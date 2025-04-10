"""
Database configuration using SQLAlchemy
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import time

from app.core.config import settings

def get_engine(retries=5, delay=5):
    """
    Create SQLAlchemy engine with retry logic for PostgreSQL
    """
    for attempt in range(retries):
        try:
            # Create SQLAlchemy engine with proper settings for PostgreSQL
            engine = create_engine(
                settings.DATABASE_URL,
                pool_pre_ping=True,  # Enable connection health checks
                pool_size=5,         # Set reasonable pool size
                max_overflow=10,     # Allow some overflow connections
                pool_timeout=30,     # Connection timeout
                connect_args={"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {
                    "connect_timeout": 10  # PostgreSQL specific connection timeout
                }
            )
            # Test the connection
            with engine.connect() as conn:
                conn.execute("SELECT 1")
            return engine
        except Exception as e:
            if attempt == retries - 1:
                raise Exception(f"Failed to connect to database after {retries} attempts: {str(e)}")
            time.sleep(delay)

# Create engine with retry logic
engine = get_engine()

# Create sessionmaker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models
Base = declarative_base()

# Dependency to get DB session
def get_db():
    """
    Dependency for getting database session with proper error handling
    
    Yields:
        Session: Database session
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()