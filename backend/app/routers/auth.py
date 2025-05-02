"""
Authentication endpoints for user login and management
"""
from datetime import timedelta
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    create_access_token, 
    get_current_user, 
    get_password_hash, 
    verify_password,
    get_supabase_user,
    validate_supabase_jwt
)
from app.models.user import User
from app.schemas.user import Token, User as UserSchema, UserCreate, UserUpdate

router = APIRouter()

@router.post("/login", response_model=Token)
def login(
    db: Session = Depends(get_db), 
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    
    Args:
        db: Database session
        form_data: OAuth2 form data with username and password
        
    Returns:
        Token: JWT access token
        
    Raises:
        HTTPException: If login fails
    """
    # Find user by email
    user = db.query(User).filter(User.email == form_data.username).first()
    
    # Check if user exists and password is correct
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Inactive user"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=60 * 24 * 7)  # 7 days
    token = create_access_token(
        data={"sub": str(user.id)}, 
        expires_delta=access_token_expires
    )
    
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me", response_model=UserSchema)
def read_users_me(current_user: User = Depends(get_current_user)) -> Any:
    """
    Get current user information
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        User: Current user information
    """
    return current_user

@router.post("/register", response_model=UserSchema)
def register_user(
    user_in: UserCreate,
    db: Session = Depends(get_db)
) -> Any:
    """
    Register a new user
    
    Args:
        user_in: User data to register
        db: Database session
        
    Returns:
        User: Created user information
        
    Raises:
        HTTPException: If registration fails
    """
    # Check if user with the same email already exists
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Validate user data based on auth provider
    try:
        UserCreate.validate(user_in)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    # Create new user
    user = User(
        email=user_in.email,
        name=user_in.name,
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        hashed_password=get_password_hash(user_in.password) if user_in.password else "",
        is_active=user_in.is_active,
        role=user_in.role,
        is_onboarded=user_in.is_onboarded,
        auth_provider=user_in.auth_provider
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Create default profile for the user
    profile = UserProfile(
        user_id=user.id,
        profile_metadata={}
    )
    
    db.add(profile)
    db.commit()
    
    return user

@router.put("/me", response_model=UserSchema)
def update_user_me(
    user_in: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Update current user information
    
    Args:
        user_in: User data to update
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        User: Updated user information
    """
    # Update user fields
    if user_in.email is not None:
        current_user.email = user_in.email
    if user_in.name is not None:
        current_user.name = user_in.name
    if user_in.password is not None:
        current_user.hashed_password = get_password_hash(user_in.password)
    if user_in.is_active is not None:
        current_user.is_active = user_in.is_active
    
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    
    return current_user

# --- Supabase Auth Integration Endpoints ---

@router.get("/supabase/me", response_model=UserSchema)
def get_supabase_user_info(
    current_user: User = Depends(get_supabase_user)
) -> Any:
    """
    Get current Supabase user information
    
    Args:
        current_user: Current Supabase authenticated user
        
    Returns:
        User: Current user information
    """
    return current_user

# This endpoint was removed because user synchronization is now handled 
# automatically by Supabase triggers (handle_new_user) defined in the 
# migration/user_management.sql file.

@router.post("/supabase/verify", response_model=Dict[str, Any])
def verify_supabase_token(
    authorization: str = Header(...),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Verify a Supabase JWT token and return user information
    
    Args:
        authorization: Authorization header with Supabase JWT token
        db: Database session
        
    Returns:
        Dict[str, Any]: User information and token status
    """
    # Extract token from authorization header
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = authorization.replace("Bearer ", "")
    
    # Validate token and get payload
    payload = validate_supabase_jwt(token)
    
    # Create or get user (similar to get_supabase_user but with more info returned)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID in token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        # Check if user exists in our database
        user = db.query(User).filter(User.id == user_id).first()
        
        # User doesn't exist - create it
        if not user:
            email = payload.get("email")
            name = payload.get("user_metadata", {}).get("name", "")
            
            if not email:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Email not found in token",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            user = User(
                id=user_id,
                email=email,
                name=name,
                hashed_password="",  # No password needed as auth is handled by Supabase
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            user_created = True
        else:
            user_created = False
        
        # Return user info and token status
        return {
            "valid": True,
            "user": {
                "id": str(user.id),
                "email": user.email,
                "name": user.name,
                "role": user.role,
                "is_active": user.is_active,
                "created_at": user.created_at.isoformat() if user.created_at else None
            },
            "user_created": user_created,
            "token_exp": payload.get("exp"),
            "aud": payload.get("aud")
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing user: {str(e)}",
        )