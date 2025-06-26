# ABOUTME: Test suite for workflow streaming endpoints
# ABOUTME: Covers SSE endpoint behavior, authentication, error handling, and timeout management

import pytest
import asyncio
from unittest.mock import AsyncMock, Mock, patch
from uuid import UUID, uuid4
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.routers.workflow import router
from app.core.security import SupabaseUser
from app.models.case import Case
from app.services.llm_service import StreamChunk
from app.utils.sse import SSEEvent, SSEEventType


@pytest.fixture
def mock_db_session():
    """Mock database session"""
    return Mock()


@pytest.fixture
def mock_current_user():
    """Mock authenticated user"""
    return SupabaseUser(
        id="test-user-id",
        email="test@example.com",
        email_confirmed_at=None,
        phone=None,
        confirmed_at=None,
        last_sign_in_at=None,
        app_metadata={},
        user_metadata={},
        role="authenticated",
        aud="",
        created_at="",
        updated_at=""
    )


@pytest.fixture
def mock_case():
    """Mock case object"""
    case = Mock(spec=Case)
    case.id = uuid4()
    case.user_id = "test-user-id"
    case.title = "Test Case"
    case.description = "Test case description"
    return case


@pytest.fixture
def mock_llm_service():
    """Mock LLM service with streaming capabilities"""
    service = Mock()
    
    # Mock stream_to_sse_events method
    async def mock_stream_to_sse_events(prompt, stage_id=None, target_panel="reasoning", chunk_size=8):
        # Simulate streaming events
        events = [
            SSEEvent(
                event_type=SSEEventType.START,
                data={"stage_id": stage_id, "message": "Starting stream", "target_panel": target_panel}
            ),
            SSEEvent(
                event_type=SSEEventType.CHUNK,
                data={"content": "Medical ", "position": 0, "is_word_boundary": True, "stage_id": stage_id}
            ),
            SSEEvent(
                event_type=SSEEventType.CHUNK,
                data={"content": "analysis ", "position": 8, "is_word_boundary": True, "stage_id": stage_id}
            ),
            SSEEvent(
                event_type=SSEEventType.CHUNK,
                data={"content": "complete", "position": 17, "is_word_boundary": True, "stage_id": stage_id}
            ),
            SSEEvent(
                event_type=SSEEventType.END,
                data={"stage_id": stage_id, "message": "Stream complete", "target_panel": target_panel, "total_chunks": 25}
            )
        ]
        
        for event in events:
            yield event
            await asyncio.sleep(0.01)  # Small delay to simulate streaming
    
    service.stream_to_sse_events = AsyncMock(side_effect=mock_stream_to_sse_events)
    return service


@pytest.fixture
def mock_diagnosis_service():
    """Mock diagnosis service"""
    service = Mock()
    service.process_stage = Mock(return_value={
        "stage_name": "initial",
        "result": {"analysis": "Test medical analysis"},
        "next_stage": "extraction"
    })
    return service


class TestWorkflowStreamingEndpoint:
    """Test cases for workflow streaming SSE endpoint"""
    
    @pytest.mark.asyncio
    async def test_stream_stage_success(self, mock_db_session, mock_current_user, mock_case, mock_llm_service):
        """Test successful stage streaming"""
        case_id = mock_case.id
        stage_name = "initial"
        
        # Mock database query
        mock_db_session.query.return_value.filter.return_value.first.return_value = mock_case
        
        # Mock dependencies
        with patch('app.routers.workflow.get_db', return_value=mock_db_session), \
             patch('app.routers.workflow.get_current_user', return_value=mock_current_user), \
             patch('app.services.llm_service.LLMService', return_value=mock_llm_service):
            
            from app.routers.workflow import stream_stage
            
            # Create async generator from function
            stream_gen = stream_stage(case_id, stage_name, mock_db_session, mock_current_user)
            
            # Collect events
            events = []
            async for event in stream_gen:
                events.append(event)
            
            # Verify events
            assert len(events) == 5
            assert events[0].event_type == SSEEventType.START
            assert events[1].event_type == SSEEventType.CHUNK
            assert events[2].event_type == SSEEventType.CHUNK  
            assert events[3].event_type == SSEEventType.CHUNK
            assert events[4].event_type == SSEEventType.END
            
            # Verify content
            assert "Medical " in events[1].data["content"]
            assert "analysis " in events[2].data["content"]
            assert "complete" in events[3].data["content"]
    
    @pytest.mark.asyncio
    async def test_stream_stage_case_not_found(self, mock_db_session, mock_current_user):
        """Test streaming with non-existent case"""
        case_id = uuid4()
        stage_name = "initial"
        
        # Mock database query to return None
        mock_db_session.query.return_value.filter.return_value.first.return_value = None
        
        with patch('app.routers.workflow.get_db', return_value=mock_db_session), \
             patch('app.routers.workflow.get_current_user', return_value=mock_current_user):
            
            from app.routers.workflow import stream_stage
            
            # Should raise HTTPException
            with pytest.raises(HTTPException) as exc_info:
                stream_gen = stream_stage(case_id, stage_name, mock_db_session, mock_current_user)
                async for _ in stream_gen:
                    pass
            
            assert exc_info.value.status_code == 404
            assert f"Case with ID {case_id} not found" in str(exc_info.value.detail)
    
    @pytest.mark.asyncio
    async def test_stream_stage_unauthorized_access(self, mock_db_session, mock_current_user, mock_case):
        """Test streaming with unauthorized case access"""
        case_id = mock_case.id
        stage_name = "initial"
        
        # Set different user ID for case
        mock_case.user_id = "different-user-id"
        
        # Mock database query
        mock_db_session.query.return_value.filter.return_value.first.return_value = mock_case
        
        with patch('app.routers.workflow.get_db', return_value=mock_db_session), \
             patch('app.routers.workflow.get_current_user', return_value=mock_current_user):
            
            from app.routers.workflow import stream_stage
            
            # Should raise HTTPException
            with pytest.raises(HTTPException) as exc_info:
                stream_gen = stream_stage(case_id, stage_name, mock_db_session, mock_current_user)
                async for _ in stream_gen:
                    pass
            
            assert exc_info.value.status_code == 403
            assert "Not authorized to access this case" in str(exc_info.value.detail)
    
    @pytest.mark.asyncio
    async def test_stream_stage_llm_error(self, mock_db_session, mock_current_user, mock_case):
        """Test streaming with LLM service error"""
        case_id = mock_case.id
        stage_name = "initial"
        
        # Mock database query
        mock_db_session.query.return_value.filter.return_value.first.return_value = mock_case
        
        # Mock LLM service to raise error
        mock_llm_service = Mock()
        async def mock_stream_error(*args, **kwargs):
            raise Exception("LLM service error")
        mock_llm_service.stream_to_sse_events = AsyncMock(side_effect=mock_stream_error)
        
        with patch('app.routers.workflow.get_db', return_value=mock_db_session), \
             patch('app.routers.workflow.get_current_user', return_value=mock_current_user), \
             patch('app.services.llm_service.LLMService', return_value=mock_llm_service):
            
            from app.routers.workflow import stream_stage
            
            # Collect events
            events = []
            stream_gen = stream_stage(case_id, stage_name, mock_db_session, mock_current_user)
            
            async for event in stream_gen:
                events.append(event)
            
            # Should receive error event
            assert len(events) >= 1
            assert any(event.event_type == SSEEventType.ERROR for event in events)
            
            # Find error event
            error_event = next(event for event in events if event.event_type == SSEEventType.ERROR)
            assert "LLM service error" in str(error_event.data)
    
    @pytest.mark.asyncio
    async def test_stream_stage_timeout_handling(self, mock_db_session, mock_current_user, mock_case):
        """Test streaming with timeout scenario"""
        case_id = mock_case.id
        stage_name = "initial"
        
        # Mock database query
        mock_db_session.query.return_value.filter.return_value.first.return_value = mock_case
        
        # Mock LLM service with timeout
        mock_llm_service = Mock()
        async def mock_stream_timeout(*args, **kwargs):
            await asyncio.sleep(0.1)  # Simulate delay
            raise asyncio.TimeoutError("Streaming timeout")
        mock_llm_service.stream_to_sse_events = AsyncMock(side_effect=mock_stream_timeout)
        
        with patch('app.routers.workflow.get_db', return_value=mock_db_session), \
             patch('app.routers.workflow.get_current_user', return_value=mock_current_user), \
             patch('app.services.llm_service.LLMService', return_value=mock_llm_service):
            
            from app.routers.workflow import stream_stage
            
            # Collect events
            events = []
            stream_gen = stream_stage(case_id, stage_name, mock_db_session, mock_current_user)
            
            async for event in stream_gen:
                events.append(event)
            
            # Should receive error event for timeout
            assert len(events) >= 1
            assert any(event.event_type == SSEEventType.ERROR for event in events)
            
            # Find error event
            error_event = next(event for event in events if event.event_type == SSEEventType.ERROR)
            assert "timeout" in str(error_event.data).lower()
    
    def test_sse_event_formatting(self):
        """Test SSE event formatting for FastAPI response"""
        from app.utils.sse import format_sse_data
        
        event = SSEEvent(
            event_type=SSEEventType.CHUNK,
            data={"content": "test content", "position": 0}
        )
        
        formatted = format_sse_data(event)
        
        # Should be properly formatted for SSE
        assert "event: chunk" in formatted
        assert "data: " in formatted
        assert "test content" in formatted
    
    @pytest.mark.asyncio 
    async def test_stream_stage_different_panels(self, mock_db_session, mock_current_user, mock_case, mock_llm_service):
        """Test streaming to different UI panels"""
        case_id = mock_case.id
        stage_name = "initial"
        
        # Mock database query
        mock_db_session.query.return_value.filter.return_value.first.return_value = mock_case
        
        # Test reasoning panel (default)
        with patch('app.routers.workflow.get_db', return_value=mock_db_session), \
             patch('app.routers.workflow.get_current_user', return_value=mock_current_user), \
             patch('app.services.llm_service.LLMService', return_value=mock_llm_service):
            
            from app.routers.workflow import stream_stage
            
            stream_gen = stream_stage(case_id, stage_name, mock_db_session, mock_current_user)
            
            # Collect first event
            first_event = None
            async for event in stream_gen:
                first_event = event
                break
            
            # Verify target panel is set correctly
            assert first_event.data.get("target_panel") == "reasoning"
            
            # Verify LLM service was called with correct parameters
            mock_llm_service.stream_to_sse_events.assert_called_once()
            call_args = mock_llm_service.stream_to_sse_events.call_args
            assert call_args[1]["target_panel"] == "reasoning"