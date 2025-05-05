"""
Case management endpoints for handling patient cases
"""
from typing import Any, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc # Add this import
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_supabase_user # Changed import
from app.models.case import Case, Message, StageResult # Added Message, StageResult
from app.models.user import User
from app.schemas.case import Case as CaseSchema, CaseCreate, CaseList, CaseDetails, CaseUpdate # Added CaseUpdate
from sqlalchemy.orm import joinedload # To eagerly load relationships

router = APIRouter()

@router.get("", response_model=CaseList)
async def list_cases( # Changed to async
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_supabase_user) # Changed dependency
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
    # Get cases for current user, sorted by last updated time (descending)
    cases = db.query(Case).filter(Case.user_id == current_user.id).order_by(desc(Case.updated_at)).offset(skip).limit(limit).all()
    total = db.query(Case).filter(Case.user_id == current_user.id).count()

    return {"cases": cases, "total": total}

@router.post("", response_model=CaseSchema, status_code=status.HTTP_201_CREATED)
async def create_case( # Changed to async
    case_in: CaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_supabase_user) # Changed dependency
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
async def get_case( # Changed to async
    case_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_supabase_user) # Changed dependency
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


# Add the new endpoint function
@router.get("/{case_id}/details", response_model=CaseDetails)
async def get_case_details( # Changed to async
    case_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_supabase_user) # Changed dependency
) -> Any:
    """
    Get detailed information for a specific case, including messages and stage results.
    This endpoint is optimized for loading past cases efficiently.

    Args:
        case_id: The ID of the case to retrieve.
        db: Database session dependency.
        current_user: The currently authenticated user.

    Returns:
        CaseDetails: Detailed case information.

    Raises:
        HTTPException: 404 if the case is not found.
        HTTPException: 403 if the user is not authorized to access the case.
    """
    # Query for the case and eagerly load messages and stage_results
    # Order messages and stage_results by creation time for consistency
    case = (
        db.query(Case)
        .options(
            joinedload(Case.messages), # Eager load messages
            joinedload(Case.stage_results) # Eager load stage results
        )
        .filter(Case.id == case_id)
        .first()
    )

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

    # Sort messages and stage results in Python if needed (SQLAlchemy might handle order)
    # Pydantic will automatically serialize the loaded relationships
    # Ensure messages and stage_results are sorted if not handled by relationship loading
    # Note: Accessing case.messages and case.stage_results triggers the load if not already loaded
    # Sorting them here ensures they are in order before returning.
    sorted_messages = sorted(case.messages, key=lambda m: m.created_at)
    sorted_stage_results = sorted(case.stage_results, key=lambda sr: sr.created_at)
    
    # Assign sorted lists back for Pydantic serialization
    case.messages = sorted_messages
    case.stage_results = sorted_stage_results

    return case


@router.delete("/{case_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
async def delete_case( # Changed to async
    case_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_supabase_user) # Changed dependency
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

@router.patch("/{case_id}", response_model=CaseSchema)
async def update_case( # Changed to async
    case_id: UUID,
    case_in: CaseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_supabase_user) # Changed dependency
) -> Any:
    """
    Update a case
    
    Args:
        case_id: Case ID
        case_in: Case update data
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        Case: Updated case
        
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
            detail="Not authorized to update this case"
        )
    
    # Update case fields
    update_data = case_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(case, field, value)
    
    # Save changes
    db.commit()
    db.refresh(case)
    
    # Return the updated case
    return case
