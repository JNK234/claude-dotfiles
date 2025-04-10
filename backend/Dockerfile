FROM python:3.10-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app \
    PORT=8000

# Set the working directory inside the container
WORKDIR /app

# Install system dependencies needed for report generation and build tools
RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    wget \
    pandoc \
    wkhtmltopdf && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy only the requirements file first to leverage Docker cache
COPY ./backend/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend directory content
COPY ./backend /app

# Ensure alembic.ini has correct permissions and migrations directory exists
RUN chmod 644 /app/alembic.ini && \
    mkdir -p /app/app/migrations/versions && \
    chmod -R 755 /app/app/migrations

# Create necessary directories for runtime data
RUN mkdir -p /tmp/reports /tmp/notes ./static && \
    chown -R nobody:nogroup /tmp/reports /tmp/notes ./static

# Switch to non-root user for better security
USER nobody

# Add container health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Expose the port
EXPOSE ${PORT}

# Create Gunicorn config
RUN echo 'import multiprocessing\n\
workers = multiprocessing.cpu_count() * 2 + 1\n\
bind = "0.0.0.0:" + str(PORT)\n\
timeout = 120\n\
keepalive = 5\n\
worker_class = "uvicorn.workers.UvicornWorker"\n\
max_requests = 1000\n\
max_requests_jitter = 50\n\
graceful_timeout = 30\n\
forwarded_allow_ips = "*"' > /app/gunicorn.conf.py

# Command to run migrations and start the application
CMD alembic upgrade head && \
    gunicorn app.main:app -c /app/gunicorn.conf.py
