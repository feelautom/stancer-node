// ─── Statuts de paiement ────────────────────────────────────────────────────

export type PaymentStatus =
  | 'authorize'
  | 'capture'
  | 'captured'
  | 'canceled'
  | 'disputed'
  | 'expired'
  | 'failed'
  | 'refused'
  | 'to_capture';

// ─── Devises ────────────────────────────────────────────────────────────────

export type Currency =
  | 'aud'
  | 'cad'
  | 'chf'
  | 'dkk'
  | 'eur'
  | 'gbp'
  | 'hkd'
  | 'jpy'
  | 'nok'
  | 'sek'
  | 'usd';

// ─── Statuts de remboursement ────────────────────────────────────────────────

export type RefundStatus =
  | 'to_refund'
  | 'refund_sent'
  | 'refunded'
  | 'not_honored'
  | 'payment_canceled';

// ─── Marques de carte ────────────────────────────────────────────────────────

export type CardBrand =
  | 'american express'
  | 'dankort'
  | 'discover'
  | 'jcb'
  | 'maestro'
  | 'mastercard'
  | 'visa';

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface PageInfo {
  limit: number;
  start: number;
  hasMore: boolean;
}

export interface ListParams {
  /** Nombre de résultats (1–100) */
  limit?: number;
  /** Curseur de départ (>= 0) */
  start?: number;
  /** Timestamp Unix — filtre les ressources créées depuis cette date */
  created?: number;
}

export interface PaymentListParams extends ListParams {
  orderId?: string;
  uniqueId?: string;
}

export type CardListParams = ListParams;
export type SepaListParams = ListParams;
export type CustomerListParams = ListParams;

// ─── Authentification 3DS ────────────────────────────────────────────────────

export interface AuthInput {
  returnUrl: string;
}

export interface AuthResponse {
  redirectUrl?: string;
  returnUrl?: string;
  status: string;
}

// ─── Card ────────────────────────────────────────────────────────────────────

export interface Card {
  id: string;
  brand?: CardBrand;
  brandName?: string;
  country?: string;
  expMonth: number;
  expYear: number;
  last4: string;
  name?: string;
  zipCode?: string | null;
  funding?: string;
  nature?: string;
  network?: string;
  preferredNetwork?: string;
  tokenize?: boolean;
  externalId?: string | null;
  liveMode: boolean;
  created: number;
}

// ─── Sepa ────────────────────────────────────────────────────────────────────

export type SepaCheckStatus = 'available' | 'checked' | 'sent' | 'error' | 'unavailable';

export interface Sepa {
  id: string;
  bic?: string;
  country?: string;
  last4: string;
  name: string;
  mandate?: string;
  dateBirth?: string | null;
  dateMandate?: string | null;
  check?: { status: SepaCheckStatus };
  liveMode: boolean;
  created: number;
}

// ─── Customer ────────────────────────────────────────────────────────────────

export interface Customer {
  id: string;
  email?: string | null;
  mobile?: string | null;
  name?: string | null;
  country?: string | null;
  externalId?: string | null;
  dateBirth?: string | null;
  legalId?: string | null;
  deleted?: boolean;
  liveMode: boolean;
  created: number;
}

// ─── Refund ──────────────────────────────────────────────────────────────────

export interface Refund {
  id: string;
  amount: number;
  currency: Currency;
  status?: RefundStatus;
  /** ID du paiement associé */
  payment: string;
  dateRefund?: number | null;
  dateBank?: number | null;
  created: number;
}

export interface CreateRefundParams {
  /** Montant à rembourser en centimes (minimum 50) */
  amount: number;
  /** ID du paiement à rembourser */
  payment: string;
}

export type RefundListParams = ListParams;

// ─── Payment ─────────────────────────────────────────────────────────────────

export interface Payment {
  id: string;
  amount: number;
  currency: Currency;
  status?: PaymentStatus;
  description?: string;
  orderId?: string;
  uniqueId?: string;
  method?: string;
  methodsAllowed?: string[];
  card?: Card;
  sepa?: Sepa;
  customer?: Customer;
  auth?: AuthResponse | null;
  capture?: boolean;
  returnUrl?: string;
  country?: string;
  fee?: number;
  response?: string;
  responseAuthor?: string | null;
  datePaym?: number | null;
  dateBank?: number | null;
  refunds?: Refund[];
  refundedAmount?: number;
  refundableAmount?: number;
  liveMode: boolean;
  created: number;
}

// ─── Params de création de carte ─────────────────────────────────────────────

export interface CardInput {
  /** Numéro de carte (16–19 chiffres, validation Luhn) */
  number: string;
  /** Mois d'expiration (1–12) */
  expMonth: number;
  /** Année d'expiration (>= année courante) */
  expYear: number;
  /** CVC — exactement 3 caractères (string, pas entier) */
  cvc: string;
  name?: string;
  zipCode?: string;
  tokenize?: boolean;
  externalId?: string;
}

export type CreateCardParams = CardInput;

// ─── Params de création de SEPA ──────────────────────────────────────────────

export interface SepaInput {
  /** IBAN (validation Mod-97) */
  iban: string;
  /** Titulaire (3–64 caractères) */
  name: string;
  /** BIC — exactement 8 ou 11 caractères si fourni */
  bic?: string;
  mandate?: string;
  dateMandate?: string;
  dateBirth?: string;
}

export type CreateSepaParams = SepaInput;

// ─── Params de création de customer ──────────────────────────────────────────

export interface CreateCustomerParams {
  /** Email ou mobile requis (au moins un des deux) */
  email?: string;
  mobile?: string;
  name?: string;
  externalId?: string;
  dateBirth?: string;
  legalId?: string;
}

export type UpdateCustomerParams = CreateCustomerParams;

// ─── Params de création de paiement ─────────────────────────────────────────

export interface CreatePaymentParams {
  /** Montant en centimes (entier, minimum 50) */
  amount: number;
  currency: Currency;
  description?: string;
  orderId?: string;
  uniqueId?: string;
  /** Objet carte ou ID d'une carte existante */
  card?: CardInput | string;
  /** Objet SEPA ou ID d'un compte SEPA existant */
  sepa?: SepaInput | string;
  /** Objet customer ou ID d'un customer existant */
  customer?: CreateCustomerParams | string;
  /** true pour activer 3DS simple, objet pour fournir une returnUrl */
  auth?: true | AuthInput;
  /** false = capture différée (défaut : true) */
  capture?: boolean;
  returnUrl?: string;
}
