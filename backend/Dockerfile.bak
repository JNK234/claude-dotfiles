FROM python:3.10-slim

# Set the working directory inside the container
WORKDIR /app

# Install system dependencies needed for report generation (pandoc, wkhtmltopdf)
# and potentially other build tools.
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
# Assumes Docker context is the repository root '.'
COPY ./backend/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend directory content into the /app working directory
# This makes the structure inside the container /app/app, /app/tests, etc.
COPY ./backend /app

# Debug - show directory structure after copy
RUN echo "===== Directory Structure in /app =====" && \
    find /app -maxdepth 2 -type d | sort && \
    echo "===== Files in /app/app/services =====" && \
    find /app/app/services -type f 2>/dev/null || echo "Directory /app/app/services not found or empty"

# Create necessary directories for runtime data (reports, notes)
# Static directory is now relative to /app (i.e., /app/static)
RUN mkdir -p /tmp/reports /tmp/notes ./static

# Set environment variables
# PYTHONPATH should point to the directory containing the top-level 'app' package, which is /app
ENV PYTHONPATH=/app
ENV PORT=8000

# Expose the port the app runs on
EXPOSE ${PORT}

# Command to run migrations and start the application using Gunicorn
# No 'cd' needed as WORKDIR is already /app. Chain commands correctly.
CMD alembic upgrade head && gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app
