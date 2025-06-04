"""
Workflow endpoints for handling the diagnosis workflow stages
"""
from typing import Any, Dict
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_local_user # Changed import
from app.models.case import Case
from app.models.user import User
from app.schemas.case import WorkflowStageProcess, WorkflowStageResponse
from app.services.diagnosis_service import DiagnosisService

router = APIRouter()

@router.post("/{case_id}/workflow/start", response_model=WorkflowStageResponse)
async def start_workflow( # Changed to async
    case_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_local_user) # Changed dependency
) -> Any:
    """
    Start the diagnosis workflow for a case
    
    Args:
        case_id: Case ID
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        WorkflowStageResponse: Initial stage result
        
    Raises:
        HTTPException: If case not found or not owned by current user
    """
    # Get case
    case = db.query(Case).filter(Case.id == case_id).first()
    
    # Check if case exists
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case with ID {case_id} not found"
        )
    
    # Check if case belongs to current user
    if case.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this case"
        )
    
    # Initialize diagnosis service
    diagnosis_service = DiagnosisService(db)
    
    # Process the patient_case_analysis stage (which will handle initial, extraction, causal_analysis, validation)
    patient_case_analysis_result = diagnosis_service.process_stage(str(case_id), 'patient_case_analysis_group')
    
    # Return the patient_case_analysis result
    return {
        "stage_name": "patient_case_analysis_group",
        "result": patient_case_analysis_result,
        "is_approved": False,
        "next_stage": patient_case_analysis_result.get("next_stage")
    }

@router.post("/{case_id}/workflow/stages/{stage_name}/process", response_model=WorkflowStageResponse)
async def process_stage( # Changed to async
    case_id: UUID,
    stage_name: str,
    stage_data: WorkflowStageProcess,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_local_user) # Changed dependency
) -> Any:
    """
    Process a specific stage in the diagnosis workflow
    
    Args:
        case_id: Case ID
        stage_name: Stage name to process
        stage_data: Stage data with optional input text
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        WorkflowStageResponse: Stage result
        
    Raises:
        HTTPException: If case not found or not owned by current user
    """
    # Get case
    case = db.query(Case).filter(Case.id == case_id).first()
    
    # Check if case exists
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case with ID {case_id} not found"
        )
    
    # Check if case belongs to current user
    if case.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this case"
        )
    
    # Initialize diagnosis service
    diagnosis_service = DiagnosisService(db)
    
    # Process stage
    result = diagnosis_service.process_stage(str(case_id), stage_name, stage_data.input_text)
    
    return {
        "stage_name": stage_name,
        "result": result,
        "is_approved": False,
        "next_stage": result.get("next_stage")
    }

@router.post("/{case_id}/workflow/stages/{stage_name}/approve", response_model=WorkflowStageResponse)
async def approve_stage( # Changed to async
    case_id: UUID,
    stage_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_local_user) # Changed dependency
) -> Any:
    """
    Approve a stage and move to the next stage
    
    Args:
        case_id: Case ID
        stage_name: Stage name to approve
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        WorkflowStageResponse: Approval result
        
    Raises:
        HTTPException: If case not found or not owned by current user
    """
    # Get case
    case = db.query(Case).filter(Case.id == case_id).first()
    
    # Check if case exists
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case with ID {case_id} not found"
        )
    
    # Check if case belongs to current user
    if case.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this case"
        )
    
    # Initialize diagnosis service
    diagnosis_service = DiagnosisService(db)
    
    # Approve stage
    result = diagnosis_service.approve_stage(str(case_id), stage_name)
    
    return {
        "stage_name": stage_name,
        "result": result,
        "is_approved": True,
        "next_stage": result.get("next_stage")
    }

@router.post("/{case_id}/generate-note")
async def generate_note( # Changed to async
    case_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_local_user) # Changed dependency
) -> Dict[str, str]:
    """
    Generate a clinical note for a completed case
    
    Args:
        case_id: Case ID
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        Dict[str, str]: Generated clinical note
        
    Raises:
        HTTPException: If case not found, not owned by current user, or not completed
    """
    # Get case
    case = db.query(Case).filter(Case.id == case_id).first()
    
    # Check if case exists
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case with ID {case_id} not found"
        )
    
    # Check if case belongs to current user
    if case.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this case"
        )
    
    # Check if case is completed
    if not case.is_complete:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Case must be completed before generating note"
        )
    
    # Initialize diagnosis service
    diagnosis_service = DiagnosisService(db)
    
    # Generate note
    note = diagnosis_service.generate_clinical_note(str(case_id))
    
    return {
        "note": note
    }
