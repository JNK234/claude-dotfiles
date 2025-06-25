#!/usr/bin/env python3
"""
Simple test to verify Supabase client creation works correctly
"""
import sys
import os
from pathlib import Path

# Set up path for imports
backend_dir = str(Path(__file__).parent.parent.parent)
sys.path.insert(0, backend_dir)
os.environ['PYTHONPATH'] = backend_dir

def test_client_creation():
    """Test that all client creation methods work"""
    print("🔍 Testing Supabase client creation...")
    
    from app.core.supabase import (
        get_supabase_client, 
        SupabaseService, 
        get_supabase_anon, 
        get_supabase_service,
        supabase_anon,
        supabase_service,
        supabase_service_instance,
        supabase_user_instance
    )
    
    # Test basic client creation
    print("  Testing basic client creation...")
    anon_client = get_supabase_client(use_service_role=False)
    service_client = get_supabase_client(use_service_role=True)
    
    assert anon_client is not None, "Anon client should not be None"
    assert service_client is not None, "Service client should not be None"
    assert anon_client is not service_client, "Clients should be different instances"
    print("  ✅ Basic client creation: PASSED")
    
    # Test lazy client functions
    print("  Testing lazy client functions...")
    lazy_anon = get_supabase_anon()
    lazy_service = get_supabase_service()
    
    assert lazy_anon is not None, "Lazy anon client should not be None"
    assert lazy_service is not None, "Lazy service client should not be None"
    
    # Test that lazy clients are cached
    lazy_anon2 = get_supabase_anon()
    lazy_service2 = get_supabase_service()
    assert lazy_anon is lazy_anon2, "Lazy anon clients should be cached"
    assert lazy_service is lazy_service2, "Lazy service clients should be cached"
    print("  ✅ Lazy client functions: PASSED")
    
    # Test service class
    print("  Testing SupabaseService class...")
    service = SupabaseService(use_service_role=True)
    anon_service = SupabaseService(use_service_role=False)
    
    assert service.use_service_role == True, "Service should use service role"
    assert anon_service.use_service_role == False, "Anon service should not use service role"
    assert service.client is not None, "Service client should not be None"
    assert anon_service.client is not None, "Anon service client should not be None"
    print("  ✅ SupabaseService class: PASSED")
    
    # Test lazy client wrappers
    print("  Testing lazy client wrappers...")
    assert hasattr(supabase_anon, 'table'), "Anon wrapper should have table method"
    assert hasattr(supabase_service, 'table'), "Service wrapper should have table method"
    assert hasattr(supabase_anon, 'auth'), "Anon wrapper should have auth method"
    assert hasattr(supabase_service, 'auth'), "Service wrapper should have auth method"
    print("  ✅ Lazy client wrappers: PASSED")
    
    # Test global service instances
    print("  Testing global service instances...")
    assert supabase_service_instance is not None, "Global service instance should exist"
    assert supabase_user_instance is not None, "Global user instance should exist"
    assert supabase_service_instance.use_service_role == True, "Global service should use service role"
    assert supabase_user_instance.use_service_role == False, "Global user should not use service role"
    print("  ✅ Global service instances: PASSED")
    
    print("\n🎉 All client creation tests PASSED!")
    return True

def test_client_attributes():
    """Test that created clients have expected attributes"""
    print("\n🔍 Testing client attributes...")
    
    from app.core.supabase import get_supabase_client
    
    client = get_supabase_client(use_service_role=True)
    
    # Check that client has expected methods
    assert hasattr(client, 'table'), "Client should have table method"
    assert hasattr(client, 'auth'), "Client should have auth method"
    assert callable(client.table), "Table method should be callable"
    print("  ✅ Client attributes: PASSED")
    
    return True

if __name__ == "__main__":
    try:
        test_client_creation()
        test_client_attributes()
        print("\n✅ All tests completed successfully!")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)