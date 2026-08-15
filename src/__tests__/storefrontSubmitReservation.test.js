// @vitest-environment node
import { describe, test, expect, vi, beforeEach } from 'vitest';

const customersMaybeSingleMock = vi.fn();
const customersInsertMock = vi.fn();
const ordersInsertSingleMock = vi.fn();
const ordersInsertPayloadSpy = vi.fn();
const fromSpy = vi.fn();

function makeInsertChain(resolvedValue) {
  // Real supabase-js insert() builders are both awaitable directly (customer
  // insert does `await ...insert({...})`) and chainable (order insert does
  // `...insert({...}).select("id").single()`), so this fake needs both.
  return {
    then(onFulfilled, onRejected) {
      return Promise.resolve(resolvedValue).then(onFulfilled, onRejected);
    },
    select: vi.fn(() => ({ single: ordersInsertSingleMock })),
  };
}

vi.mock('../supabase.js', () => ({
  supabase: {
    from: vi.fn((table) => {
      fromSpy(table);
      if (table === 'customers') {
        return {
          select: vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: customersMaybeSingleMock })) })) })),
          insert: vi.fn((payload) => {
            customersInsertMock(payload);
            return makeInsertChain({ error: null });
          }),
        };
      }
      if (table === 'orders') {
        return {
          insert: vi.fn((payload) => {
            ordersInsertPayloadSpy(payload);
            return makeInsertChain({});
          }),
        };
      }
      throw new Error(`Unexpected table in test: ${table}`);
    }),
  },
}));

const { storefrontSubmitReservation } = await import('../App.jsx');

beforeEach(() => {
  fromSpy.mockReset();
  customersMaybeSingleMock.mockReset();
  customersInsertMock.mockReset();
  ordersInsertSingleMock.mockReset();
  ordersInsertPayloadSpy.mockReset();
  customersMaybeSingleMock.mockResolvedValue({ data: null, error: null });
  ordersInsertSingleMock.mockResolvedValue({ data: { id: 'order-1' }, error: null });
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({}) })));
});

const baseArgs = {
  orderTire: { brand: 'Michelin', model: 'Defender T+H', price: 139.99 },
  name: 'Jane Doe',
  phone: '555-1234',
  email: 'jane@example.com',
  vehicleRaw: '2019 Toyota Camry',
  quantity: 4,
};

describe('storefrontSubmitReservation', () => {
  test('throws when no shop is specified', async () => {
    // Arrange / Act / Assert
    await expect(storefrontSubmitReservation(null, baseArgs)).rejects.toThrow('Missing shop.');
  });

  test('computes the total from quantity and tire price', async () => {
    // Arrange / Act
    await storefrontSubmitReservation('shop-1', baseArgs);

    // Assert
    expect(ordersInsertPayloadSpy).toHaveBeenCalledWith(
      expect.objectContaining({ quantity: 4, total: 559.96 })
    );
  });

  test('clamps quantity into the 1-99 range', async () => {
    // Arrange / Act
    await storefrontSubmitReservation('shop-1', { ...baseArgs, quantity: 500 });

    // Assert
    expect(ordersInsertPayloadSpy).toHaveBeenCalledWith(expect.objectContaining({ quantity: 99 }));

    // Arrange / Act
    await storefrontSubmitReservation('shop-1', { ...baseArgs, quantity: 0 });

    // Assert
    expect(ordersInsertPayloadSpy).toHaveBeenCalledWith(expect.objectContaining({ quantity: 1 }));
  });

  test('creates a new customer record when one does not already exist', async () => {
    // Arrange
    customersMaybeSingleMock.mockResolvedValue({ data: null, error: null });

    // Act
    await storefrontSubmitReservation('shop-1', baseArgs);

    // Assert
    expect(customersInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ shop_id: 'shop-1', name: 'Jane Doe', email: 'jane@example.com', vehicle_year: 2019, vehicle_make: 'Toyota', vehicle_model: 'Camry' })
    );
  });

  test('does not create a duplicate customer when one already exists for this email', async () => {
    // Arrange
    customersMaybeSingleMock.mockResolvedValue({ data: { id: 'existing-customer' }, error: null });

    // Act
    await storefrontSubmitReservation('shop-1', baseArgs);

    // Assert
    expect(customersInsertMock).not.toHaveBeenCalled();
  });

  test('returns the new order id on success', async () => {
    // Arrange
    ordersInsertSingleMock.mockResolvedValue({ data: { id: 'order-42' }, error: null });

    // Act
    const orderId = await storefrontSubmitReservation('shop-1', baseArgs);

    // Assert
    expect(orderId).toBe('order-42');
  });

  test('propagates the database error when the order insert fails', async () => {
    // Arrange
    ordersInsertSingleMock.mockResolvedValue({ data: null, error: new Error('insert failed') });

    // Act / Assert
    await expect(storefrontSubmitReservation('shop-1', baseArgs)).rejects.toThrow('insert failed');
  });

  test('notifies the shop owner by SMS only when consent was given and a phone number is on file', async () => {
    // Arrange
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({}) }));
    vi.stubGlobal('fetch', fetchMock);

    // Act — consent true, owner phone present, plan includes SMS: should text
    await storefrontSubmitReservation('shop-1', { ...baseArgs, smsConsent: true, ownerPhone: '555-9999', plan: 'Growth Partner' });
    expect(fetchMock).toHaveBeenCalledWith('/api/send-sms', expect.objectContaining({ method: 'POST' }));

    // Act — no consent: should not text
    fetchMock.mockClear();
    await storefrontSubmitReservation('shop-1', { ...baseArgs, smsConsent: false, ownerPhone: '555-9999', plan: 'Growth Partner' });
    expect(fetchMock).not.toHaveBeenCalled();

    // Act — consent true, but shop's plan doesn't include SMS: should not text
    fetchMock.mockClear();
    await storefrontSubmitReservation('shop-1', { ...baseArgs, smsConsent: true, ownerPhone: '555-9999', plan: 'Early Partner' });

    // Assert
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
