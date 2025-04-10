"""
Database configuration using SQLAlchemy
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# Create SQLAlchemy engine
engine = create_engine(
    settings.DATABASE_URL, 
    connect_args={"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
)

# Create sessionmaker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models
Base = declarative_base()

# Dependency to get DB session
def get_db():
    """
    Dependency for getting database session
    
    Yields:
        Session: Database session
    
    Example:
        ```python
        @app.get("/users/")
        def get_users(db: Session = Depends(get_db)):
            users = db.query(User).all()
            return users
        ```
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()