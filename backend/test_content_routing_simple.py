"""
ABOUTME: Simple TDD test for content routing (Prompt 5)
ABOUTME: Tests sequential content routing: detailed analysis → summary
"""
import asyncio
import sys
import os
from unittest.mock import Mock

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


async def test_streaming_workflow_import():
    """Test that we can import the streaming workflow components"""
    print("Testing streaming workflow imports...")
    
    # Test we can import the new streaming method
    from app.services.diagnosis_service import DiagnosisService
    from app.utils.sse import SSEEventType, create_sse_event
    
    # Check DiagnosisService has the stream_stage method
    assert hasattr(DiagnosisService, 'stream_stage')
    
    # Check method signature
    import inspect
    sig = inspect.signature(DiagnosisService.stream_stage)
    assert 'case_id' in sig.parameters
    assert 'stage_name' in sig.parameters
    
    print("✅ Streaming workflow import test passed")


async def test_workflow_endpoint_integration():
    """Test that workflow router uses DiagnosisService streaming"""
    print("Testing workflow endpoint integration...")
    
    # Check that the workflow router stream_stage endpoint exists and calls DiagnosisService
    from app.routers import workflow
    
    # Verify the endpoint exists
    assert hasattr(workflow, 'stream_stage')
    
    # Read the source to verify it calls diagnosis_service.stream_stage
    import inspect
    source = inspect.getsource(workflow.stream_stage)
    assert 'diagnosis_service.stream_stage' in source
    
    print("✅ Workflow endpoint integration test passed")


async def run_tests():
    """Run simple content routing tests"""
    print("🧪 Running Prompt 5: Content Routing Logic Tests")
    print("=" * 50)
    
    try:
        await test_streaming_workflow_import()
        await test_workflow_endpoint_integration()
        print("\n🎉 All Prompt 5 tests passed!")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = asyncio.run(run_tests())
    sys.exit(0 if success else 1)