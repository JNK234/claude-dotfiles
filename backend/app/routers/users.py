"""
API Endpoints for user profile management.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, SupabaseUser
from app.models.user import User as UserModel
from app.schemas.user import UserProfileResponse, ProfileUpdate, UserStats
from app.services.user_service import user_service # Import the service instance

router = APIRouter(
    prefix="/users", # Set a prefix for all routes in this router
    tags=["Users"], # Tag for API documentation
    # dependencies=[Depends(get_current_user)] # Optional: Apply dependency to all routes
)

@router.get("/me", response_model=UserProfileResponse)
async def read_users_me(
    current_user: SupabaseUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve the profile information for the currently authenticated user.
    """
    try:
        profile = await user_service.get_user_profile(db, current_user)
        return profile
    except Exception as e:
        # Log the error e
        print(f"Error fetching profile for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not fetch user profile.",
        )

@router.put("/me", response_model=UserProfileResponse)
async def update_users_me(
    profile_update: ProfileUpdate,
    current_user: SupabaseUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update the profile information (name, job title) for the currently authenticated user.
    """
    try:
        updated_profile = await user_service.update_user_profile(db, current_user, profile_update)
        return updated_profile
    except ValueError as ve: # Catch specific error from service
         raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, # Or 400 Bad Request depending on logic
            detail=str(ve),
        )
    except Exception as e:
        # Log the error e
        print(f"Error updating profile for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not update user profile.",
        )

@router.get("/me/stats", response_model=UserStats)
async def read_users_me_stats(
    current_user: SupabaseUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve statistics (cases processed, subscription tier) for the currently authenticated user.
    """
    try:
        stats = await user_service.get_user_stats(db, current_user)
        return stats
    except Exception as e:
        # Log the error e
        print(f"Error fetching stats for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not fetch user statistics.",
        )
