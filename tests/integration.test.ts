/**
 * Tests d'intégration — appellent l'API Stancer réelle (stest_).
 *
 * Pré-requis : STANCER_STEST_KEY dans .env
 * Lancement  : npx tsx --env-file=.env --test tests/integration.test.ts
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Stancer, StancerError, isCaptured, getPaymentUrl } from '../src/index.js';

const apiKey = process.env.STANCER_STEST_KEY;
if (!apiKey) throw new Error('STANCER_STEST_KEY manquant dans .env');

const client = new Stancer({ apiKey });

// Carte test Stancer — Visa qui passe en to_capture
const TEST_CARD = {
  number: '4111111111111111',
  expMonth: 12,
  expYear: 2030,
  cvc: '123',
  name: 'Test Card',
};

// ─── Customers ───────────────────────────────────────────────────────────────

describe('customers', () => {
  let customerId: string;

  test('create — crée un customer', async () => {
    const customer = await client.customers.create({
      email: `test-${Date.now()}@stancer-node-test.dev`,
      name: 'Test Intégration',
    });
    assert.ok(customer.id.startsWith('cust_'), `id inattendu : ${customer.id}`);
    assert.ok(customer.email);
    assert.equal(customer.liveMode, false);
    customerId = customer.id;
  });

  test('retrieve — récupère le customer créé', async () => {
    const customer = await client.customers.retrieve(customerId);
    assert.equal(customer.id, customerId);
    assert.equal(customer.name, 'Test Intégration');
  });

  test('update — modifie le customer sans erreur', async () => {
    await assert.doesNotReject(() =>
      client.customers.update(customerId, { name: 'Test Modifié' }),
    );
  });

  test('delete — supprime le customer', async () => {
    await assert.doesNotReject(() => client.customers.delete(customerId));
  });
});

// ─── Cards ───────────────────────────────────────────────────────────────────

describe('cards', () => {
  let cardId: string;

  test('create ou récupère — tokenise une carte (gère 409 si déjà existante)', async () => {
    try {
      const card = await client.cards.create(TEST_CARD);
      assert.ok(card.id.startsWith('card_'));
      assert.equal(card.last4, '1111');
      assert.equal(card.liveMode, false);
      cardId = card.id;
    } catch (err) {
      if (err instanceof StancerError && err.status === 409) {
        // L'API cards ne retourne pas d'ID en 409 — on cherche dans les paiements récents
        const list = await client.payments.list({ limit: 10 });
        const withCard = list.payments.find((p) => p.card?.last4 === '1111');
        if (withCard?.card?.id) {
          cardId = withCard.card.id;
        } else {
          // Pas bloquant : on marque le test comme skip
          console.log('INFO: carte 409 sans ID récupérable, retrieve ignoré');
          cardId = '';
        }
      } else {
        throw err;
      }
    }
  });

  test('retrieve — récupère la carte par ID', async () => {
    if (!cardId) {
      console.log('SKIP: cardId non disponible');
      return;
    }
    const card = await client.cards.retrieve(cardId);
    assert.equal(card.id, cardId);
    assert.ok(card.last4.length === 4);
    assert.equal(card.liveMode, false);
  });
});

// ─── Payments ────────────────────────────────────────────────────────────────

describe('payments', () => {
  let paymentId: string;
  const uniqueId = `idem-${Date.now()}`;

  test('create — crée un paiement avec carte inline', async () => {
    const payment = await client.payments.create({
      amount: 100,
      currency: 'eur',
      description: 'Test intégration stancer-node',
      orderId: `test-${Date.now()}`,
      card: TEST_CARD,
    });
    assert.ok(payment.id.startsWith('paym_'), `id inattendu : ${payment.id}`);
    assert.equal(payment.amount, 100);
    assert.equal(payment.currency, 'eur');
    assert.equal(payment.liveMode, false);
    paymentId = payment.id;
  });

  test('retrieve — récupère le paiement créé', async () => {
    const payment = await client.payments.retrieve(paymentId);
    assert.equal(payment.id, paymentId);
    assert.equal(payment.amount, 100);
  });

  test('isCaptured — cohérent avec le statut retourné', async () => {
    const payment = await client.payments.retrieve(paymentId);
    const captured = isCaptured(payment);
    assert.equal(typeof captured, 'boolean');
    if (payment.status === 'to_capture' || payment.status === 'captured') {
      assert.ok(captured);
    }
  });

  test('list — liste les paiements avec limit', async () => {
    const result = await client.payments.list({ limit: 3 });
    assert.ok(Array.isArray(result.payments));
    assert.ok(result.payments.length > 0);
    assert.ok(typeof result.range.limit === 'number');
    assert.ok(typeof result.range.hasMore === 'boolean');
  });

  test('list — pagination start', async () => {
    const page1 = await client.payments.list({ limit: 2, start: 0 });
    const page2 = await client.payments.list({ limit: 2, start: 2 });
    assert.ok(Array.isArray(page1.payments));
    assert.ok(Array.isArray(page2.payments));
  });

  test('create avec uniqueId — second appel retourne le même paiement (409 géré)', async () => {
    const params = {
      amount: 150,
      currency: 'eur' as const,
      uniqueId,
      card: TEST_CARD,
    };
    const first = await client.payments.create(params);
    assert.ok(first.id.startsWith('paym_'));

    // Second appel identique → 409 → doit retourner le même paiement sans erreur
    const second = await client.payments.create(params);
    assert.equal(
      first.id,
      second.id,
      `Attendu le même paiement. first=${first.id}, second=${second.id}`,
    );
  });
});

// ─── Refunds ─────────────────────────────────────────────────────────────────

describe('refunds', () => {
  /**
   * NOTE : dans l'environnement stest_, les paiements n'atteignent jamais le statut
   * `captured` (ils restent en `to_capture`). Le remboursement n'est possible qu'après
   * capture effective. Ces tests valident le comportement d'erreur et la structure de
   * l'API — les tests happy-path nécessitent un environnement de prod ou un paiement
   * réellement capturé.
   */

  let paymentId: string;

  test('setup — crée un paiement (to_capture)', async () => {
    const payment = await client.payments.create({
      amount: 500,
      currency: 'eur',
      orderId: `refund-test-${Date.now()}`,
      card: TEST_CARD,
    });
    assert.ok(payment.id.startsWith('paym_'));
    paymentId = payment.id;
  });

  test('refunds.create — lève StancerError 409 si non capturé (comportement attendu en stest_)', async () => {
    await assert.rejects(
      () => client.refunds.create({ amount: 100, payment: paymentId }),
      (err: unknown) => {
        assert.ok(err instanceof StancerError);
        assert.equal(err.status, 409);
        return true;
      },
    );
  });

  test('payments.refund — lève StancerError 409 si non capturé', async () => {
    await assert.rejects(
      () => client.payments.refund(paymentId, 100),
      (err: unknown) => {
        assert.ok(err instanceof StancerError);
        assert.equal(err.status, 409);
        return true;
      },
    );
  });
});

// ─── getPaymentUrl ────────────────────────────────────────────────────────────

describe('getPaymentUrl', () => {
  test('génère une URL valide', () => {
    const url = getPaymentUrl('ptest_abc123', 'paym_test');
    assert.equal(url, 'https://payment.stancer.com/ptest_abc123/paym_test');
  });
});

// ─── StancerError ─────────────────────────────────────────────────────────────

describe('StancerError — erreurs API réelles', () => {
  test('payment inexistant lève StancerError (4xx)', async () => {
    await assert.rejects(
      () => client.payments.retrieve('paym_000000000000000000000000'),
      (err: unknown) => {
        assert.ok(err instanceof StancerError);
        assert.ok(err.status >= 400 && err.status < 500);
        return true;
      },
    );
  });

  test('clé API invalide lève StancerError (4xx)', async () => {
    const bad = new Stancer({ apiKey: 'stest_000000000000000000000000000000' });
    await assert.rejects(
      () => bad.payments.retrieve('paym_000000000000000000000000'),
      (err: unknown) => {
        assert.ok(err instanceof StancerError);
        assert.ok(err.status >= 400 && err.status < 500);
        return true;
      },
    );
  });
});
