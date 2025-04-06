# Use a specific version for better reproducibility
FROM python:3.10.13-slim

# Set environment variables
ENV PYTHONPATH=/app \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Install system dependencies in a single layer
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    wget \
    pandoc \
    wkhtmltopdf \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /tmp/reports /tmp/notes /app/static \
    && chmod 777 /tmp/reports /tmp/notes /app/static

# Install Python dependencies
# Copy only requirements first to leverage Docker cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
# Use .dockerignore to exclude unnecessary files
COPY . .

# Create a health check endpoint file if it doesn't exist
RUN if [ ! -f /app/app/routers/health.py ]; then \
    mkdir -p /app/app/routers && \
    echo 'from fastapi import APIRouter\n\nrouter = APIRouter()\n\n@router.get("/health")\ndef health_check():\n    return {"status": "healthy"}' > /app/app/routers/health.py && \
    if [ -f /app/app/main.py ]; then \
        sed -i -e "/from app.routers import/s/$/, health/" /app/app/main.py && \
        sed -i -e "/app.include_router.*tags=\[/a app.include_router(health.router, prefix=f\"{settings.API_V1_STR}\", tags=[\"Health\"])" /app/app/main.py; \
    fi \
    fi

# Script to handle startup tasks and dynamic port binding
COPY <<EOF /app/start.sh
#!/bin/bash
set -e

# Create required directories with proper permissions
mkdir -p /tmp/reports /tmp/notes /app/static
chmod 777 /tmp/reports /tmp/notes /app/static

# Get port from environment or default to 8000
PORT=\${PORT:-8000}

# Run the application with optimized settings
exec gunicorn \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:\$PORT \
    --timeout 120 \
    --keep-alive 5 \
    --access-logfile - \
    --error-logfile - \
    app.main:app
EOF

RUN chmod +x /app/start.sh

# Use the startup script
CMD ["/app/start.sh"]
