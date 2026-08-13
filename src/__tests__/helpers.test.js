import { describe, test, expect } from 'vitest';
import {
  planPrice,
  genInviteCode,
  tireFromSupabaseRow,
  formatOrderCreatedDate,
  orderFromSupabaseRow,
  docNumberFor,
  computeInvoiceTotals,
  slugifyLocationName,
  buildTireInsertPayload,
  buildWaitlistPayload,
  parseVehicleFields,
} from '../helpers.js';

describe('planPrice', () => {
  test('returns the price for a known plan name', () => {
    // Arrange
    const planName = 'Growth Partner';

    // Act
    const price = planPrice(planName);

    // Assert
    expect(price).toBe(249);
  });

  test('returns 0 for an unknown plan name', () => {
    // Arrange
    const planName = 'Not A Real Plan';

    // Act
    const price = planPrice(planName);

    // Assert
    expect(price).toBe(0);
  });
});

describe('genInviteCode', () => {
  test('formats the code as TF-<2 letter state>-<6 char suffix>', () => {
    // Arrange
    const state = 'SC';

    // Act
    const code = genInviteCode(state);

    // Assert
    expect(code).toMatch(/^TF-SC-[A-Z0-9]{6}$/);
  });

  test('falls back to XX when no state is given', () => {
    // Arrange / Act
    const code = genInviteCode('');

    // Assert
    expect(code).toMatch(/^TF-XX-[A-Z0-9]{6}$/);
  });

  test('uppercases and truncates a longer state value to 2 characters', () => {
    // Arrange / Act
    const code = genInviteCode('california');

    // Assert
    expect(code.startsWith('TF-CA-')).toBe(true);
  });

  test('generates different codes on successive calls', () => {
    // Arrange / Act
    const codeA = genInviteCode('SC');
    const codeB = genInviteCode('SC');

    // Assert
    expect(codeA).not.toBe(codeB);
  });
});

describe('tireFromSupabaseRow', () => {
  test('maps a raw Supabase row into the shape the UI expects', () => {
    // Arrange
    const row = {
      id: 'tire-1',
      shop_id: 'shop-1',
      brand: 'Michelin',
      model: 'Defender T+H',
      size: '225/55R17',
      condition: 'New',
      quantity: 4,
      price: 139.99,
      status: 'Active',
      created_at: '2026-01-01T00:00:00Z',
    };

    // Act
    const tire = tireFromSupabaseRow(row);

    // Assert
    expect(tire.qty).toBe(4);
    expect(tire.price).toBe(139.99);
    expect(tire.setPrice).toBeCloseTo(559.96, 2);
    expect(tire.brand).toBe('Michelin');
  });

  test('defaults missing text fields instead of leaving them undefined', () => {
    // Arrange
    const row = { id: 'tire-2', shop_id: 'shop-1', quantity: 0, price: 0 };

    // Act
    const tire = tireFromSupabaseRow(row);

    // Assert
    expect(tire.brand).toBe('');
    expect(tire.model).toBe('');
    expect(tire.condition).toBe('New');
    expect(tire.status).toBe('Active');
  });
});

describe('formatOrderCreatedDate', () => {
  test('formats a valid ISO timestamp as YYYY-MM-DD', () => {
    // Arrange
    const createdAt = '2026-05-01T14:32:00Z';

    // Act
    const formatted = formatOrderCreatedDate(createdAt);

    // Assert
    expect(formatted).toBe('2026-05-01');
  });

  test('returns an empty string for a missing or invalid date', () => {
    // Arrange / Act / Assert
    expect(formatOrderCreatedDate(null)).toBe('');
    expect(formatOrderCreatedDate(undefined)).toBe('');
    expect(formatOrderCreatedDate('not a date')).toBe('');
  });
});

describe('orderFromSupabaseRow', () => {
  test('maps a raw order row and derives a short order label', () => {
    // Arrange
    const row = {
      id: 'a1b2c3d4-0000-0000-0000-000000000000',
      shop_id: 'shop-1',
      tire_id: 'tire-1',
      customer_name: 'Jane Doe',
      customer_email: 'jane@example.com',
      customer_phone: '555-1234',
      quantity: 2,
      total: 259.98,
      status: 'Confirmed',
      created_at: '2026-05-01T00:00:00Z',
      sms_consent: true,
    };

    // Act
    const order = orderFromSupabaseRow(row);

    // Assert
    expect(order.orderLabel).toBe('ORD-a1b2c3d4');
    expect(order.customer).toBe('Jane Doe');
    expect(order.qty).toBe(2);
    expect(order.total).toBe(259.98);
    expect(order.sms_consent).toBe(true);
  });

  test('defaults status to Pending and sms_consent to false when absent', () => {
    // Arrange
    const row = { id: 'order-2', shop_id: 'shop-1', quantity: 1, total: 50 };

    // Act
    const order = orderFromSupabaseRow(row);

    // Assert
    expect(order.status).toBe('Pending');
    expect(order.sms_consent).toBe(false);
  });
});

describe('docNumberFor', () => {
  test('prefixes with QT for a quote', () => {
    // Arrange
    const invoice = { id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', doc_type: 'Quote' };

    // Act
    const number = docNumberFor(invoice);

    // Assert
    expect(number).toBe('QT-AAAAAAAA');
  });

  test('prefixes with INV for an invoice or receipt', () => {
    // Arrange
    const invoice = { id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', doc_type: 'Invoice' };

    // Act
    const number = docNumberFor(invoice);

    // Assert
    expect(number).toBe('INV-AAAAAAAA');
  });
});

describe('computeInvoiceTotals', () => {
  test('sums line items and applies the tax rate', () => {
    // Arrange
    const lineItems = [
      { quantity: 4, unit_price: 25 },
      { quantity: 1, unit_price: 100 },
    ];
    const taxRate = 8;

    // Act
    const { subtotal, taxAmount, total } = computeInvoiceTotals(lineItems, taxRate);

    // Assert
    expect(subtotal).toBe(200);
    expect(taxAmount).toBeCloseTo(16, 5);
    expect(total).toBeCloseTo(216, 5);
  });

  test('treats missing or non-numeric quantity/price as zero instead of NaN', () => {
    // Arrange
    const lineItems = [{ quantity: '', unit_price: undefined }];

    // Act
    const { subtotal, taxAmount, total } = computeInvoiceTotals(lineItems, 10);

    // Assert
    expect(subtotal).toBe(0);
    expect(taxAmount).toBe(0);
    expect(total).toBe(0);
  });

  test('defaults to zero tax when no tax rate is given', () => {
    // Arrange
    const lineItems = [{ quantity: 2, unit_price: 10 }];

    // Act
    const { taxAmount, total, subtotal } = computeInvoiceTotals(lineItems, undefined);

    // Assert
    expect(taxAmount).toBe(0);
    expect(total).toBe(subtotal);
  });
});

describe('slugifyLocationName', () => {
  test('lowercases and hyphenates a normal name', () => {
    // Arrange
    const name = 'Greenville Tire Pros';

    // Act
    const slug = slugifyLocationName(name);

    // Assert
    expect(slug).toBe('greenville-tire-pros');
  });

  test('strips punctuation and collapses repeated separators', () => {
    // Arrange
    const name = "Deja's Tires & Wheels!!";

    // Act
    const slug = slugifyLocationName(name);

    // Assert
    expect(slug).toBe('deja-s-tires-wheels');
  });

  test('falls back to "shop" for an empty or symbols-only name', () => {
    // Arrange / Act / Assert
    expect(slugifyLocationName('')).toBe('shop');
    expect(slugifyLocationName('!!!')).toBe('shop');
  });
});

describe('buildTireInsertPayload', () => {
  test('marks a tire with quantity 0 as Out of Stock', () => {
    // Arrange
    const newTire = { brand: 'Michelin', model: 'Defender', size: '225/55R17', condition: 'New', qty: 0, price: 139.99 };

    // Act
    const payload = buildTireInsertPayload(newTire, 'shop-1');

    // Assert
    expect(payload.status).toBe('Out of Stock');
    expect(payload.quantity).toBe(0);
    expect(payload.shop_id).toBe('shop-1');
  });

  test('marks a tire with a positive quantity as Active', () => {
    // Arrange
    const newTire = { brand: 'Goodyear', model: 'Assurance', size: '215/60R16', condition: 'Used', qty: 4, price: 59.99 };

    // Act
    const payload = buildTireInsertPayload(newTire, 'shop-1');

    // Assert
    expect(payload.status).toBe('Active');
    expect(payload.quantity).toBe(4);
    expect(payload.price).toBe(59.99);
  });
});

describe('buildWaitlistPayload', () => {
  test('builds a valid payload when a tire and email are provided', () => {
    // Arrange
    const tire = { id: 'tire-1', brand: 'Michelin', model: 'Defender', size: '225/55R17' };

    // Act
    const result = buildWaitlistPayload(tire, ' customer@example.com ', 'shop-1');

    // Assert
    expect(result.valid).toBe(true);
    expect(result.payload).toMatchObject({
      shop_id: 'shop-1',
      tire_id: 'tire-1',
      tire_name: 'Michelin Defender 225/55R17',
      email: 'customer@example.com',
    });
  });

  test('is invalid when no tire is selected', () => {
    // Arrange / Act
    const result = buildWaitlistPayload(null, 'customer@example.com', 'shop-1');

    // Assert
    expect(result.valid).toBe(false);
  });

  test('is invalid when the email is blank or only whitespace', () => {
    // Arrange
    const tire = { id: 'tire-1', brand: 'Michelin', model: 'Defender', size: '225/55R17' };

    // Act / Assert
    expect(buildWaitlistPayload(tire, '', 'shop-1').valid).toBe(false);
    expect(buildWaitlistPayload(tire, '   ', 'shop-1').valid).toBe(false);
  });
});

describe('parseVehicleFields', () => {
  test('splits a "year make model" string into its parts', () => {
    // Arrange
    const vehicleRaw = '2019 Toyota Camry';

    // Act
    const { vehicle_year, vehicle_make, vehicle_model } = parseVehicleFields(vehicleRaw);

    // Assert
    expect(vehicle_year).toBe(2019);
    expect(vehicle_make).toBe('Toyota');
    expect(vehicle_model).toBe('Camry');
  });

  test('handles a make/model with no year prefix', () => {
    // Arrange
    const vehicleRaw = 'Honda Accord';

    // Act
    const { vehicle_year, vehicle_make, vehicle_model } = parseVehicleFields(vehicleRaw);

    // Assert
    expect(vehicle_year).toBeNull();
    expect(vehicle_make).toBe('Honda');
    expect(vehicle_model).toBe('Accord');
  });

  test('returns empty fields for a blank string', () => {
    // Arrange / Act
    const { vehicle_year, vehicle_make, vehicle_model } = parseVehicleFields('   ');

    // Assert
    expect(vehicle_year).toBeNull();
    expect(vehicle_make).toBe('');
    expect(vehicle_model).toBe('');
  });

  test('joins a multi-word model back together', () => {
    // Arrange
    const vehicleRaw = '2021 Ford F-150 Lariat';

    // Act
    const { vehicle_model } = parseVehicleFields(vehicleRaw);

    // Assert
    expect(vehicle_model).toBe('F-150 Lariat');
  });
});
