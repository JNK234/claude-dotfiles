// ABOUTME: Tests for streaming-related TypeScript interfaces and types
// ABOUTME: Validates streaming event structures and type safety for medical diagnosis platform

import { 
  StreamEvent, 
  StreamEventType, 
  StreamChunk,
  StreamStatus,
  StreamMetadata,
  StreamError,
  isValidStreamEvent,
  createStreamEvent
} from '../../types/streaming';

describe('Streaming Types', () => {
  describe('StreamEventType', () => {
    it('should include all required event types', () => {
      // Test that all expected event types exist
      const expectedTypes: StreamEventType[] = [
        'chunk',
        'start',
        'end',
        'error',
        'metadata'
      ];
      
      // This will fail until we define StreamEventType
      expect(expectedTypes.length).toBe(5);
    });
  });

  describe('StreamEvent interface', () => {
    it('should have required properties', () => {
      const mockEvent: StreamEvent = {
        id: 'test-id',
        type: 'chunk',
        timestamp: Date.now(),
        data: { content: 'test' }
      };

      expect(mockEvent.id).toBeDefined();
      expect(mockEvent.type).toBeDefined();
      expect(mockEvent.timestamp).toBeDefined();
      expect(mockEvent.data).toBeDefined();
    });

    it('should support different event types', () => {
      const chunkEvent: StreamEvent = {
        id: '1',
        type: 'chunk',
        timestamp: Date.now(),
        data: { content: 'Hello' }
      };

      const startEvent: StreamEvent = {
        id: '2', 
        type: 'start',
        timestamp: Date.now(),
        data: { stage: 'initial' }
      };

      expect(chunkEvent.type).toBe('chunk');
      expect(startEvent.type).toBe('start');
    });
  });

  describe('StreamChunk interface', () => {
    it('should have content and position properties', () => {
      const chunk: StreamChunk = {
        content: 'Hello world',
        position: 0,
        length: 11,
        isWordBoundary: true
      };

      expect(chunk.content).toBe('Hello world');
      expect(chunk.position).toBe(0);
      expect(chunk.length).toBe(11);
      expect(chunk.isWordBoundary).toBe(true);
    });

    it('should support optional word boundary flag', () => {
      const chunk: StreamChunk = {
        content: 'test',
        position: 0,
        length: 4
      };

      expect(chunk.isWordBoundary).toBeUndefined();
    });
  });

  describe('StreamStatus enum', () => {
    it('should include all status values', () => {
      const expectedStatuses = ['idle', 'connecting', 'streaming', 'paused', 'completed', 'error'];
      
      // This will fail until we define StreamStatus
      expect(Object.values(StreamStatus)).toEqual(expect.arrayContaining(expectedStatuses));
    });
  });

  describe('StreamMetadata interface', () => {
    it('should include stage and content routing info', () => {
      const metadata: StreamMetadata = {
        stageId: 'initial',
        stageName: 'Initial Analysis',
        targetPanel: 'reasoning',
        totalChunks: 100,
        currentChunk: 25,
        estimatedDuration: 5000
      };

      expect(metadata.stageId).toBe('initial');
      expect(metadata.targetPanel).toBe('reasoning');
      expect(metadata.totalChunks).toBe(100);
    });

    it('should support optional properties', () => {
      const minimalMetadata: StreamMetadata = {
        stageId: 'test',
        stageName: 'Test Stage',
        targetPanel: 'chat'
      };

      expect(minimalMetadata.totalChunks).toBeUndefined();
      expect(minimalMetadata.estimatedDuration).toBeUndefined();
    });
  });

  describe('StreamError interface', () => {
    it('should include error details', () => {
      const error: StreamError = {
        code: 'STREAM_TIMEOUT',
        message: 'Stream timed out after 30 seconds',
        recoverable: true,
        timestamp: Date.now()
      };

      expect(error.code).toBe('STREAM_TIMEOUT');
      expect(error.recoverable).toBe(true);
    });
  });

  describe('isValidStreamEvent function', () => {
    it('should validate correct stream events', () => {
      const validEvent: StreamEvent = {
        id: 'test-1',
        type: 'chunk',
        timestamp: Date.now(),
        data: { content: 'test' }
      };

      expect(isValidStreamEvent(validEvent)).toBe(true);
    });

    it('should reject invalid stream events', () => {
      const invalidEvent = {
        type: 'chunk',
        data: { content: 'test' }
        // missing id and timestamp
      };

      expect(isValidStreamEvent(invalidEvent as any)).toBe(false);
    });

    it('should reject events with invalid types', () => {
      const invalidTypeEvent = {
        id: 'test',
        type: 'invalid-type',
        timestamp: Date.now(),
        data: {}
      };

      expect(isValidStreamEvent(invalidTypeEvent as any)).toBe(false);
    });
  });

  describe('createStreamEvent function', () => {
    it('should create valid stream events', () => {
      const event = createStreamEvent('chunk', { content: 'Hello' });

      expect(event.id).toBeDefined();
      expect(event.type).toBe('chunk');
      expect(event.timestamp).toBeDefined();
      expect(event.data).toEqual({ content: 'Hello' });
    });

    it('should generate unique IDs', () => {
      const event1 = createStreamEvent('start', {});
      const event2 = createStreamEvent('start', {});

      expect(event1.id).not.toBe(event2.id);
    });

    it('should set current timestamp', () => {
      const beforeTime = Date.now();
      const event = createStreamEvent('metadata', {});
      const afterTime = Date.now();

      expect(event.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(event.timestamp).toBeLessThanOrEqual(afterTime);
    });
  });
});