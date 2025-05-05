"""
InferenceMD FastAPI Application
Main application entry point
"""
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
from sqlalchemy.sql import text

from app.core.config import settings
from app.core.database import get_db
from app.core.init_db import init_db, create_tables
from app.routers import auth, cases, workflow, messages, reports, contact, users # Added users router import

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=None,
    redoc_url=None
)

# Add CORS middleware with more secure configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"],
    expose_headers=["Content-Length"],
    max_age=600,  # Cache preflight requests for 10 minutes
)

# Add health check endpoint
@app.get("/health", tags=["Health"])
async def health_check(db=Depends(get_db)):
    """
    Health check endpoint that verifies database connectivity
    """
    try:
        # Test database connection
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected",
            "version": settings.VERSION
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail="Database connection failed")

# Include routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(cases.router, prefix=f"{settings.API_V1_STR}/cases", tags=["Cases"])
app.include_router(workflow.router, prefix=f"{settings.API_V1_STR}/cases", tags=["Workflow"])
app.include_router(messages.router, prefix=f"{settings.API_V1_STR}/cases", tags=["Messages"])
app.include_router(reports.router, prefix=f"{settings.API_V1_STR}/cases", tags=["Reports"])
app.include_router(contact.router, prefix=f"{settings.API_V1_STR}", tags=["Contact"]) # Added contact router
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/users", tags=["Users"]) # Added users router

# Endpoint to get stage mapping
@app.get(f"{settings.API_V1_STR}/stages/mapping", tags=["Workflow"])
async def get_stage_mapping():
    """
    Get the mapping between backend and frontend stages
    """
    return {
        "mapping": settings.STAGE_MAPPING,
        "backend_stages": list(settings.STAGE_MAPPING.keys()),
        "frontend_stages": list(set(settings.STAGE_MAPPING.values()))
    }

# Custom Swagger UI with JWT authentication
@app.get("/docs", include_in_schema=False)
async def swagger_ui_html():
    """
    Custom Swagger UI that supports JWT authentication
    """
    return get_swagger_ui_html(
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        title=f"{settings.PROJECT_NAME} - API Documentation",
        swagger_js_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/swagger-ui-bundle.js",
        swagger_css_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/swagger-ui.css",
        swagger_favicon_url="/static/favicon.ico",
    )

@app.get("/", include_in_schema=False)
async def root():
    """
    Root endpoint redirecting to API documentation
    """
    return {"message": f"Welcome to {settings.PROJECT_NAME} API", 
            "documentation": "/docs",
            "version": settings.VERSION}

# Startup event
@app.on_event("startup")
async def startup_event():
    """
    Initialize database and required directories on startup
    """
    import logging
    import os
    
    logger = logging.getLogger(__name__)
    logger.setLevel(logging.INFO)
    
    # Ensure required directories exist
    for directory in [settings.REPORTS_DIR, settings.NOTES_DIR, settings.STATIC_DIR]:
        os.makedirs(directory, exist_ok=True)
        logger.info(f"Ensured directory exists: {directory}")
    
    # Initialize database
    retries = 5
    for attempt in range(retries):
        try:
            db = next(get_db())
            create_tables(db)
            init_db(db)
            logger.info("Database initialized successfully")
            break
        except Exception as e:
            if attempt == retries - 1:
                logger.error(f"Failed to initialize database after {retries} attempts: {str(e)}")
                raise
            logger.warning(f"Database initialization attempt {attempt + 1} failed, retrying...")
            import time
            time.sleep(5)
        finally:
            try:
                db.close()
            except:
                pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
