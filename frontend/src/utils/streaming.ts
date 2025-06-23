// ABOUTME: Streaming utility functions for text chunking and SSE event handling
// ABOUTME: Provides word-level chunking, SSE formatting, and timing calculations for smooth streaming

import { StreamChunk } from '../types/streaming';

/**
 * Options for text chunking
 */
export interface ChunkOptions {
  maxChunkSize?: number;
  respectWordBoundaries?: boolean;
  preserveWhitespace?: boolean;
}

/**
 * Server-Sent Event structure
 */
export interface SSEEvent {
  type: string;
  id?: string;
  data: any;
}

/**
 * Default chunk options
 */
const DEFAULT_CHUNK_OPTIONS: Required<ChunkOptions> = {
  maxChunkSize: 10,
  respectWordBoundaries: true,
  preserveWhitespace: true
};

/**
 * Splits text into chunks of specified size with optional word boundary respect
 */
export function chunkText(
  text: string,
  maxSize: number,
  options: Partial<ChunkOptions> = {}
): StreamChunk[] {
  if (!text || text.length === 0) {
    return [];
  }

  const opts = { ...DEFAULT_CHUNK_OPTIONS, ...options };
  const chunks: StreamChunk[] = [];
  let position = 0;

  while (position < text.length) {
    let chunkEnd = Math.min(position + maxSize, text.length);
    
    // If respecting word boundaries and we're not at the end
    if (opts.respectWordBoundaries && chunkEnd < text.length) {
      // Look for a space before the cut-off point
      const lastSpace = text.lastIndexOf(' ', chunkEnd);
      if (lastSpace > position) {
        chunkEnd = lastSpace; // Don't include the space in current chunk
      }
    }

    const content = text.slice(position, chunkEnd);
    const isWordBoundary = opts.respectWordBoundaries && 
      (chunkEnd >= text.length || text[chunkEnd] === ' ');

    chunks.push({
      content,
      position,
      length: content.length,
      isWordBoundary
    });

    position = chunkEnd;
    // Skip whitespace when moving to next chunk, but include its length in position
    while (position < text.length && text[position] === ' ') {
      position++;
    }
  }

  return chunks;
}

/**
 * Creates optimized word chunks for streaming display (5-10 characters)
 */
export function createWordChunks(
  text: string,
  options: Partial<ChunkOptions> = {}
): StreamChunk[] {
  const opts = {
    ...DEFAULT_CHUNK_OPTIONS,
    maxChunkSize: 8, // Optimized for medical content
    respectWordBoundaries: true,
    ...options
  };

  // Use the basic chunking if maxChunkSize is very small
  if (opts.maxChunkSize < 6) {
    return chunkText(text, opts.maxChunkSize, opts);
  }

  // For medical terminology, we use a more sophisticated approach
  const words = text.split(/(\s+)/); // Keep whitespace
  const chunks: StreamChunk[] = [];
  let currentChunk = '';
  let currentPosition = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const proposedChunk = currentChunk + word;

    // If adding this word would exceed max size and we have content
    if (proposedChunk.length > opts.maxChunkSize && currentChunk.length > 0) {
      // Add current chunk
      const isWordBoundary = /\s$/.test(currentChunk) || i === words.length - 1;
      chunks.push({
        content: currentChunk,
        position: currentPosition,
        length: currentChunk.length,
        isWordBoundary
      });
      
      currentPosition += currentChunk.length;
      currentChunk = word;
    } else {
      currentChunk = proposedChunk;
    }
  }

  // Add remaining content
  if (currentChunk.length > 0) {
    chunks.push({
      content: currentChunk,
      position: currentPosition,
      length: currentChunk.length,
      isWordBoundary: true
    });
  }

  return chunks.filter(chunk => chunk.content.length > 0);
}

/**
 * Formats an event for Server-Sent Events protocol
 */
export function formatSSEEvent(
  eventType: string,
  data: any,
  id?: string
): string {
  let formatted = `event: ${eventType}\n`;
  
  if (id) {
    formatted += `id: ${id}\n`;
  }

  // Serialize data and escape newlines
  const serializedData = JSON.stringify(data);
  formatted += `data: ${serializedData}\n\n`;

  return formatted;
}

/**
 * Parses a Server-Sent Event string back to an event object
 */
export function parseSSEEvent(sseString: string): SSEEvent | null {
  try {
    const lines = sseString.trim().split('\n');
    const event: Partial<SSEEvent> = {};

    for (const line of lines) {
      if (line.startsWith('event: ')) {
        event.type = line.substring(7);
      } else if (line.startsWith('id: ')) {
        event.id = line.substring(4);
      } else if (line.startsWith('data: ')) {
        const dataStr = line.substring(6);
        try {
          event.data = JSON.parse(dataStr);
        } catch {
          return null; // Invalid JSON
        }
      }
    }

    if (!event.type || event.data === undefined) {
      return null;
    }

    return event as SSEEvent;
  } catch {
    return null;
  }
}

/**
 * Calculates timing for chunk delivery to create smooth streaming effect
 */
export function calculateChunkTiming(
  chunks: StreamChunk[],
  totalDurationMs: number
): number[] {
  if (chunks.length === 0) {
    return [];
  }

  if (chunks.length === 1) {
    return [0];
  }

  const timing: number[] = [0]; // First chunk delivered immediately
  const intervalMs = totalDurationMs / (chunks.length - 1);

  for (let i = 1; i < chunks.length; i++) {
    timing.push(Math.round(intervalMs * i));
  }

  return timing;
}

/**
 * Merges consecutive chunks into a single chunk
 */
export function mergeChunks(chunks: StreamChunk[]): StreamChunk {
  if (chunks.length === 0) {
    return {
      content: '',
      position: 0,
      length: 0
    };
  }

  if (chunks.length === 1) {
    return { ...chunks[0] };
  }

  const firstChunk = chunks[0];
  const lastChunk = chunks[chunks.length - 1];
  const content = chunks.map(chunk => chunk.content).join('');

  return {
    content,
    position: firstChunk.position,
    length: lastChunk.position + lastChunk.length - firstChunk.position,
    isWordBoundary: lastChunk.isWordBoundary
  };
}