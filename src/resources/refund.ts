import { StancerClient, buildQueryString } from '../client.js';
import type { Refund, PageInfo, CreateRefundParams, RefundListParams } from '../types.js';

export interface RefundListResponse {
  refunds: Refund[];
  range: PageInfo;
}

export class RefundResource {
  constructor(private readonly client: StancerClient) {}

  create(params: CreateRefundParams): Promise<Refund> {
    return this.client.request<Refund>('POST', '/refunds/', {
      amount: params.amount,
      payment: params.payment,
    });
  }

  retrieve(id: string): Promise<Refund> {
    return this.client.request<Refund>('GET', `/refunds/${id}`);
  }

  async list(params?: RefundListParams): Promise<RefundListResponse> {
    const qs = buildQueryString({
      limit: params?.limit,
      start: params?.start,
      created: params?.created,
    });
    return this.client.request<RefundListResponse>('GET', `/refunds/${qs}`);
  }
}
