"""
Case model for storing patient cases and related data
"""
import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base

class Case(Base):
    """
    Case model for storing patient case information
    """
    __tablename__ = "cases"

    # Primary key using UUID
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign key to user (doctor)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    user = relationship("User", backref="cases")
    
    # Case content
    case_text = Column(Text, nullable=False)
    current_stage = Column(String, nullable=False, default="initial")
    is_complete = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships with cascade delete
    stage_results = relationship("StageResult", back_populates="case", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="case", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="case", cascade="all, delete-orphan")

class StageResult(Base):
    """
    StageResult model for storing results of each diagnosis stage
    """
    __tablename__ = "stage_results"

    # Primary key using UUID
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign key to case
    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.id"), nullable=False)
    case = relationship("Case", back_populates="stage_results") # Use back_populates

    # Stage information
    stage_name = Column(String, nullable=False)
    result = Column(JSON, nullable=False, default={})
    is_approved = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Message(Base):
    """
    Message model for storing chat messages between doctor and AI
    """
    __tablename__ = "messages"

    # Primary key using UUID
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign key to case
    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.id"), nullable=False)
    case = relationship("Case", back_populates="messages") # Use back_populates

    # Message content
    role = Column(String, nullable=False)  # "user" or "assistant"
    content = Column(Text, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Report(Base):
    """
    Report model for storing generated PDF reports
    """
    __tablename__ = "reports"

    # Primary key using UUID
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign key to case
    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.id"), nullable=False)
    case = relationship("Case", back_populates="reports") # Use back_populates

    # Report information
    file_path = Column(String, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
