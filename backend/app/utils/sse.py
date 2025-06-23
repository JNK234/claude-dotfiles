# ABOUTME: Server-Sent Events utilities for streaming medical diagnosis content
# ABOUTME: Provides SSE event generation, formatting, and streaming orchestration for real-time content delivery

import json
import uuid
import asyncio
import logging
from typing import Any, Dict, List, Optional, AsyncGenerator, Union
from dataclasses import dataclass
from enum import Enum
from queue import Queue, Full
import time

logger = logging.getLogger(__name__)


class SSEEventType:
    """SSE event type constants"""
    CHUNK = "chunk"
    START = "start"
    END = "end"
    ERROR = "error"
    METADATA = "metadata"
    HEARTBEAT = "heartbeat"
    PROGRESS = "progress"
    STAGE_COMPLETE = "stage_complete"


@dataclass
class SSEEvent:
    """SSE event data structure"""
    event_type: str
    data: Dict[str, Any]
    id: Optional[str] = None
    retry: Optional[int] = None
    
    def __post_init__(self):
        """Validate event after initialization"""
        if not self.event_type or not isinstance(self.event_type, str):
            raise ValueError("Event type must be a non-empty string")
        if self.data is None:
            raise ValueError("Event data cannot be None")


class SSEError(Exception):
    """SSE-specific error with additional context"""
    
    def __init__(self, message: str, error_code: str = "SSE_ERROR", context: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.error_code = error_code
        self.context = context or {}


def create_sse_event(
    event_type: str, 
    data: Dict[str, Any], 
    event_id: Optional[str] = None,
    retry: Optional[int] = None
) -> SSEEvent:
    """
    Create an SSE event with auto-generated ID if not provided
    
    Args:
        event_type: Type of the event (chunk, start, end, etc.)
        data: Event payload data
        event_id: Optional custom event ID
        retry: Optional retry interval in milliseconds
        
    Returns:
        SSEEvent: Formatted SSE event
    """
    if event_id is None:
        event_id = f"{event_type}-{int(time.time() * 1000)}-{uuid.uuid4().hex[:8]}"
    
    return SSEEvent(
        event_type=event_type,
        data=data,
        id=event_id,
        retry=retry
    )


def format_sse_data(event: SSEEvent) -> str:
    """
    Format SSE event for transmission according to SSE protocol
    
    Args:
        event: SSEEvent to format
        
    Returns:
        str: Formatted SSE string
    """
    lines = []
    
    # Add event type
    lines.append(f"event: {event.event_type}")
    
    # Add ID if present
    if event.id:
        lines.append(f"id: {event.id}")
    
    # Add retry if present
    if event.retry is not None:
        lines.append(f"retry: {event.retry}")
    
    # Add data (must be valid JSON)
    try:
        data_json = json.dumps(event.data, ensure_ascii=False)
        lines.append(f"data: {data_json}")
    except (TypeError, ValueError) as e:
        raise SSEError(f"Failed to serialize event data: {e}", "SERIALIZATION_ERROR")
    
    # End with double newline
    lines.append("")
    lines.append("")
    
    return "\n".join(lines)


def validate_sse_event(event: SSEEvent) -> bool:
    """
    Validate SSE event structure and content
    
    Args:
        event: Event to validate
        
    Returns:
        bool: True if valid, False otherwise
    """
    try:
        # Check event type is valid
        valid_types = [
            SSEEventType.CHUNK, SSEEventType.START, SSEEventType.END,
            SSEEventType.ERROR, SSEEventType.METADATA, SSEEventType.HEARTBEAT,
            SSEEventType.PROGRESS, SSEEventType.STAGE_COMPLETE
        ]
        
        if event.event_type not in valid_types:
            return False
        
        # Check data is serializable
        try:
            json.dumps(event.data)
        except (TypeError, ValueError):
            return False
        
        # Check data size (warn for large payloads)
        data_size = len(json.dumps(event.data))
        if data_size > 50000:  # 50KB warning threshold
            logger.warning(f"Large SSE event data: {data_size} bytes")
        
        return True
        
    except Exception:
        return False


class SSEEventGenerator:
    """Generator for managing SSE event streaming"""
    
    def __init__(self, buffer_size: int = 1000, heartbeat_interval: int = 30):
        """
        Initialize SSE event generator
        
        Args:
            buffer_size: Maximum number of events to buffer
            heartbeat_interval: Heartbeat interval in seconds
        """
        self.buffer_size = buffer_size
        self.heartbeat_interval = heartbeat_interval
        self.is_active = False
        self._event_queue: Queue = Queue(maxsize=buffer_size)
        self._last_heartbeat = time.time()
    
    def start(self):
        """Start the event generator"""
        self.is_active = True
        logger.info("SSE event generator started")
    
    def stop(self):
        """Stop the event generator"""
        self.is_active = False
        logger.info("SSE event generator stopped")
    
    def add_event(self, event: SSEEvent):
        """
        Add event to the generator queue
        
        Args:
            event: Event to add
        """
        try:
            self._event_queue.put_nowait(event)
        except Full:
            # Remove oldest event to make room
            try:
                self._event_queue.get_nowait()
                self._event_queue.put_nowait(event)
                logger.warning("SSE event buffer overflow, dropped oldest event")
            except:
                logger.error("Failed to add event to SSE buffer")
    
    async def stream_events(self) -> AsyncGenerator[str, None]:
        """
        Stream formatted SSE events
        
        Yields:
            str: Formatted SSE event strings
        """
        while self.is_active:
            try:
                # Check for queued events
                if not self._event_queue.empty():
                    event = self._event_queue.get_nowait()
                    if validate_sse_event(event):
                        yield format_sse_data(event)
                
                # Send heartbeat if needed
                current_time = time.time()
                if current_time - self._last_heartbeat > self.heartbeat_interval:
                    heartbeat = create_sse_event(
                        SSEEventType.HEARTBEAT,
                        {"timestamp": int(current_time * 1000)}
                    )
                    yield format_sse_data(heartbeat)
                    self._last_heartbeat = current_time
                
                # Small delay to prevent busy waiting
                await asyncio.sleep(0.01)
                
            except Exception as e:
                logger.error(f"Error in SSE event stream: {e}")
                error_event = create_sse_event(
                    SSEEventType.ERROR,
                    {"message": str(e), "code": "STREAM_ERROR"}
                )
                yield format_sse_data(error_event)
                break


async def stream_sse_events(
    events: List[SSEEvent], 
    delay_ms: int = 0
) -> AsyncGenerator[str, None]:
    """
    Stream a list of SSE events with optional delays
    
    Args:
        events: List of events to stream
        delay_ms: Delay between events in milliseconds
        
    Yields:
        str: Formatted SSE event strings
    """
    for event in events:
        if validate_sse_event(event):
            yield format_sse_data(event)
            
            if delay_ms > 0:
                await asyncio.sleep(delay_ms / 1000.0)
        else:
            logger.warning(f"Skipping invalid SSE event: {event.event_type}")


# Medical workflow specific helpers
def create_medical_chunk_event(
    content: str, 
    position: int, 
    is_word_boundary: bool = False,
    stage_id: Optional[str] = None
) -> SSEEvent:
    """
    Create a medical content chunk event
    
    Args:
        content: Text content chunk
        position: Position in the full text
        is_word_boundary: Whether this chunk ends at a word boundary
        stage_id: Optional workflow stage identifier
        
    Returns:
        SSEEvent: Medical chunk event
    """
    data = {
        "content": content,
        "position": position,
        "length": len(content),
        "is_word_boundary": is_word_boundary
    }
    
    if stage_id:
        data["stage_id"] = stage_id
    
    return create_sse_event(SSEEventType.CHUNK, data)


def create_medical_stage_event(
    event_type: str,
    stage_id: str,
    stage_name: str,
    target_panel: str = "reasoning",
    **additional_data
) -> SSEEvent:
    """
    Create a medical workflow stage event
    
    Args:
        event_type: start, end, or stage_complete
        stage_id: Workflow stage identifier
        stage_name: Human-readable stage name
        target_panel: UI panel target (reasoning or chat)
        **additional_data: Additional event data
        
    Returns:
        SSEEvent: Medical stage event
    """
    data = {
        "stage_id": stage_id,
        "stage_name": stage_name,
        "target_panel": target_panel,
        **additional_data
    }
    
    return create_sse_event(event_type, data)


def create_medical_progress_event(
    stage_id: str,
    current_chunk: int,
    total_chunks: int,
    estimated_duration: Optional[int] = None
) -> SSEEvent:
    """
    Create a medical workflow progress event
    
    Args:
        stage_id: Workflow stage identifier
        current_chunk: Current chunk number
        total_chunks: Total number of chunks
        estimated_duration: Estimated completion time in ms
        
    Returns:
        SSEEvent: Progress event
    """
    progress_percent = (current_chunk / total_chunks) * 100 if total_chunks > 0 else 0
    
    data = {
        "stage_id": stage_id,
        "current_chunk": current_chunk,
        "total_chunks": total_chunks,
        "progress_percent": round(progress_percent, 2)
    }
    
    if estimated_duration:
        data["estimated_duration"] = estimated_duration
    
    return create_sse_event(SSEEventType.PROGRESS, data)