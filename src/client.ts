import { StancerError } from './errors.js';

const BASE_URL = 'https://api.stancer.com/v1';

// ─── Camelize keys ────────────────────────────────────────────────────────────

function camelize(str: string): string {
  return str.replace(/_([a-z0-9])/g, (_, char: string) => char.toUpperCase());
}

export function camelizeKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(camelizeKeys);
  }
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      result[camelize(key)] = camelizeKeys(val);
    }
    return result;
  }
  return value;
}

// ─── Snakize keys ─────────────────────────────────────────────────────────────

export function snakize(str: string): string {
  return str.replace(/([A-Z])/g, (_, char: string) => `_${char.toLowerCase()}`);
}

export function snakizeKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(snakizeKeys);
  }
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      result[snakize(key)] = snakizeKeys(val);
    }
    return result;
  }
  return value;
}

// ─── Client HTTP ──────────────────────────────────────────────────────────────

export class StancerClient {
  private readonly authHeader: string;

  constructor(apiKey: string) {
    if (!apiKey) throw new Error('apiKey is required');
    this.authHeader = `Basic ${btoa(`${apiKey}:`)}`;
  }

  async request<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    path: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    const url = `${BASE_URL}${path}`;
    const headers: Record<string, string> = {
      Authorization: this.authHeader,
      'Content-Type': 'application/json',
    };

    const init: RequestInit = { method, headers };
    if (body !== undefined) {
      init.body = JSON.stringify(body);
    }

    const res = await fetch(url, init);

    let parsed: unknown;
    const text = await res.text();
    try {
      parsed = text ? JSON.parse(text) : {};
    } catch {
      parsed = {};
    }

    if (!res.ok) {
      const errorBody = (parsed ?? {}) as Record<string, unknown>;
      const errorObj = (errorBody['error'] ?? errorBody) as Record<string, unknown>;
      const message =
        typeof errorObj['message'] === 'string'
          ? errorObj['message']
          : `HTTP ${res.status}`;
      const code =
        typeof errorObj['code'] === 'string' ? errorObj['code'] : String(res.status);
      throw new StancerError(message, code, res.status, errorBody);
    }

    return camelizeKeys(parsed) as T;
  }
}

// ─── Query string ─────────────────────────────────────────────────────────────

export function buildQueryString(params: Record<string, string | number | undefined>): string {
  const parts: string[] = [];
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined) {
      parts.push(`${encodeURIComponent(snakize(key))}=${encodeURIComponent(String(val))}`);
    }
  }
  return parts.length > 0 ? `?${parts.join('&')}` : '';
}
