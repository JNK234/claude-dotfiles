"""
Report endpoints for generating and retrieving reports
"""
import base64
import logging
from typing import Any, Dict
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
logger = logging.getLogger(__name__)
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, SupabaseUser
from app.models.case import Case, Report
from app.models.user import User
from app.schemas.case import Report as ReportSchema
from app.services.report_service import ReportService

router = APIRouter()

@router.post("/{case_id}/reports", response_model=ReportSchema, status_code=status.HTTP_201_CREATED)
async def generate_report( # Changed to async
    case_id: UUID,
    db: Session = Depends(get_db),
    current_user: SupabaseUser = Depends(get_current_user) # Changed dependency
) -> Any:
    """
    Generate a report for a case
    
    Args:
        case_id: Case ID
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        Report: Generated report
        
    Raises:
        HTTPException: If case not found or not owned by current user
    """
    if case_id is None:
        raise Exception("Case ID is required")
    try:
        if isinstance(case_id, str):
            case_id = UUID(case_id)
    except ValueError:
        raise Exception("Case ID is invalid")
    
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
    
    # Initialize report service
    report_service = ReportService(db)
    
    # Generate report
    report_result = report_service.generate_report(str(case_id))
    
    # Check if report generation failed
    if not report_result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate report"
        )
    
    # Create and return report object for API response
    report = Report(
        id=UUID(report_result["id"]),
        case_id=UUID(report_result["case_id"]),
        file_path=report_result["file_path"],
        created_at=report_result["created_at"]
    )
    
    return report

@router.get("/{case_id}/reports/{report_id}")
async def get_report( # Changed to async
    case_id: UUID,
    report_id: UUID,
    db: Session = Depends(get_db),
    current_user: SupabaseUser = Depends(get_current_user) # Changed dependency
) -> Any:
    """
    Get a report by ID
    
    Args:
        case_id: Case ID
        report_id: Report ID
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        Response: Report file
        
    Raises:
        HTTPException: If report not found or not owned by current user
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
    
    # Get report
    report = db.query(Report).filter(
        Report.id == report_id,
        Report.case_id == case_id
    ).first()
    
    # Check if report exists
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID {report_id} not found"
        )
    
    # Initialize report service
    report_service = ReportService(db)
    
    # Get report content
    report_result = report_service.get_report(str(report_id))
    
    # Check if report retrieval failed
    if not report_result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve report"
        )
    
    # Decode base64 data
    try:
        decoded_data = base64.b64decode(report_result["encoded_data"])
        
        # Return report content with proper headers
        return Response(
            content=decoded_data,
            media_type=report_result["content_type"],
            headers={
                "Content-Disposition": f"attachment; filename=report_{report_id}{'.pdf' if report_result['content_type'] == 'application/pdf' else '.txt'}",
                "Content-Type": report_result["content_type"]
            }
        )
    except Exception as e:
        logger.error(f"Error decoding report data: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error processing report data"
        )

@router.post("/{case_id}/notes", response_model=ReportSchema, status_code=status.HTTP_201_CREATED)
async def generate_note( # Changed to async
    case_id: UUID,
    db: Session = Depends(get_db),
    current_user: SupabaseUser = Depends(get_current_user) # Changed dependency
) -> Any:
    """
    Generate a clinical note for a case
    
    Args:
        case_id: Case ID
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        Report: Generated note
        
    Raises:
        HTTPException: If case not found or not owned by current user
    """
    if case_id is None:
        raise Exception("Case ID is required")
    try:
        if isinstance(case_id, str):
            case_id = UUID(case_id)
    except ValueError:
        raise Exception("Case ID is invalid")
    
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
    
    # Initialize report service
    report_service = ReportService(db)
    
    # Generate note
    note_result = report_service.generate_note(str(case_id))
    
    # Check if note generation failed
    if not note_result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate note"
        )
    
    # Create and return report object for API response
    report = Report(
        id=UUID(note_result["id"]),
        case_id=UUID(note_result["case_id"]),
        file_path=note_result["file_path"],
        created_at=note_result["created_at"]
    )
    
    return report

@router.get("/{case_id}/notes/{note_id}")
async def get_note( # Changed to async
    case_id: UUID,
    note_id: UUID,
    db: Session = Depends(get_db),
    current_user: SupabaseUser = Depends(get_current_user) # Changed dependency
) -> Any:
    """
    Get a note by ID
    
    Args:
        case_id: Case ID
        note_id: Note ID
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        Response: Note file
        
    Raises:
        HTTPException: If note not found or not owned by current user
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
    
    # Get note
    note = db.query(Report).filter(
        Report.id == note_id,
        Report.case_id == case_id
    ).first()
    
    # Check if note exists
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Note with ID {note_id} not found"
        )
    
    # Initialize report service
    report_service = ReportService(db)
    
    # Get note content
    note_result = report_service.get_report(str(note_id))
    
    # Check if note retrieval failed
    if not note_result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve note"
        )
    
    # Decode base64 data
    try:
        decoded_data = base64.b64decode(note_result["encoded_data"])
        
        # Return note content with proper headers
        return Response(
            content=decoded_data,
            media_type=note_result["content_type"],
            headers={
                "Content-Disposition": f"attachment; filename=note_{note_id}.pdf",
                "Content-Type": "application/pdf"
            }
        )
    except Exception as e:
        logger.error(f"Error decoding note data: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error processing note data"
        )
