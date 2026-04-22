import { StancerClient } from './client.js';
import { PaymentResource } from './resources/payment.js';
import { CardResource } from './resources/card.js';
import { SepaResource } from './resources/sepa.js';
import { CustomerResource } from './resources/customer.js';
import { RefundResource } from './resources/refund.js';
import { DisputeResource } from './resources/dispute.js';

export class Stancer {
  readonly payments: PaymentResource;
  readonly cards: CardResource;
  readonly sepa: SepaResource;
  readonly customers: CustomerResource;
  readonly refunds: RefundResource;
  readonly disputes: DisputeResource;

  constructor({ apiKey }: { apiKey: string }) {
    const client = new StancerClient(apiKey);
    this.payments = new PaymentResource(client);
    this.cards = new CardResource(client);
    this.sepa = new SepaResource(client);
    this.customers = new CustomerResource(client);
    this.refunds = new RefundResource(client);
    this.disputes = new DisputeResource(client);
  }
}

export default Stancer;

export { StancerError } from './errors.js';
export { isCaptured, getPaymentUrl } from './helpers.js';

export type {
  Payment,
  Card,
  Sepa,
  Customer,
  Refund,
  Dispute,
  PaymentStatus,
  RefundStatus,
  Currency,
  CardBrand,
  SepaCheckStatus,
  PageInfo,
  ListParams,
  PaymentListParams,
  CardListParams,
  SepaListParams,
  CustomerListParams,
  RefundListParams,
  DisputeListParams,
  CardInput,
  CreateCardParams,
  SepaInput,
  CreateSepaParams,
  CreateCustomerParams,
  UpdateCustomerParams,
  CreateRefundParams,
  CreatePaymentParams,
  AuthInput,
  AuthResponse,
} from './types.js';

export type { PaymentListResponse } from './resources/payment.js';
export type { CardListResponse } from './resources/card.js';
export type { SepaListResponse } from './resources/sepa.js';
export type { CustomerListResponse } from './resources/customer.js';
export type { RefundListResponse } from './resources/refund.js';
export type { DisputeListResponse } from './resources/dispute.js';
