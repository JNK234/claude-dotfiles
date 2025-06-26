# ABOUTME: Authentication helper functions for consistent user authorization
# ABOUTME: Handles UUID vs string user ID comparisons and provides debugging utilities

import logging
from typing import Union
from uuid import UUID

from fastapi import HTTPException, status

from app.core.security import SupabaseUser
from app.models.case import Case

logger = logging.getLogger(__name__)


def verify_case_access(case: Case, current_user: SupabaseUser, case_id: Union[str, UUID] = None) -> None:
    """
    Verify that the current user has access to the specified case
    
    Args:
        case: Case object from database
        current_user: Current authenticated user
        case_id: Optional case ID for logging (if different from case.id)
        
    Raises:
        HTTPException: If user is not authorized to access the case
    """
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case with ID {case_id or 'unknown'} not found"
        )
    
    # Convert both user IDs to strings for comparison to handle UUID vs string mismatch
    case_user_id_str = str(case.user_id)
    current_user_id_str = str(current_user.id)
    
    # Debug logging to track user ID types and values
    logger.debug(f"Case access verification:")
    logger.debug(f"  Case ID: {case.id}")
    logger.debug(f"  Case user_id: {case_user_id_str} (type: {type(case.user_id)})")
    logger.debug(f"  Current user_id: {current_user_id_str} (type: {type(current_user.id)})")
    
    if case_user_id_str != current_user_id_str:
        logger.warning(f"Unauthorized case access attempt:")
        logger.warning(f"  Case ID: {case.id}")
        logger.warning(f"  Case owner: {case_user_id_str}")
        logger.warning(f"  Requesting user: {current_user_id_str}")
        logger.warning(f"  User email: {current_user.email}")
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this case"
        )
    
    logger.debug(f"Case access authorized for user {current_user_id_str}")


def normalize_user_id(user_id: Union[str, UUID]) -> str:
    """
    Normalize user ID to string format for consistent comparisons
    
    Args:
        user_id: User ID in string or UUID format
        
    Returns:
        str: User ID as string
    """
    return str(user_id)


def log_user_context(current_user: SupabaseUser, operation: str) -> None:
    """
    Log user context for debugging authentication issues
    
    Args:
        current_user: Current authenticated user
        operation: Description of the operation being performed
    """
    logger.info(f"User context for {operation}:")
    logger.info(f"  User ID: {current_user.id} (type: {type(current_user.id)})")
    logger.info(f"  Email: {current_user.email}")
    logger.info(f"  Role: {current_user.role}")