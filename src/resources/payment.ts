import { StancerClient, snakizeKeys, buildQueryString } from '../client.js';
import { StancerError } from '../errors.js';
import type {
  Payment,
  PageInfo,
  CreatePaymentParams,
  PaymentListParams,
  CardInput,
  SepaInput,
  CreateCustomerParams,
  AuthInput,
  Refund,
} from '../types.js';

// ─── Sérialisation snake_case ─────────────────────────────────────────────────

function serializeAuth(auth: true | AuthInput): true | Record<string, unknown> {
  if (auth === true) return true;
  return { return_url: auth.returnUrl };
}

function serializeCard(card: CardInput | string): string | Record<string, unknown> {
  if (typeof card === 'string') return card;
  return snakizeKeys(card) as Record<string, unknown>;
}

function serializeSepa(sepa: SepaInput | string): string | Record<string, unknown> {
  if (typeof sepa === 'string') return sepa;
  return snakizeKeys(sepa) as Record<string, unknown>;
}

function serializeCustomer(
  customer: CreateCustomerParams | string,
): string | Record<string, unknown> {
  if (typeof customer === 'string') return customer;
  return snakizeKeys(customer) as Record<string, unknown>;
}

function serializePaymentParams(params: CreatePaymentParams): Record<string, unknown> {
  const body: Record<string, unknown> = {
    amount: params.amount,
    currency: params.currency,
  };

  if (params.description !== undefined) body['description'] = params.description;
  if (params.orderId !== undefined) body['order_id'] = params.orderId;
  if (params.uniqueId !== undefined) body['unique_id'] = params.uniqueId;
  if (params.capture !== undefined) body['capture'] = params.capture;
  if (params.returnUrl !== undefined) body['return_url'] = params.returnUrl;
  if (params.auth !== undefined) body['auth'] = serializeAuth(params.auth);
  if (params.card !== undefined) body['card'] = serializeCard(params.card);
  if (params.sepa !== undefined) body['sepa'] = serializeSepa(params.sepa);
  if (params.customer !== undefined) body['customer'] = serializeCustomer(params.customer);

  return body;
}

// ─── Resource ─────────────────────────────────────────────────────────────────

export interface PaymentListResponse {
  payments: Payment[];
  range: PageInfo;
}

export class PaymentResource {
  constructor(private readonly client: StancerClient) {}

  async create(params: CreatePaymentParams): Promise<Payment> {
    const body = serializePaymentParams(params);
    try {
      return await this.client.request<Payment>('POST', '/checkout/', body);
    } catch (err) {
      if (err instanceof StancerError && err.status === 409) {
        // Structure réelle de l'API : body.error.message.id
        const errorObj = (err.body['error'] ?? {}) as Record<string, unknown>;
        const messageObj = (errorObj['message'] ?? {}) as Record<string, unknown>;
        const existingId =
          (typeof err.body['id'] === 'string' ? err.body['id'] : null) ??
          (typeof errorObj['id'] === 'string' ? errorObj['id'] : null) ??
          (typeof messageObj['id'] === 'string' ? messageObj['id'] : null);
        if (existingId) {
          return this.retrieve(existingId);
        }
      }
      throw err;
    }
  }

  retrieve(id: string): Promise<Payment> {
    return this.client.request<Payment>('GET', `/checkout/${id}`);
  }

  capture(id: string): Promise<Payment> {
    return this.client.request<Payment>('PATCH', `/checkout/${id}`, {
      status: 'capture',
    });
  }

  async list(params?: PaymentListParams): Promise<PaymentListResponse> {
    const qs = buildQueryString({
      limit: params?.limit,
      start: params?.start,
      created: params?.created,
      order_id: params?.orderId,
      unique_id: params?.uniqueId,
    });
    return this.client.request<PaymentListResponse>('GET', `/checkout/${qs}`);
  }

  /**
   * Rembourse un paiement.
   * Si `amount` n'est pas fourni, rembourse le montant total remboursable.
   */
  async refund(id: string, amount?: number): Promise<Refund> {
    let refundAmount = amount;
    if (refundAmount === undefined) {
      const payment = await this.retrieve(id);
      refundAmount = payment.refundableAmount ?? payment.amount;
    }
    return this.client.request<Refund>('POST', '/refunds/', {
      amount: refundAmount,
      payment: id,
    });
  }
}
