"""
Database initialization module
"""
import logging
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
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
        logger.info("Database already initialized with users")
        return
    
    # Create default doctor user
    user = User(
        email="doctor@example.com",
        name="Demo Doctor",
        hashed_password=get_password_hash("password"),
        is_active=True,
        role="doctor"
    )
    
    # Add to database
    db.add(user)
    db.commit()
    db.refresh(user)
    
    logger.info(f"Created default doctor user: {user.email}")

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