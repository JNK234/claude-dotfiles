"""
Service layer for user profile and related operations.
"""
# Removed secrets, logging, timedelta, timezone, Optional imports related to password reset
from datetime import datetime 
from sqlalchemy.orm import Session
from sqlalchemy import func # For count
# Removed select import

from app.models.user import User, UserProfile
from app.models.case import Case # Import Case model for counting
from app.schemas.user import UserProfileResponse, ProfileUpdate, UserStats
# Removed get_password_hash import
# Removed logging configuration
# Removed PASSWORD_RESET_TOKEN_EXPIRE_HOURS constant

class UserService:
    """
    Provides methods for interacting with user profile data and actions like password reset.
    """

    @staticmethod
    async def get_user_profile(db: Session, user: User) -> UserProfileResponse:
        """
        Retrieves the full profile information for a given user.

        Args:
            db: The database session.
            user: The authenticated user model instance.

        Returns:
            The user's profile information.
        """
        # Pydantic's `model_validate` with `from_attributes=True` will automatically
        # handle the relationship loading and nested structure defined in UserProfileResponse.
        # Ensure the relationship is loaded if needed (SQLAlchemy might lazy load it).
        # You might consider adding options(joinedload(User.profile)) in the query
        # that fetches the 'user' object in the dependency (get_current_local_user)
        # for optimization if lazy loading causes issues.

        # Directly validate the ORM object against the response schema
        return UserProfileResponse.model_validate(user)


    @staticmethod
    async def update_user_profile(db: Session, user: User, profile_data: ProfileUpdate) -> UserProfileResponse:
        """
        Updates the user's profile information (name and job title).

        Args:
            db: The database session.
            user: The authenticated user model instance.
            profile_data: The profile update data.

        Returns:
            The updated user's profile information.

        Raises:
            ValueError: If the user profile doesn't exist and needs to be created first.
        """
        updated = False

        # Update User.name if provided
        if profile_data.name is not None and user.name != profile_data.name:
            user.name = profile_data.name
            updated = True

        # Update UserProfile.job_title if provided
        if profile_data.job_title is not None:
            if not user.profile:
                # Handle case where profile doesn't exist - potentially create it
                # For now, let's assume profile should exist or raise error
                # Option 1: Create profile
                # user.profile = UserProfile(user_id=user.id, job_title=profile_data.job_title)
                # db.add(user.profile)
                # updated = True
                # Option 2: Raise error (simpler for now)
                 raise ValueError("User profile does not exist. Cannot update job title.")

            elif user.profile.job_title != profile_data.job_title:
                user.profile.job_title = profile_data.job_title
                updated = True

        # Commit changes if any were made
        if updated:
            db.commit()
            db.refresh(user)
            if user.profile: # Refresh profile too if it exists
                 db.refresh(user.profile)

        # Return the updated profile
        return await UserService.get_user_profile(db, user)


    @staticmethod
    async def get_user_stats(db: Session, user: User) -> UserStats:
        """
        Retrieves statistics for the given user.

        Args:
            db: The database session.
            user: The authenticated user model instance.

        Returns:
            The user's statistics.
        """
        # Count cases associated with the user
        # Assuming Case model has a user_id foreign key
        case_count = db.query(func.count(Case.id)).filter(Case.user_id == user.id).scalar() or 0

        # Get subscription tier from the user model
        subscription_tier = user.subscription_tier

        return UserStats(
            cases_processed=case_count,
            subscription_tier=subscription_tier
        )

# Removed Password Reset Methods as Supabase handles this flow

# Instantiate the service
user_service = UserService()
