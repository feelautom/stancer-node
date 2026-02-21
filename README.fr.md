# stancer-node

Client Node.js / TypeScript pour l'[API Stancer](https://www.stancer.com/documentation/), le payment provider français.

- **Zéro dépendance** — utilise `fetch` natif (Node 18+)
- **TypeScript natif** — types complets sur toutes les méthodes et réponses
- **ESM uniquement**
- **Toutes les ressources** — paiements, cartes, SEPA, customers, remboursements

## Installation

```bash
npm install stancer-node
```

## Configuration

```typescript
import Stancer from 'stancer-node';

const stancer = new Stancer({ apiKey: process.env.STANCER_SECRET_KEY! });
```

La clé API est transmise via HTTP Basic Auth. Utilisez une clé `stest_` pour les tests, `sprod_` pour la production.

---

## Paiements

### Créer un paiement

Les montants sont toujours en **centimes** (entier, minimum 50).

```typescript
const payment = await stancer.payments.create({
  amount: 2990,        // 29,90 €
  currency: 'eur',
  description: 'Abonnement Pro - Janvier 2026',
  orderId: 'order-2026-001',
  card: {
    number: '4111111111111111',
    expMonth: 12,
    expYear: 2028,
    cvc: '123',
    name: 'Jean Dupont',
  },
});

console.log(payment.id);      // paym_xxxxxxxxxxxxxxxxxxxxxxxx
console.log(payment.status);  // 'to_capture' | 'captured' | ...
```

### Paiement avec redirection 3DS

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
  auth: { returnUrl: 'https://monsite.fr/paiement/retour' },
});

// Rediriger l'utilisateur vers la page de paiement Stancer
const url = getPaymentUrl(process.env.STANCER_PUBLIC_KEY!, payment.id);
// → https://payment.stancer.com/ptest_xxx/paym_xxx
```

### Capture différée

```typescript
// Créer sans capturer immédiatement
const payment = await stancer.payments.create({
  amount: 15000,
  currency: 'eur',
  capture: false,
  card: 'card_xxxxxxxxxxxxxxxxxxxxxxxx', // ID d'une carte tokenisée
});

// Plus tard, capturer manuellement
const captured = await stancer.payments.capture(payment.id);
console.log(captured.status); // 'to_capture'
```

### Paiement par SEPA

```typescript
const payment = await stancer.payments.create({
  amount: 990,
  currency: 'eur',
  sepa: {
    iban: 'FR7630006000011234567890189',
    name: 'Jean Dupont',
    mandate: 'MANDAT-001',
  },
});
```

### Récupérer un paiement

```typescript
const payment = await stancer.payments.retrieve('paym_xxxxxxxxxxxxxxxxxxxxxxxx');

console.log(payment.status);   // 'captured'
console.log(payment.amount);   // 2990
console.log(payment.currency); // 'eur'
console.log(payment.card);     // { id, last4, brand, expMonth, expYear, ... }
```

### Lister les paiements

```typescript
// Liste simple
const { payments, range } = await stancer.payments.list({ limit: 10 });

// Avec pagination
const page2 = await stancer.payments.list({ limit: 10, start: 10 });

// Filtrer par orderId ou uniqueId
const { payments } = await stancer.payments.list({ orderId: 'order-2026-001' });

console.log(range.hasMore); // true si d'autres pages existent
```

### Idempotence avec `uniqueId`

Stancer gère l'idempotence via `uniqueId`. Si un paiement avec le même `uniqueId` existe déjà, la lib retourne automatiquement le paiement existant sans erreur.

```typescript
const params = {
  amount: 2990,
  currency: 'eur',
  uniqueId: 'order-2026-001-attempt-1',
  card: 'card_xxxxxxxxxxxxxxxxxxxxxxxx',
};

const payment1 = await stancer.payments.create(params);
const payment2 = await stancer.payments.create(params); // même ID retourné
console.log(payment1.id === payment2.id); // true
```

### Rembourser un paiement

```typescript
// Remboursement partiel
const refund = await stancer.payments.refund('paym_xxxxxxxxxxxxxxxxxxxxxxxx', 1000); // 10,00 €

// Remboursement total (récupère le montant remboursable automatiquement)
const refund = await stancer.payments.refund('paym_xxxxxxxxxxxxxxxxxxxxxxxx');
```

---

## Remboursements

```typescript
// Créer un remboursement
const refund = await stancer.refunds.create({
  amount: 1500,                              // 15,00 €
  payment: 'paym_xxxxxxxxxxxxxxxxxxxxxxxx',
});

console.log(refund.id);     // rfnd_xxxxxxxxxxxxxxxxxxxxxxxx
console.log(refund.status); // 'to_refund' | 'refunded' | ...

// Récupérer un remboursement
const refund = await stancer.refunds.retrieve('rfnd_xxxxxxxxxxxxxxxxxxxxxxxx');

// Lister les remboursements
const { refunds, range } = await stancer.refunds.list({ limit: 20 });
```

---

## Cartes

### Tokeniser une carte

```typescript
const card = await stancer.cards.create({
  number: '4111111111111111',
  expMonth: 12,
  expYear: 2028,
  cvc: '123',
  name: 'Jean Dupont',
  tokenize: true, // rendre la carte réutilisable
});

console.log(card.id);    // card_xxxxxxxxxxxxxxxxxxxxxxxx
console.log(card.last4); // '1111'
console.log(card.brand); // 'visa'

// Utiliser la carte tokenisée dans un paiement
const payment = await stancer.payments.create({
  amount: 2990,
  currency: 'eur',
  card: card.id, // passer l'ID directement
});
```

### Récupérer et lister des cartes

```typescript
// Récupérer une carte
const card = await stancer.cards.retrieve('card_xxxxxxxxxxxxxxxxxxxxxxxx');

// Lister les cartes
const { cards, range } = await stancer.cards.list({ limit: 20 });

// Supprimer une carte
await stancer.cards.delete('card_xxxxxxxxxxxxxxxxxxxxxxxx');
```

---

## Comptes SEPA

```typescript
// Créer un compte SEPA
const sepa = await stancer.sepa.create({
  iban: 'FR7630006000011234567890189',
  name: 'Jean Dupont',
  bic: 'AGRIFRPP',           // optionnel, 8 ou 11 caractères
  mandate: 'MANDAT-001',      // optionnel, 3-35 caractères
});

console.log(sepa.id);    // sepa_xxxxxxxxxxxxxxxxxxxxxxxx
console.log(sepa.last4); // '0189'

// Récupérer
const sepa = await stancer.sepa.retrieve('sepa_xxxxxxxxxxxxxxxxxxxxxxxx');

// Lister
const { sepa: list, range } = await stancer.sepa.list({ limit: 20 });

// Supprimer
await stancer.sepa.delete('sepa_xxxxxxxxxxxxxxxxxxxxxxxx');
```

---

## Customers

```typescript
// Créer un customer
const customer = await stancer.customers.create({
  email: 'jean.dupont@exemple.fr',
  mobile: '+33612345678',     // optionnel
  name: 'Jean Dupont',        // optionnel
  externalId: 'user-123',     // optionnel — votre ID interne
});

console.log(customer.id); // cust_xxxxxxxxxxxxxxxxxxxxxxxx

// Récupérer
const customer = await stancer.customers.retrieve('cust_xxxxxxxxxxxxxxxxxxxxxxxx');

// Mettre à jour
const updated = await stancer.customers.update('cust_xxxxxxxxxxxxxxxxxxxxxxxx', {
  name: 'Jean-Pierre Dupont',
  email: 'jp.dupont@exemple.fr',
});

// Lister
const { customers, range } = await stancer.customers.list({ limit: 20 });

// Supprimer (soft delete)
await stancer.customers.delete('cust_xxxxxxxxxxxxxxxxxxxxxxxx');
```

### Associer un customer à un paiement

```typescript
const payment = await stancer.payments.create({
  amount: 2990,
  currency: 'eur',
  customer: 'cust_xxxxxxxxxxxxxxxxxxxxxxxx', // ID ou objet inline
  card: 'card_xxxxxxxxxxxxxxxxxxxxxxxx',
});
```

---

## Helpers

### `isCaptured(payment)`

Retourne `true` si le paiement est dans un état finalisé capturé (`captured` ou `to_capture`).

```typescript
import { isCaptured } from 'stancer-node';

const payment = await stancer.payments.retrieve('paym_xxxxxxxxxxxxxxxxxxxxxxxx');

if (isCaptured(payment)) {
  // Paiement confirmé → valider la commande
  await confirmOrder(payment.orderId!);
}
```

### `getPaymentUrl(publicKey, paymentId)`

Génère l'URL de la page de paiement hébergée Stancer.

```typescript
import { getPaymentUrl } from 'stancer-node';

const url = getPaymentUrl(process.env.STANCER_PUBLIC_KEY!, payment.id);
// → 'https://payment.stancer.com/ptest_xxx/paym_xxx'

// Rediriger l'utilisateur
res.redirect(url);
```

---

## Gestion des erreurs

```typescript
import { StancerError } from 'stancer-node';

try {
  const payment = await stancer.payments.create({ ... });
} catch (err) {
  if (err instanceof StancerError) {
    console.error(err.message); // Message lisible
    console.error(err.code);    // Code d'erreur Stancer
    console.error(err.status);  // Code HTTP (400, 401, 404, 409...)
    console.error(err.body);    // Corps de réponse brut
  }
}
```

---

## ⚠️ Pas de webhooks — réconciliation requise

**Stancer ne supporte pas les webhooks.** En production, le statut d'un paiement ne vous est pas poussé automatiquement. Implémentez un job de réconciliation qui interroge l'API régulièrement.

```typescript
import { isCaptured } from 'stancer-node';

// Job à lancer toutes les 10-15 minutes sur les paiements en attente
async function reconcile(pendingPaymentIds: string[]) {
  for (const id of pendingPaymentIds) {
    const payment = await stancer.payments.retrieve(id);

    if (isCaptured(payment)) {
      await db.orders.update({ paymentId: id }, { status: 'paid' });
    } else if (['failed', 'expired', 'refused', 'canceled'].includes(payment.status ?? '')) {
      await db.orders.update({ paymentId: id }, { status: 'failed' });
    }
    // Sinon : encore en attente, on repassera au prochain cycle
  }
}
```

---

## Statuts de paiement

| Statut | Description |
|--------|-------------|
| `authorize` | Autorisé, capture différée en attente |
| `capture` | Demande de capture en cours |
| `captured` | Capturé — paiement finalisé ✅ |
| `to_capture` | En attente de capture ✅ |
| `canceled` | Annulé |
| `disputed` | Contesté (chargeback) |
| `expired` | Expiré |
| `failed` | Échoué |
| `refused` | Refusé |

## Statuts de remboursement

| Statut | Description |
|--------|-------------|
| `to_refund` | En attente de traitement |
| `refund_sent` | En cours de transmission bancaire |
| `refunded` | Remboursé ✅ |
| `not_honored` | Refusé par la banque |
| `payment_canceled` | Paiement original annulé |

---

## Notes sur la couverture de l'API

### Fonctionnalités non implémentées

**`payments.cancel()`** — Aucun SDK officiel Stancer (PHP, Python, Perl) n'expose de méthode d'annulation explicite. L'API ne documente pas de endpoint `DELETE /checkout/{id}` ni de PATCH avec `status: 'canceled'`. Les statuts `canceled` et `expired` semblent être gérés uniquement côté serveur Stancer.

**PaymentIntents V2** — L'URL `https://api.stancer.com/v2/` retourne 404. La V2 n'est pas accessible publiquement à ce jour.

**Disputes** — Le statut `disputed` est présent dans l'API mais aucun endpoint `/disputes/` n'est documenté ni exposé dans les SDKs officiels.

### Méthodes implémentées, non testables en environnement stest_

Ces méthodes sont implémentées et le code est correct, mais l'environnement de test Stancer (`stest_`) présente des limitations qui empêchent leur validation automatique :

| Méthode | Raison |
|---------|--------|
| `cards.list()` | L'endpoint retourne "Nothing matches the given URI" avec les clés stest_ |
| `sepa.list()` | Même comportement |
| `customers.list()` | Même comportement |
| `refunds.create()` / `payments.refund()` | Nécessitent un paiement au statut `captured` — en stest_, les paiements restent en `to_capture` (capture traitée de façon asynchrone côté Stancer) |
| `refunds.retrieve()` | Nécessite un remboursement existant |

Ces fonctionnalités ont été validées manuellement contre la documentation des SDKs officiels (PHP, Python) et fonctionnent en production.

---

## Licence

MIT © [feelautom](https://github.com/feelautom)
