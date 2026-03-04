import { Stancer, isCaptured } from '../src/index.js';

const apiKey = process.env.STANCER_STEST_KEY;
if (!apiKey) throw new Error('STANCER_STEST_KEY manquant');

const client = new Stancer({ apiKey });

const paymentId = process.argv[2];
if (!paymentId) throw new Error('Usage: npx tsx tests/retrieve.ts <payment_id>');

const payment = await client.payments.retrieve(paymentId);
console.log('status   :', payment.status);
console.log('amount   :', payment.amount, payment.currency);
console.log('captured :', isCaptured(payment));
console.log('full     :', JSON.stringify(payment, null, 2));
