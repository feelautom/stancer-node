import { StancerClient, buildQueryString } from '../client.js';
import type { Dispute, PageInfo, DisputeListParams } from '../types.js';

export interface DisputeListResponse {
  disputes: Dispute[];
  range: PageInfo;
}

export class DisputeResource {
  constructor(private readonly client: StancerClient) {}

  retrieve(id: string): Promise<Dispute> {
    return this.client.request<Dispute>('GET', `/disputes/${id}`);
  }

  async list(params?: DisputeListParams): Promise<DisputeListResponse> {
    const qs = buildQueryString({
      limit: params?.limit,
      start: params?.start,
      created: params?.created,
      created_until: params?.createdUntil,
    });
    return this.client.request<DisputeListResponse>('GET', `/disputes/${qs}`);
  }
}
