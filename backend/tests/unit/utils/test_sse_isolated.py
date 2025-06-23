# ABOUTME: Isolated tests for SSE utilities without Supabase dependencies  
# ABOUTME: Tests pure utility functions for Server-Sent Events generation and formatting

import pytest
import json
import asyncio
import sys
import os
from typing import Dict, Any

# Add project root to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../..'))

from app.utils.sse import (
    SSEEvent, SSEEventType, create_sse_event, format_sse_data,
    validate_sse_event, SSEEventGenerator, stream_sse_events,
    SSEError, create_medical_chunk_event, create_medical_stage_event
)


class TestSSEEvent:
    """Test SSE event data structure"""
    
    def test_sse_event_creation(self):
        """Test creating SSE events with required fields"""
        event = SSEEvent(
            event_type="chunk",
            data={"content": "Hello world"},
            id="event-123"
        )
        
        assert event.event_type == "chunk"
        assert event.data == {"content": "Hello world"}
        assert event.id == "event-123"
        assert event.retry is None
    
    def test_sse_event_validation(self):
        """Test SSE event field validation"""
        # Test invalid event type
        with pytest.raises(ValueError):
            SSEEvent(event_type="", data={})
        
        # Test None data
        with pytest.raises(ValueError):
            SSEEvent(event_type="chunk", data=None)


class TestCreateSSEEvent:
    """Test SSE event creation helper function"""
    
    def test_create_basic_event(self):
        """Test creating basic SSE events"""
        event = create_sse_event("chunk", {"content": "test"})
        
        assert event.event_type == "chunk"
        assert event.data == {"content": "test"}
        assert event.id is not None
        assert isinstance(event.id, str)
    
    def test_create_event_generates_unique_ids(self):
        """Test that event IDs are unique"""
        event1 = create_sse_event("chunk", {"content": "test1"})
        event2 = create_sse_event("chunk", {"content": "test2"})
        
        assert event1.id != event2.id


class TestFormatSSEData:
    """Test SSE data formatting for transmission"""
    
    def test_format_basic_event(self):
        """Test formatting basic SSE event"""
        event = SSEEvent(
            event_type="chunk",
            data={"content": "Hello"},
            id="test-123"
        )
        
        formatted = format_sse_data(event)
        
        assert "event: chunk\n" in formatted
        assert "id: test-123\n" in formatted
        assert "data: " in formatted
        assert formatted.endswith("\n\n")
        
        # Verify data is valid JSON
        data_line = [line for line in formatted.split('\n') if line.startswith('data: ')][0]
        data_content = data_line[6:]  # Remove "data: "
        parsed_data = json.loads(data_content)
        assert parsed_data == {"content": "Hello"}


class TestValidateSSEEvent:
    """Test SSE event validation"""
    
    def test_validate_valid_event(self):
        """Test validation of valid SSE events"""
        event = SSEEvent(
            event_type="chunk",
            data={"content": "test"},
            id="valid-123"
        )
        
        assert validate_sse_event(event) is True
    
    def test_validate_invalid_event_type(self):
        """Test validation rejects invalid event types"""
        event = SSEEvent(event_type="invalid_type", data={"test": True})
        
        assert validate_sse_event(event) is False


class TestMedicalHelpers:
    """Test medical workflow specific helpers"""
    
    def test_create_medical_chunk_event(self):
        """Test creating medical content chunk events"""
        event = create_medical_chunk_event(
            content="Patient presents with hypertension",
            position=0,
            is_word_boundary=True,
            stage_id="initial"
        )
        
        assert event.event_type == "chunk"
        assert event.data["content"] == "Patient presents with hypertension"
        assert event.data["position"] == 0
        assert event.data["is_word_boundary"] is True
        assert event.data["stage_id"] == "initial"
    
    def test_create_medical_stage_event(self):
        """Test creating medical workflow stage events"""
        event = create_medical_stage_event(
            event_type="start",
            stage_id="initial",
            stage_name="Initial Analysis", 
            target_panel="reasoning"
        )
        
        assert event.event_type == "start"
        assert event.data["stage_id"] == "initial"
        assert event.data["stage_name"] == "Initial Analysis"
        assert event.data["target_panel"] == "reasoning"


@pytest.mark.asyncio
async def test_stream_sse_events():
    """Test streaming a list of SSE events"""
    events = [
        create_sse_event("start", {"stage": "test"}),
        create_sse_event("chunk", {"content": "hello"}),
        create_sse_event("end", {})
    ]
    
    formatted_events = []
    async for formatted in stream_sse_events(events):
        formatted_events.append(formatted)
    
    assert len(formatted_events) == 3
    assert all("event: " in event for event in formatted_events)
    assert all(event.endswith("\n\n") for event in formatted_events)