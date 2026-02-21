# stancer-node

Node.js / TypeScript client for the [Stancer](https://www.stancer.com/) payment API.

[Documentation en français](./README.fr.md)

- **Zero dependencies** — uses native `fetch` (Node 18+)
- **Native TypeScript** — full types on all methods and responses
- **ESM only**
- **All resources** — payments, cards, SEPA, customers, refunds

## Installation

```bash
npm install stancer-node
```

## Configuration

```typescript
import Stancer from 'stancer-node';

const stancer = new Stancer({ apiKey: process.env.STANCER_SECRET_KEY! });
```

Use a `stest_` key for testing, `sprod_` for production.

---

## Payments

### Create a payment

Amounts are always in **cents** (integer, minimum 50).

```typescript
const payment = await stancer.payments.create({
  amount: 2990,        // 29.90 €
  currency: 'eur',
  description: 'Pro subscription - January 2026',
  orderId: 'order-2026-001',
  card: {
    number: '4111111111111111',
    expMonth: 12,
    expYear: 2028,
    cvc: '123',
    name: 'John Doe',
  },
});

console.log(payment.id);      // paym_xxxxxxxxxxxxxxxxxxxxxxxx
console.log(payment.status);  // 'to_capture' | 'captured' | ...
```

### Payment with 3DS redirect

```typescript
const payment = await stancer.payments.create({
  amount: 4900,
  currency: 'eur',
  card: {
    number: '4111111111111111',
    expMonth: 12,
    expYear: 2028,
    cvc: '123',
  },
  auth: { returnUrl: 'https://mysite.com/payment/return' },
});

// Redirect the user to the hosted Stancer payment page
const url = getPaymentUrl(process.env.STANCER_PUBLIC_KEY!, payment.id);
// → https://payment.stancer.com/ptest_xxx/paym_xxx
```

### Deferred capture

```typescript
// Create without capturing immediately
const payment = await stancer.payments.create({
  amount: 15000,
  currency: 'eur',
  capture: false,
  card: 'card_xxxxxxxxxxxxxxxxxxxxxxxx', // tokenized card ID
});

// Capture later
const captured = await stancer.payments.capture(payment.id);
```

### SEPA payment

```typescript
const payment = await stancer.payments.create({
  amount: 990,
  currency: 'eur',
  sepa: {
    iban: 'FR7630006000011234567890189',
    name: 'John Doe',
    mandate: 'MANDATE-001',
  },
});
```

### Retrieve a payment

```typescript
const payment = await stancer.payments.retrieve('paym_xxxxxxxxxxxxxxxxxxxxxxxx');

console.log(payment.status);   // 'captured'
console.log(payment.amount);   // 2990
console.log(payment.currency); // 'eur'
console.log(payment.card);     // { id, last4, brand, expMonth, expYear, ... }
```

### List payments

```typescript
// Basic list
const { payments, range } = await stancer.payments.list({ limit: 10 });

// Pagination
const page2 = await stancer.payments.list({ limit: 10, start: 10 });

// Filter by orderId or uniqueId
const { payments } = await stancer.payments.list({ orderId: 'order-2026-001' });

console.log(range.hasMore); // true if more pages exist
```

### Idempotency with `uniqueId`

If a payment with the same `uniqueId` already exists, the lib automatically returns the existing payment without throwing.

```typescript
const params = {
  amount: 2990,
  currency: 'eur',
  uniqueId: 'order-2026-001-attempt-1',
  card: 'card_xxxxxxxxxxxxxxxxxxxxxxxx',
};

const payment1 = await stancer.payments.create(params);
const payment2 = await stancer.payments.create(params); // same ID returned
console.log(payment1.id === payment2.id); // true
```

### Refund a payment

```typescript
// Partial refund
const refund = await stancer.payments.refund('paym_xxxxxxxxxxxxxxxxxxxxxxxx', 1000); // 10.00 €

// Full refund (fetches refundable amount automatically)
const refund = await stancer.payments.refund('paym_xxxxxxxxxxxxxxxxxxxxxxxx');
```

---

## Refunds

```typescript
// Create a refund
const refund = await stancer.refunds.create({
  amount: 1500,                              // 15.00 €
  payment: 'paym_xxxxxxxxxxxxxxxxxxxxxxxx',
});

console.log(refund.id);     // rfnd_xxxxxxxxxxxxxxxxxxxxxxxx
console.log(refund.status); // 'to_refund' | 'refunded' | ...

// Retrieve a refund
const refund = await stancer.refunds.retrieve('rfnd_xxxxxxxxxxxxxxxxxxxxxxxx');

// List refunds
const { refunds, range } = await stancer.refunds.list({ limit: 20 });
```

---

## Cards

### Tokenize a card

```typescript
const card = await stancer.cards.create({
  number: '4111111111111111',
  expMonth: 12,
  expYear: 2028,
  cvc: '123',
  name: 'John Doe',
  tokenize: true,
});

console.log(card.id);    // card_xxxxxxxxxxxxxxxxxxxxxxxx
console.log(card.last4); // '1111'
console.log(card.brand); // 'visa'

// Use the tokenized card in a payment
const payment = await stancer.payments.create({
  amount: 2990,
  currency: 'eur',
  card: card.id,
});
```

### Retrieve and list cards

```typescript
const card = await stancer.cards.retrieve('card_xxxxxxxxxxxxxxxxxxxxxxxx');

const { cards, range } = await stancer.cards.list({ limit: 20 });

await stancer.cards.delete('card_xxxxxxxxxxxxxxxxxxxxxxxx');
```

---

## SEPA accounts

```typescript
// Create a SEPA account
const sepa = await stancer.sepa.create({
  iban: 'FR7630006000011234567890189',
  name: 'John Doe',
  bic: 'AGRIFRPP',      // optional, 8 or 11 characters
  mandate: 'MND-001',   // optional, 3-35 characters
});

console.log(sepa.id);    // sepa_xxxxxxxxxxxxxxxxxxxxxxxx
console.log(sepa.last4); // '0189'

const sepa = await stancer.sepa.retrieve('sepa_xxxxxxxxxxxxxxxxxxxxxxxx');

const { sepa: list, range } = await stancer.sepa.list({ limit: 20 });

await stancer.sepa.delete('sepa_xxxxxxxxxxxxxxxxxxxxxxxx');
```

---

## Customers

```typescript
// Create a customer
const customer = await stancer.customers.create({
  email: 'john.doe@example.com',
  mobile: '+33612345678',   // optional
  name: 'John Doe',         // optional
  externalId: 'user-123',   // optional — your internal ID
});

console.log(customer.id); // cust_xxxxxxxxxxxxxxxxxxxxxxxx

const customer = await stancer.customers.retrieve('cust_xxxxxxxxxxxxxxxxxxxxxxxx');

const updated = await stancer.customers.update('cust_xxxxxxxxxxxxxxxxxxxxxxxx', {
  name: 'John P. Doe',
  email: 'jp.doe@example.com',
});

const { customers, range } = await stancer.customers.list({ limit: 20 });

await stancer.customers.delete('cust_xxxxxxxxxxxxxxxxxxxxxxxx'); // soft delete
```

### Attach a customer to a payment

```typescript
const payment = await stancer.payments.create({
  amount: 2990,
  currency: 'eur',
  customer: 'cust_xxxxxxxxxxxxxxxxxxxxxxxx',
  card: 'card_xxxxxxxxxxxxxxxxxxxxxxxx',
});
```

---

## Helpers

### `isCaptured(payment)`

Returns `true` if the payment is in a finalized captured state (`captured` or `to_capture`).

```typescript
import { isCaptured } from 'stancer-node';

const payment = await stancer.payments.retrieve('paym_xxxxxxxxxxxxxxxxxxxxxxxx');

if (isCaptured(payment)) {
  await confirmOrder(payment.orderId!);
}
```

### `getPaymentUrl(publicKey, paymentId)`

Generates the URL for the hosted Stancer payment page.

```typescript
import { getPaymentUrl } from 'stancer-node';

const url = getPaymentUrl(process.env.STANCER_PUBLIC_KEY!, payment.id);
// → 'https://payment.stancer.com/ptest_xxx/paym_xxx'

res.redirect(url);
```

---

## Error handling

```typescript
import { StancerError } from 'stancer-node';

try {
  const payment = await stancer.payments.create({ ... });
} catch (err) {
  if (err instanceof StancerError) {
    console.error(err.message); // Human-readable message
    console.error(err.code);    // Stancer error code
    console.error(err.status);  // HTTP status (400, 401, 404, 409...)
    console.error(err.body);    // Raw response body
  }
}
```

---

## ⚠️ No webhooks — reconciliation required

**Stancer does not support webhooks.** In production, payment status changes are not pushed to you automatically. Implement a reconciliation job that polls the API regularly.

```typescript
import { isCaptured } from 'stancer-node';

// Run every 10-15 minutes on pending payments
async function reconcile(pendingPaymentIds: string[]) {
  for (const id of pendingPaymentIds) {
    const payment = await stancer.payments.retrieve(id);

    if (isCaptured(payment)) {
      await db.orders.update({ paymentId: id }, { status: 'paid' });
    } else if (['failed', 'expired', 'refused', 'canceled'].includes(payment.status ?? '')) {
      await db.orders.update({ paymentId: id }, { status: 'failed' });
    }
    // Otherwise: still pending, check again on next cycle
  }
}
```

---

## Payment statuses

| Status | Description |
|--------|-------------|
| `authorize` | Authorized, deferred capture pending |
| `capture` | Capture request in progress |
| `captured` | Captured — payment finalized ✅ |
| `to_capture` | Awaiting capture ✅ |
| `canceled` | Canceled |
| `disputed` | Disputed (chargeback) |
| `expired` | Expired |
| `failed` | Failed |
| `refused` | Refused |

## Refund statuses

| Status | Description |
|--------|-------------|
| `to_refund` | Pending processing |
| `refund_sent` | Being transmitted to the bank |
| `refunded` | Refunded ✅ |
| `not_honored` | Rejected by the bank |
| `payment_canceled` | Original payment was canceled |

---

## API coverage notes

### Not implemented

**`payments.cancel()`** — No official Stancer SDK (PHP, Python, Perl) exposes an explicit cancel method. The API does not document a `DELETE /checkout/{id}` endpoint or a PATCH with `status: 'canceled'`. The `canceled` and `expired` statuses appear to be managed server-side by Stancer only.

**PaymentIntents V2** — `https://api.stancer.com/v2/` returns 404. The V2 API is not publicly accessible.

**Disputes** — The `disputed` status exists in the API but no `/disputes/` endpoint is documented or exposed in any official SDK.

### Implemented but not testable in stest_ environment

These methods are correctly implemented but the Stancer test environment (`stest_`) has limitations that prevent automated validation:

| Method | Reason |
|--------|--------|
| `cards.list()` | Returns "Nothing matches the given URI" with stest_ keys |
| `sepa.list()` | Same behavior |
| `customers.list()` | Same behavior |
| `refunds.create()` / `payments.refund()` | Require a payment with `captured` status — in stest_, payments stay in `to_capture` (capture is processed asynchronously by Stancer) |
| `refunds.retrieve()` | Requires an existing refund |

These features have been validated against the official SDK documentation (PHP, Python) and work correctly in production.

---

## License

MIT © [feelautom](https://github.com/feelautom)
