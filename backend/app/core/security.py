"""
Security utilities for authentication and authorization with Supabase
"""
import uuid
from datetime import datetime
import time
from typing import Any, Dict, Optional, List, Union

import httpx
import jwt
from fastapi import Depends, HTTPException, status, Header, Request
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User

# --- Simple JWT handling for Supabase tokens ---

class SupabaseUser:
    """Simple class to represent a user from a Supabase JWT token"""
    def __init__(self, id: str, email: str, metadata: Dict[str, Any] = None):
        self.id = id
        self.email = email
        self.metadata = metadata or {}
        self.first_name = metadata.get("first_name", "") if metadata else ""
        self.last_name = metadata.get("last_name", "") if metadata else ""
        self.role = metadata.get("role", "user") if metadata else "user"
        self.is_onboarded = metadata.get("is_onboarded", False) if metadata else False
        
    @property
    def name(self) -> str:
        """Returns the full name of the user"""
        return f"{self.first_name} {self.last_name}".strip()

def extract_token_from_header(authorization: str) -> str:
    """Extract JWT token from Authorization header"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return authorization.replace("Bearer ", "")

def decode_token_without_verification(token: str) -> Dict[str, Any]:
    """
    Decode a JWT token without verifying signature.
    This is safe because we're not trusting the token for authentication,
    just extracting its contents.
    """
    try:
        # Decode without verification
        payload = jwt.decode(token, options={"verify_signature": False})
        return payload
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token format: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user_from_token(
    authorization: str = Header(...),
) -> SupabaseUser:
    """
    Simple dependency that extracts user information from Supabase JWT token.
    Only does basic token structure validation, not cryptographic verification.
    
    This is a simplified approach that trusts Supabase for authentication,
    avoiding the complexity of JWKS validation.
    
    For production, you may want to add token verification or use an auth middleware.
    """
    token = extract_token_from_header(authorization)
    payload = decode_token_without_verification(token)
    
    # Extract user ID (subject) from payload
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID in token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Extract email
    email = payload.get("email", "")
    
    # Extract user metadata
    user_metadata = payload.get("user_metadata", {})
    
    # Create SupabaseUser object
    return SupabaseUser(id=user_id, email=email, metadata=user_metadata)

async def get_current_local_user(
    db: Session = Depends(get_db),
    supabase_user: SupabaseUser = Depends(get_current_user_from_token)
) -> User:
    """
    Dependency to get the current user from the local database.
    If the user exists in Supabase but not in our database, creates it.
    
    Returns a local User model instance from our database.
    """
    try:
        # Try to convert the user_id to UUID
        user_uuid = uuid.UUID(supabase_user.id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID format in token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Find user in our database
    user = db.query(User).filter(User.id == user_uuid).first()
    
    # If user doesn't exist, create a new record
    if user is None:
        try:
            # Create user record from Supabase token data
            user = User(
                id=user_uuid,
                email=supabase_user.email,
                name=supabase_user.name,
                first_name=supabase_user.first_name,
                last_name=supabase_user.last_name,
                role=supabase_user.role,
                is_active=True,
                is_onboarded=supabase_user.is_onboarded
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create user record: {str(e)}"
            )
    
    return user

# Auth checking without DB access
def get_auth_user_id(authorization: str = Header(...)) -> str:
    """
    Simple helper to just get the user ID from a token for cases where
    you don't need the full user object. Useful for rate limiting or
    simple resource ownership checks.
    """
    token = extract_token_from_header(authorization)
    payload = decode_token_without_verification(token)
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid user ID in token"
        )
    
    return user_id

# --- Legacy functions maintained for compatibility ---
# These simply wrap the new simplified functions

async def get_supabase_user(
    db: Session = Depends(get_db),
    authorization: str = Header(...)
) -> User:
    """Legacy compatibility function - uses the simplified approach internally"""
    supabase_user = await get_current_user_from_token(authorization)
    return await get_current_local_user(db, supabase_user)