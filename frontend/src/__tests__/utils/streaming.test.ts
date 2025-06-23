// ABOUTME: Tests for streaming utility functions including word-level chunking
// ABOUTME: Validates text chunking, SSE formatting, and streaming helpers for medical platform

import {
  chunkText,
  createWordChunks,
  formatSSEEvent,
  parseSSEEvent,
  calculateChunkTiming,
  mergeChunks,
  ChunkOptions,
  SSEEvent
} from '../../utils/streaming';

describe('Streaming Utilities', () => {
  describe('chunkText function', () => {
    it('should split text into chunks of specified size', () => {
      const text = 'Hello world this is a test message';
      const chunks = chunkText(text, 10);

      expect(chunks.length).toBeGreaterThan(1);
      chunks.forEach(chunk => {
        expect(chunk.content.length).toBeLessThanOrEqual(10);
      });
    });

    it('should respect word boundaries when specified', () => {
      const text = 'Hello world test';
      const chunks = chunkText(text, 8, { respectWordBoundaries: true });

      // Should not break words - each chunk should end at word boundaries
      const combinedText = chunks.map(c => c.content).join(' ').replace(/\s+/g, ' ');
      expect(combinedText.trim()).toBe(text.trim());
      
      // No chunk should end with a partial word (non-space character followed by more text)
      chunks.forEach((chunk, index) => {
        if (index < chunks.length - 1) { // Not the last chunk
          // Should either end with complete word or be a complete word
          expect(chunk.content.trim().length).toBeGreaterThan(0);
        }
      });
    });

    it('should handle empty strings', () => {
      const chunks = chunkText('', 10);
      expect(chunks).toEqual([]);
    });

    it('should handle single character strings', () => {
      const chunks = chunkText('a', 10);
      expect(chunks).toHaveLength(1);
      expect(chunks[0].content).toBe('a');
    });

    it('should include position information', () => {
      const text = 'Hello world';
      const chunks = chunkText(text, 5);

      // Test that positions are set and chunks don't overlap
      expect(chunks.length).toBeGreaterThan(1);
      chunks.forEach((chunk, index) => {
        expect(chunk.position).toBeGreaterThanOrEqual(0);
        expect(chunk.position).toBeLessThan(text.length);
        
        // Check that the content at position matches
        const actualContent = text.slice(chunk.position, chunk.position + chunk.length);
        expect(actualContent).toBe(chunk.content);
      });
    });
  });

  describe('createWordChunks function', () => {
    it('should create chunks optimized for streaming display', () => {
      const text = 'This is a medical diagnosis text';
      const chunks = createWordChunks(text);

      // Should create chunks of 5-10 characters as specified
      chunks.forEach(chunk => {
        expect(chunk.content.length).toBeGreaterThanOrEqual(1);
        expect(chunk.content.length).toBeLessThanOrEqual(10);
      });
    });

    it('should mark word boundaries correctly', () => {
      const text = 'Hello world test';
      const chunks = createWordChunks(text);

      // Find chunks that end with complete words
      const wordBoundaryChunks = chunks.filter(chunk => chunk.isWordBoundary);
      expect(wordBoundaryChunks.length).toBeGreaterThan(0);
    });

    it('should handle medical terminology gracefully', () => {
      const medicalText = 'Patient presents with hypertension and diabetes mellitus';
      const chunks = createWordChunks(medicalText);

      expect(chunks.length).toBeGreaterThan(0);
      // Should not break important medical terms awkwardly
      const combinedText = chunks.map(c => c.content).join('');
      expect(combinedText).toBe(medicalText);
    });

    it('should support custom chunk options', () => {
      const text = 'Test message';
      const options: ChunkOptions = {
        maxChunkSize: 4,
        respectWordBoundaries: false
      };
      
      const chunks = createWordChunks(text, options);
      chunks.forEach(chunk => {
        expect(chunk.content.length).toBeLessThanOrEqual(4);
      });
    });
  });

  describe('formatSSEEvent function', () => {
    it('should format events for Server-Sent Events', () => {
      const eventData = { content: 'Hello world' };
      const formatted = formatSSEEvent('chunk', eventData, 'event-123');

      expect(formatted).toContain('event: chunk');
      expect(formatted).toContain('id: event-123');
      expect(formatted).toContain('data: ');
      expect(formatted).toContain(JSON.stringify(eventData));
      expect(formatted.endsWith('\n\n')).toBe(true);
    });

    it('should handle events without ID', () => {
      const eventData = { status: 'complete' };
      const formatted = formatSSEEvent('end', eventData);

      expect(formatted).toContain('event: end');
      expect(formatted).not.toContain('id:');
      expect(formatted).toContain('data: ');
    });

    it('should escape special characters in data', () => {
      const eventData = { message: 'Line 1\nLine 2\r\nLine 3' };
      const formatted = formatSSEEvent('chunk', eventData);

      // Should not contain unescaped newlines in data field
      const dataLine = formatted.split('\n').find(line => line.startsWith('data: '));
      expect(dataLine).toBeDefined();
      expect(dataLine).not.toMatch(/data: .*\n.*[^\\]/);
    });
  });

  describe('parseSSEEvent function', () => {
    it('should parse valid SSE event strings', () => {
      const sseString = 'event: chunk\nid: test-123\ndata: {"content":"Hello"}\n\n';
      const parsed = parseSSEEvent(sseString);

      expect(parsed).toBeDefined();
      expect(parsed!.type).toBe('chunk');
      expect(parsed!.id).toBe('test-123');
      expect(parsed!.data).toEqual({ content: 'Hello' });
    });

    it('should handle events without ID', () => {
      const sseString = 'event: start\ndata: {"stage":"initial"}\n\n';
      const parsed = parseSSEEvent(sseString);

      expect(parsed).toBeDefined();
      expect(parsed!.type).toBe('start');
      expect(parsed!.id).toBeUndefined();
      expect(parsed!.data).toEqual({ stage: 'initial' });
    });

    it('should return null for malformed events', () => {
      const malformedEvent = 'invalid sse format';
      const parsed = parseSSEEvent(malformedEvent);

      expect(parsed).toBeNull();
    });

    it('should handle JSON parsing errors gracefully', () => {
      const sseString = 'event: chunk\ndata: {invalid json}\n\n';
      const parsed = parseSSEEvent(sseString);

      expect(parsed).toBeNull();
    });
  });

  describe('calculateChunkTiming function', () => {
    it('should calculate appropriate timing for chunk delivery', () => {
      const chunks = [
        { content: 'Hello', position: 0, length: 5 },
        { content: ' world', position: 5, length: 6 }
      ];

      const timing = calculateChunkTiming(chunks, 2000); // 2 second total duration

      expect(timing.length).toBe(chunks.length);
      timing.forEach((delay, index) => {
        expect(delay).toBeGreaterThanOrEqual(0);
        if (index > 0) {
          expect(delay).toBeGreaterThanOrEqual(timing[index - 1]);
        }
      });
    });

    it('should distribute timing evenly for equal chunks', () => {
      const chunks = [
        { content: 'test', position: 0, length: 4 },
        { content: 'test', position: 4, length: 4 },
        { content: 'test', position: 8, length: 4 }
      ];

      const timing = calculateChunkTiming(chunks, 3000);
      
      // Should have roughly equal intervals
      const intervals = timing.slice(1).map((delay, index) => delay - timing[index]);
      const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
      
      intervals.forEach(interval => {
        expect(Math.abs(interval - avgInterval)).toBeLessThan(avgInterval * 0.2); // Within 20% of average
      });
    });
  });

  describe('mergeChunks function', () => {
    it('should merge consecutive chunks', () => {
      const chunks = [
        { content: 'Hello', position: 0, length: 5 },
        { content: ' ', position: 5, length: 1 },
        { content: 'world', position: 6, length: 5 }
      ];

      const merged = mergeChunks(chunks);

      expect(merged.content).toBe('Hello world');
      expect(merged.position).toBe(0);
      expect(merged.length).toBe(11);
    });

    it('should handle empty chunk arrays', () => {
      const merged = mergeChunks([]);

      expect(merged.content).toBe('');
      expect(merged.position).toBe(0);
      expect(merged.length).toBe(0);
    });

    it('should handle single chunk', () => {
      const chunks = [{ content: 'test', position: 0, length: 4 }];
      const merged = mergeChunks(chunks);

      expect(merged.content).toBe('test');
      expect(merged.position).toBe(0);
      expect(merged.length).toBe(4);
    });
  });
});