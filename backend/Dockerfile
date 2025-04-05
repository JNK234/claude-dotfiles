FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    wget \
    pandoc \
    wkhtmltopdf \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY ./app ./app

# Create folders
RUN mkdir -p reports static

# Set environment variables
ENV PYTHONPATH=/app
ENV PORT=8001

# Expose port
EXPOSE ${PORT}

# Run the application using Gunicorn with Uvicorn workers
# Gunicorn will automatically bind to 0.0.0.0 and the PORT environment variable provided by Render (default 10000)
# -w 4: Number of worker processes (adjust based on Render plan resources)
# -k uvicorn.workers.UvicornWorker: Use Uvicorn for ASGI compatibility
# app.main:app: Path to the FastAPI application instance
CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "app.main:app"]
