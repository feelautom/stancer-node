import { StancerClient, snakizeKeys, buildQueryString } from '../client.js';
import type { Address, PageInfo, CreateAddressParams, ListParams } from '../types.js';

export interface AddressListResponse {
  addresses: Address[];
  range: PageInfo;
}

export class AddressResource {
  constructor(private readonly client: StancerClient) {}

  create(params: CreateAddressParams): Promise<Address> {
    return this.client.request<Address>(
      'POST',
      '/addresses/',
      snakizeKeys(params) as Record<string, unknown>,
    );
  }

  retrieve(id: string): Promise<Address> {
    return this.client.request<Address>('GET', `/addresses/${id}`);
  }

  async list(params?: ListParams): Promise<AddressListResponse> {
    const qs = buildQueryString({
      limit: params?.limit,
      start: params?.start,
    });
    return this.client.request<AddressListResponse>('GET', `/addresses/${qs}`);
  }

  async delete(id: string): Promise<void> {
    await this.client.request<unknown>('DELETE', `/addresses/${id}`);
  }
}
