"""
Security utilities for authentication and authorization with Supabase
"""
import uuid
from datetime import datetime, timedelta
import time
from typing import Any, Dict, Optional, List, Union

import httpx # For fetching JWKS
# Use python-jose for JWT operations as it's already a dependency
from jose import jwt as jose_jwt
from jose import jwk as jose_jwk
from jose.exceptions import JOSEError, ExpiredSignatureError as JoseExpiredSignatureError, JWTError as JoseJWTError, JWKError as JoseJWKError, JWTClaimsError as JoseJWTClaimsError
from fastapi import Depends, HTTPException, status, Header, Request
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.supabase_client import supabase
from app.models.user import User

# --- JWT handling for Supabase tokens (HS256 with shared secret) ---

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

def verify_jwt(token: str) -> Dict[str, Any]:
    """
    Verify a JWT token using HS256 algorithm with shared secret.
    
    Args:
        token: JWT token to verify
        
    Returns:
        Dict[str, Any]: Decoded token claims
        
    Raises:
        HTTPException: If token is invalid
    """
    try:
        if not settings.SUPABASE_JWT_SECRET:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="JWT verification key not configured"
            )
            
        # Decode using HS256 and the shared secret
        payload = jose_jwt.decode(
            token=token,
            key=settings.SUPABASE_JWT_SECRET,
            algorithms=settings.SUPABASE_JWT_ALGORITHMS,
            audience=settings.SUPABASE_JWT_AUDIENCE,
            # Issuer validation optional but recommended
            # options={"verify_iss": True} if settings.SUPABASE_ISSUER else {}
        )
        
        return payload
        
    except JoseExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except (JoseJWTError, JoseJWKError, JoseJWTClaimsError) as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Error validating token: {str(e)}"
        )

def extract_token_from_header(authorization: str = Header(None)) -> str:
    """
    Extract JWT token from Authorization header
    
    Args:
        authorization: Authorization header
        
    Returns:
        str: JWT token
        
    Raises:
        HTTPException: If Authorization header is missing or invalid
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header is missing",
            headers={"WWW-Authenticate": "Bearer"}
        )
        
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication scheme",
            headers={"WWW-Authenticate": "Bearer"}
        )
        
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is missing",
            headers={"WWW-Authenticate": "Bearer"}
        )
        
    return token

async def get_supabase_user(authorization: str = Header(None)) -> SupabaseUser:
    """
    Get user from Supabase JWT token
    
    Args:
        authorization: Authorization header with bearer token
        
    Returns:
        SupabaseUser: User information from token
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    # Extract and verify the token
    token = extract_token_from_header(authorization)
    payload = verify_jwt(token)
    
    # The sub claim contains the user ID in Supabase tokens
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found in token"
        )
    
    # Fetch user profile from Supabase
    try:
        response = supabase.table('profiles').select('*').eq('id', user_id).execute()
        
        if not response.data or len(response.data) == 0:
            # If profile is not found for an authenticated user, this indicates missing essential data.
            # Consider logging this event for investigation if you have logging setup.
            # e.g., logger.warning(f"Profile not found for authenticated user ID: {user_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User profile not found for ID: {user_id}. Please ensure profile is created and RLS allows access."
            )
        
        profile = response.data[0]
        
        # Prioritize email from JWT as it's authoritative for the session.
        email_from_jwt = payload.get("email", "")
        # Note: The profiles table doesn't have email field - email comes from JWT
        
        # Extract full name and split it if needed
        full_name = profile.get("full_name", "")
        username = profile.get("username", "")
        
        # Split full_name into first and last name for compatibility
        if full_name:
            name_parts = full_name.strip().split(' ', 1)
            first_name = name_parts[0] if name_parts else ""
            last_name = name_parts[1] if len(name_parts) > 1 else ""
        else:
            first_name = ""
            last_name = ""

        # Role extraction: Check JWT 'role', then default to 'user'
        jwt_role = payload.get("role") 
        final_role = jwt_role if jwt_role and jwt_role != "authenticated" else "user"

        user_metadata = {
            "first_name": first_name,
            "last_name": last_name,
            "full_name": full_name,
            "username": username,
            "avatar_url": profile.get("avatar_url", ""),
            "website": profile.get("website", ""),
            "is_onboarded": profile.get("is_onboarded", False),  # Default False if not in schema
            "role": final_role
            # Add any other relevant fields from 'profile' or 'payload' (JWT)
        }

        return SupabaseUser(
            id=user_id,
            email=email_from_jwt,
            metadata=user_metadata
        )
    except HTTPException: # Re-raise HTTPExceptions directly to preserve status code and detail
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching user profile: {str(e)}"
        )

async def get_supabase_user_from_token(token: str) -> Optional[SupabaseUser]:
    """
    Get user from a raw JWT token (for cases where you already have the token)
    
    Args:
        token: JWT token
        
    Returns:
        Optional[SupabaseUser]: User information from token, None if invalid
    """
    try:
        payload = verify_jwt(token)
        
        # The sub claim contains the user ID in Supabase tokens
        user_id = payload.get("sub")
        if not user_id:
            return None
        
        # Extract email
        email = payload.get("email", "")
        
        # Extract user metadata
        user_metadata = payload.get("user_metadata", {})
        
        # Create SupabaseUser object without fetching from database
        return SupabaseUser(id=user_id, email=email, metadata=user_metadata)
        
    except HTTPException:
        return None
    except Exception:
        return None

def get_auth_user_id(authorization: str = Header(None)) -> str:
    """
    Get user ID from JWT token without fetching user profile
    
    Args:
        authorization: Authorization header with bearer token
        
    Returns:
        str: User ID from token
        
    Raises:
        HTTPException: If token is invalid or user ID not found
    """
    # Extract and verify the token
    token = extract_token_from_header(authorization)
    payload = verify_jwt(token)
    
    # The sub claim contains the user ID in Supabase tokens
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found in token"
        )
    
    return user_id

# --- Legacy functions maintained for compatibility ---
# These simply wrap the new simplified functions

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
    payload = verify_jwt(token)
    
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