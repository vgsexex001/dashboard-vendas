export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'AUTH_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'PAYLOAD_TOO_LARGE'
  | 'EXTERNAL_API_ERROR'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: ErrorCode,
    message: string,
    public details?: unknown[]
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown[]) {
    super(422, 'VALIDATION_ERROR', message, details);
  }
}

export class AuthError extends AppError {
  constructor(message = 'Não autorizado') {
    super(401, 'AUTH_ERROR', message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso não encontrado') {
    super(404, 'NOT_FOUND', message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Limite de requisições excedido. Tente novamente em instantes.') {
    super(429, 'RATE_LIMITED', message);
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(message = 'Arquivo muito grande') {
    super(413, 'PAYLOAD_TOO_LARGE', message);
  }
}

export class ExternalApiError extends AppError {
  constructor(message = 'Erro ao comunicar com serviço externo') {
    super(502, 'EXTERNAL_API_ERROR', message);
  }
}
