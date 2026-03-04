import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// On importe depuis les sources directement (tsx compile à la volée)
import { camelizeKeys, snakizeKeys, buildQueryString } from '../src/client.js';
import { StancerError } from '../src/errors.js';
import { isCaptured, getPaymentUrl } from '../src/helpers.js';
import type { Payment } from '../src/types.js';

// ─── camelizeKeys ─────────────────────────────────────────────────────────────

describe('camelizeKeys', () => {
  test('convertit les clés snake_case en camelCase', () => {
    const result = camelizeKeys({ live_mode: true, exp_month: 12 });
    assert.deepEqual(result, { liveMode: true, expMonth: 12 });
  });

  test('gère les objets imbriqués', () => {
    const result = camelizeKeys({ card: { exp_month: 12, last_4: '4242' } });
    assert.deepEqual(result, { card: { expMonth: 12, last4: '4242' } });
  });

  test('gère les tableaux', () => {
    const result = camelizeKeys([{ live_mode: false }, { live_mode: true }]);
    assert.deepEqual(result, [{ liveMode: false }, { liveMode: true }]);
  });

  test('gère les tableaux imbriqués dans objets', () => {
    const result = camelizeKeys({ methods_allowed: ['card', 'sepa'] });
    assert.deepEqual(result, { methodsAllowed: ['card', 'sepa'] });
  });

  test('laisse les valeurs primitives intactes', () => {
    assert.equal(camelizeKeys(42), 42);
    assert.equal(camelizeKeys('hello'), 'hello');
    assert.equal(camelizeKeys(null), null);
    assert.equal(camelizeKeys(true), true);
  });

  test('laisse les clés déjà camelCase intactes', () => {
    const result = camelizeKeys({ orderId: 'abc' });
    assert.deepEqual(result, { orderId: 'abc' });
  });
});

// ─── snakizeKeys ──────────────────────────────────────────────────────────────

describe('snakizeKeys', () => {
  test('convertit les clés camelCase en snake_case', () => {
    const result = snakizeKeys({ expMonth: 12, liveMode: false });
    assert.deepEqual(result, { exp_month: 12, live_mode: false });
  });

  test('gère les objets imbriqués', () => {
    const result = snakizeKeys({ authData: { returnUrl: 'https://ex.com' } });
    assert.deepEqual(result, { auth_data: { return_url: 'https://ex.com' } });
  });

  test('gère les tableaux', () => {
    const result = snakizeKeys([{ expMonth: 12 }, { expYear: 2026 }]);
    assert.deepEqual(result, [{ exp_month: 12 }, { exp_year: 2026 }]);
  });

  test('laisse les valeurs primitives intactes', () => {
    assert.equal(snakizeKeys(42), 42);
    assert.equal(snakizeKeys(null), null);
  });
});

// ─── buildQueryString ─────────────────────────────────────────────────────────

describe('buildQueryString', () => {
  test('retourne une chaîne vide si pas de params', () => {
    assert.equal(buildQueryString({}), '');
  });

  test('retourne une chaîne vide si tous les params sont undefined', () => {
    assert.equal(buildQueryString({ limit: undefined, start: undefined }), '');
  });

  test('construit un query string avec un param', () => {
    assert.equal(buildQueryString({ limit: 10 }), '?limit=10');
  });

  test('construit un query string avec plusieurs params', () => {
    const qs = buildQueryString({ limit: 10, start: 0 });
    assert.equal(qs, '?limit=10&start=0');
  });

  test('ignore les valeurs undefined', () => {
    const qs = buildQueryString({ limit: 10, start: undefined, created: 1700000000 });
    assert.equal(qs, '?limit=10&created=1700000000');
  });

  test('convertit les clés camelCase en snake_case', () => {
    const qs = buildQueryString({ orderId: 'abc', uniqueId: 'xyz' } as Record<string, string>);
    assert.equal(qs, '?order_id=abc&unique_id=xyz');
  });
});

// ─── StancerError ────────────────────────────────────────────────────────────

describe('StancerError', () => {
  test('est une instance de Error', () => {
    const err = new StancerError('message', 'code', 422);
    assert.ok(err instanceof Error);
    assert.ok(err instanceof StancerError);
  });

  test('expose name, code, status, body', () => {
    const body = { error: { message: 'test' } };
    const err = new StancerError('test message', 'err_test', 422, body);
    assert.equal(err.name, 'StancerError');
    assert.equal(err.message, 'test message');
    assert.equal(err.code, 'err_test');
    assert.equal(err.status, 422);
    assert.deepEqual(err.body, body);
  });

  test('body vide par défaut', () => {
    const err = new StancerError('msg', 'code', 500);
    assert.deepEqual(err.body, {});
  });

  test('instanceof fonctionne dans catch', () => {
    let caught = false;
    try {
      throw new StancerError('test', 'code', 404);
    } catch (e) {
      if (e instanceof StancerError) caught = true;
    }
    assert.ok(caught);
  });
});

// ─── isCaptured ──────────────────────────────────────────────────────────────

const makePayment = (status: Payment['status']): Payment => ({
  id: 'paym_test',
  amount: 100,
  currency: 'eur',
  status,
  liveMode: false,
  created: 0,
});

describe('isCaptured', () => {
  test('retourne true pour status "captured"', () => {
    assert.ok(isCaptured(makePayment('captured')));
  });

  test('retourne true pour status "to_capture"', () => {
    assert.ok(isCaptured(makePayment('to_capture')));
  });

  test('retourne false pour les autres statuts', () => {
    const others: Payment['status'][] = [
      'authorize', 'capture', 'canceled', 'disputed', 'expired', 'failed', 'refused',
    ];
    for (const status of others) {
      assert.equal(isCaptured(makePayment(status)), false, `Attendu false pour "${status}"`);
    }
  });

  test('retourne false si status undefined', () => {
    assert.equal(isCaptured(makePayment(undefined)), false);
  });
});

// ─── getPaymentUrl ────────────────────────────────────────────────────────────

describe('getPaymentUrl', () => {
  test('génère l\'URL correcte', () => {
    const url = getPaymentUrl('ptest_abc123', 'paym_xyz456');
    assert.equal(url, 'https://payment.stancer.com/ptest_abc123/paym_xyz456');
  });
});
