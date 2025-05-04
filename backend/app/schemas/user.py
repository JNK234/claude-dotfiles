"""
Pydantic schemas for user data validation and serialization
"""
from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

# Shared properties
class UserBase(BaseModel):
    """Base User schema with common properties"""
    email: EmailStr
    name: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: bool = True
    role: str = "doctor"
    is_onboarded: bool = False
    auth_provider: str = "local"
    subscription_tier: str = "free" # Added subscription tier

# Properties to receive via API on creation
class UserCreate(UserBase):
    """Schema for creating a new user"""
    password: Optional[str] = Field(None, min_length=8)
    
    @classmethod
    def validate(cls, obj):
        # Validate password is required for local auth
        if obj.auth_provider == "local" and not obj.password:
            raise ValueError("Password is required for local authentication")
        return obj

# Properties to receive via API on user profile update
class ProfileUpdate(BaseModel):
    """Schema for updating user profile information"""
    name: Optional[str] = None # Maps to User.name
    job_title: Optional[str] = None # Maps to UserProfile.job_title

# Schema for user profile (read-only view)
class UserProfileBase(BaseModel):
    """Base schema for user profile data (read-only fields)"""
    # user_id: UUID # Removed as it's implicit in the relationship
    phone_number: Optional[str] = None
    company_name: Optional[str] = None
    job_title: Optional[str] = None # This will be the 'title' field
    country: Optional[str] = None
    timezone: Optional[str] = None
    language: Optional[str] = None
    avatar_url: Optional[str] = None
    profile_metadata: Dict[str, Any] = {}
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True

# Properties to return via API (basic user info)
class User(UserBase):
    """Schema for user returned from API (basic info)"""
    id: UUID
    created_at: datetime # Keep created_at for user account creation date

    class Config:
        from_attributes = True

# Combined schema for returning full user profile details
class UserProfileResponse(User):
    """Schema for returning full user profile details, including nested profile"""
    profile: Optional[UserProfileBase] = None # Expect nested profile object

    class Config:
        from_attributes = True # Enable ORM mode

# Schema for user statistics
class UserStats(BaseModel):
    """Schema for user statistics"""
    cases_processed: int
    subscription_tier: str

# Properties for token authentication
class Token(BaseModel):
    """Schema for JWT token"""
    access_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    """Schema for JWT token payload"""
    sub: str
    exp: datetime

# Supabase user metadata
class SupabaseUserMetadata(BaseModel):
    """Schema for Supabase user metadata"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    provider: Optional[str] = None

# Supabase user
class SupabaseUser(BaseModel):
    """Schema for Supabase user"""
    id: UUID
    email: EmailStr
    user_metadata: Optional[SupabaseUserMetadata] = None
    app_metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
