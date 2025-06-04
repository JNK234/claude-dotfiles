"""
Health check endpoints for monitoring system status
"""
import asyncio
from typing import Any, Dict

from fastapi import APIRouter

from app.core.config import get_settings
from app.core.database import get_db_health, check_db_connection, check_async_db_connection
from app.core.security import get_auth_health
from app.core.supabase import supabase_service_instance

# Get settings
settings = get_settings()

router = APIRouter()


@router.get("/", response_model=Dict[str, Any])
async def health_check() -> Dict[str, Any]:
    """
    Comprehensive health check for all system components
    
    Returns:
        Dict containing health status of all components
    """
    
    # Check all components
    checks = await asyncio.gather(
        _check_api_health(),
        _check_database_health(),
        _check_supabase_health(),
        _check_auth_health(),
        return_exceptions=True
    )
    
    api_health, db_health, supabase_health, auth_health = checks
    
    # Determine overall health
    all_healthy = all([
        isinstance(check, dict) and check.get("status") == "healthy"
        for check in checks
    ])
    
    return {
        "status": "healthy" if all_healthy else "unhealthy",
        "service": "medhastra-api",
        "version": settings.version,
        "environment": "development" if settings.debug else "production",
        "components": {
            "api": api_health if isinstance(api_health, dict) else {"status": "error", "error": str(api_health)},
            "database": db_health if isinstance(db_health, dict) else {"status": "error", "error": str(db_health)},
            "supabase": supabase_health if isinstance(supabase_health, dict) else {"status": "error", "error": str(supabase_health)},
            "authentication": auth_health if isinstance(auth_health, dict) else {"status": "error", "error": str(auth_health)}
        }
    }


async def _check_api_health() -> Dict[str, Any]:
    """Check API health"""
    try:
        return {
            "status": "healthy",
            "service": "fastapi",
            "version": settings.version,
            "debug_mode": settings.debug
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "service": "fastapi",
            "error": str(e)
        }


async def _check_database_health() -> Dict[str, Any]:
    """Check database connectivity"""
    try:
        # Check both sync and async connections
        sync_healthy = check_db_connection()
        async_healthy = await check_async_db_connection()
        
        if sync_healthy and async_healthy:
            return get_db_health()
        else:
            return {
                "status": "unhealthy",
                "database": "postgresql",
                "sync_connection": sync_healthy,
                "async_connection": async_healthy,
                "error": "Database connection failed"
            }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "postgresql", 
            "error": str(e)
        }


async def _check_supabase_health() -> Dict[str, Any]:
    """Check Supabase service connectivity"""
    try:
        return await supabase_service_instance.health_check()
    except Exception as e:
        return {
            "status": "unhealthy",
            "service": "supabase",
            "error": str(e)
        }


async def _check_auth_health() -> Dict[str, Any]:
    """Check authentication system health"""
    try:
        return get_auth_health()
    except Exception as e:
        return {
            "status": "unhealthy",
            "service": "authentication",
            "error": str(e)
        }


@router.get("/ping")
async def ping() -> Dict[str, str]:
    """
    Simple ping endpoint for basic availability check
    """
    return {"status": "ok", "message": "pong"}


@router.get("/version") 
async def version() -> Dict[str, str]:
    """
    Get API version information
    """
    return {
        "service": "medhastra-api",
        "version": settings.version,
        "environment": "development" if settings.debug else "production"
    }


@router.get("/database")
async def database_health() -> Dict[str, Any]:
    """
    Detailed database health check
    """
    return await _check_database_health()


@router.get("/supabase")
async def supabase_health() -> Dict[str, Any]:
    """
    Detailed Supabase health check
    """
    return await _check_supabase_health()


@router.get("/auth")
async def auth_health() -> Dict[str, Any]:
    """
    Detailed authentication health check
    """
    return await _check_auth_health() 