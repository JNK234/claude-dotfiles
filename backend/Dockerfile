FROM python:3.10-slim

# Essential environment variables only
ENV PYTHONPATH=/app \
    PORT=8000 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install dependencies needed for report generation
RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    wget \
    pandoc \
    wkhtmltopdf && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements first for caching
COPY ./backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY ./backend /app

# Create directories
RUN mkdir -p /tmp/reports /tmp/notes ./static ./app/migrations/versions && \
    find /app -type d | sort && \
    ls -la /app/app/services

# Expose port
EXPOSE 8000

# Simple direct start with debug output
CMD echo "Current directory: $(pwd)" && \
    echo "Directory listing:" && \
    ls -la && \
    echo "Python path: $PYTHONPATH" && \
    echo "App services directory:" && \
    ls -la app/services && \
    echo "Starting server..." && \
    python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
