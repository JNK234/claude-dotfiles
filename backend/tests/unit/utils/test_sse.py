# ABOUTME: Tests for backend SSE event generation utilities
# ABOUTME: Validates Server-Sent Events formatting, streaming data serialization, and error handling

import pytest
import json
import asyncio
from unittest.mock import AsyncMock, MagicMock
from typing import Dict, Any, AsyncGenerator

from app.utils.sse import (
    SSEEvent,
    SSEEventGenerator,
    create_sse_event,
    format_sse_data,
    validate_sse_event,
    stream_sse_events,
    SSEError,
    SSEEventType
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
    
    def test_sse_event_with_retry(self):
        """Test SSE events with retry configuration"""
        event = SSEEvent(
            event_type="error",
            data={"message": "Connection failed"},
            retry=5000
        )
        
        assert event.retry == 5000
        assert event.id is None
    
    def test_sse_event_validation(self):
        """Test SSE event field validation"""
        # Test invalid event type
        with pytest.raises(ValueError):
            SSEEvent(event_type="", data={})
        
        # Test None data
        with pytest.raises(ValueError):
            SSEEvent(event_type="chunk", data=None)


class TestSSEEventType:
    """Test SSE event type enumeration"""
    
    def test_event_types_exist(self):
        """Test that all expected event types are defined"""
        expected_types = [
            "chunk", "start", "end", "error", "metadata", 
            "heartbeat", "progress", "stage_complete"
        ]
        
        for event_type in expected_types:
            assert hasattr(SSEEventType, event_type.upper())
            assert getattr(SSEEventType, event_type.upper()) == event_type


class TestCreateSSEEvent:
    """Test SSE event creation helper function"""
    
    def test_create_basic_event(self):
        """Test creating basic SSE events"""
        event = create_sse_event("chunk", {"content": "test"})
        
        assert event.event_type == "chunk"
        assert event.data == {"content": "test"}
        assert event.id is not None
        assert isinstance(event.id, str)
    
    def test_create_event_with_id(self):
        """Test creating events with custom ID"""
        event = create_sse_event("start", {"stage": "initial"}, event_id="custom-123")
        
        assert event.id == "custom-123"
        assert event.event_type == "start"
    
    def test_create_event_with_retry(self):
        """Test creating events with retry configuration"""
        event = create_sse_event("error", {"message": "Failed"}, retry=3000)
        
        assert event.retry == 3000
        assert event.event_type == "error"
    
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
    
    def test_format_event_without_id(self):
        """Test formatting events without ID"""
        event = SSEEvent(event_type="heartbeat", data={"timestamp": 123456})
        formatted = format_sse_data(event)
        
        assert "event: heartbeat\n" in formatted
        assert "id:" not in formatted
        assert "data: " in formatted
    
    def test_format_event_with_retry(self):
        """Test formatting events with retry"""
        event = SSEEvent(
            event_type="error",
            data={"message": "Retry needed"},
            retry=5000
        )
        formatted = format_sse_data(event)
        
        assert "retry: 5000\n" in formatted
        assert "event: error\n" in formatted
    
    def test_format_handles_special_characters(self):
        """Test formatting data with newlines and special characters"""
        event = SSEEvent(
            event_type="chunk",
            data={"content": "Line 1\nLine 2\r\nLine 3", "special": "chars: \"quotes\""}
        )
        formatted = format_sse_data(event)
        
        # Should contain properly escaped JSON
        assert "data: " in formatted
        data_line = [line for line in formatted.split('\n') if line.startswith('data: ')][0]
        data_content = data_line[6:]
        
        # Should be valid JSON
        parsed_data = json.loads(data_content)
        assert parsed_data["content"] == "Line 1\nLine 2\r\nLine 3"
        assert parsed_data["special"] == "chars: \"quotes\""
    
    def test_format_empty_data(self):
        """Test formatting events with empty data"""
        event = SSEEvent(event_type="end", data={})
        formatted = format_sse_data(event)
        
        assert "data: {}\n" in formatted


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
    
    def test_validate_large_data(self):
        """Test validation handles large data payloads"""
        large_content = "x" * 100000  # 100KB content
        event = SSEEvent(
            event_type="chunk", 
            data={"content": large_content}
        )
        
        # Should validate but might warn about size
        result = validate_sse_event(event)
        assert isinstance(result, bool)
    
    def test_validate_malformed_data(self):
        """Test validation handles non-serializable data"""
        # Create event with non-serializable data
        class NonSerializable:
            pass
        
        event = SSEEvent(
            event_type="chunk",
            data={"obj": NonSerializable()}
        )
        
        assert validate_sse_event(event) is False


class TestSSEEventGenerator:
    """Test SSE event generator class"""
    
    def test_generator_initialization(self):
        """Test SSE event generator initialization"""
        generator = SSEEventGenerator(buffer_size=100, heartbeat_interval=30)
        
        assert generator.buffer_size == 100
        assert generator.heartbeat_interval == 30
        assert generator.is_active is False
    
    def test_generator_start_stop(self):
        """Test starting and stopping the generator"""
        generator = SSEEventGenerator()
        
        generator.start()
        assert generator.is_active is True
        
        generator.stop()
        assert generator.is_active is False
    
    def test_generator_add_event(self):
        """Test adding events to generator"""
        generator = SSEEventGenerator()
        event = create_sse_event("chunk", {"content": "test"})
        
        generator.add_event(event)
        assert len(generator._event_queue) == 1
    
    def test_generator_buffer_overflow(self):
        """Test generator buffer overflow handling"""
        generator = SSEEventGenerator(buffer_size=2)
        
        # Add more events than buffer size
        for i in range(5):
            event = create_sse_event("chunk", {"content": f"test{i}"})
            generator.add_event(event)
        
        # Should only keep latest events within buffer size
        assert len(generator._event_queue) <= 2
    
    @pytest.mark.asyncio
    async def test_generator_event_stream(self):
        """Test generator event streaming"""
        generator = SSEEventGenerator()
        generator.start()
        
        # Add test events
        event1 = create_sse_event("start", {"stage": "test"})
        event2 = create_sse_event("chunk", {"content": "hello"})
        event3 = create_sse_event("end", {})
        
        generator.add_event(event1)
        generator.add_event(event2)
        generator.add_event(event3)
        
        # Collect events from stream
        events = []
        async for formatted_event in generator.stream_events():
            events.append(formatted_event)
            if len(events) >= 3:  # Stop after collecting test events
                break
        
        assert len(events) == 3
        assert "event: start\n" in events[0]
        assert "event: chunk\n" in events[1] 
        assert "event: end\n" in events[2]
        
        generator.stop()


class TestStreamSSEEvents:
    """Test high-level SSE event streaming function"""
    
    @pytest.mark.asyncio
    async def test_stream_simple_events(self):
        """Test streaming simple list of events"""
        events = [
            create_sse_event("start", {"stage": "initial"}),
            create_sse_event("chunk", {"content": "hello"}),
            create_sse_event("end", {})
        ]
        
        formatted_events = []
        async for formatted in stream_sse_events(events):
            formatted_events.append(formatted)
        
        assert len(formatted_events) == 3
        assert all("event: " in event for event in formatted_events)
        assert all(event.endswith("\n\n") for event in formatted_events)
    
    @pytest.mark.asyncio
    async def test_stream_with_delays(self):
        """Test streaming events with timing delays"""
        events = [
            create_sse_event("chunk", {"content": "part1"}),
            create_sse_event("chunk", {"content": "part2"})
        ]
        
        start_time = asyncio.get_event_loop().time()
        
        formatted_events = []
        async for formatted in stream_sse_events(events, delay_ms=100):
            formatted_events.append(formatted)
        
        end_time = asyncio.get_event_loop().time()
        duration = (end_time - start_time) * 1000  # Convert to ms
        
        assert len(formatted_events) == 2
        assert duration >= 100  # Should take at least 100ms due to delay
    
    @pytest.mark.asyncio
    async def test_stream_error_handling(self):
        """Test streaming with error events"""
        events = [
            create_sse_event("start", {}),
            create_sse_event("error", {"message": "Something failed", "code": "TEST_ERROR"}),
            create_sse_event("end", {})
        ]
        
        formatted_events = []
        async for formatted in stream_sse_events(events):
            formatted_events.append(formatted)
        
        assert len(formatted_events) == 3
        error_event = formatted_events[1]
        assert "event: error\n" in error_event
        assert "TEST_ERROR" in error_event


class TestSSEError:
    """Test SSE-specific error handling"""
    
    def test_sse_error_creation(self):
        """Test creating SSE-specific errors"""
        error = SSEError("Connection failed", error_code="SSE_CONNECTION_FAILED")
        
        assert str(error) == "Connection failed"
        assert error.error_code == "SSE_CONNECTION_FAILED"
    
    def test_sse_error_with_context(self):
        """Test SSE errors with additional context"""
        error = SSEError(
            "Event validation failed",
            error_code="SSE_VALIDATION_ERROR",
            context={"event_type": "invalid", "event_id": "test-123"}
        )
        
        assert error.context["event_type"] == "invalid"
        assert error.context["event_id"] == "test-123"


class TestSSEIntegration:
    """Integration tests for SSE event system"""
    
    @pytest.mark.asyncio
    async def test_end_to_end_event_flow(self):
        """Test complete end-to-end SSE event flow"""
        # Create generator
        generator = SSEEventGenerator()
        generator.start()
        
        # Create medical workflow events
        events = [
            create_sse_event("start", {
                "stage_id": "initial", 
                "stage_name": "Initial Analysis",
                "target_panel": "reasoning"
            }),
            create_sse_event("chunk", {
                "content": "Patient presents with elevated blood pressure",
                "position": 0,
                "is_word_boundary": True
            }),
            create_sse_event("chunk", {
                "content": " readings consistent with hypertension",
                "position": 46,
                "is_word_boundary": True
            }),
            create_sse_event("metadata", {
                "total_chunks": 2,
                "current_chunk": 2,
                "stage_progress": 100
            }),
            create_sse_event("end", {
                "stage_id": "initial",
                "status": "completed"
            })
        ]
        
        # Add events to generator
        for event in events:
            assert validate_sse_event(event) is True
            generator.add_event(event)
        
        # Stream events and validate format
        streamed_events = []
        async for formatted_event in generator.stream_events():
            streamed_events.append(formatted_event)
            if len(streamed_events) >= 5:
                break
        
        # Validate all events were streamed correctly
        assert len(streamed_events) == 5
        
        # Check start event
        assert "event: start\n" in streamed_events[0]
        assert "Initial Analysis" in streamed_events[0]
        
        # Check chunk events
        assert "event: chunk\n" in streamed_events[1]
        assert "elevated blood pressure" in streamed_events[1]
        
        # Check metadata event
        assert "event: metadata\n" in streamed_events[3]
        assert "stage_progress" in streamed_events[3]
        
        # Check end event
        assert "event: end\n" in streamed_events[4]
        assert "completed" in streamed_events[4]
        
        generator.stop()
    
    def test_medical_content_serialization(self):
        """Test serialization of medical content with special characters"""
        medical_content = """
        ASSESSMENT:
        • Hypertension (ICD-10: I10)
        • Type 2 diabetes mellitus with complications
        
        PLAN:
        1. Continue ACE inhibitor
        2. Monitor BP q2-3 months
        3. A1C in 3 months
        """
        
        event = create_sse_event("chunk", {
            "content": medical_content,
            "medical_codes": ["I10", "E11.9"],
            "urgency": "routine"
        })
        
        formatted = format_sse_data(event)
        
        # Should format correctly without breaking SSE protocol
        assert formatted.endswith("\n\n")
        assert "event: chunk\n" in formatted
        
        # Data should be valid JSON
        data_line = [line for line in formatted.split('\n') if line.startswith('data: ')][0]
        data_content = data_line[6:]
        parsed_data = json.loads(data_content)
        
        assert "ICD-10: I10" in parsed_data["content"]
        assert parsed_data["medical_codes"] == ["I10", "E11.9"]