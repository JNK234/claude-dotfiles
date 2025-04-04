"""
InferenceMD FastAPI Application
Main application entry point
"""
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html

from app.core.config import settings
from app.core.database import get_db
from app.core.init_db import init_db, create_tables
from app.routers import auth, cases, workflow, messages, reports

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=None,
    redoc_url=None
)

# Add CORS middleware with more permissive settings for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"] if not settings.CORS_ORIGINS else settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(cases.router, prefix=f"{settings.API_V1_STR}/cases", tags=["Cases"])
app.include_router(workflow.router, prefix=f"{settings.API_V1_STR}/cases", tags=["Workflow"])
app.include_router(messages.router, prefix=f"{settings.API_V1_STR}/cases", tags=["Messages"])
app.include_router(reports.router, prefix=f"{settings.API_V1_STR}/cases", tags=["Reports"])

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
    Initialize database on startup
    """
    db = next(get_db())
    try:
        # Create tables and init DB
        create_tables(db)
        init_db(db)
    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
