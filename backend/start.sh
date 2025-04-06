#!/bin/bash
set -e

echo "Starting InferenceMD backend..."

# Create required directories with proper permissions
mkdir -p /tmp/reports /tmp/notes /app/static
chmod 777 /tmp/reports /tmp/notes /app/static

# Run database migrations
echo "Running database migrations..."
cd /app
python -m alembic upgrade head

# Get port from environment or default to 8000
PORT=${PORT:-8000}
echo "Starting server on port $PORT..."

# Run the application with optimized settings
exec gunicorn \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:$PORT \
    --timeout 120 \
    --keep-alive 5 \
    --access-logfile - \
    --error-logfile - \
    app.main:app 