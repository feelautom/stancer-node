import { StancerClient, snakizeKeys, buildQueryString } from '../client.js';
import type { Card, PageInfo, CreateCardParams, CardListParams } from '../types.js';

export interface CardListResponse {
  cards: Card[];
  range: PageInfo;
}

export class CardResource {
  constructor(private readonly client: StancerClient) {}

  create(params: CreateCardParams): Promise<Card> {
    return this.client.request<Card>('POST', '/cards/', snakizeKeys(params) as Record<string, unknown>);
  }

  retrieve(id: string): Promise<Card> {
    return this.client.request<Card>('GET', `/cards/${id}`);
  }

  async list(params?: CardListParams): Promise<CardListResponse> {
    const qs = buildQueryString({
      limit: params?.limit,
      start: params?.start,
      created: params?.created,
    });
    return this.client.request<CardListResponse>('GET', `/cards/${qs}`);
  }

  async delete(id: string): Promise<void> {
    await this.client.request<unknown>('DELETE', `/cards/${id}`);
  }
}
