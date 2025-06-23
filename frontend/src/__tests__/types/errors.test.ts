// ABOUTME: Tests for streaming-specific error types and error handling utilities
// ABOUTME: Validates error classification and recovery mechanisms for streaming functionality

import {
  StreamingError,
  StreamingErrorCode,
  StreamingErrorType,
  createStreamingError,
  isRecoverableError,
  getErrorRecoveryStrategy,
  ErrorRecoveryStrategy
} from '../../types/errors';

describe('Streaming Error Types', () => {
  describe('StreamingErrorCode enum', () => {
    it('should include all expected error codes', () => {
      const expectedCodes = [
        'CONNECTION_FAILED',
        'STREAM_TIMEOUT',
        'INVALID_EVENT',
        'PARSING_ERROR',
        'AUTHENTICATION_ERROR',
        'RATE_LIMIT_EXCEEDED',
        'CHUNK_SEQUENCE_ERROR',
        'NETWORK_ERROR',
        'SERVER_ERROR',
        'UNKNOWN_ERROR'
      ];

      expectedCodes.forEach(code => {
        expect(Object.values(StreamingErrorCode)).toContain(code);
      });
    });
  });

  describe('StreamingErrorType enum', () => {
    it('should categorize errors by type', () => {
      const expectedTypes = [
        'NETWORK',
        'AUTHENTICATION', 
        'PARSING',
        'TIMEOUT',
        'RATE_LIMIT',
        'SERVER',
        'CLIENT',
        'UNKNOWN'
      ];

      expectedTypes.forEach(type => {
        expect(Object.values(StreamingErrorType)).toContain(type);
      });
    });
  });

  describe('StreamingError interface', () => {
    it('should have required error properties', () => {
      const error: StreamingError = {
        code: StreamingErrorCode.STREAM_TIMEOUT,
        type: StreamingErrorType.TIMEOUT,
        message: 'Stream timed out after 30 seconds',
        timestamp: Date.now(),
        recoverable: true
      };

      expect(error.code).toBe(StreamingErrorCode.STREAM_TIMEOUT);
      expect(error.type).toBe(StreamingErrorType.TIMEOUT);
      expect(error.message).toBe('Stream timed out after 30 seconds');
      expect(error.recoverable).toBe(true);
    });

    it('should support optional context and metadata', () => {
      const error: StreamingError = {
        code: StreamingErrorCode.PARSING_ERROR,
        type: StreamingErrorType.PARSING,
        message: 'Failed to parse SSE event',
        timestamp: Date.now(),
        recoverable: false,
        context: {
          eventData: 'malformed-event-string',
          stageId: 'initial'
        },
        metadata: {
          attempts: 3,
          lastAttempt: Date.now() - 1000
        }
      };

      expect(error.context).toBeDefined();
      expect(error.context!.eventData).toBe('malformed-event-string');
      expect(error.metadata).toBeDefined();
      expect(error.metadata!.attempts).toBe(3);
    });
  });

  describe('createStreamingError function', () => {
    it('should create streaming errors with correct types', () => {
      const error = createStreamingError(
        StreamingErrorCode.CONNECTION_FAILED,
        'Unable to establish SSE connection'
      );

      expect(error.code).toBe(StreamingErrorCode.CONNECTION_FAILED);
      expect(error.type).toBe(StreamingErrorType.NETWORK);
      expect(error.message).toBe('Unable to establish SSE connection');
      expect(error.timestamp).toBeDefined();
    });

    it('should auto-determine error type from code', () => {
      const timeoutError = createStreamingError(
        StreamingErrorCode.STREAM_TIMEOUT,
        'Timeout occurred'
      );

      const authError = createStreamingError(
        StreamingErrorCode.AUTHENTICATION_ERROR,
        'Authentication failed'
      );

      expect(timeoutError.type).toBe(StreamingErrorType.TIMEOUT);
      expect(authError.type).toBe(StreamingErrorType.AUTHENTICATION);
    });

    it('should support optional context and metadata', () => {
      const error = createStreamingError(
        StreamingErrorCode.PARSING_ERROR,
        'JSON parse failed',
        { eventData: 'invalid-json' },
        { parseAttempts: 2 }
      );

      expect(error.context).toEqual({ eventData: 'invalid-json' });
      expect(error.metadata).toEqual({ parseAttempts: 2 });
    });

    it('should set current timestamp', () => {
      const beforeTime = Date.now();
      const error = createStreamingError(
        StreamingErrorCode.NETWORK_ERROR,
        'Network failed'
      );
      const afterTime = Date.now();

      expect(error.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(error.timestamp).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('isRecoverableError function', () => {
    it('should identify recoverable errors', () => {
      const recoverableErrors = [
        StreamingErrorCode.CONNECTION_FAILED,
        StreamingErrorCode.STREAM_TIMEOUT,
        StreamingErrorCode.NETWORK_ERROR,
        StreamingErrorCode.RATE_LIMIT_EXCEEDED
      ];

      recoverableErrors.forEach(code => {
        const error = createStreamingError(code, 'Test error');
        expect(isRecoverableError(error)).toBe(true);
      });
    });

    it('should identify non-recoverable errors', () => {
      const nonRecoverableErrors = [
        StreamingErrorCode.AUTHENTICATION_ERROR,
        StreamingErrorCode.PARSING_ERROR,
        StreamingErrorCode.INVALID_EVENT
      ];

      nonRecoverableErrors.forEach(code => {
        const error = createStreamingError(code, 'Test error');
        expect(isRecoverableError(error)).toBe(false);
      });
    });
  });

  describe('getErrorRecoveryStrategy function', () => {
    it('should return appropriate recovery strategies', () => {
      const timeoutError = createStreamingError(
        StreamingErrorCode.STREAM_TIMEOUT,
        'Timeout'
      );

      const strategy = getErrorRecoveryStrategy(timeoutError);
      expect(strategy).toBeDefined();
      expect(strategy.action).toBe(ErrorRecoveryStrategy.RETRY);
      expect(strategy.maxAttempts).toBeGreaterThan(0);
    });

    it('should handle connection failures with backoff', () => {
      const connectionError = createStreamingError(
        StreamingErrorCode.CONNECTION_FAILED,
        'Connection failed'
      );

      const strategy = getErrorRecoveryStrategy(connectionError);
      expect(strategy.action).toBe(ErrorRecoveryStrategy.RETRY_WITH_BACKOFF);
      expect(strategy.backoffMs).toBeDefined();
      expect(strategy.backoffMs!).toBeGreaterThan(0);
    });

    it('should handle rate limits with delay', () => {
      const rateLimitError = createStreamingError(
        StreamingErrorCode.RATE_LIMIT_EXCEEDED,
        'Rate limit exceeded'
      );

      const strategy = getErrorRecoveryStrategy(rateLimitError);
      expect(strategy.action).toBe(ErrorRecoveryStrategy.RETRY_AFTER_DELAY);
      expect(strategy.delayMs).toBeDefined();
      expect(strategy.delayMs!).toBeGreaterThan(0);
    });

    it('should recommend fallback for non-recoverable errors', () => {
      const authError = createStreamingError(
        StreamingErrorCode.AUTHENTICATION_ERROR,
        'Auth failed'
      );

      const strategy = getErrorRecoveryStrategy(authError);
      expect(strategy.action).toBe(ErrorRecoveryStrategy.FALLBACK_TO_BATCH);
    });
  });

  describe('ErrorRecoveryStrategy enum', () => {
    it('should include all recovery strategies', () => {
      const expectedStrategies = [
        'RETRY',
        'RETRY_WITH_BACKOFF',
        'RETRY_AFTER_DELAY',
        'FALLBACK_TO_BATCH',
        'USER_INTERVENTION',
        'ABORT'
      ];

      expectedStrategies.forEach(strategy => {
        expect(Object.values(ErrorRecoveryStrategy)).toContain(strategy);
      });
    });
  });
});