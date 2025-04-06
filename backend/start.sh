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

# Run database migrations
echo "Running database migrations..."
cd /app
python -m alembic upgrade head || echo "Warning: Migration failed, but continuing..."

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