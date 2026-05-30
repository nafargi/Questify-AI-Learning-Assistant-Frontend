export enum QuestifyErrorCode {
  NETWORK_FAILURE = 'NETWORK_FAILURE',
  REQUEST_TIMEOUT = 'REQUEST_TIMEOUT',
  PARSE_FAILURE = 'PARSE_FAILURE',
  UNAUTHORIZED = 'UNAUTHORIZED',
  ACCOUNT_UNVERIFIED = 'ACCOUNT_UNVERIFIED',
  FORBIDDEN = 'FORBIDDEN',
  SUBSCRIPTION_REQUIRED = 'SUBSCRIPTION_REQUIRED',
  MATERIAL_LIMIT_REACHED = 'MATERIAL_LIMIT_REACHED',
  AI_REQUEST_LIMIT_REACHED = 'AI_REQUEST_LIMIT_REACHED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  ANALYZE_RATE_LIMITED = 'ANALYZE_RATE_LIMITED',
  EXAM_GENERATION_DISABLED = 'EXAM_GENERATION_DISABLED',
  CHAT_DISABLED = 'CHAT_DISABLED',
  UNEXPECTED_CONTENT_TYPE = 'UNEXPECTED_CONTENT_TYPE'
}

export class QuestifyError extends Error {
  constructor(
    public readonly code: QuestifyErrorCode,
    public readonly message: string,
    public readonly statusCode: number,
    public readonly requestId: string,
    public readonly endpoint: string,
    public readonly timestamp: Date,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'QuestifyError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// HTTP layer errors
export class NetworkError extends QuestifyError {
  constructor(message: string, endpoint: string, originalError?: unknown) {
    super(QuestifyErrorCode.NETWORK_FAILURE, message, 0, 'unknown', endpoint, new Date(), originalError);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends QuestifyError {
  constructor(message: string, endpoint: string) {
    super(QuestifyErrorCode.REQUEST_TIMEOUT, message, 0, 'unknown', endpoint, new Date());
    this.name = 'TimeoutError';
  }
}

export class ParseError extends QuestifyError {
  constructor(message: string, endpoint: string, originalError?: unknown) {
    super(QuestifyErrorCode.PARSE_FAILURE, message, 0, 'unknown', endpoint, new Date(), originalError);
    this.name = 'ParseError';
  }
}

export class UnexpectedContentTypeError extends QuestifyError {
  constructor(message: string, endpoint: string) {
    super(QuestifyErrorCode.UNEXPECTED_CONTENT_TYPE, message, 0, 'unknown', endpoint, new Date());
    this.name = 'UnexpectedContentTypeError';
  }
}

// Auth errors
export class UnauthorizedError extends QuestifyError {
  constructor(message: string, requestId: string, endpoint: string) {
    super(QuestifyErrorCode.UNAUTHORIZED, message, 401, requestId, endpoint, new Date());
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends QuestifyError {
  constructor(code: QuestifyErrorCode, message: string, requestId: string, endpoint: string) {
    super(code, message, 403, requestId, endpoint, new Date());
    this.name = 'ForbiddenError';
  }
}

export class SubscriptionLimitError extends ForbiddenError {
  constructor(code: QuestifyErrorCode, message: string, requestId: string, endpoint: string) {
    super(code, message, requestId, endpoint);
    this.name = 'SubscriptionLimitError';
  }
}

export class AccountUnverifiedError extends ForbiddenError {
  constructor(message: string, requestId: string, endpoint: string) {
    super(QuestifyErrorCode.ACCOUNT_UNVERIFIED, message, requestId, endpoint);
    this.name = 'AccountUnverifiedError';
  }
}

// Validation errors
export class ValidationError extends QuestifyError {
  constructor(
    message: string,
    requestId: string,
    endpoint: string,
    public readonly fieldErrors?: Record<string, string>
  ) {
    super(QuestifyErrorCode.VALIDATION_ERROR, message, 400, requestId, endpoint, new Date());
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends QuestifyError {
  constructor(
    message: string,
    requestId: string,
    endpoint: string,
    public readonly retryAfterSeconds: number
  ) {
    super(QuestifyErrorCode.RATE_LIMITED, message, 429, requestId, endpoint, new Date());
    this.name = 'RateLimitError';
  }
}

// Resource errors
export class NotFoundError extends QuestifyError {
  constructor(message: string, requestId: string, endpoint: string) {
    super(QuestifyErrorCode.NOT_FOUND, message, 404, requestId, endpoint, new Date());
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends QuestifyError {
  constructor(message: string, requestId: string, endpoint: string) {
    super(QuestifyErrorCode.CONFLICT, message, 409, requestId, endpoint, new Date());
    this.name = 'ConflictError';
  }
}

// Server errors
export class InternalServerError extends QuestifyError {
  constructor(message: string, requestId: string, endpoint: string) {
    super(QuestifyErrorCode.INTERNAL_SERVER_ERROR, message, 500, requestId, endpoint, new Date());
    this.name = 'InternalServerError';
  }
}

// Business logic errors (subclasses of SubscriptionLimitError)
export class MaterialLimitError extends SubscriptionLimitError {
  constructor(message: string, requestId: string, endpoint: string) {
    super(QuestifyErrorCode.MATERIAL_LIMIT_REACHED, message, requestId, endpoint);
    this.name = 'MaterialLimitError';
  }
}

export class AIRequestLimitError extends SubscriptionLimitError {
  constructor(message: string, requestId: string, endpoint: string) {
    super(QuestifyErrorCode.AI_REQUEST_LIMIT_REACHED, message, requestId, endpoint);
    this.name = 'AIRequestLimitError';
  }
}

export class ExamGenerationDisabledError extends SubscriptionLimitError {
  constructor(message: string, requestId: string, endpoint: string) {
    super(QuestifyErrorCode.EXAM_GENERATION_DISABLED, message, requestId, endpoint);
    this.name = 'ExamGenerationDisabledError';
  }
}

export class ChatDisabledError extends SubscriptionLimitError {
  constructor(message: string, requestId: string, endpoint: string) {
    super(QuestifyErrorCode.CHAT_DISABLED, message, requestId, endpoint);
    this.name = 'ChatDisabledError';
  }
}

export class AnalysisFailedError extends QuestifyError {
  constructor(message: string, requestId: string, endpoint: string, public readonly errorDetails?: unknown) {
    super(QuestifyErrorCode.INTERNAL_SERVER_ERROR, message, 500, requestId, endpoint, new Date());
    this.name = 'AnalysisFailedError';
  }
}
