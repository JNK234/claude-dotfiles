"""
Supabase client and service layer for direct database operations
"""
import logging
from typing import Any, Dict, List, Optional
from uuid import UUID

from supabase import Client, create_client

from app.core.config import get_settings

logger = logging.getLogger(__name__)

# Get settings
settings = get_settings()

# Create Supabase clients
def get_supabase_client(use_service_role: bool = False) -> Client:
    """
    Get Supabase client with appropriate key
    
    Args:
        use_service_role: If True, use service role key (bypasses RLS)
                         If False, use anon key (subject to RLS)
    """
    key = settings.supabase_service_role_key if use_service_role else settings.supabase_anon_key
    return create_client(settings.supabase_url, key)

# Lazy client initialization
_supabase_anon = None
_supabase_service = None

def get_supabase_anon() -> Client:
    """Get anonymous Supabase client (lazy initialization)"""
    global _supabase_anon
    if _supabase_anon is None:
        _supabase_anon = get_supabase_client(use_service_role=False)
    return _supabase_anon

def get_supabase_service() -> Client:
    """Get service role Supabase client (lazy initialization)"""
    global _supabase_service
    if _supabase_service is None:
        _supabase_service = get_supabase_client(use_service_role=True)
    return _supabase_service

# Backward compatibility - module-level client access
class _LazyClient:
    """Lazy client wrapper for backward compatibility"""
    def __init__(self, use_service_role: bool):
        self._use_service_role = use_service_role
        self._client = None
    
    def __getattr__(self, name):
        if self._client is None:
            self._client = get_supabase_client(use_service_role=self._use_service_role)
        return getattr(self._client, name)

# Create lazy clients that behave like the original global clients
supabase_anon = _LazyClient(use_service_role=False)
supabase_service = _LazyClient(use_service_role=True)


class SupabaseService:
    """Service layer for Supabase operations"""
    
    def __init__(self, use_service_role: bool = True):
        """
        Initialize Supabase service
        
        Args:
            use_service_role: Whether to use service role (bypasses RLS)
        """
        self.client = get_supabase_client(use_service_role)
        self.use_service_role = use_service_role
    
    async def get_user_cases(self, user_id: str, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Get cases for a specific user"""
        try:
            response = self.client.table("cases").select("*").eq("user_id", user_id).range(offset, offset + limit - 1).execute()
            return response.data if response.data else []
        except Exception as e:
            logger.error(f"Error fetching user cases: {e}")
            raise
    
    async def create_case(self, user_id: str, case_text: str) -> Dict[str, Any]:
        """Create a new case"""
        try:
            response = self.client.table("cases").insert({
                "user_id": user_id,
                "case_text": case_text,
                "current_stage": "initial",
                "is_complete": False
            }).execute()
            
            if response.data:
                return response.data[0]
            else:
                raise Exception("Failed to create case")
        except Exception as e:
            logger.error(f"Error creating case: {e}")
            raise
    
    async def get_case(self, case_id: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Get a specific case"""
        try:
            query = self.client.table("cases").select("*").eq("id", case_id)
            
            # Add user filter if not using service role
            if not self.use_service_role and user_id:
                query = query.eq("user_id", user_id)
            
            response = query.execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Error fetching case: {e}")
            raise
    
    async def update_case(self, case_id: str, updates: Dict[str, Any], user_id: Optional[str] = None) -> Dict[str, Any]:
        """Update a case"""
        try:
            query = self.client.table("cases").update(updates).eq("id", case_id)
            
            # Add user filter if not using service role
            if not self.use_service_role and user_id:
                query = query.eq("user_id", user_id)
            
            response = query.execute()
            
            if response.data:
                return response.data[0]
            else:
                raise Exception("Failed to update case or case not found")
        except Exception as e:
            logger.error(f"Error updating case: {e}")
            raise
    
    async def delete_case(self, case_id: str, user_id: Optional[str] = None) -> bool:
        """Delete a case"""
        try:
            query = self.client.table("cases").delete().eq("id", case_id)
            
            # Add user filter if not using service role
            if not self.use_service_role and user_id:
                query = query.eq("user_id", user_id)
            
            response = query.execute()
            return len(response.data) > 0
        except Exception as e:
            logger.error(f"Error deleting case: {e}")
            raise
    
    async def get_case_messages(self, case_id: str, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Get messages for a case"""
        try:
            response = (
                self.client.table("messages")
                .select("*")
                .eq("case_id", case_id)
                .order("created_at", desc=False)
                .range(offset, offset + limit - 1)
                .execute()
            )
            return response.data if response.data else []
        except Exception as e:
            logger.error(f"Error fetching case messages: {e}")
            raise
    
    async def create_message(self, case_id: str, role: str, content: str) -> Dict[str, Any]:
        """Create a new message"""
        try:
            response = self.client.table("messages").insert({
                "case_id": case_id,
                "role": role,
                "content": content
            }).execute()
            
            if response.data:
                return response.data[0]
            else:
                raise Exception("Failed to create message")
        except Exception as e:
            logger.error(f"Error creating message: {e}")
            raise
    
    async def get_stage_results(self, case_id: str) -> List[Dict[str, Any]]:
        """Get stage results for a case"""
        try:
            response = (
                self.client.table("stage_results")
                .select("*")
                .eq("case_id", case_id)
                .order("created_at", desc=False)
                .execute()
            )
            return response.data if response.data else []
        except Exception as e:
            logger.error(f"Error fetching stage results: {e}")
            raise
    
    async def create_stage_result(self, case_id: str, stage_name: str, result: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        """Create a stage result"""
        try:
            data = {
                "case_id": case_id,
                "stage_name": stage_name,
                "result": result,
                "is_approved": kwargs.get("is_approved", False),
                "token_usage": kwargs.get("token_usage"),
                "cost_usd": kwargs.get("cost_usd"),
                "provider": kwargs.get("provider"),
                "model_name": kwargs.get("model_name")
            }
            
            # Remove None values
            data = {k: v for k, v in data.items() if v is not None}
            
            response = self.client.table("stage_results").insert(data).execute()
            
            if response.data:
                return response.data[0]
            else:
                raise Exception("Failed to create stage result")
        except Exception as e:
            logger.error(f"Error creating stage result: {e}")
            raise
    
    async def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user profile"""
        try:
            response = self.client.table("profiles").select("*").eq("id", user_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Error fetching user profile: {e}")
            raise
    
    async def create_user_profile(self, user_id: str, email: str, **kwargs) -> Dict[str, Any]:
        """Create user profile"""
        try:
            data = {
                "id": user_id,
                "email": email,
                "first_name": kwargs.get("first_name", ""),
                "last_name": kwargs.get("last_name", ""),
                "role": kwargs.get("role", "doctor"),
                "is_onboarded": kwargs.get("is_onboarded", False)
            }
            
            response = self.client.table("profiles").insert(data).execute()
            
            if response.data:
                return response.data[0]
            else:
                raise Exception("Failed to create user profile")
        except Exception as e:
            logger.error(f"Error creating user profile: {e}")
            raise
    
    async def update_user_profile(self, user_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update user profile"""
        try:
            response = self.client.table("profiles").update(updates).eq("id", user_id).execute()
            
            if response.data:
                return response.data[0]
            else:
                raise Exception("Failed to update user profile or profile not found")
        except Exception as e:
            logger.error(f"Error updating user profile: {e}")
            raise
    
    async def health_check(self) -> Dict[str, Any]:
        """Check Supabase connection health"""
        try:
            # Simple query to test connection
            response = self.client.table("profiles").select("id").limit(1).execute()
            return {
                "status": "healthy",
                "service": "supabase",
                "connection": "successful"
            }
        except Exception as e:
            logger.error(f"Supabase health check failed: {e}")
            return {
                "status": "unhealthy",
                "service": "supabase",
                "error": str(e),
                "connection": "failed"
            }


# Global service instances
supabase_service_instance = SupabaseService(use_service_role=True)
supabase_user_instance = SupabaseService(use_service_role=False)


# Helper functions for common operations
async def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Get user by email from profiles table"""
    try:
        response = supabase_service.table("profiles").select("*").eq("email", email).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        logger.error(f"Error fetching user by email: {e}")
        return None


async def verify_case_ownership(case_id: str, user_id: str) -> bool:
    """Verify if user owns the case"""
    try:
        response = supabase_service.table("cases").select("id").eq("id", case_id).eq("user_id", user_id).execute()
        return len(response.data) > 0
    except Exception as e:
        logger.error(f"Error verifying case ownership: {e}")
        return False


# Export commonly used items
__all__ = [
    "get_supabase_client",
    "supabase_anon",
    "supabase_service", 
    "SupabaseService",
    "supabase_service_instance",
    "supabase_user_instance",
    "get_user_by_email",
    "verify_case_ownership"
] 