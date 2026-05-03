import { StancerClient, snakizeKeys, buildQueryString } from '../client.js';
import type { Sepa, SepaCheck, PageInfo, CreateSepaParams, UpdateSepaParams, CreateSepaCheckParams, SepaListParams } from '../types.js';

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

  update(id: string, params: UpdateSepaParams): Promise<Sepa> {
    return this.client.request<Sepa>(
      'PATCH',
      `/sepa/${id}`,
      snakizeKeys(params) as Record<string, unknown>,
    );
  }

  createCheck(params: CreateSepaCheckParams): Promise<SepaCheck> {
    return this.client.request<SepaCheck>('POST', '/sepa/check/', {
      sepa: params.sepa,
    });
  }

  retrieveCheck(id: string): Promise<SepaCheck> {
    return this.client.request<SepaCheck>('GET', `/sepa/check/${id}`);
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
