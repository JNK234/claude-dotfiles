// ABOUTME: Streaming-specific error types and recovery strategies
// ABOUTME: Provides comprehensive error handling for streaming functionality in medical platform

/**
 * Streaming error codes for specific error conditions
 */
export enum StreamingErrorCode {
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  STREAM_TIMEOUT = 'STREAM_TIMEOUT',
  INVALID_EVENT = 'INVALID_EVENT',
  PARSING_ERROR = 'PARSING_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  CHUNK_SEQUENCE_ERROR = 'CHUNK_SEQUENCE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Categories of streaming errors
 */
export enum StreamingErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  PARSING = 'PARSING',
  TIMEOUT = 'TIMEOUT',
  RATE_LIMIT = 'RATE_LIMIT',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Recovery strategies for different error types
 */
export enum ErrorRecoveryStrategy {
  RETRY = 'RETRY',
  RETRY_WITH_BACKOFF = 'RETRY_WITH_BACKOFF',
  RETRY_AFTER_DELAY = 'RETRY_AFTER_DELAY',
  FALLBACK_TO_BATCH = 'FALLBACK_TO_BATCH',
  USER_INTERVENTION = 'USER_INTERVENTION',
  ABORT = 'ABORT'
}

/**
 * Comprehensive streaming error interface
 */
export interface StreamingError {
  code: StreamingErrorCode;
  type: StreamingErrorType;
  message: string;
  timestamp: number;
  recoverable: boolean;
  context?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Recovery strategy configuration
 */
export interface RecoveryStrategy {
  action: ErrorRecoveryStrategy;
  maxAttempts?: number;
  backoffMs?: number;
  delayMs?: number;
  fallbackAction?: ErrorRecoveryStrategy;
}

/**
 * Maps error codes to their types
 */
const ERROR_CODE_TO_TYPE_MAP: Record<StreamingErrorCode, StreamingErrorType> = {
  [StreamingErrorCode.CONNECTION_FAILED]: StreamingErrorType.NETWORK,
  [StreamingErrorCode.STREAM_TIMEOUT]: StreamingErrorType.TIMEOUT,
  [StreamingErrorCode.INVALID_EVENT]: StreamingErrorType.PARSING,
  [StreamingErrorCode.PARSING_ERROR]: StreamingErrorType.PARSING,
  [StreamingErrorCode.AUTHENTICATION_ERROR]: StreamingErrorType.AUTHENTICATION,
  [StreamingErrorCode.RATE_LIMIT_EXCEEDED]: StreamingErrorType.RATE_LIMIT,
  [StreamingErrorCode.CHUNK_SEQUENCE_ERROR]: StreamingErrorType.CLIENT,
  [StreamingErrorCode.NETWORK_ERROR]: StreamingErrorType.NETWORK,
  [StreamingErrorCode.SERVER_ERROR]: StreamingErrorType.SERVER,
  [StreamingErrorCode.UNKNOWN_ERROR]: StreamingErrorType.UNKNOWN
};

/**
 * Maps error codes to their recoverability
 */
const RECOVERABLE_ERRORS = new Set([
  StreamingErrorCode.CONNECTION_FAILED,
  StreamingErrorCode.STREAM_TIMEOUT,
  StreamingErrorCode.NETWORK_ERROR,
  StreamingErrorCode.RATE_LIMIT_EXCEEDED,
  StreamingErrorCode.SERVER_ERROR
]);

/**
 * Creates a streaming error with proper type mapping
 */
export function createStreamingError(
  code: StreamingErrorCode,
  message: string,
  context?: Record<string, any>,
  metadata?: Record<string, any>
): StreamingError {
  return {
    code,
    type: ERROR_CODE_TO_TYPE_MAP[code],
    message,
    timestamp: Date.now(),
    recoverable: RECOVERABLE_ERRORS.has(code),
    context,
    metadata
  };
}

/**
 * Determines if an error is recoverable
 */
export function isRecoverableError(error: StreamingError): boolean {
  return error.recoverable;
}

/**
 * Gets appropriate recovery strategy for an error
 */
export function getErrorRecoveryStrategy(error: StreamingError): RecoveryStrategy {
  switch (error.code) {
    case StreamingErrorCode.CONNECTION_FAILED:
      return {
        action: ErrorRecoveryStrategy.RETRY_WITH_BACKOFF,
        maxAttempts: 3,
        backoffMs: 1000,
        fallbackAction: ErrorRecoveryStrategy.FALLBACK_TO_BATCH
      };

    case StreamingErrorCode.STREAM_TIMEOUT:
      return {
        action: ErrorRecoveryStrategy.RETRY,
        maxAttempts: 2,
        fallbackAction: ErrorRecoveryStrategy.FALLBACK_TO_BATCH
      };

    case StreamingErrorCode.NETWORK_ERROR:
      return {
        action: ErrorRecoveryStrategy.RETRY_WITH_BACKOFF,
        maxAttempts: 3,
        backoffMs: 2000
      };

    case StreamingErrorCode.RATE_LIMIT_EXCEEDED:
      return {
        action: ErrorRecoveryStrategy.RETRY_AFTER_DELAY,
        maxAttempts: 1,
        delayMs: 60000 // 1 minute
      };

    case StreamingErrorCode.AUTHENTICATION_ERROR:
      return {
        action: ErrorRecoveryStrategy.FALLBACK_TO_BATCH
      };

    case StreamingErrorCode.PARSING_ERROR:
    case StreamingErrorCode.INVALID_EVENT:
      return {
        action: ErrorRecoveryStrategy.FALLBACK_TO_BATCH
      };

    case StreamingErrorCode.SERVER_ERROR:
      return {
        action: ErrorRecoveryStrategy.RETRY,
        maxAttempts: 2,
        fallbackAction: ErrorRecoveryStrategy.FALLBACK_TO_BATCH
      };

    default:
      return {
        action: ErrorRecoveryStrategy.FALLBACK_TO_BATCH
      };
  }
}