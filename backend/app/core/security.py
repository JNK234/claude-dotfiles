"""
Authentication and security utilities for Supabase integration
"""
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel

from app.core.config import get_settings
from app.core.supabase import get_user_by_email, supabase_service_instance

logger = logging.getLogger(__name__)

# Get settings
settings = get_settings()

# HTTP Bearer scheme for JWT tokens
security = HTTPBearer()


class SupabaseUser(BaseModel):
    """Supabase user model"""
    id: str
    email: str
    role: str = "authenticated"
    app_metadata: Dict[str, Any] = {}
    user_metadata: Dict[str, Any] = {}
    aud: str = "authenticated"
    exp: Optional[int] = None
    iat: Optional[int] = None


class TokenData(BaseModel):
    """Token data model"""
    email: Optional[str] = None
    user_id: Optional[str] = None


def verify_supabase_jwt(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify Supabase JWT token
    
    Args:
        token: JWT token string
        
    Returns:
        Decoded token payload or None if invalid
    """
    try:
        # Decode JWT token using Supabase JWT secret
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated"
        )
        
        # Check if token is expired
        exp = payload.get("exp")
        if exp and datetime.utcnow().timestamp() > exp:
            logger.warning("Token has expired")
            return None
        
        return payload
        
    except JWTError as e:
        logger.error(f"JWT verification failed: {e}")
        return None
    except Exception as e:
        logger.error(f"Token verification error: {e}")
        return None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> SupabaseUser:
    """
    Get current authenticated user from Supabase JWT token
    
    Args:
        credentials: HTTP authorization credentials
        
    Returns:
        SupabaseUser object
        
    Raises:
        HTTPException: If authentication fails
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Extract token from credentials
        token = credentials.credentials
        
        # Verify JWT token
        payload = verify_supabase_jwt(token)
        if payload is None:
            raise credentials_exception
        
        # Extract user information from token
        user_id = payload.get("sub")
        email = payload.get("email")
        role = payload.get("role", "authenticated")
        
        if user_id is None or email is None:
            raise credentials_exception
        
        # Create SupabaseUser object
        user = SupabaseUser(
            id=user_id,
            email=email,
            role=role,
            app_metadata=payload.get("app_metadata", {}),
            user_metadata=payload.get("user_metadata", {}),
            aud=payload.get("aud", "authenticated"),
            exp=payload.get("exp"),
            iat=payload.get("iat")
        )
        
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        raise credentials_exception


async def get_current_user_profile(
    current_user: SupabaseUser = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get current user's profile from Supabase database
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        User profile data
        
    Raises:
        HTTPException: If profile not found
    """
    try:
        # Get user profile from Supabase
        profile = await supabase_service_instance.get_user_profile(current_user.id)
        
        if not profile:
            # Profile doesn't exist, create a basic one
            profile = await supabase_service_instance.create_user_profile(
                user_id=current_user.id,
                email=current_user.email,
                role=current_user.user_metadata.get("role", "doctor")
            )
        
        return profile
        
    except Exception as e:
        logger.error(f"Error fetching user profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch user profile"
        )


def verify_user_access(user_id: str, resource_user_id: str) -> bool:
    """
    Verify if user has access to a resource
    
    Args:
        user_id: Current user ID
        resource_user_id: User ID associated with the resource
        
    Returns:
        True if user has access, False otherwise
    """
    return user_id == resource_user_id


async def verify_case_access(
    case_id: str, 
    current_user: SupabaseUser = Depends(get_current_user)
) -> bool:
    """
    Verify if current user has access to a specific case
    
    Args:
        case_id: Case ID to check
        current_user: Current authenticated user
        
    Returns:
        True if user has access, False otherwise
    """
    try:
        case = await supabase_service_instance.get_case(case_id)
        if not case:
            return False
        
        return case["user_id"] == current_user.id
        
    except Exception as e:
        logger.error(f"Error verifying case access: {e}")
        return False


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create JWT access token (for testing/development)
    Note: In production, tokens should be created by Supabase
    
    Args:
        data: Data to encode in token
        expires_delta: Token expiration time
        
    Returns:
        Encoded JWT token
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.supabase_jwt_secret, algorithm="HS256")
    return encoded_jwt




# Health check function
def get_auth_health() -> Dict[str, Any]:
    """Get authentication system health status"""
    try:
        # Test JWT secret is available
        if not settings.supabase_jwt_secret:
            return {
                "status": "unhealthy",
                "service": "authentication",
                "error": "JWT secret not configured",
                "connection": "failed"
            }
        
        # Test Supabase URL is available
        if not settings.supabase_url:
            return {
                "status": "unhealthy", 
                "service": "authentication",
                "error": "Supabase URL not configured",
                "connection": "failed"
            }
        
        return {
            "status": "healthy",
            "service": "authentication",
            "jwt_configured": True,
            "supabase_configured": True,
            "connection": "successful"
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "service": "authentication",
            "error": str(e),
            "connection": "failed"
        }


# Export commonly used items
__all__ = [
    "SupabaseUser",
    "TokenData",
    "verify_supabase_jwt",
    "get_current_user",
    "get_current_user_profile", 
    "verify_user_access",
    "verify_case_access",
    "create_access_token",
    "get_supabase_user",  # Legacy compatibility
    "get_auth_health",
    "security"
]