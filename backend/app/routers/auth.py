"""
Authentication endpoints for Supabase JWT validation and user info retrieval.
"""
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    get_current_user_from_token,
    get_current_local_user,
    SupabaseUser,
    get_auth_user_id
)
from app.models.user import User
from app.schemas.user import User as UserSchema, UserCreate

router = APIRouter()

# --- Supabase Auth Integration Endpoints ---

@router.get("/me", response_model=UserSchema)
async def get_current_user_info(
    current_user: User = Depends(get_current_local_user)
) -> Any:
    """
    Get current authenticated user information
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        User: Current user information
    """
    return current_user

@router.post("/verify", response_model=Dict[str, Any])
async def verify_token(
    authorization: str = Header(...),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Verify a JWT token and return user information.
    
    If the user doesn't exist in the local database, it will be created.

    Args:
        authorization: Authorization header with JWT token (Bearer <token>)
        db: Database session

    Returns:
        Dict[str, Any]: User information and token status

    Raises:
        HTTPException: If token is invalid or improperly formatted
    """
    # Get user info from token
    supabase_user = await get_current_user_from_token(authorization)
    
    # Get or create user in local database
    db_user = await get_current_local_user(db, supabase_user)
    
    # Return user info and token status
    return {
        "valid": True,
        "user": {
            "id": str(db_user.id),
            "email": db_user.email,
            "name": db_user.name,
            "first_name": db_user.first_name,
            "last_name": db_user.last_name,
            "role": db_user.role,
            "is_active": db_user.is_active,
            "is_onboarded": db_user.is_onboarded,
            "created_at": db_user.created_at.isoformat() if db_user.created_at else None
        },
        "auth_provider": "supabase"
    }

@router.get("/user-id", response_model=Dict[str, str])
def get_user_id(
    authorization: str = Header(...)
) -> Dict[str, str]:
    """
    Get the user ID from the JWT token without any database access.
    Useful for lightweight authentication checks.
    
    Args:
        authorization: Authorization header with JWT token (Bearer <token>)
        
    Returns:
        Dict[str, str]: User ID from token
    """
    user_id = get_auth_user_id(authorization)
    return {"user_id": user_id}
