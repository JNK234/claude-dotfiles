"""
Authentication endpoints for Supabase JWT validation, user info retrieval, and password reset.
"""
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    get_current_user,
    get_current_user_profile,
    SupabaseUser,
    verify_supabase_jwt
)
from app.models.user import User
from app.schemas.user import ( # Import specific schemas
    User as UserSchema,
    UserCreate
    # Removed ForgotPasswordRequest, ResetPasswordRequest
)
# Removed user_service import as it's not used here anymore

router = APIRouter()

# --- Supabase Auth Integration Endpoints ---

@router.get("/me", response_model=Dict[str, Any])
async def get_current_user_info(
    current_user: SupabaseUser = Depends(get_current_user)
) -> Any:
    """
    Get current authenticated user information

    Args:
        current_user: Current authenticated user

    Returns:
        Dict[str, Any]: Current user information from Supabase
    """
    profile = await get_current_user_profile(current_user)
    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
        "profile": profile
    }

@router.post("/verify", response_model=Dict[str, Any])
async def verify_token(
    authorization: str = Header(...)
) -> Dict[str, Any]:
    """
    Verify a JWT token and return user information from Supabase.

    Args:
        authorization: Authorization header with JWT token (Bearer <token>)

    Returns:
        Dict[str, Any]: User information and token status

    Raises:
        HTTPException: If token is invalid or improperly formatted
    """
    try:
        # Extract token from authorization header
        if not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authorization header format"
            )
        
        token = authorization.split(" ")[1]
        
        # Verify JWT token
        payload = verify_supabase_jwt(token)
        if payload is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )

        # Return user info and token status
        return {
            "valid": True,
            "user": {
                "id": payload.get("sub"),
                "email": payload.get("email"),
                "role": payload.get("role", "authenticated"),
                "aud": payload.get("aud"),
                "exp": payload.get("exp"),
                "iat": payload.get("iat")
            },
            "auth_provider": "supabase"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token verification failed"
        )

@router.get("/user-id", response_model=Dict[str, str])
async def get_user_id(
    current_user: SupabaseUser = Depends(get_current_user)
) -> Dict[str, str]:
    """
    Get the user ID from the JWT token without any database access.
    Useful for lightweight authentication checks.

    Args:
        current_user: Current authenticated user from Supabase

    Returns:
        Dict[str, str]: User ID from token
    """
    return {"user_id": current_user.id}

# Removed Password Reset Endpoints as Supabase handles this flow
