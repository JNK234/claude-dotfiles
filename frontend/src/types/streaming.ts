// ABOUTME: Core streaming types and interfaces for medical diagnosis platform
// ABOUTME: Defines streaming events, chunks, and metadata structures for real-time content delivery

/**
 * Types of streaming events that can be emitted during streaming
 */
export type StreamEventType = 'chunk' | 'start' | 'end' | 'error' | 'metadata' | 'stage_complete' | 'heartbeat' | 'progress';

/**
 * Core streaming event interface
 */
export interface StreamEvent {
  id?: string;
  type: StreamEventType;
  timestamp: number;
  data: any;
  retry?: number;
}

/**
 * Text chunk for streaming display
 */
export interface StreamChunk {
  content: string;
  position: number;
  length: number;
  isWordBoundary?: boolean;
}

/**
 * Streaming status enumeration
 */
export enum StreamStatus {
  IDLE = 'idle',
  CONNECTING = 'connecting',
  STREAMING = 'streaming',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ERROR = 'error'
}

/**
 * Metadata for streaming context
 */
export interface StreamMetadata {
  stageId: string;
  stageName: string;
  targetPanel: 'reasoning' | 'chat';
  totalChunks?: number;
  currentChunk?: number;
  estimatedDuration?: number;
}

/**
 * Streaming error details
 */
export interface StreamError {
  code: string;
  message: string;
  recoverable: boolean;
  timestamp: number;
}

/**
 * Validates if an object is a valid StreamEvent
 */
export function isValidStreamEvent(event: any): event is StreamEvent {
  if (!event || typeof event !== 'object') {
    return false;
  }

  const validTypes: StreamEventType[] = ['chunk', 'start', 'end', 'error', 'metadata'];

  return (
    typeof event.id === 'string' &&
    typeof event.type === 'string' &&
    validTypes.includes(event.type as StreamEventType) &&
    typeof event.timestamp === 'number' &&
    event.data !== undefined
  );
}

/**
 * Creates a new stream event with generated ID and timestamp
 */
export function createStreamEvent(type: StreamEventType, data: any): StreamEvent {
  return {
    id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    timestamp: Date.now(),
    data
  };
}