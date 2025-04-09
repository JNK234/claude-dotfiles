"""
User model for authentication and user management
"""
import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

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
    
    # Authentication
    hashed_password = Column(String, nullable=False)
    
    # Role and status
    is_active = Column(Boolean, default=True)
    role = Column(String, default="doctor")
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())