"""
User model for authentication and user management
"""
import uuid
from datetime import datetime
# Removed Optional import as it's no longer needed here

from sqlalchemy import Column, String, DateTime, Boolean, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base

class User(Base):
    """
    User model for storing doctor information and authentication
    """
    __tablename__ = "users"

    # Primary key using UUID
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # User identity
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    
    # Authentication
    hashed_password = Column(String, nullable=True)  # Can be null for external auth
    
    # Role and status
    is_active = Column(Boolean, default=True)
    role = Column(String, default="doctor")
    is_onboarded = Column(Boolean, default=False)
    
    # Auth provider
    auth_provider = Column(String, default="local")  # "local", "google", "supabase"

    # Account details
    subscription_tier = Column(String, default="free", nullable=False) # e.g., 'free', 'pro', 'enterprise'
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Removed Password Reset Fields

    # Relationships
    profile = relationship("UserProfile", back_populates="user", uselist=False)

class UserProfile(Base):
    """
    User profile model for storing additional user information
    """
    __tablename__ = "user_profiles"
    
    # Primary key using UUID
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # User foreign key
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True)
    
    # Profile information
    phone_number = Column(String, nullable=True)
    company_name = Column(String, nullable=True)
    job_title = Column(String, nullable=True)
    country = Column(String, nullable=True)
    timezone = Column(String, nullable=True)
    language = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    
    # Metadata
    profile_metadata = Column(JSON, default={})
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="profile")
