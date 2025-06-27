"""
Workflow endpoints for handling the diagnosis workflow stages
"""
from typing import Any, Dict, AsyncGenerator
from uuid import UUID
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, SupabaseUser
from app.core.auth_helpers import verify_case_access
from app.models.case import Case
from app.models.user import User
from app.schemas.case import WorkflowStageProcess, WorkflowStageResponse
from app.services.diagnosis_service import DiagnosisService
from app.services.llm_service import LLMService
from app.utils.sse import SSEEvent, SSEEventType, format_sse_data, create_sse_event

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/{case_id}/workflow/start", response_model=WorkflowStageResponse)
async def start_workflow( # Changed to async
    case_id: UUID,
    db: Session = Depends(get_db),
    current_user: SupabaseUser = Depends(get_current_user) # Changed dependency
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
    
    # Verify case exists and user has access
    verify_case_access(case, current_user, case_id)
    
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
    current_user: SupabaseUser = Depends(get_current_user) # Changed dependency
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
    
    # Verify case exists and user has access
    verify_case_access(case, current_user, case_id)
    
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
    current_user: SupabaseUser = Depends(get_current_user) # Changed dependency
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
    
    # Verify case exists and user has access
    verify_case_access(case, current_user, case_id)
    
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
    current_user: SupabaseUser = Depends(get_current_user) # Changed dependency
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
    
    # Verify case exists and user has access
    verify_case_access(case, current_user, case_id)
    
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

@router.get("/{case_id}/workflow/stages/{stage_name}/stream")
async def stream_stage(
    case_id: UUID,
    stage_name: str,
    db: Session = Depends(get_db),
    current_user: SupabaseUser = Depends(get_current_user)
) -> StreamingResponse:
    """
    Stream a single workflow stage using Server-Sent Events (SSE)
    
    Args:
        case_id: Case ID
        stage_name: Stage name to stream
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        StreamingResponse: SSE stream of stage processing
        
    Raises:
        HTTPException: If case not found or not owned by current user
    """
    # Get case
    case = db.query(Case).filter(Case.id == case_id).first()
    
    # Verify case exists and user has access
    verify_case_access(case, current_user, case_id)
    
    async def event_generator() -> AsyncGenerator[str, None]:
        """Generate SSE events by streaming the existing DiagnosisService logic"""
        try:
            logger.info(f"Starting streaming for case {case_id}, stage {stage_name}")
            
            # Initialize diagnosis service (same as batch workflow)
            diagnosis_service = DiagnosisService(db)
            
            # Use the existing DiagnosisService streaming method 
            # This will stream the same logic as process_stage but with SSE events
            async for sse_event in diagnosis_service.stream_stage(str(case_id), stage_name):
                formatted_event = format_sse_data(sse_event)
                yield formatted_event
                
        except Exception as e:
            logger.error(f"Error in stage streaming: {str(e)}")
            # Send error event
            error_event = create_sse_event(
                SSEEventType.ERROR,
                {
                    "message": str(e),
                    "stage_id": stage_name,
                    "case_id": str(case_id)
                }
            )
            formatted_error = format_sse_data(error_event)
            yield formatted_error
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable Nginx buffering
        }
    )

def _generate_stage_prompt(stage_name: str, case: Case, chat_history: list) -> str:
    """
    Generate appropriate prompt for the given stage
    
    Args:
        stage_name: Name of the workflow stage
        case: Case object
        chat_history: List of chat messages
        
    Returns:
        str: Generated prompt for the stage
    """
    # For now, use a simple prompt based on stage name
    # This will be enhanced with proper prompt templates
    
    if stage_name == "initial":
        return f"""
        Analyze the following medical case and provide an initial assessment:
        
        Case Title: {case.title}
        Case Description: {case.description}
        
        Please provide a detailed initial analysis focusing on:
        1. Key symptoms and findings
        2. Potential areas of concern
        3. Initial diagnostic considerations
        4. Recommended next steps
        
        Provide your analysis in a clear, structured format suitable for clinical review.
        """
    
    elif stage_name == "extraction":
        return f"""
        Extract and analyze key medical factors from this case:
        
        Case Title: {case.title}
        Case Description: {case.description}
        
        Please extract:
        1. Clinical symptoms and signs
        2. Patient demographics and history
        3. Laboratory and diagnostic findings
        4. Medications and treatments
        5. Risk factors and comorbidities
        
        Present the findings in an organized, clinical format.
        """
    
    elif stage_name == "causal_analysis":
        return f"""
        Perform causal analysis for this medical case:
        
        Case Title: {case.title}
        Case Description: {case.description}
        
        Analyze:
        1. Causal relationships between symptoms and potential diagnoses
        2. Pathophysiological connections
        3. Risk factor contributions
        4. Temporal relationships between events
        
        Provide a detailed causal analysis with clinical reasoning.
        """
    
    elif stage_name == "validation":
        return f"""
        Validate the analysis and findings for this case:
        
        Case Title: {case.title}
        Case Description: {case.description}
        
        Validation areas:
        1. Consistency of findings with clinical presentation
        2. Completeness of information
        3. Identification of missing data
        4. Verification of diagnostic reasoning
        
        Provide validation results with recommendations for proceeding.
        """
    
    else:
        # Fallback for unknown stages
        return f"""
        Analyze the following medical case for stage '{stage_name}':
        
        Case Title: {case.title}
        Case Description: {case.description}
        
        Please provide a comprehensive analysis appropriate for the {stage_name} stage of medical diagnosis workflow.
        """
