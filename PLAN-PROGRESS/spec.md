# MedhastraAI Streaming Implementation Specification

## Overview

This specification outlines the implementation of character-by-character streaming for all LLM model outputs in the MedhastraAI medical diagnosis platform to eliminate the "feeling of lag" and provide a more dynamic, responsive user experience.

## Current State Analysis

### Existing Architecture
- **Backend**: FastAPI with Python, uses LangChain for LLM orchestration
- **Frontend**: React/TypeScript with Vite, Axios for API communication
- **LLM Processing**: Currently batch/synchronous processing taking 30-120 seconds
- **UI Layout**: Existing ReasoningPanel (detailed analysis) and ChatContainer (conversational summaries)

### Current Pain Points
- Long wait times (30-120 seconds) with minimal feedback
- Users experience "feeling of lag" during LLM processing
- No visibility into processing progress
- Risk of timeout issues on slower networks

## Requirements

### Primary Objective
Implement streaming for **all LLM model outputs** to provide real-time text display and eliminate perceived lag.

### Streaming Requirements
1. **Universal Coverage**: All LLM outputs must stream (no exceptions)
2. **Preserve UI Layout**: Stream content to existing ReasoningPanel and ChatContainer components
3. **Word-level Chunking**: Stream in word/small phrase chunks (5-10 characters) for optimal responsiveness
4. **Error Resilience**: Show partial content + error message with retry capability

## Technical Implementation Design

### Communication Protocol: Server-Sent Events (SSE)

**Choice Rationale**: SSE is ideal for unidirectional streaming, simpler than WebSockets, works with existing HTTP infrastructure.

### Event Structure (Unified Approach)

```typescript
interface StreamEvent {
  type: "content_chunk" | "stage_complete" | "error" | "stream_done";
  panel: "reasoning" | "chat";
  stage: string; // "initial", "extraction", "diagnosis", etc.
  content: string;
  metadata?: {
    chunk_index?: number;
    total_expected?: number;
    error_code?: string;
    retry_available?: boolean;
  };
}
```

**Event Types**:
- `content_chunk`: Streaming text content (5-10 character chunks)
- `stage_complete`: Indicates a processing stage has finished
- `error`: Error occurred during streaming with partial content preserved
- `stream_done`: Entire workflow stage group completed

### Backend Implementation

#### 1. SSE Endpoint Structure
```python
# New streaming endpoints in workflow.py
@router.get("/cases/{case_id}/workflow/stages/{stage_name}/stream")
async def stream_stage_processing(case_id: str, stage_name: str)

@router.get("/cases/{case_id}/workflow/start/stream") 
async def stream_workflow_start(case_id: str)
```

#### 2. LLM Service Modifications
- Modify `llm_service.py` to support streaming via LangChain's streaming capabilities
- Implement chunking logic for word-level streaming
- Add streaming-specific error handling with partial content preservation

#### 3. Content Routing Logic
**Sequential Streaming Approach** (maintains existing workflow):
1. **Phase 1**: Stream detailed analysis → ReasoningPanel
2. **Phase 2**: Generate and stream conversational summary → ChatContainer

```python
# Pseudo-code for backend streaming logic
async def stream_stage_content(case_id: str, stage_name: str):
    # Phase 1: Stream detailed analysis
    async for chunk in llm_service.stream_detailed_analysis():
        yield SSEEvent(type="content_chunk", panel="reasoning", content=chunk)
    
    yield SSEEvent(type="stage_complete", panel="reasoning")
    
    # Phase 2: Generate and stream summary
    async for chunk in llm_service.stream_summary():
        yield SSEEvent(type="content_chunk", panel="chat", content=chunk)
    
    yield SSEEvent(type="stream_done", panel="chat")
```

### Frontend Implementation

#### 1. SSE Client Service
```typescript
// New StreamingService.ts
class StreamingService {
  private eventSource: EventSource | null = null;
  
  startStageStream(caseId: string, stageName: string, onEvent: (event: StreamEvent) => void) {
    this.eventSource = new EventSource(`/api/cases/${caseId}/workflow/stages/${stageName}/stream`);
    this.eventSource.onmessage = (event) => {
      const streamEvent: StreamEvent = JSON.parse(event.data);
      onEvent(streamEvent);
    };
  }
}
```

#### 2. WorkflowContext Enhancements

**New State Management**:
```typescript
interface WorkflowState {
  // Existing state...
  streamingStages: Record<string, {
    reasoningContent: string;
    chatContent: string;
    isStreaming: boolean;
    error?: string;
  }>;
}
```

**New Functions**:
- `handleStreamingEvent()`: Routes streaming events to appropriate panel updates
- `appendStreamingContent()`: Adds chunks to existing content
- `handleStreamingError()`: Manages partial content + error display

#### 3. UI Component Updates

**ReasoningPanel**:
- Display streaming content with typing indicator
- Show partial content + error message on failures
- Retry button for failed streams

**ChatContainer**:
- Streaming message bubbles with real-time text appearance
- Preserve existing message history during streaming
- Error state with retry capability

## Detailed Implementation Steps

### Phase 1: Backend Streaming Infrastructure
1. Add SSE endpoints to FastAPI app
2. Modify LLM service to support streaming responses
3. Implement word-level chunking logic
4. Add streaming-specific error handling
5. Create unified event structure

### Phase 2: Frontend Streaming Client
1. Create StreamingService for SSE management
2. Enhance WorkflowContext with streaming state
3. Implement event routing and content accumulation
4. Add error handling with partial content preservation

### Phase 3: UI Component Integration
1. Update ReasoningPanel for streaming display
2. Enhance ChatContainer with streaming messages
3. Add loading indicators and typing effects
4. Implement retry functionality for failed streams

### Phase 4: Testing & Optimization
1. Unit tests for streaming services
2. Integration tests for SSE communication
3. E2E tests for complete streaming workflows
4. Performance optimization for chunk delivery

## Error Handling Strategy

### Error Types
1. **Network Interruption**: Resume streaming from last successful chunk
2. **LLM API Failures**: Display partial content + error message + retry option
3. **Timeout Issues**: Graceful degradation with manual retry
4. **Rate Limiting**: Automatic retry with exponential backoff

### Recovery Mechanisms
- **Partial Content Preservation**: Always maintain streamed content on errors
- **Retry Interface**: Clear retry buttons with error context
- **Graceful Degradation**: Fall back to batch processing if streaming fails consistently

## Success Metrics

### User Experience
- Eliminate "feeling of lag" during diagnosis workflows
- Reduce perceived wait time by 70%+ through streaming feedback
- Maintain existing clinical workflow patterns

### Technical Performance
- Streaming latency < 100ms for chunk delivery
- Error recovery success rate > 95%
- No impact on existing non-streaming functionality

## Migration Strategy

### Backward Compatibility
- Maintain existing batch API endpoints during transition
- Feature flag for streaming vs. batch mode
- Gradual rollout to user segments

### Rollback Plan
- Keep existing synchronous processing as fallback
- Quick disable mechanism for streaming features
- Monitoring and alerting for streaming health

## Future Enhancements

### Phase 2 Features (Post-MVP)
1. **Stream Cancellation**: Allow users to cancel long-running streams
2. **Progress Indicators**: Show percentage completion for multi-stage processes  
3. **Stream Replay**: Allow users to replay streaming output for review
4. **Real-time Collaboration**: Multiple users viewing same streaming diagnosis

### Advanced Features
1. **Adaptive Chunking**: Dynamic chunk size based on network conditions
2. **Stream Compression**: Optimize bandwidth for mobile users
3. **Offline Resilience**: Cache partial streams for offline review

---

**Specification Version**: 1.0  
**Date**: 2025-06-23  
**Author**: Claude (Streaming Implementation Specialist)  
**Reviewer**: Doctor Biz