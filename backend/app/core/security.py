"""
Security utilities for authentication and authorization
"""
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User

# Password context for hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against a hash
    
    Args:
        plain_password: Plain text password
        hashed_password: Hashed password
        
    Returns:
        bool: True if password matches hash
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    Hash a password
    
    Args:
        password: Plain text password
        
    Returns:
        str: Hashed password
    """
    return pwd_context.hash(password)

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT token
    
    Args:
        data: Data to encode in token
        expires_delta: Optional expiration time
        
    Returns:
        str: JWT token
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    """
    Get the current user from a JWT token
    
    Args:
        db: Database session
        token: JWT token
        
    Returns:
        User: Current user
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        try:
            user_id = uuid.UUID(user_id)
        except ValueError:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

# Supabase Auth Validation
def validate_supabase_jwt(token: str) -> Dict[str, Any]:
    """
    Validate a Supabase JWT token
    
    Args:
        token: Supabase JWT token
        
    Returns:
        Dict[str, Any]: Decoded token payload
        
    Raises:
        HTTPException: If token is invalid
    """
    # This is a placeholder - in a real implementation, you would:
    # 1. Fetch the Supabase JWT signing keys (JWKS)
    # 2. Validate the token signature
    # 3. Check expiration and other claims
    # 
    # For now, we'll assume the token is valid if it can be decoded
    # In production, you should use a proper JWT validation library
    try:
        # Just decode without verification for now
        # In production, you would verify using Supabase public key
        payload = jwt.decode(token, options={"verify_signature": False})
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_supabase_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    """
    Get or create a user from a Supabase JWT token
    
    Args:
        db: Database session
        token: Supabase JWT token
        
    Returns:
        User: Current user
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    # Validate the token and extract user info
    payload = validate_supabase_jwt(token)
    
    # Extract user ID from the Supabase token
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID in token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Try to find the user in our database
    try:
        user_uuid = uuid.UUID(user_id)
        user = db.query(User).filter(User.id == user_uuid).first()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID format",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # If user doesn't exist in our database, create it
    if not user:
        # Extract user data from token
        email = payload.get("email")
        name = payload.get("name", "")
        
        # In a real implementation, you should validate this data
        if not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email not found in token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Create a new user record
        user = User(
            id=user_uuid,
            email=email,
            name=name,
            hashed_password="",  # No password needed as auth is handled by Supabase
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    return user