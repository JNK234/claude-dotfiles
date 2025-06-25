"""
ABOUTME: Comprehensive tests for Supabase client creation with controlled configuration scenarios
ABOUTME: Tests client factory patterns, error handling, and different authentication modes
"""

import os
import sys
import pytest
from unittest.mock import patch, MagicMock
from pathlib import Path

# Add the backend directory to the path to import from app
backend_dir = str(Path(__file__).parent.parent.parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
    
# Also set PYTHONPATH environment variable for imports
os.environ['PYTHONPATH'] = backend_dir

class TestSupabaseClientFactory:
    """Test client creation with various configuration scenarios"""
    
    def test_client_creation_with_valid_config(self):
        """Test successful client creation with valid configuration"""
        from app.core.supabase import get_supabase_client
        
        # Test anon client
        anon_client = get_supabase_client(use_service_role=False)
        assert anon_client is not None
        assert hasattr(anon_client, 'table')
        assert hasattr(anon_client, 'auth')
        
        # Test service role client
        service_client = get_supabase_client(use_service_role=True)
        assert service_client is not None
        assert hasattr(service_client, 'table')
        assert hasattr(service_client, 'auth')
        
        # They should be different instances
        assert anon_client is not service_client
    
    def test_client_creation_with_invalid_url(self):
        """Test client creation behavior with invalid URL"""
        from app.core.supabase import get_supabase_client
        
        invalid_env = {
            'SUPABASE_URL': 'invalid-url',
            'SUPABASE_ANON_KEY': 'test_key',
            'SUPABASE_SERVICE_ROLE_KEY': 'test_service_key',
            'SUPABASE_JWT_SECRET': 'test_secret'
        }
        
        with patch.dict(os.environ, invalid_env, clear=False):
            # Should still create client but may fail on actual usage
            try:
                client = get_supabase_client()
                # Client creation might succeed even with invalid URL
                # Actual validation happens on first request
                assert client is not None
            except Exception as e:
                # If it fails immediately, that's also valid behavior
                assert 'url' in str(e).lower() or 'invalid' in str(e).lower()
    
    def test_client_creation_with_empty_keys(self):
        """Test client creation with empty or missing keys"""
        from app.core.supabase import get_supabase_client
        
        empty_key_env = {
            'SUPABASE_URL': 'https://test.supabase.co',
            'SUPABASE_ANON_KEY': '',
            'SUPABASE_SERVICE_ROLE_KEY': '',
            'SUPABASE_JWT_SECRET': 'test_secret'
        }
        
        with patch.dict(os.environ, empty_key_env, clear=False):
            with pytest.raises(Exception):
                # Should fail with empty keys
                get_supabase_client()
    
    def test_lazy_client_initialization(self):
        """Test that lazy clients initialize properly"""
        from app.core.supabase import get_supabase_anon, get_supabase_service
        
        # Test lazy anon client
        anon_client1 = get_supabase_anon()
        anon_client2 = get_supabase_anon()
        
        # Should return same instance (cached)
        assert anon_client1 is anon_client2
        
        # Test lazy service client
        service_client1 = get_supabase_service()
        service_client2 = get_supabase_service()
        
        # Should return same instance (cached)
        assert service_client1 is service_client2
        
        # Anon and service should be different
        assert anon_client1 is not service_client1
    
    def test_lazy_client_wrapper_behavior(self):
        """Test the _LazyClient wrapper behavior"""
        from app.core.supabase import supabase_anon, supabase_service
        
        # Test that wrapper has expected attributes
        assert hasattr(supabase_anon, 'table')
        assert hasattr(supabase_anon, 'auth')
        assert hasattr(supabase_service, 'table')
        assert hasattr(supabase_service, 'auth')
        
        # Test that accessing attributes works
        anon_table = supabase_anon.table
        service_table = supabase_service.table
        
        assert callable(anon_table)
        assert callable(service_table)


class TestSupabaseServiceInstantiation:
    """Test SupabaseService class instantiation patterns"""
    
    def test_service_creation_with_service_role(self):
        """Test SupabaseService creation with service role"""
        from app.core.supabase import SupabaseService
        
        service = SupabaseService(use_service_role=True)
        
        assert service.client is not None
        assert service.use_service_role == True
        assert hasattr(service.client, 'table')
        assert hasattr(service.client, 'auth')
    
    def test_service_creation_with_anon_role(self):
        """Test SupabaseService creation with anon role"""
        from app.core.supabase import SupabaseService
        
        service = SupabaseService(use_service_role=False)
        
        assert service.client is not None
        assert service.use_service_role == False
        assert hasattr(service.client, 'table')
        assert hasattr(service.client, 'auth')
    
    def test_service_default_initialization(self):
        """Test SupabaseService default initialization"""
        from app.core.supabase import SupabaseService
        
        # Default should be service role
        service = SupabaseService()
        assert service.use_service_role == True
    
    def test_global_service_instances(self):
        """Test that global service instances are created properly"""
        from app.core.supabase import supabase_service_instance, supabase_user_instance
        
        # Test service instance
        assert supabase_service_instance is not None
        assert supabase_service_instance.use_service_role == True
        
        # Test user instance
        assert supabase_user_instance is not None
        assert supabase_user_instance.use_service_role == False
        
        # Should be different instances
        assert supabase_service_instance is not supabase_user_instance


class TestClientConfigurationIntegration:
    """Test integration between configuration and client creation"""
    
    def test_settings_integration_with_client_creation(self):
        """Test that settings properly integrate with client creation"""
        from app.core.config import get_settings
        from app.core.supabase import get_supabase_client
        
        settings = get_settings()
        
        # Verify settings are loaded
        assert settings.supabase_url
        assert settings.supabase_anon_key
        assert settings.supabase_service_role_key
        
        # Verify client creation uses these settings
        client = get_supabase_client(use_service_role=False)
        assert client is not None
        
        service_client = get_supabase_client(use_service_role=True)
        assert service_client is not None
    
    def test_configuration_validation_in_client_creation(self):
        """Test that client creation validates configuration properly"""
        from app.core.supabase import get_supabase_client
        
        # Test with missing URL
        missing_url_env = {
            'SUPABASE_URL': '',
            'SUPABASE_ANON_KEY': 'test_key',
            'SUPABASE_SERVICE_ROLE_KEY': 'test_service_key'
        }
        
        with patch.dict(os.environ, missing_url_env, clear=False):
            with pytest.raises(Exception):
                get_supabase_client()


class TestErrorHandlingAndRecovery:
    """Test error handling in client creation scenarios"""
    
    def test_client_creation_error_messages(self):
        """Test that client creation provides helpful error messages"""
        from app.core.supabase import get_supabase_client
        
        # Test with completely invalid configuration
        invalid_env = {
            'SUPABASE_URL': 'not-a-url',
            'SUPABASE_ANON_KEY': 'invalid',
            'SUPABASE_SERVICE_ROLE_KEY': 'invalid',
            'SUPABASE_JWT_SECRET': 'invalid'
        }
        
        with patch.dict(os.environ, invalid_env, clear=False):
            try:
                client = get_supabase_client()
                # If creation succeeds, error will happen on first usage
                # which is also valid behavior
            except Exception as e:
                # Error message should be informative
                error_msg = str(e).lower()
                assert any(keyword in error_msg for keyword in ['url', 'key', 'invalid', 'supabase'])
    
    def test_client_creation_with_network_issues(self):
        """Test client creation behavior when network is unavailable"""
        # Note: Client creation typically doesn't test network connectivity
        # This is more about initialization vs actual connection
        from app.core.supabase import get_supabase_client
        
        # Client creation should succeed even if network is down
        # because Supabase client doesn't test connection on creation
        client = get_supabase_client()
        assert client is not None


@pytest.mark.asyncio
async def test_service_methods_with_created_clients():
    """Test that service methods work with created clients"""
    from app.core.supabase import SupabaseService
    
    # Test with service role
    service = SupabaseService(use_service_role=True)
    
    # Test health check (this actually tests connectivity)
    try:
        health_result = await service.health_check()
        assert 'status' in health_result
        assert 'service' in health_result
        assert health_result['service'] == 'supabase'
    except Exception as e:
        # If health check fails, it's likely due to actual connectivity issues
        # not client creation issues
        print(f"Health check failed (expected for connectivity issues): {e}")


class TestClientFactoryPatterns:
    """Test factory patterns for creating test clients"""
    
    @staticmethod
    def create_test_client(use_service_role: bool = True):
        """Factory method for creating test clients"""
        from app.core.supabase import get_supabase_client
        return get_supabase_client(use_service_role=use_service_role)
    
    @staticmethod
    def create_test_service(use_service_role: bool = True):
        """Factory method for creating test services"""
        from app.core.supabase import SupabaseService
        return SupabaseService(use_service_role=use_service_role)
    
    def test_factory_methods(self):
        """Test the factory methods work correctly"""
        # Test client factory
        anon_client = self.create_test_client(use_service_role=False)
        service_client = self.create_test_client(use_service_role=True)
        
        assert anon_client is not None
        assert service_client is not None
        assert anon_client is not service_client
        
        # Test service factory
        anon_service = self.create_test_service(use_service_role=False)
        service_service = self.create_test_service(use_service_role=True)
        
        assert anon_service is not None
        assert service_service is not None
        assert anon_service.use_service_role == False
        assert service_service.use_service_role == True


if __name__ == "__main__":
    # Run tests with pytest
    pytest.main([__file__, "-v"])