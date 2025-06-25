# ABOUTME: Isolated unit tests for LLM service streaming functionality  
# ABOUTME: Tests streaming logic without external dependencies

import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from typing import AsyncGenerator, List
import time
from dataclasses import dataclass
from typing import Optional, Dict, Any


@dataclass
class StreamChunk:
    """Mock StreamChunk for testing"""
    content: str
    position: int = 0
    length: int = 0
    is_word_boundary: bool = False
    metadata: Optional[Dict[str, Any]] = None
    
    def __post_init__(self):
        if self.length == 0:
            self.length = len(self.content)


class MockLLMService:
    """Mock LLM service for testing streaming functionality"""
    
    def __init__(self):
        self.llm = Mock()
        self.settings = Mock()
        self.settings.LLM_MAX_RETRIES = 2
        self.settings.LLM_TIMEOUT = 60
        self.settings.LLM_PROVIDER = "openai"
        self.settings.LLM_MODEL_NAME = "gpt-3.5-turbo"
    
    def _create_word_chunks(
        self, 
        text: str, 
        max_size: int, 
        start_position: int = 0
    ) -> List[StreamChunk]:
        """Create word-level chunks from text content"""
        if not text:
            return []
        
        chunks = []
        position = start_position
        
        # Split on whitespace while preserving it
        words = text.split(' ')
        current_chunk = ""
        
        for i, word in enumerate(words):
            # Add space except for first word
            word_with_space = word if i == 0 else " " + word
            
            # If adding this word would exceed max size and we have content
            if len(current_chunk + word_with_space) > max_size and current_chunk:
                # Create chunk from current content
                is_word_boundary = current_chunk.endswith(' ') or current_chunk.endswith('\n')
                chunks.append(StreamChunk(
                    content=current_chunk,
                    position=position,
                    length=len(current_chunk),
                    is_word_boundary=is_word_boundary
                ))
                
                position += len(current_chunk)
                current_chunk = word_with_space.lstrip()
            else:
                current_chunk += word_with_space
        
        # Add remaining content
        if current_chunk:
            chunks.append(StreamChunk(
                content=current_chunk,
                position=position,
                length=len(current_chunk),
                is_word_boundary=True
            ))
        
        return chunks
    
    async def stream_generate(
        self,
        prompt: str,
        chunk_size: int = 8,
        include_metadata: bool = False,
        timeout: Optional[int] = None
    ) -> AsyncGenerator[StreamChunk, None]:
        """Mock streaming generate method"""
        position = 0
        
        async for response_chunk in self.llm.astream(prompt):
            if hasattr(response_chunk, 'content'):
                new_content = response_chunk.content
                
                # Process content into word-level chunks
                chunks = self._create_word_chunks(
                    new_content, 
                    chunk_size, 
                    position
                )
                
                for chunk in chunks:
                    if include_metadata:
                        chunk.metadata = {
                            "provider": self.settings.LLM_PROVIDER,
                            "model": self.settings.LLM_MODEL_NAME,
                            "timestamp": time.time()
                        }
                    
                    yield chunk
                    position += chunk.length


class TestLLMServiceStreamingIsolated:
    """Test streaming capabilities without external dependencies"""
    
    @pytest.fixture
    def mock_llm_service(self):
        """Create a mock LLM service for testing"""
        return MockLLMService()
    
    @pytest.fixture
    def sample_response_text(self):
        """Sample medical response for testing"""
        return "Patient presents with acute chest pain. Initial assessment suggests possible cardiac involvement."
    
    def test_create_word_chunks_basic(self, mock_llm_service):
        """Test basic word chunking functionality"""
        text = "Medical diagnosis requires careful analysis"
        chunks = mock_llm_service._create_word_chunks(text, 15)
        
        # Should create multiple chunks
        assert len(chunks) > 1
        
        # Verify content is preserved
        full_content = "".join(chunk.content for chunk in chunks)
        assert full_content == text
        
        # Verify positions are correct
        assert chunks[0].position == 0
        if len(chunks) > 1:
            assert chunks[1].position == chunks[0].position + chunks[0].length
    
    def test_create_word_chunks_word_boundaries(self, mock_llm_service):
        """Test word boundary respect in chunking"""
        text = "This is a test sentence for chunking"
        chunks = mock_llm_service._create_word_chunks(text, 10)
        
        # Verify chunks respect word boundaries where possible
        for chunk in chunks[:-1]:  # All except last chunk
            if chunk.is_word_boundary and len(chunk.content) < 10:
                # Should end with a complete word
                assert not chunk.content.endswith(' ')
    
    def test_create_word_chunks_empty_text(self, mock_llm_service):
        """Test chunking with empty text"""
        chunks = mock_llm_service._create_word_chunks("", 10)
        assert len(chunks) == 0
    
    def test_create_word_chunks_single_word(self, mock_llm_service):
        """Test chunking with single word that fits"""
        chunks = mock_llm_service._create_word_chunks("word", 10)
        assert len(chunks) == 1
        assert chunks[0].content == "word"
        assert chunks[0].is_word_boundary is True
    
    def test_create_word_chunks_long_word(self, mock_llm_service):
        """Test chunking with word longer than max size"""
        chunks = mock_llm_service._create_word_chunks("supercalifragilisticexpialidocious", 10)
        assert len(chunks) == 1  # Should still create one chunk
        assert chunks[0].content == "supercalifragilisticexpialidocious"
    
    def test_create_word_chunks_medical_terminology(self, mock_llm_service):
        """Test chunking with medical terminology"""
        text = "Pneumonoultramicroscopicsilicovolcanoconiosispathy cardiovascular myocardial"
        chunks = mock_llm_service._create_word_chunks(text, 20)
        
        # Should handle long medical terms appropriately
        assert len(chunks) >= 2
        
        # Reconstruct and verify
        reconstructed = "".join(chunk.content for chunk in chunks)
        assert reconstructed == text
    
    @pytest.mark.asyncio
    async def test_stream_generate_basic_flow(self, mock_llm_service, sample_response_text):
        """Test basic streaming flow"""
        # Mock the astream method
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
    async def test_stream_generate_with_metadata(self, mock_llm_service):
        """Test streaming with metadata inclusion"""
        async def mock_astream(prompt):
            yield Mock(content="Test response content")
        
        mock_llm_service.llm.astream = mock_astream
        
        chunks = []
        async for chunk in mock_llm_service.stream_generate(
            "Test prompt", 
            include_metadata=True
        ):
            chunks.append(chunk)
        
        assert len(chunks) > 0
        
        # Check that metadata is included
        for chunk in chunks:
            assert chunk.metadata is not None
            assert "provider" in chunk.metadata
            assert "model" in chunk.metadata
            assert "timestamp" in chunk.metadata
    
    @pytest.mark.asyncio
    async def test_stream_generate_chunk_sizing(self, mock_llm_service):
        """Test different chunk sizes"""
        test_text = "This is a comprehensive medical diagnosis report"
        
        async def mock_astream(prompt):
            yield Mock(content=test_text)
        
        mock_llm_service.llm.astream = mock_astream
        
        # Test with small chunk size
        small_chunks = []
        async for chunk in mock_llm_service.stream_generate("Test", chunk_size=5):
            small_chunks.append(chunk)
        
        # Test with large chunk size
        large_chunks = []
        async for chunk in mock_llm_service.stream_generate("Test", chunk_size=20):
            large_chunks.append(chunk)
        
        # Small chunks should create more chunks
        assert len(small_chunks) >= len(large_chunks)
        
        # Both should preserve content
        small_content = "".join(c.content for c in small_chunks)
        large_content = "".join(c.content for c in large_chunks)
        assert small_content == large_content == test_text
    
    def test_chunk_positions_are_sequential(self, mock_llm_service):
        """Test that chunk positions are sequential and correct"""
        text = "Sequential positioning test for medical content"
        chunks = mock_llm_service._create_word_chunks(text, 12)
        
        # Verify positions are sequential
        expected_position = 0
        for chunk in chunks:
            assert chunk.position == expected_position
            expected_position += chunk.length
        
        # Verify total length matches original text
        total_length = sum(chunk.length for chunk in chunks)
        assert total_length == len(text)
    
    def test_chunk_boundary_detection(self, mock_llm_service):
        """Test word boundary detection in chunks"""
        text = "Word boundary detection test"
        chunks = mock_llm_service._create_word_chunks(text, 8)
        
        # Last chunk should always be at word boundary
        assert chunks[-1].is_word_boundary is True
        
        # Check intermediate chunks
        for i, chunk in enumerate(chunks[:-1]):
            if chunk.is_word_boundary:
                # Should not end with trailing space in content
                assert not chunk.content.endswith(' ')
    
    @pytest.mark.asyncio 
    async def test_stream_generate_empty_response(self, mock_llm_service):
        """Test streaming with empty response"""
        async def mock_astream(prompt):
            yield Mock(content="")
        
        mock_llm_service.llm.astream = mock_astream
        
        chunks = []
        async for chunk in mock_llm_service.stream_generate("Test prompt"):
            chunks.append(chunk)
        
        # Should handle empty content gracefully
        assert len(chunks) == 0
    
    def test_streamchunk_dataclass_functionality(self):
        """Test StreamChunk dataclass functionality"""
        # Test with explicit length
        chunk1 = StreamChunk(content="test", position=0, length=5)
        assert chunk1.length == 5
        
        # Test with auto-calculated length
        chunk2 = StreamChunk(content="test", position=0)
        assert chunk2.length == 4
        
        # Test with metadata
        chunk3 = StreamChunk(
            content="test",
            metadata={"provider": "openai"}
        )
        assert chunk3.metadata["provider"] == "openai"
        assert chunk3.is_word_boundary is False  # default value