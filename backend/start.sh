#!/bin/bash
set -e

echo "Starting InferenceMD backend..."

# Create required directories with proper permissions
mkdir -p /tmp/reports /tmp/notes /app/static
chmod 777 /tmp/reports /tmp/notes /app/static

# Check Python packages
echo "Checking installed packages..."
pip list

# Ensure uvicorn and gunicorn are installed
echo "Ensuring critical packages are installed..."
pip install --no-cache-dir uvicorn==0.34.0 gunicorn==22.0.0

# Run database migrations with proper error handling
echo "Running database migrations..."
cd /app

# Attempt migrations with retries
MAX_RETRIES=3
RETRY_COUNT=0
MIGRATION_SUCCESS=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ] && [ "$MIGRATION_SUCCESS" = false ]; do
    if alembic upgrade head; then
        MIGRATION_SUCCESS=true
        echo "Database migrations completed successfully!"
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            echo "Migration attempt $RETRY_COUNT failed. Retrying in 5 seconds..."
            sleep 5
        else
            echo "ERROR: Database migrations failed after $MAX_RETRIES attempts!"
            exit 1
        fi
    fi
done

# Get port from environment or default to 8000
PORT=${PORT:-8000}
echo "Starting server on port $PORT..."

# Ensure paths are set correctly
export PYTHONPATH=/app
export PATH=$PATH:/usr/local/bin

# Run the application with optimized settings
echo "Starting gunicorn with uvicorn workers..."
exec gunicorn \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:$PORT \
    --timeout 120 \
    --keep-alive 5 \
    --access-logfile - \
    --error-logfile - \
    app.main:app 