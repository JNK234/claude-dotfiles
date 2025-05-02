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

# Properties to receive via API on update
class UserUpdate(BaseModel):
    """Schema for updating an existing user"""
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    password: Optional[str] = Field(None, min_length=8)
    is_active: Optional[bool] = None

# Schema for user profile
class UserProfile(BaseModel):
    """Schema for user profile data"""
    user_id: UUID
    phone_number: Optional[str] = None
    company_name: Optional[str] = None
    job_title: Optional[str] = None
    country: Optional[str] = None
    timezone: Optional[str] = None
    language: Optional[str] = None
    avatar_url: Optional[str] = None
    profile_metadata: Dict[str, Any] = {}
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Properties to return via API
class User(UserBase):
    """Schema for user returned from API"""
    id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True

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