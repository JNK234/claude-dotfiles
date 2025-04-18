"""
Pydantic schemas for case data validation and serialization
"""
from datetime import datetime
from typing import Dict, List, Optional, Any
from uuid import UUID

from pydantic import BaseModel, Field

# Case schemas
class CaseBase(BaseModel):
    """Base Case schema with common properties"""
    case_text: str

class CaseCreate(CaseBase):
    """Schema for creating a new case"""
    pass

class CaseUpdate(BaseModel):
    """Schema for updating a case"""
    case_text: Optional[str] = None
    current_stage: Optional[str] = None
    is_complete: Optional[bool] = None

class Case(CaseBase):
    """Schema for case returned from API"""
    id: UUID
    user_id: UUID
    current_stage: str
    is_complete: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class CaseList(BaseModel):
    """Schema for list of cases"""
    cases: List[Case]
    total: int

# Stage Result schemas
class StageResultBase(BaseModel):
    """Base StageResult schema with common properties"""
    stage_name: str
    result: Dict[str, Any] = {}
    is_approved: bool = False

class StageResultCreate(StageResultBase):
    """Schema for creating a new stage result"""
    pass

class StageResult(StageResultBase):
    """Schema for stage result returned from API"""
    id: UUID
    case_id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Message schemas
class MessageBase(BaseModel):
    """Base Message schema with common properties"""
    role: str
    content: str

class MessageCreate(MessageBase):
    """Schema for creating a new message"""
    pass

class Message(MessageBase):
    """Schema for message returned from API"""
    id: UUID
    case_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True

class MessageList(BaseModel):
    """Schema for list of messages"""
    messages: List[Message]
    total: int

# Report schemas
class ReportBase(BaseModel):
    """Base Report schema with common properties"""
    file_path: str

class ReportCreate(ReportBase):
    """Schema for creating a new report"""
    pass

class Report(ReportBase):
    """Schema for report returned from API"""
    id: UUID
    case_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True

# Workflow schemas
class WorkflowStageProcess(BaseModel):
    """Schema for processing a workflow stage"""
    input_text: Optional[str] = None

class WorkflowStageResponse(BaseModel):
    """Schema for workflow stage response"""
    stage_name: str
    result: Dict[str, Any]
    is_approved: bool
    next_stage: Optional[str] = None


# Combined schema for detailed case view
class CaseDetails(Case):
    """Schema for detailed case view including messages and stage results"""
    messages: List[Message] = []
    stage_results: List[StageResult] = []

    class Config:
        from_attributes = True # Ensure it works with ORM models
