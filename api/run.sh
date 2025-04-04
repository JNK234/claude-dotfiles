#!/bin/bash

# Function to display help
function show_help {
    echo "Usage: ./run.sh [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help        Show this help message"
    echo "  -d, --dev         Run in development mode with auto-reload"
    echo "  -p, --prod        Run in production mode"
    echo "  --docker          Run using Docker Compose"
    echo "  --docker-build    Rebuild Docker images and run"
    echo "  --port PORT       Specify port (default: 8000)"
    echo ""
    echo "Examples:"
    echo "  ./run.sh -d                # Run in development mode"
    echo "  ./run.sh -p --port 9000    # Run in production mode on port 9000"
    echo "  ./run.sh --docker          # Run using Docker Compose"
}

# Default values
MODE="dev"
PORT=8000
USE_DOCKER=false
REBUILD_DOCKER=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -d|--dev)
            MODE="dev"
            shift
            ;;
        -p|--prod)
            MODE="prod"
            shift
            ;;
        --docker)
            USE_DOCKER=true
            shift
            ;;
        --docker-build)
            USE_DOCKER=true
            REBUILD_DOCKER=true
            shift
            ;;
        --port)
            PORT=$2
            shift
            shift
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Warning: .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "Please edit .env file with your configuration"
fi

# Create necessary directories
mkdir -p reports static

# Run the application
if [ "$USE_DOCKER" = true ]; then
    # Run using Docker Compose
    if [ "$REBUILD_DOCKER" = true ]; then
        echo "Building Docker images and running..."
        docker-compose up --build
    else
        echo "Running using Docker Compose..."
        docker-compose up
    fi
else
    # Run using Uvicorn directly
    if [ "$MODE" = "dev" ]; then
        echo "Running in development mode on port $PORT..."
        uvicorn app.main:app --reload --host 0.0.0.0 --port $PORT
    else
        echo "Running in production mode on port $PORT..."
        uvicorn app.main:app --host 0.0.0.0 --port $PORT
    fi
fi