// ABOUTME: Comprehensive unit tests for StreamingService SSE client
// ABOUTME: Tests connection lifecycle, retry logic, event parsing, and error handling

import { StreamingService } from '../../services/StreamingService';
import { StreamEvent, StreamStatus } from '../../types/streaming';
import { StreamingError, StreamingErrorCode } from '../../types/errors';

// Mock EventSource
class MockEventSource {
  public url: string;
  public withCredentials: boolean;
  public readyState: number = 0;
  public onopen: ((event: Event) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(url: string, eventSourceInitDict?: EventSourceInit) {
    this.url = url;
    this.withCredentials = eventSourceInitDict?.withCredentials || false;
  }

  close() {
    this.readyState = 2; // CLOSED
  }

  addEventListener(type: string, listener: Function) {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, []);
    }
    this.eventListeners.get(type)!.push(listener);
  }

  removeEventListener(type: string, listener: Function) {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Helper methods for testing
  simulateOpen() {
    this.readyState = 1; // OPEN
    if (this.onopen) {
      this.onopen(new Event('open'));
    }
  }

  simulateMessage(data: string) {
    if (this.onmessage) {
      const event = new MessageEvent('message', {
        data,
        lastEventId: '',
        origin: '',
        ports: [],
      });
      
      this.onmessage(event);
    }
  }

  simulateCustomEvent(eventType: string, data: string) {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const event = new MessageEvent(eventType, {
        data,
        lastEventId: '',
        origin: '',
        ports: [],
      });
      
      listeners.forEach(listener => listener(event));
    }
  }

  simulateError() {
    this.readyState = 2; // CLOSED
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }
}

// Track instances for testing
const mockInstances: MockEventSource[] = [];

// Override constructor to track instances
function MockEventSourceConstructor(url: string, options?: EventSourceInit) {
  const instance = new MockEventSource(url, options);
  mockInstances.push(instance);
  return instance;
}

// Copy static properties
Object.setPrototypeOf(MockEventSourceConstructor, MockEventSource);

// Mock global EventSource
(global as any).EventSource = MockEventSourceConstructor;

describe('StreamingService', () => {
  let streamingService: StreamingService;
  let mockEventSource: MockEventSource;

  beforeEach(() => {
    streamingService = new StreamingService();
    // Clear mock instances
    mockInstances.length = 0;
    jest.clearAllMocks();
  });

  afterEach(() => {
    streamingService.disconnect();
  });

  describe('Connection Lifecycle', () => {
    test('should initialize with idle status', () => {
      expect(streamingService.getStatus()).toBe(StreamStatus.IDLE);
      expect(streamingService.isConnected()).toBe(false);
    });

    test('should connect to SSE endpoint with proper URL', async () => {
      const caseId = '123';
      const stageName = 'initial';
      const token = 'test-jwt-token';

      streamingService.connect(caseId, stageName, token);
      
      // Get the EventSource instance that was created
      mockEventSource = mockInstances[mockInstances.length - 1];
      
      expect(mockEventSource.url).toContain(`/api/cases/${caseId}/workflow/stages/${stageName}/stream`);
      expect(mockEventSource.url).toContain(`Authorization=${encodeURIComponent('Bearer ' + token)}`);
      
      // Simulate successful connection
      mockEventSource.simulateOpen();
      
      expect(streamingService.getStatus()).toBe(StreamStatus.STREAMING);
      expect(streamingService.isConnected()).toBe(true);
    });

    test('should disconnect and cleanup properly', () => {
      const caseId = '123';
      const stageName = 'initial';
      const token = 'test-jwt-token';

      streamingService.connect(caseId, stageName, token);
      mockEventSource = mockInstances[mockInstances.length - 1];
      mockEventSource.simulateOpen();

      streamingService.disconnect();

      expect(streamingService.getStatus()).toBe(StreamStatus.IDLE);
      expect(streamingService.isConnected()).toBe(false);
      expect(mockEventSource.readyState).toBe(2); // CLOSED
    });
  });

  describe('Event Handling', () => {
    beforeEach(() => {
      const caseId = '123';
      const stageName = 'initial';
      const token = 'test-jwt-token';
      
      streamingService.connect(caseId, stageName, token);
      mockEventSource = mockInstances[mockInstances.length - 1];
      mockEventSource.simulateOpen();
    });

    test('should parse and emit valid streaming events', (done) => {
      streamingService.onEvent((event) => {
        expect(event.type).toBe('chunk');
        expect(event.data).toEqual({ content: 'Hello', position: 0 });
        done();
      });

      // Use the custom event simulation instead of message
      const eventData = JSON.stringify({ content: 'Hello', position: 0 });
      mockEventSource.simulateCustomEvent('chunk', eventData);
    });

    test('should handle malformed events gracefully', (done) => {
      let eventReceived = false;

      streamingService.onEvent(() => {
        eventReceived = true;
      });

      streamingService.onError((error) => {
        expect(error.code).toBe(StreamingErrorCode.PARSE_ERROR);
        expect(eventReceived).toBe(false);
        done();
      });

      // Send malformed JSON using custom event
      mockEventSource.simulateCustomEvent('chunk', '{invalid json}');
    });
  });

  describe('Error Handling', () => {
    test('should emit connection errors', (done) => {
      streamingService.onError((error) => {
        expect(error.code).toBe(StreamingErrorCode.CONNECTION_ERROR);
        done();
      });

      const caseId = '123';
      const stageName = 'initial';
      const token = 'test-jwt-token';

      streamingService.connect(caseId, stageName, token);
      mockEventSource = mockInstances[mockInstances.length - 1];
      mockEventSource.simulateError();
    });
  });
});