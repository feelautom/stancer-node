import { StancerClient, snakizeKeys, buildQueryString } from '../client.js';
import type {
  Customer,
  PageInfo,
  ListParams,
  CreateCustomerParams,
  UpdateCustomerParams,
  CustomerListParams,
} from '../types.js';

export interface CustomerListResponse {
  customers: Customer[];
  range: PageInfo;
}

export class CustomerResource {
  constructor(private readonly client: StancerClient) {}

  create(params: CreateCustomerParams): Promise<Customer> {
    return this.client.request<Customer>(
      'POST',
      '/customers/',
      snakizeKeys(params) as Record<string, unknown>,
    );
  }

  retrieve(id: string): Promise<Customer> {
    return this.client.request<Customer>('GET', `/customers/${id}`);
  }

  update(id: string, params: UpdateCustomerParams): Promise<Customer> {
    return this.client.request<Customer>(
      'PATCH',
      `/customers/${id}`,
      snakizeKeys(params) as Record<string, unknown>,
    );
  }

  async list(params?: CustomerListParams): Promise<CustomerListResponse> {
    const qs = buildQueryString({
      limit: params?.limit,
      start: params?.start,
      created: params?.created,
    });
    return this.client.request<CustomerListResponse>('GET', `/customers/${qs}`);
  }

  async delete(id: string): Promise<void> {
    await this.client.request<unknown>('DELETE', `/customers/${id}`);
  }

  async listPaymentIntents(id: string, params?: ListParams): Promise<unknown> {
    const qs = buildQueryString({
      limit: params?.limit,
      start: params?.start,
    });
    return this.client.request<unknown>('GET', `/customers/${id}/payment_intents${qs}`);
  }

  async listSubscriptions(id: string, params?: ListParams): Promise<unknown> {
    const qs = buildQueryString({
      limit: params?.limit,
      start: params?.start,
    });
    return this.client.request<unknown>('GET', `/customers/${id}/subscriptions${qs}`);
  }
}
