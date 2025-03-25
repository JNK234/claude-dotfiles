"""
Case management endpoints for handling patient cases
"""
from typing import Any, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.case import Case
from app.models.user import User
from app.schemas.case import Case as CaseSchema, CaseCreate, CaseList

router = APIRouter()

@router.get("", response_model=CaseList)
def list_cases(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    List cases for the current user
    
    Args:
        skip: Number of records to skip for pagination
        limit: Maximum number of records to return
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        CaseList: List of cases
    """
    # Get cases for current user
    cases = db.query(Case).filter(Case.user_id == current_user.id).offset(skip).limit(limit).all()
    total = db.query(Case).filter(Case.user_id == current_user.id).count()
    
    return {"cases": cases, "total": total}

@router.post("", response_model=CaseSchema, status_code=status.HTTP_201_CREATED)
def create_case(
    case_in: CaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Create a new case
    
    Args:
        case_in: Case data
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        Case: Created case
    """
    # Create new case
    case = Case(
        user_id=current_user.id,
        case_text=case_in.case_text,
        current_stage="initial"
    )
    
    # Save to database
    db.add(case)
    db.commit()
    db.refresh(case)
    
    return case

@router.get("/{case_id}", response_model=CaseSchema)
def get_case(
    case_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get a case by ID
    
    Args:
        case_id: Case ID
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        Case: Case with specified ID
        
    Raises:
        HTTPException: If case not found or not owned by current user
    """
    # Get case by ID
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
    
    return case

@router.delete("/{case_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
def delete_case(
    case_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> None:
    """
    Delete a case
    
    Args:
        case_id: Case ID
        db: Database session
        current_user: Current authenticated user
        
    Raises:
        HTTPException: If case not found or not owned by current user
    """
    # Get case by ID
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
            detail="Not authorized to delete this case"
        )
    
    # Delete case
    db.delete(case)
    db.commit()
    
    # 204 status code requires no content returned
    
    return None