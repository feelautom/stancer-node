import { StancerClient, type ApiVersion } from './client.js';
import { PaymentResource } from './resources/payment.js';
import { CardResource } from './resources/card.js';
import { SepaResource } from './resources/sepa.js';
import { CustomerResource } from './resources/customer.js';
import { RefundResource } from './resources/refund.js';
import { DisputeResource } from './resources/dispute.js';
import { AddressResource } from './resources/address.js';

export interface StancerOptions {
  apiKey: string;
  apiVersion?: ApiVersion;
}

export class Stancer {
  readonly payments: PaymentResource;
  readonly cards: CardResource;
  readonly sepa: SepaResource;
  readonly customers: CustomerResource;
  readonly refunds: RefundResource;
  readonly disputes: DisputeResource;
  readonly addresses: AddressResource;

  constructor(options: StancerOptions | { apiKey: string }) {
    const apiKey = options.apiKey;
    const apiVersion = 'apiVersion' in options ? options.apiVersion ?? 'v1' : 'v1';
    const client = new StancerClient(apiKey, apiVersion);
    this.payments = new PaymentResource(client);
    this.cards = new CardResource(client);
    this.sepa = new SepaResource(client);
    this.customers = new CustomerResource(client);
    this.refunds = new RefundResource(client);
    this.disputes = new DisputeResource(client);
    this.addresses = new AddressResource(client);
  }
}

export default Stancer;

export { StancerError } from './errors.js';
export { isCaptured, getPaymentUrl } from './helpers.js';
export type { ApiVersion } from './client.js';

export type {
  Payment,
  Card,
  Sepa,
  Customer,
  Refund,
  Dispute,
  Address,
  SepaCheck,
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
  UpdateCardParams,
  SepaInput,
  CreateSepaParams,
  UpdateSepaParams,
  CreateSepaCheckParams,
  CreateAddressParams,
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
export type { AddressListResponse } from './resources/address.js';
