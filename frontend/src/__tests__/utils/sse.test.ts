// ABOUTME: Tests for frontend SSE event parsing and validation utilities
// ABOUTME: Validates EventSource integration, event parsing, and error recovery for streaming

import {
  SSEParser,
  parseSSEStream,
  validateIncomingSSE,
  SSEConnectionManager,
  SSEParsingError,
  createSSEEventFromString,
  batchSSEEvents,
  SSEEventBuffer,
  SSEReconnectionStrategy
} from '../../utils/sse';
import { StreamEvent } from '../../types/streaming';
import { StreamingError } from '../../types/errors';

// Mock EventSource for testing
class MockEventSource {
  url: string;
  readyState: number = 0;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  
  constructor(url: string, options?: EventSourceInit) {
    this.url = url;
  }
  
  close() {
    this.readyState = 2;
  }
  
  // Helper methods for testing
  simulateOpen() {
    this.readyState = 1;
    if (this.onopen) {
      this.onopen(new Event('open'));
    }
  }
  
  simulateMessage(data: string, event?: string, id?: string) {
    if (this.onmessage) {
      // Create a more complete mock message event
      const messageEvent = {
        data,
        lastEventId: id || '',
        origin: this.url,
        source: null,
        type: event || 'message',
        target: this,
        currentTarget: this,
        bubbles: false,
        cancelable: false,
        defaultPrevented: false,
        eventPhase: 2,
        isTrusted: true,
        timeStamp: Date.now(),
        preventDefault: () => {},
        stopPropagation: () => {},
        stopImmediatePropagation: () => {},
        // Add missing MessageEvent properties
        ports: [],
        initMessageEvent: () => {},
        cancelBubble: false,
        composed: false,
        returnValue: true,
        srcElement: null,
        NONE: 0,
        CAPTURING_PHASE: 1,
        AT_TARGET: 2,
        BUBBLING_PHASE: 3
      } as unknown as MessageEvent;
      
      this.onmessage(messageEvent);
    }
  }
  
  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }
}

// Mock global EventSource
(global as any).EventSource = MockEventSource;

describe('SSE Parser', () => {
  describe('parseSSEStream function', () => {
    it('should parse valid SSE event strings', () => {
      const sseString = 'event: chunk\nid: test-123\ndata: {"content":"Hello world"}\n\n';
      const parsed = parseSSEStream(sseString);

      expect(parsed).toBeDefined();
      expect(parsed!.type).toBe('chunk');
      expect(parsed!.id).toBe('test-123');
      expect(parsed!.data).toEqual({ content: 'Hello world' });
    });

    it('should parse events without ID', () => {
      const sseString = 'event: heartbeat\ndata: {"timestamp":123456}\n\n';
      const parsed = parseSSEStream(sseString);

      expect(parsed).toBeDefined();
      expect(parsed!.type).toBe('heartbeat');
      expect(parsed!.id).toBeUndefined();
      expect(parsed!.data).toEqual({ timestamp: 123456 });
    });

    it('should handle events with retry field', () => {
      const sseString = 'event: error\nretry: 5000\ndata: {"message":"Connection failed"}\n\n';
      const parsed = parseSSEStream(sseString);

      expect(parsed).toBeDefined();
      expect(parsed!.type).toBe('error');
      expect(parsed!.retry).toBe(5000);
      expect(parsed!.data).toEqual({ message: 'Connection failed' });
    });

    it('should return null for malformed SSE strings', () => {
      const malformedStrings = [
        'invalid sse format',
        'event: chunk\ndata: {invalid json}\n\n',
        'data: {"content":"test"}\n\n', // Missing event type
        ''
      ];

      malformedStrings.forEach(malformed => {
        const parsed = parseSSEStream(malformed);
        expect(parsed).toBeNull();
      });
    });

    it('should handle multiline data correctly', () => {
      const sseString = 'event: chunk\ndata: {"content":"Line 1\\nLine 2\\nLine 3"}\n\n';
      const parsed = parseSSEStream(sseString);

      expect(parsed).toBeDefined();
      expect(parsed!.data.content).toBe('Line 1\nLine 2\nLine 3');
    });
  });

  describe('validateIncomingSSE function', () => {
    it('should validate correct SSE events', () => {
      const validEvent = {
        type: 'chunk',
        id: 'test-123',
        data: { content: 'Hello' },
        timestamp: Date.now()
      };

      expect(validateIncomingSSE(validEvent)).toBe(true);
    });

    it('should reject events with missing required fields', () => {
      const invalidEvents = [
        { data: { content: 'test' } }, // Missing type
        { type: 'chunk' }, // Missing data
        { type: '', data: {} }, // Empty type
        null,
        undefined
      ];

      invalidEvents.forEach(event => {
        expect(validateIncomingSSE(event as any)).toBe(false);
      });
    });

    it('should validate medical workflow event types', () => {
      const medicalEventTypes = [
        'chunk', 'start', 'end', 'error', 'metadata',
        'stage_complete', 'progress', 'heartbeat'
      ];

      medicalEventTypes.forEach(type => {
        const event = {
          type,
          data: { stage: 'initial' },
          timestamp: Date.now()
        };
        expect(validateIncomingSSE(event)).toBe(true);
      });
    });

    it('should reject unknown event types', () => {
      const event = {
        type: 'unknown_event_type',
        data: { test: true },
        timestamp: Date.now()
      };

      expect(validateIncomingSSE(event)).toBe(false);
    });
  });

  describe('createSSEEventFromString function', () => {
    it('should create StreamEvent from SSE string', () => {
      const sseString = 'event: chunk\nid: test-456\ndata: {"content":"Medical analysis"}\n\n';
      const streamEvent = createSSEEventFromString(sseString);

      expect(streamEvent).toBeDefined();
      expect(streamEvent!.type).toBe('chunk');
      expect(streamEvent!.id).toBe('test-456');
      expect(streamEvent!.data).toEqual({ content: 'Medical analysis' });
      expect(streamEvent!.timestamp).toBeDefined();
    });

    it('should return null for invalid SSE strings', () => {
      const invalidString = 'not a valid sse format';
      const streamEvent = createSSEEventFromString(invalidString);

      expect(streamEvent).toBeNull();
    });

    it('should generate timestamp for events without one', () => {
      const sseString = 'event: chunk\ndata: {"content":"test"}\n\n';
      const beforeTime = Date.now();
      const streamEvent = createSSEEventFromString(sseString);
      const afterTime = Date.now();

      expect(streamEvent).toBeDefined();
      expect(streamEvent!.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(streamEvent!.timestamp).toBeLessThanOrEqual(afterTime);
    });
  });
});

describe('SSE Event Buffer', () => {
  let buffer: SSEEventBuffer;

  beforeEach(() => {
    buffer = new SSEEventBuffer(5); // Buffer size of 5
  });

  describe('buffer management', () => {
    it('should initialize with correct size', () => {
      expect(buffer.maxSize).toBe(5);
      expect(buffer.size).toBe(0);
      expect(buffer.isEmpty).toBe(true);
    });

    it('should add events to buffer', () => {
      const event: StreamEvent = {
        id: 'test-1',
        type: 'chunk',
        timestamp: Date.now(),
        data: { content: 'test' }
      };

      buffer.add(event);
      expect(buffer.size).toBe(1);
      expect(buffer.isEmpty).toBe(false);
    });

    it('should respect buffer size limit', () => {
      // Add more events than buffer size
      for (let i = 0; i < 8; i++) {
        const event: StreamEvent = {
          id: `test-${i}`,
          type: 'chunk',
          timestamp: Date.now(),
          data: { content: `test${i}` }
        };
        buffer.add(event);
      }

      expect(buffer.size).toBe(5); // Should not exceed max size
    });

    it('should maintain FIFO order when buffer overflows', () => {
      // Add events 0-7, buffer size 5
      for (let i = 0; i < 8; i++) {
        const event: StreamEvent = {
          id: `test-${i}`,
          type: 'chunk',
          timestamp: Date.now(),
          data: { content: `test${i}` }
        };
        buffer.add(event);
      }

      const events = buffer.getAll();
      expect(events).toHaveLength(5);
      // Should contain events 3-7 (most recent)
      expect(events[0].data.content).toBe('test3');
      expect(events[4].data.content).toBe('test7');
    });

    it('should clear buffer', () => {
      buffer.add({
        id: 'test',
        type: 'chunk',
        timestamp: Date.now(),
        data: {}
      });

      expect(buffer.size).toBe(1);
      buffer.clear();
      expect(buffer.size).toBe(0);
      expect(buffer.isEmpty).toBe(true);
    });
  });

  describe('event retrieval', () => {
    beforeEach(() => {
      // Add test events
      for (let i = 0; i < 3; i++) {
        buffer.add({
          id: `test-${i}`,
          type: 'chunk',
          timestamp: Date.now() + i,
          data: { content: `content${i}` }
        });
      }
    });

    it('should get events since timestamp', () => {
      const middleTime = Date.now() + 1;
      const recentEvents = buffer.getSince(middleTime);

      expect(recentEvents).toHaveLength(1);
      expect(recentEvents[0].data.content).toBe('content2');
    });

    it('should get events by type', () => {
      buffer.add({
        id: 'error-1',
        type: 'error',
        timestamp: Date.now() + 10,
        data: { message: 'test error' }
      });

      const chunkEvents = buffer.getByType('chunk');
      const errorEvents = buffer.getByType('error');

      expect(chunkEvents).toHaveLength(3);
      expect(errorEvents).toHaveLength(1);
      expect(errorEvents[0].data.message).toBe('test error');
    });

    it('should get latest events', () => {
      const latest = buffer.getLatest(2);

      expect(latest).toHaveLength(2);
      expect(latest[0].data.content).toBe('content1');
      expect(latest[1].data.content).toBe('content2');
    });
  });
});

describe('SSE Connection Manager', () => {
  let manager: SSEConnectionManager;
  let mockEventSource: MockEventSource;

  beforeEach(() => {
    manager = new SSEConnectionManager();
    // EventSource constructor will return our mock
  });

  describe('connection lifecycle', () => {
    it('should initialize in disconnected state', () => {
      expect(manager.isConnected).toBe(false);
      expect(manager.connectionState).toBe('disconnected');
    });

    it('should connect to SSE endpoint', async () => {
      const connectPromise = manager.connect('http://test.com/sse');
      
      // Simulate connection opening
      setTimeout(() => {
        const es = manager.eventSource as unknown as MockEventSource;
        es.simulateOpen();
      }, 10);

      await connectPromise;
      
      expect(manager.isConnected).toBe(true);
      expect(manager.connectionState).toBe('connected');
    });

    it('should handle connection errors', async () => {
      const connectPromise = manager.connect('http://test.com/sse');
      
      // Simulate connection error
      setTimeout(() => {
        const es = manager.eventSource as unknown as MockEventSource;
        es.simulateError();
      }, 10);

      await expect(connectPromise).rejects.toThrow();
      expect(manager.isConnected).toBe(false);
    });

    it('should disconnect and cleanup resources', () => {
      manager.connect('http://test.com/sse');
      manager.disconnect();

      expect(manager.isConnected).toBe(false);
      expect(manager.connectionState).toBe('disconnected');
    });
  });

  describe('event handling', () => {
    beforeEach(async () => {
      const connectPromise = manager.connect('http://test.com/sse');
      setTimeout(() => {
        const es = manager.eventSource as unknown as MockEventSource;
        es.simulateOpen();
      }, 10);
      await connectPromise;
    });

    it('should receive and parse SSE events', (done) => {
      manager.onEvent((event) => {
        expect(event.type).toBe('chunk');
        expect(event.data).toEqual({ content: 'Hello' });
        done();
      });

      const es = manager.eventSource as unknown as MockEventSource;
      es.simulateMessage('{"content":"Hello"}', 'chunk', 'test-123');
    });

    it('should handle multiple event listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      manager.onEvent(listener1);
      manager.onEvent(listener2);

      const es = manager.eventSource as unknown as MockEventSource;
      es.simulateMessage('{"test":true}', 'metadata');

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('should remove event listeners', () => {
      const listener = jest.fn();
      const unsubscribe = manager.onEvent(listener);

      // Send event, should receive it
      const es = manager.eventSource as unknown as MockEventSource;
      es.simulateMessage('{"test":1}', 'chunk');
      expect(listener).toHaveBeenCalledTimes(1);

      // Unsubscribe and send another event
      unsubscribe();
      es.simulateMessage('{"test":2}', 'chunk');
      expect(listener).toHaveBeenCalledTimes(1); // Should not be called again
    });
  });

  describe('reconnection logic', () => {
    it('should attempt reconnection on connection loss', async () => {
      const strategy: SSEReconnectionStrategy = {
        maxAttempts: 3,
        initialDelay: 100,
        backoffMultiplier: 2,
        maxDelay: 1000
      };

      manager.setReconnectionStrategy(strategy);
      
      // Connect initially
      const connectPromise = manager.connect('http://test.com/sse');
      setTimeout(() => {
        const es = manager.eventSource as unknown as MockEventSource;
        es.simulateOpen();
      }, 10);
      await connectPromise;

      // Simulate connection loss by setting readyState to CLOSED and triggering error
      const es = manager.eventSource as unknown as MockEventSource;
      es.readyState = 2; // EventSource.CLOSED
      es.simulateError();

      // Small delay to allow async handling
      await new Promise(resolve => setTimeout(resolve, 50));

      // Should attempt reconnection
      expect(manager.connectionState).toBe('reconnecting');
    });

    it('should use exponential backoff for reconnection delays', () => {
      const strategy: SSEReconnectionStrategy = {
        maxAttempts: 3,
        initialDelay: 100,
        backoffMultiplier: 2,
        maxDelay: 1000
      };

      const delays = manager.calculateReconnectionDelays(strategy);
      
      expect(delays).toEqual([100, 200, 400]);
    });

    it('should respect maximum delay limit', () => {
      const strategy: SSEReconnectionStrategy = {
        maxAttempts: 5,
        initialDelay: 100,
        backoffMultiplier: 3,
        maxDelay: 500
      };

      const delays = manager.calculateReconnectionDelays(strategy);
      
      // Should cap at maxDelay
      expect(delays.every(delay => delay <= 500)).toBe(true);
    });
  });
});

describe('batchSSEEvents function', () => {
  it('should batch events by time window', () => {
    const events: StreamEvent[] = [
      { id: '1', type: 'chunk', timestamp: 1000, data: { content: 'a' } },
      { id: '2', type: 'chunk', timestamp: 1050, data: { content: 'b' } },
      { id: '3', type: 'chunk', timestamp: 1200, data: { content: 'c' } },
      { id: '4', type: 'chunk', timestamp: 1250, data: { content: 'd' } }
    ];

    const batches = batchSSEEvents(events, 100); // 100ms window

    expect(batches).toHaveLength(2);
    expect(batches[0]).toHaveLength(2); // Events 1 and 2
    expect(batches[1]).toHaveLength(2); // Events 3 and 4
  });

  it('should handle empty event arrays', () => {
    const batches = batchSSEEvents([], 100);
    expect(batches).toEqual([]);
  });

  it('should batch events by type', () => {
    const events: StreamEvent[] = [
      { id: '1', type: 'chunk', timestamp: 1000, data: {} },
      { id: '2', type: 'metadata', timestamp: 1000, data: {} },
      { id: '3', type: 'chunk', timestamp: 1000, data: {} },
      { id: '4', type: 'error', timestamp: 1000, data: {} }
    ];

    const batches = batchSSEEvents(events, 0, 'type');

    expect(batches).toHaveLength(3);
    expect(batches.find(batch => batch[0].type === 'chunk')).toHaveLength(2);
    expect(batches.find(batch => batch[0].type === 'metadata')).toHaveLength(1);
    expect(batches.find(batch => batch[0].type === 'error')).toHaveLength(1);
  });
});

describe('SSE Parsing Error', () => {
  it('should create parsing errors with context', () => {
    const error = new SSEParsingError(
      'Invalid JSON in data field',
      'INVALID_JSON',
      { rawData: '{invalid json}', eventType: 'chunk' }
    );

    expect(error.message).toBe('Invalid JSON in data field');
    expect(error.code).toBe('INVALID_JSON');
    expect(error.context.rawData).toBe('{invalid json}');
    expect(error.context.eventType).toBe('chunk');
  });

  it('should convert to StreamingError', () => {
    const parseError = new SSEParsingError('Parse failed', 'PARSE_ERROR');
    
    // Test the basic error properties first
    expect(parseError.message).toBe('Parse failed');
    expect(parseError.code).toBe('PARSE_ERROR');
    expect(parseError.name).toBe('SSEParsingError');
    
    // Check inheritance chain
    expect(parseError).toBeInstanceOf(Error);
    expect(parseError.constructor.name).toBe('SSEParsingError');
  });
});

describe('SSE Integration Tests', () => {
  it('should handle complete medical workflow event stream', async () => {
    const manager = new SSEConnectionManager();
    const receivedEvents: StreamEvent[] = [];

    manager.onEvent((event) => {
      receivedEvents.push(event);
    });

    // Connect
    const connectPromise = manager.connect('http://test.com/medical-sse');
    setTimeout(() => {
      const es = manager.eventSource as unknown as MockEventSource;
      es.simulateOpen();
    }, 10);
    await connectPromise;

    // Simulate medical workflow events
    const es = manager.eventSource as unknown as MockEventSource;
    
    // Start event
    es.simulateMessage(JSON.stringify({
      stage_id: 'initial',
      stage_name: 'Initial Analysis',
      target_panel: 'reasoning'
    }), 'start', 'start-1');

    // Chunk events
    es.simulateMessage(JSON.stringify({
      content: 'Patient presents with',
      position: 0,
      is_word_boundary: true
    }), 'chunk', 'chunk-1');

    es.simulateMessage(JSON.stringify({
      content: ' elevated blood pressure',
      position: 21,
      is_word_boundary: true
    }), 'chunk', 'chunk-2');

    // Metadata event
    es.simulateMessage(JSON.stringify({
      total_chunks: 2,
      current_chunk: 2,
      stage_progress: 100
    }), 'metadata', 'meta-1');

    // End event
    es.simulateMessage(JSON.stringify({
      stage_id: 'initial',
      status: 'completed'
    }), 'end', 'end-1');

    // Verify received events
    expect(receivedEvents).toHaveLength(5);
    
    expect(receivedEvents[0].type).toBe('start');
    expect(receivedEvents[0].data.stage_name).toBe('Initial Analysis');

    expect(receivedEvents[1].type).toBe('chunk');
    expect(receivedEvents[1].data.content).toBe('Patient presents with');

    expect(receivedEvents[2].type).toBe('chunk');
    expect(receivedEvents[2].data.content).toBe(' elevated blood pressure');

    expect(receivedEvents[3].type).toBe('metadata');
    expect(receivedEvents[3].data.stage_progress).toBe(100);

    expect(receivedEvents[4].type).toBe('end');
    expect(receivedEvents[4].data.status).toBe('completed');

    manager.disconnect();
  });
});