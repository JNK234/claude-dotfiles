"""
Pydantic schemas for user data validation and serialization
"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

# Shared properties
class UserBase(BaseModel):
    """Base User schema with common properties"""
    email: EmailStr
    name: str
    is_active: bool = True
    role: str = "doctor"

# Properties to receive via API on creation
class UserCreate(UserBase):
    """Schema for creating a new user"""
    password: str = Field(..., min_length=8)

# Properties to receive via API on update
class UserUpdate(BaseModel):
    """Schema for updating an existing user"""
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    password: Optional[str] = Field(None, min_length=8)
    is_active: Optional[bool] = None

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