// @vitest-environment node
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

const constructEventMock = vi.fn();
const customersRetrieveMock = vi.fn();

vi.mock('stripe', () => {
  // Must be a regular function, not an arrow function — it's invoked with
  // `new Stripe(...)` in the handler, and arrow functions aren't constructible.
  const StripeMock = vi.fn(function StripeMock() {
    return { customers: { retrieve: customersRetrieveMock } };
  });
  StripeMock.webhooks = { constructEvent: constructEventMock };
  return { default: StripeMock };
});

// select().eq().maybeSingle() results are consumed in call order via
// mockResolvedValueOnce, so each test queues up exactly the lookups its
// scenario needs (customer_id lookup, then email fallback lookup, etc).
const selectMaybeSingleMock = vi.fn();
const updateSpy = vi.fn();
const updateMaybeSingleMock = vi.fn();

function makeSupabase() {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: selectMaybeSingleMock })) })),
      update: vi.fn((updates) => {
        updateSpy(updates);
        return { eq: vi.fn(() => ({ select: vi.fn(() => ({ maybeSingle: updateMaybeSingleMock })) })) };
      }),
    })),
  };
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => makeSupabase()),
}));

const { default: handler } = await import('../webhook.js');

function makeReq(bodyObj, { signature = 'sig_test' } = {}) {
  const bodyBuffer = Buffer.from(JSON.stringify(bodyObj));
  return {
    method: 'POST',
    headers: signature ? { 'stripe-signature': signature } : {},
    async *[Symbol.asyncIterator]() {
      yield bodyBuffer;
    },
  };
}

function makeRes() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

function stubRequiredEnv() {
  vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_test');
  vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key');
  vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test');
}

beforeEach(() => {
  constructEventMock.mockReset();
  customersRetrieveMock.mockReset();
  selectMaybeSingleMock.mockReset();
  updateSpy.mockReset();
  updateMaybeSingleMock.mockReset();
  updateMaybeSingleMock.mockResolvedValue({ data: { id: 'shop-1' }, error: null });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('webhook handler — request validation', () => {
  test('rejects non-POST requests with 405', async () => {
    // Arrange
    const req = { method: 'GET' };
    const res = makeRes();

    // Act
    await handler(req, res);

    // Assert
    expect(res.statusCode).toBe(405);
  });

  test('returns 500 when required server env vars are missing', async () => {
    // Arrange — deliberately not calling stubRequiredEnv()
    const req = makeReq({});
    const res = makeRes();

    // Act
    await handler(req, res);

    // Assert
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Server configuration error');
  });

  test('returns 400 when the stripe-signature header is missing', async () => {
    // Arrange
    stubRequiredEnv();
    const req = makeReq({}, { signature: null });
    const res = makeRes();

    // Act
    await handler(req, res);

    // Assert
    expect(res.statusCode).toBe(400);
  });

  test('returns 400 when signature verification fails', async () => {
    // Arrange
    stubRequiredEnv();
    constructEventMock.mockImplementation(() => {
      throw new Error('Invalid signature');
    });
    const req = makeReq({ type: 'checkout.session.completed' });
    const res = makeRes();

    // Act
    await handler(req, res);

    // Assert
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/Invalid signature/);
  });

  test('acknowledges but does not process an unhandled event type', async () => {
    // Arrange
    stubRequiredEnv();
    constructEventMock.mockReturnValue({ id: 'evt_1', type: 'customer.created', data: { object: {} } });
    const req = makeReq({});
    const res = makeRes();

    // Act
    await handler(req, res);

    // Assert
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ received: true, handled: false });
    expect(updateSpy).not.toHaveBeenCalled();
  });
});

describe('webhook handler — checkout.session.completed', () => {
  test('activates the shop found by stripe_customer_id and records the subscription', async () => {
    // Arrange
    stubRequiredEnv();
    selectMaybeSingleMock.mockResolvedValueOnce({ data: { id: 'shop-1', stripe_customer_id: 'cus_1' }, error: null });
    constructEventMock.mockReturnValue({
      id: 'evt_1',
      type: 'checkout.session.completed',
      data: {
        object: {
          customer: 'cus_1',
          subscription: 'sub_1',
          metadata: { plan: 'Growth Partner' },
        },
      },
    });
    const req = makeReq({});
    const res = makeRes();

    // Act
    await handler(req, res);

    // Assert
    expect(res.statusCode).toBe(200);
    expect(res.body.updated).toBe(true);
    expect(updateSpy).toHaveBeenCalledWith({
      status: 'Active',
      stripe_customer_id: 'cus_1',
      stripe_subscription_id: 'sub_1',
      plan: 'Growth Partner',
    });
  });

  test('falls back to matching by email and backfills stripe_customer_id when no shop is linked yet', async () => {
    // Arrange
    stubRequiredEnv();
    // First lookup (by customer_id) finds nothing, second (by email) finds the shop.
    selectMaybeSingleMock
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: { id: 'shop-2' }, error: null });
    constructEventMock.mockReturnValue({
      id: 'evt_2',
      type: 'checkout.session.completed',
      data: {
        object: {
          customer: 'cus_2',
          customer_email: 'owner@shop.com',
          subscription: { id: 'sub_2' },
          metadata: {},
        },
      },
    });
    const req = makeReq({});
    const res = makeRes();

    // Act
    await handler(req, res);

    // Assert
    expect(res.statusCode).toBe(200);
    expect(res.body.updated).toBe(true);
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'Active', stripe_customer_id: 'cus_2', stripe_subscription_id: 'sub_2' })
    );
  });

  test('acknowledges the event without erroring when no shop matches at all', async () => {
    // Arrange
    stubRequiredEnv();
    selectMaybeSingleMock
      .mockResolvedValueOnce({ data: null, error: null }) // by customer_id
      .mockResolvedValueOnce({ data: null, error: null }); // by email
    constructEventMock.mockReturnValue({
      id: 'evt_3',
      type: 'checkout.session.completed',
      data: { object: { customer: 'cus_orphan', customer_email: 'nobody@shop.com', metadata: {} } },
    });
    const req = makeReq({});
    const res = makeRes();

    // Act
    await handler(req, res);

    // Assert — no retry storm: still 200, just marks updated: false
    expect(res.statusCode).toBe(200);
    expect(res.body.updated).toBe(false);
    expect(updateSpy).not.toHaveBeenCalled();
  });
});

describe('webhook handler — subscription lifecycle', () => {
  test('customer.subscription.updated maps a past_due status and detects a plan downgrade by price id', async () => {
    // Arrange
    stubRequiredEnv();
    vi.stubEnv('STRIPE_PRICE_EARLY_PARTNER', 'price_early');
    vi.stubEnv('STRIPE_PRICE_GROWTH_PARTNER', 'price_growth');
    selectMaybeSingleMock.mockResolvedValueOnce({ data: { id: 'shop-1' }, error: null });
    constructEventMock.mockReturnValue({
      id: 'evt_4',
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_1',
          customer: 'cus_1',
          status: 'past_due',
          items: { data: [{ price: { id: 'price_early' } }] },
        },
      },
    });
    const req = makeReq({});
    const res = makeRes();

    // Act
    await handler(req, res);

    // Assert
    expect(res.statusCode).toBe(200);
    expect(updateSpy).toHaveBeenCalledWith({
      status: 'Past Due',
      plan: 'Early Partner',
      stripe_customer_id: 'cus_1',
      stripe_subscription_id: 'sub_1',
    });
  });

  test('customer.subscription.deleted marks the shop Cancelled', async () => {
    // Arrange
    stubRequiredEnv();
    selectMaybeSingleMock.mockResolvedValueOnce({ data: { id: 'shop-1' }, error: null });
    constructEventMock.mockReturnValue({
      id: 'evt_5',
      type: 'customer.subscription.deleted',
      data: { object: { id: 'sub_1', customer: 'cus_1', status: 'canceled' } },
    });
    const req = makeReq({});
    const res = makeRes();

    // Act
    await handler(req, res);

    // Assert
    expect(res.statusCode).toBe(200);
    expect(updateSpy).toHaveBeenCalledWith({ status: 'Cancelled', stripe_customer_id: 'cus_1' });
  });

  test('invoice.payment_failed marks the shop Past Due', async () => {
    // Arrange
    stubRequiredEnv();
    selectMaybeSingleMock.mockResolvedValueOnce({ data: { id: 'shop-1' }, error: null });
    constructEventMock.mockReturnValue({
      id: 'evt_6',
      type: 'invoice.payment_failed',
      data: { object: { customer: 'cus_1' } },
    });
    const req = makeReq({});
    const res = makeRes();

    // Act
    await handler(req, res);

    // Assert
    expect(res.statusCode).toBe(200);
    expect(updateSpy).toHaveBeenCalledWith({ status: 'Past Due', stripe_customer_id: 'cus_1' });
  });

  test('invoice.payment_succeeded reactivates the shop', async () => {
    // Arrange
    stubRequiredEnv();
    selectMaybeSingleMock.mockResolvedValueOnce({ data: { id: 'shop-1' }, error: null });
    constructEventMock.mockReturnValue({
      id: 'evt_7',
      type: 'invoice.payment_succeeded',
      data: { object: { customer: 'cus_1' } },
    });
    const req = makeReq({});
    const res = makeRes();

    // Act
    await handler(req, res);

    // Assert
    expect(res.statusCode).toBe(200);
    expect(updateSpy).toHaveBeenCalledWith({ status: 'Active', stripe_customer_id: 'cus_1' });
  });
});

describe('webhook handler — error handling', () => {
  test('returns 500 without leaking internals when the database update fails', async () => {
    // Arrange
    stubRequiredEnv();
    selectMaybeSingleMock.mockResolvedValueOnce({ data: { id: 'shop-1' }, error: null });
    updateMaybeSingleMock.mockResolvedValue({ data: null, error: new Error('db unavailable') });
    constructEventMock.mockReturnValue({
      id: 'evt_8',
      type: 'invoice.payment_succeeded',
      data: { object: { customer: 'cus_1' } },
    });
    const req = makeReq({});
    const res = makeRes();

    // Act
    await handler(req, res);

    // Assert
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: 'Webhook handler failed' });
  });
});
