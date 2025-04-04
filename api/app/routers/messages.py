"""
Message endpoints for handling chat messages
"""
from typing import Any, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.case import Case, Message
from app.models.user import User
from app.schemas.case import Message as MessageSchema, MessageCreate, MessageList
from app.services.diagnosis_service import DiagnosisService

router = APIRouter()

@router.get("/{case_id}/messages", response_model=MessageList)
def list_messages(
    case_id: UUID,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    List messages for a case
    
    Args:
        case_id: Case ID
        skip: Number of records to skip for pagination
        limit: Maximum number of records to return
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        MessageList: List of messages
        
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
    
    # Get messages
    messages = db.query(Message).filter(
        Message.case_id == case_id
    ).order_by(Message.created_at).offset(skip).limit(limit).all()
    
    # Get total count
    total = db.query(Message).filter(Message.case_id == case_id).count()
    
    return {"messages": messages, "total": total}

@router.post("/{case_id}/messages", response_model=MessageSchema, status_code=status.HTTP_201_CREATED)
def create_message(
    case_id: UUID,
    message_in: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Create a new message for a case
    
    Args:
        case_id: Case ID
        message_in: Message data
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        Message: Created message
        
    Raises:
        HTTPException: If case not found or not owned by current user
    """
    # Get 
    if case_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Case ID is required"
        )
    else:
        try:
            if isinstance(case_id, str):
                case_id = UUID(case_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid case ID"
            )
            
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
    
    # Add user message to the session via the service
    user_message_obj = diagnosis_service.add_message(str(case_id), message_in.role, message_in.content)

    # --- Commit the user message immediately ---
    try:
        db.commit()
        db.refresh(user_message_obj) # Get ID, created_at etc. from DB
        # logger.info(f"Successfully committed user message {user_message_obj.id} for case {case_id}")
    except Exception as e:
        db.rollback()
        # logger.error(f"Failed to commit user message for case {case_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save message."
        )
    # --- User message is now saved ---

    # Now, handle subsequent logic (e.g., assistant response)
    # Wrap this in a try/except to prevent failures here from affecting the response
    try:
        # If this is a user message, generate an assistant response
        # For validation stage, this allows the assistant to respond to additional information
        if message_in.role == "user" and case.current_stage == "validation":
            # Process validation stage with the new input
            # Note: process_stage might also commit, review its transaction handling if issues persist
            diagnosis_service.process_stage(str(case_id), "validation", message_in.content)

            # Add assistant message (service adds to session)
            assistant_msg_obj = diagnosis_service.add_message(str(case_id), "assistant", "I've processed your additional information. Let me check if we now have all the necessary data to proceed.")
            # Commit the assistant message separately
            db.commit()
            db.refresh(assistant_msg_obj)
            logger.info(f"Successfully committed assistant message {assistant_msg_obj.id} for case {case_id}")

    except Exception as processing_error:
        # Log the error, but don't fail the request since the user message was saved
        db.rollback() # Rollback any changes from the failed processing block
        logger.error(f"Error during post-message processing for case {case_id}: {processing_error}")
        # Optionally, you could add a generic assistant message indicating a processing issue occurred

    # Return the initially saved and committed user message object
    # FastAPI will automatically serialize this using the response_model (MessageSchema)
    return user_message_obj
