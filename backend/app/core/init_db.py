"""
Database initialization module
"""
import logging
from sqlalchemy.orm import Session

# Removed import of get_password_hash as it's no longer used here
# from app.core.security import get_password_hash
from app.models.user import User

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_db(db: Session) -> None:
    """
    Initialize database with first superuser
    
    Args:
        db: Database session
    """
    # Check if users exist
    user = db.query(User).first()
    if user:
        logger.info("Database already contains users. Skipping default user creation.")
        return
    
    # Removed default user creation logic.
    # User creation should now happen via Supabase signup and the associated trigger.
    logger.info("No users found. Database initialization complete (default user creation skipped).")
    # If other initialization steps were needed, they would go here.

def create_tables(db: Session) -> None:
    """
    Create database tables
    
    Args:
        db: Database session
    """
    from app.core.database import Base, engine
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    logger.info("Created database tables")
