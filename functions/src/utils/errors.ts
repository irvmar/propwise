import { HttpsError, type FunctionsErrorCode } from 'firebase-functions/v2/https';

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public httpStatus: number = 500,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class TenantNotFoundError extends AppError {
  constructor(phone: string) {
    super(`Tenant not found for phone: ${phone}`, 'TENANT_NOT_FOUND', 404);
  }
}

export class OrganizationNotFoundError extends AppError {
  constructor(id: string) {
    super(`Organization not found: ${id}`, 'ORG_NOT_FOUND', 404);
  }
}

export class RateLimitError extends AppError {
  constructor() {
    super('Rate limit exceeded', 'RATE_LIMIT', 429);
  }
}

export function toHttpsError(error: unknown): HttpsError {
  if (error instanceof AppError) {
    const codeMap: Record<number, FunctionsErrorCode> = {
      400: 'invalid-argument',
      401: 'unauthenticated',
      403: 'permission-denied',
      404: 'not-found',
      429: 'resource-exhausted',
      500: 'internal',
    };
    return new HttpsError(
      codeMap[error.httpStatus] || 'internal',
      error.message,
    );
  }
  return new HttpsError('internal', 'An unexpected error occurred');
}
