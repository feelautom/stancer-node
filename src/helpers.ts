import type { Payment } from './types.js';

/**
 * Retourne true si le paiement est dans un état final capturé.
 *
 * Stancer ne supporte pas les webhooks. En production, utiliser cette
 * fonction dans un job de réconciliation qui appelle payments.retrieve(id)
 * sur tous les paiements PENDING depuis plus de 10 minutes.
 */
export function isCaptured(payment: Payment): boolean {
  return payment.status === 'captured' || payment.status === 'to_capture';
}

/**
 * Génère l'URL de la page de paiement hébergée Stancer.
 * Redirige l'utilisateur vers cette URL après avoir créé le paiement.
 *
 * @param publicKey  Clé publique Stancer (commence par ptest_ ou pprod_)
 * @param paymentId  ID du paiement (commence par paym_)
 */
export function getPaymentUrl(publicKey: string, paymentId: string): string {
  return `https://payment.stancer.com/${publicKey}/${paymentId}`;
}
