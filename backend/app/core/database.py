"""
Database connection and session management for Supabase PostgreSQL
"""
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.core.config import get_settings

logger = logging.getLogger(__name__)

# Get settings
settings = get_settings()

# Create the SQLAlchemy engine for Supabase PostgreSQL
engine = create_engine(
    settings.supabase_database_url,
    pool_pre_ping=True,
    pool_recycle=300,
    echo=settings.debug
)

# Create async engine for Supabase PostgreSQL
async_engine = create_async_engine(
    settings.async_database_url,
    pool_pre_ping=True,
    pool_recycle=300,
    echo=settings.debug
)

# Create session makers
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
AsyncSessionLocal = async_sessionmaker(
    async_engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

# Base class for models
Base = declarative_base()


def get_db():
    """
    Dependency to get database session for FastAPI
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency to get async database session for FastAPI
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception as e:
            logger.error(f"Async database session error: {e}")
            await session.rollback()
            raise
        finally:
            await session.close()


@asynccontextmanager
async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Context manager for async database sessions
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception as e:
            logger.error(f"Async session error: {e}")
            await session.rollback()
            raise
        finally:
            await session.close()


def init_db():
    """
    Initialize database tables (for development/testing)
    Note: In production, use Supabase migrations
    """
    try:
        # Import all models here to ensure they are registered with SQLAlchemy
        from app.models import user, case, report  # noqa: F401
        
        # Create tables (only for development - use migrations in production)
        if settings.debug:
            Base.metadata.create_all(bind=engine)
            logger.info("Database tables created successfully")
        else:
            logger.info("Skipping table creation in production - use Supabase migrations")
            
    except Exception as e:
        logger.error(f"Database initialization error: {e}")
        raise


async def init_async_db():
    """
    Initialize database tables asynchronously
    """
    try:
        # Import all models here to ensure they are registered with SQLAlchemy
        from app.models import user, case, report  # noqa: F401
        
        # Create tables (only for development - use migrations in production)
        if settings.debug:
            async with async_engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("Async database tables created successfully")
        else:
            logger.info("Skipping async table creation in production - use Supabase migrations")
            
    except Exception as e:
        logger.error(f"Async database initialization error: {e}")
        raise


def check_db_connection():
    """
    Check if database connection is working
    """
    try:
        with engine.connect() as connection:
            connection.execute("SELECT 1")
            logger.info("Database connection successful")
            return True
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return False


async def check_async_db_connection():
    """
    Check if async database connection is working
    """
    try:
        async with async_engine.connect() as connection:
            await connection.execute("SELECT 1")
            logger.info("Async database connection successful")
            return True
    except Exception as e:
        logger.error(f"Async database connection failed: {e}")
        return False


# Database health check function
def get_db_health():
    """
    Get database health status
    """
    try:
        with engine.connect() as connection:
            result = connection.execute("SELECT version()")
            version = result.fetchone()[0]
            return {
                "status": "healthy",
                "database": "postgresql",
                "version": version,
                "connection": "successful"
            }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "postgresql", 
            "error": str(e),
            "connection": "failed"
        }


# Export commonly used items
__all__ = [
    "engine",
    "async_engine", 
    "SessionLocal",
    "AsyncSessionLocal",
    "Base",
    "get_db",
    "get_async_db",
    "get_async_session",
    "init_db",
    "init_async_db",
    "check_db_connection",
    "check_async_db_connection",
    "get_db_health"
]