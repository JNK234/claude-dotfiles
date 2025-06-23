# Streaming Implementation Usage Examples

This document provides usage examples for the core streaming types and utilities implemented in Prompt 1.

## Core Streaming Types

### Creating Stream Events

```typescript
import { createStreamEvent, StreamEventType } from '../types/streaming';

// Create a chunk event
const chunkEvent = createStreamEvent('chunk', {
  content: 'Medical analysis data',
  position: 0,
  length: 20
});

// Create a metadata event
const metadataEvent = createStreamEvent('metadata', {
  stageId: 'initial',
  stageName: 'Initial Analysis',
  targetPanel: 'reasoning',
  totalChunks: 100,
  currentChunk: 25
});
```

### Validating Stream Events

```typescript
import { isValidStreamEvent } from '../types/streaming';

const event = {
  id: 'test-123',
  type: 'chunk',
  timestamp: Date.now(),
  data: { content: 'Hello' }
};

if (isValidStreamEvent(event)) {
  // Event is valid and properly typed
  console.log(`Processing ${event.type} event`);
}
```

## Text Chunking Utilities

### Basic Text Chunking

```typescript
import { chunkText } from '../utils/streaming';

const medicalText = 'Patient presents with hypertension and diabetes mellitus type 2';

// Create chunks with word boundaries respected
const chunks = chunkText(medicalText, 10, {
  respectWordBoundaries: true
});

chunks.forEach(chunk => {
  console.log(`Chunk: "${chunk.content}" at position ${chunk.position}`);
});
```

### Optimized Word Chunking for Streaming

```typescript
import { createWordChunks } from '../utils/streaming';

const diagnosisText = 'Primary diagnosis: Essential hypertension. Secondary conditions include type 2 diabetes mellitus with good glycemic control.';

// Create optimized chunks for streaming display
const streamChunks = createWordChunks(diagnosisText);

streamChunks.forEach((chunk, index) => {
  console.log(`Chunk ${index + 1}: "${chunk.content}"`);
  if (chunk.isWordBoundary) {
    console.log('  -> Word boundary detected');
  }
});
```

### Custom Chunking Options

```typescript
import { createWordChunks, ChunkOptions } from '../utils/streaming';

const options: ChunkOptions = {
  maxChunkSize: 15,
  respectWordBoundaries: true,
  preserveWhitespace: true
};

const chunks = createWordChunks('Long medical terminology text', options);
```

## Server-Sent Events (SSE) Formatting

### Formatting Events for SSE

```typescript
import { formatSSEEvent } from '../utils/streaming';

// Format a chunk event
const chunkData = { content: 'Analyzing symptoms...', isComplete: false };
const sseFormatted = formatSSEEvent('chunk', chunkData, 'chunk-123');

console.log(sseFormatted);
// Output:
// event: chunk
// id: chunk-123
// data: {"content":"Analyzing symptoms...","isComplete":false}
//
```

### Parsing SSE Events

```typescript
import { parseSSEEvent } from '../utils/streaming';

const incomingSSE = `event: chunk
id: chunk-456
data: {"content":"Treatment recommendations","stage":"treatment"}

`;

const parsedEvent = parseSSEEvent(incomingSSE);
if (parsedEvent) {
  console.log(`Received ${parsedEvent.type} event:`, parsedEvent.data);
}
```

## Chunk Timing and Merging

### Calculating Streaming Timing

```typescript
import { calculateChunkTiming } from '../utils/streaming';

const chunks = [
  { content: 'Patient', position: 0, length: 7 },
  { content: ' exhibits', position: 7, length: 9 },
  { content: ' symptoms of', position: 16, length: 12 }
];

// Calculate timing for 2-second total duration
const timing = calculateChunkTiming(chunks, 2000);

timing.forEach((delay, index) => {
  console.log(`Chunk ${index} should be delivered after ${delay}ms`);
});
```

### Merging Chunks

```typescript
import { mergeChunks } from '../utils/streaming';

const consecutiveChunks = [
  { content: 'Blood', position: 0, length: 5 },
  { content: ' pressure', position: 5, length: 9 },
  { content: ' elevated', position: 14, length: 9 }
];

const merged = mergeChunks(consecutiveChunks);
console.log(`Merged content: "${merged.content}"`);
// Output: "Blood pressure elevated"
```

## Error Handling

### Creating and Handling Streaming Errors

```typescript
import { 
  createStreamingError, 
  StreamingErrorCode,
  isRecoverableError,
  getErrorRecoveryStrategy 
} from '../types/errors';

// Create a timeout error
const timeoutError = createStreamingError(
  StreamingErrorCode.STREAM_TIMEOUT,
  'Stream timed out after 30 seconds',
  { stageId: 'initial', duration: 30000 }
);

// Check if error is recoverable
if (isRecoverableError(timeoutError)) {
  const strategy = getErrorRecoveryStrategy(timeoutError);
  
  switch (strategy.action) {
    case 'RETRY':
      console.log(`Retrying up to ${strategy.maxAttempts} times`);
      break;
    case 'RETRY_WITH_BACKOFF':
      console.log(`Retrying with ${strategy.backoffMs}ms backoff`);
      break;
    case 'FALLBACK_TO_BATCH':
      console.log('Falling back to batch processing');
      break;
  }
}
```

### Comprehensive Error Recovery

```typescript
import { StreamingErrorCode, getErrorRecoveryStrategy } from '../types/errors';

async function handleStreamingError(error: StreamingError) {
  const strategy = getErrorRecoveryStrategy(error);
  
  switch (strategy.action) {
    case 'RETRY_WITH_BACKOFF':
      await new Promise(resolve => setTimeout(resolve, strategy.backoffMs));
      // Retry the streaming operation
      break;
      
    case 'RETRY_AFTER_DELAY':
      console.log(`Rate limited. Waiting ${strategy.delayMs}ms before retry`);
      await new Promise(resolve => setTimeout(resolve, strategy.delayMs));
      break;
      
    case 'FALLBACK_TO_BATCH':
      console.log('Streaming failed, falling back to batch processing');
      // Switch to non-streaming mode
      break;
      
    case 'USER_INTERVENTION':
      console.log('User intervention required');
      // Show error to user with retry option
      break;
  }
}
```

## Integration with Medical Workflow

### Streaming Medical Analysis Results

```typescript
import { createStreamEvent, createWordChunks, StreamStatus } from '../types/streaming';
import { formatSSEEvent } from '../utils/streaming';

function streamMedicalAnalysis(analysisText: string, stageId: string) {
  const chunks = createWordChunks(analysisText);
  
  // Send start event
  const startEvent = createStreamEvent('start', {
    stageId,
    totalChunks: chunks.length,
    targetPanel: 'reasoning'
  });
  
  console.log(formatSSEEvent('start', startEvent.data, startEvent.id));
  
  // Stream chunks with timing
  chunks.forEach((chunk, index) => {
    setTimeout(() => {
      const chunkEvent = createStreamEvent('chunk', {
        content: chunk.content,
        position: chunk.position,
        chunkIndex: index,
        isWordBoundary: chunk.isWordBoundary
      });
      
      console.log(formatSSEEvent('chunk', chunkEvent.data, chunkEvent.id));
      
      // Send end event after last chunk
      if (index === chunks.length - 1) {
        const endEvent = createStreamEvent('end', {
          stageId,
          totalChunks: chunks.length,
          status: StreamStatus.COMPLETED
        });
        
        console.log(formatSSEEvent('end', endEvent.data, endEvent.id));
      }
    }, index * 100); // 100ms delay between chunks
  });
}

// Usage
const analysisResult = "Patient presents with elevated blood pressure readings consistent with stage 1 hypertension. Additional workup recommended to rule out secondary causes.";
streamMedicalAnalysis(analysisResult, 'initial');
```

This implementation provides a solid foundation for streaming functionality in the medical diagnosis platform, with comprehensive error handling and optimized chunking for medical terminology.