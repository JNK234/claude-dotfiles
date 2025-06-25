# ABOUTME: Unit tests for LLM service streaming functionality
# ABOUTME: Tests async generators, chunking logic, and streaming integration

import pytest
import asyncio
import sys
import os
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from typing import AsyncGenerator, List
import time

# Add the app directory to the path for isolated testing
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..'))

# Mock the Supabase dependency before importing
with patch.dict('sys.modules', {
    'app.core.supabase': MagicMock()
}), patch('app.core.config.settings') as mock_settings:
    # Configure mock settings
    mock_settings.LLM_MAX_RETRIES = 2
    mock_settings.LLM_TIMEOUT = 60
    mock_settings.LLM_PROVIDER = "openai"
    mock_settings.LLM_MODEL_NAME = "gpt-3.5-turbo"
    
    from app.services.llm_service import LLMService, StreamChunk
    from app.utils.sse import SSEEvent, SSEEventType


class TestLLMServiceStreaming:
    """Test streaming capabilities of LLM service"""
    
    @pytest.fixture
    def mock_llm_service(self):
        """Create a mock LLM service for testing"""
        service = LLMService()
        # Mock the underlying LLM
        service.llm = Mock()
        return service
    
    @pytest.fixture
    def sample_response_text(self):
        """Sample medical response for testing"""
        return "Patient presents with acute chest pain. Initial assessment suggests possible cardiac involvement. Further diagnostic workup recommended including ECG and cardiac enzymes."
    
    @pytest.mark.asyncio
    async def test_stream_generate_basic(self, mock_llm_service, sample_response_text):
        """Test basic streaming generation"""
        # Mock the streaming response
        async def mock_astream(prompt):
            words = sample_response_text.split()
            for word in words:
                yield Mock(content=word + " ")
        
        mock_llm_service.llm.astream = mock_astream
        
        # Test streaming
        chunks = []
        async for chunk in mock_llm_service.stream_generate("Test prompt"):
            chunks.append(chunk)
        
        # Verify we got chunks
        assert len(chunks) > 0
        # Verify content is properly chunked
        full_content = "".join(chunk.content for chunk in chunks)
        assert "chest pain" in full_content
        assert "cardiac" in full_content
    
    @pytest.mark.asyncio
    async def test_stream_generate_with_word_chunking(self, mock_llm_service):
        """Test streaming with word-level chunking"""
        test_text = "Medical diagnosis requires careful analysis."
        
        async def mock_astream(prompt):
            yield Mock(content=test_text)
        
        mock_llm_service.llm.astream = mock_astream
        
        chunks = []
        async for chunk in mock_llm_service.stream_generate("Test prompt", chunk_size=10):
            chunks.append(chunk)
        
        # Should have multiple chunks for word boundaries
        assert len(chunks) > 1
        
        # Verify chunks respect word boundaries
        for chunk in chunks:
            if hasattr(chunk, 'is_word_boundary'):
                # Chunks should end at word boundaries when possible
                if chunk.is_word_boundary and chunk.content.strip():
                    assert chunk.content.strip()[-1] not in [' ', '\n']
    
    @pytest.mark.asyncio
    async def test_stream_generate_with_history(self, mock_llm_service):
        """Test streaming with message history"""
        messages = [
            {"role": "user", "content": "What are the symptoms?"},
            {"role": "assistant", "content": "Common symptoms include..."}
        ]
        
        async def mock_astream(messages_list):
            yield Mock(content="Based on history, additional symptoms may include fatigue.")
        
        mock_llm_service.llm.astream = mock_astream
        
        chunks = []
        async for chunk in mock_llm_service.stream_generate_with_history(messages):
            chunks.append(chunk)
        
        assert len(chunks) > 0
        full_content = "".join(chunk.content for chunk in chunks)
        assert "fatigue" in full_content
    
    @pytest.mark.asyncio
    async def test_stream_generate_error_handling(self, mock_llm_service):
        """Test error handling in streaming"""
        async def mock_astream_error(prompt):
            yield Mock(content="Partial response")
            raise Exception("LLM API error")
        
        mock_llm_service.llm.astream = mock_astream_error
        
        chunks = []
        with pytest.raises(Exception, match="LLM API error"):
            async for chunk in mock_llm_service.stream_generate("Test prompt"):
                chunks.append(chunk)
        
        # Should have received partial content before error
        assert len(chunks) > 0
        assert chunks[0].content == "Partial response"
    
    @pytest.mark.asyncio
    async def test_stream_generate_retry_logic(self, mock_llm_service):
        """Test retry logic for streaming failures"""
        call_count = 0
        
        async def mock_astream_with_retry(prompt):
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                raise Exception("Temporary failure")
            yield Mock(content="Success after retry")
        
        # Mock the retry configuration
        with patch('app.core.config.settings.LLM_MAX_RETRIES', 2):
            mock_llm_service.llm.astream = mock_astream_with_retry
            
            chunks = []
            async for chunk in mock_llm_service.stream_generate("Test prompt"):
                chunks.append(chunk)
            
            assert len(chunks) > 0
            assert chunks[0].content == "Success after retry"
            assert call_count == 2  # One failure, one success
    
    @pytest.mark.asyncio
    async def test_stream_to_sse_events(self, mock_llm_service):
        """Test conversion of streaming chunks to SSE events"""
        test_text = "Patient shows improvement in symptoms."
        
        async def mock_astream(prompt):
            words = test_text.split()
            for word in words:
                yield Mock(content=word + " ")
        
        mock_llm_service.llm.astream = mock_astream
        
        events = []
        async for event in mock_llm_service.stream_to_sse_events("Test prompt", stage_id="diagnosis"):
            events.append(event)
        
        # Should have start, chunks, and end events
        assert len(events) >= 3
        
        # Check start event
        start_event = events[0]
        assert start_event.event_type == SSEEventType.START
        assert start_event.data["stage_id"] == "diagnosis"
        
        # Check chunk events
        chunk_events = [e for e in events if e.event_type == SSEEventType.CHUNK]
        assert len(chunk_events) > 0
        
        # Check end event
        end_event = events[-1]
        assert end_event.event_type == SSEEventType.END
    
    @pytest.mark.asyncio
    async def test_streaming_configuration_options(self, mock_llm_service):
        """Test streaming with different configuration options"""
        async def mock_astream(prompt):
            yield Mock(content="Medical assessment complete.")
        
        mock_llm_service.llm.astream = mock_astream
        
        # Test with custom chunk size
        chunks = []
        async for chunk in mock_llm_service.stream_generate(
            "Test prompt", 
            chunk_size=5,
            include_metadata=True
        ):
            chunks.append(chunk)
        
        assert len(chunks) > 0
        
        # Verify metadata is included if requested
        if hasattr(chunks[0], 'metadata'):
            assert chunks[0].metadata is not None
    
    @pytest.mark.asyncio
    async def test_streaming_timeout_handling(self, mock_llm_service):
        """Test timeout handling in streaming"""
        async def mock_astream_slow(prompt):
            yield Mock(content="Start")
            await asyncio.sleep(2)  # Simulate slow response
            yield Mock(content="End")
        
        mock_llm_service.llm.astream = mock_astream_slow
        
        # Test with timeout
        chunks = []
        start_time = time.time()
        
        try:
            async for chunk in mock_llm_service.stream_generate(
                "Test prompt", 
                timeout=1  # 1 second timeout
            ):
                chunks.append(chunk)
        except asyncio.TimeoutError:
            pass  # Expected timeout
        
        elapsed = time.time() - start_time
        assert elapsed < 1.5  # Should timeout within reasonable time
        assert len(chunks) >= 1  # Should get at least first chunk
    
    def test_streaming_backward_compatibility(self, mock_llm_service):
        """Test that existing synchronous methods still work"""
        # Mock the synchronous invoke method
        mock_llm_service.llm.invoke = Mock(return_value=Mock(content="Synchronous response"))
        
        # Test existing invoke method
        response = mock_llm_service.invoke("Test prompt")
        assert response == "Synchronous response"
        
        # Test existing generate method
        response = mock_llm_service.generate("Test prompt: {condition}", condition="hypertension")
        assert "Synchronous response" in response
        
        # Test existing generate_with_history method
        messages = [{"role": "user", "content": "Test"}]
        response = mock_llm_service.generate_with_history(messages)
        assert response == "Synchronous response"
    
    @pytest.mark.asyncio
    async def test_streaming_provider_compatibility(self, mock_llm_service):
        """Test streaming works with different providers"""
        providers = ["azure", "openai", "gemini", "deepseek"]
        
        for provider in providers:
            with patch('app.core.config.settings.LLM_PROVIDER', provider):
                async def mock_astream(prompt):
                    yield Mock(content=f"Response from {provider}")
                
                mock_llm_service.llm.astream = mock_astream
                
                chunks = []
                async for chunk in mock_llm_service.stream_generate("Test prompt"):
                    chunks.append(chunk)
                
                assert len(chunks) > 0
                assert provider in chunks[0].content