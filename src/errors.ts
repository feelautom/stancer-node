export class StancerError extends Error {
  readonly code: string;
  readonly status: number;
  readonly body: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    status: number,
    body: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'StancerError';
    this.code = code;
    this.status = status;
    this.body = body;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
