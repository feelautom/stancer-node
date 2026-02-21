import { StancerClient, snakizeKeys, buildQueryString } from '../client.js';
import type { Sepa, PageInfo, CreateSepaParams, SepaListParams } from '../types.js';

export interface SepaListResponse {
  sepa: Sepa[];
  range: PageInfo;
}

export class SepaResource {
  constructor(private readonly client: StancerClient) {}

  create(params: CreateSepaParams): Promise<Sepa> {
    return this.client.request<Sepa>('POST', '/sepa/', snakizeKeys(params) as Record<string, unknown>);
  }

  retrieve(id: string): Promise<Sepa> {
    return this.client.request<Sepa>('GET', `/sepa/${id}`);
  }

  async list(params?: SepaListParams): Promise<SepaListResponse> {
    const qs = buildQueryString({
      limit: params?.limit,
      start: params?.start,
      created: params?.created,
    });
    return this.client.request<SepaListResponse>('GET', `/sepa/${qs}`);
  }

  async delete(id: string): Promise<void> {
    await this.client.request<unknown>('DELETE', `/sepa/${id}`);
  }
}
