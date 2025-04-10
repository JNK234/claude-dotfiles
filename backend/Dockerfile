FROM python:3.10-slim

# Essential environment variables only
ENV PYTHONPATH=/app \
    PORT=8000

WORKDIR /app

# Minimal dependencies
RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends \
    curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements first for caching
COPY ./backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY ./backend /app

# Create directories
RUN mkdir -p /tmp/reports /tmp/notes ./static

# Expose port
EXPOSE 8000

# Simple direct start without complex config
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT
