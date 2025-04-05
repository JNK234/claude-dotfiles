# InferenceMD API Architecture

This document provides an overview of the architecture of the InferenceMD API.

## Overview

The InferenceMD API is a FastAPI-based backend for a medical diagnosis system that uses causal inference with LLMs. It provides endpoints for user authentication, case management, diagnosis workflow, chat interaction, and report generation.

## Architecture Diagram

```
┌────────────────┐      ┌────────────────┐      ┌────────────────┐
│                │      │                │      │                │
│  React Frontend│◄────►│  FastAPI       │◄────►│  Database      │
│  (Three-panel  │      │  Backend       │      │  (SQLite)      │
│   Interface)   │      │                │      │                │
└────────────────┘      └───────┬────────┘      └────────────────┘
                                │
                                ▼
                    ┌────────────────────┐
                    │ External Services  │
                    │                    │
┌────────────────┐  │ ┌──────────────┐  │  ┌────────────────┐
│                │  │ │              │  │  │                │
│  Azure OpenAI  │◄─┼─┤ LLM Service  │  │  │  Report        │
│  Service       │  │ │              │  │  │  Generation    │
│                │  │ └──────────────┘  │  │                │
└────────────────┘  │                    │  └────────────────┘
                    └────────────────────┘
```

## Components

### Core Components

1. **Authentication**: JWT-based authentication for doctors
   - Handles user login and validation
   - Generates and validates JWT tokens
   - Provides user information

2. **Case Management**: CRUD operations for medical cases
   - Create new cases
   - List user cases
   - Get specific case details
   - Delete cases

3. **Workflow Engine**: Stage-based progression through diagnosis workflow
   - Manages the progression through diagnosis stages
   - Processes each stage using LLM
   - Tracks stage results and approvals

4. **LLM Integration**: Secure communication with Azure OpenAI
   - Handles communication with Azure OpenAI service
   - Formats prompts for different stages
   - Processes responses for structured output

5. **Report Generation**: Markdown and PDF generation from diagnosis results
   - Creates structured markdown reports
   - Converts markdown to PDF
   - Stores and retrieves reports

### Data Flow

1. **User Authentication**:
   - User sends login credentials
   - API validates credentials and generates JWT token
   - User includes token in subsequent requests

2. **Case Creation**:
   - User creates a new case with patient information
   - API stores case and assigns it to the user

3. **Diagnosis Workflow**:
   - User starts workflow for a case
   - API processes each stage sequentially
   - Each stage uses LLM to analyze case data
   - User reviews and approves each stage
   - Results from previous stages feed into subsequent stages

4. **Chat Interaction**:
   - User sends messages related to a case
   - API stores messages and potentially generates responses
   - Messages can provide additional information for stages

5. **Report Generation**:
   - User requests report generation
   - API combines all stage results into a markdown report
   - API converts markdown to PDF
   - User downloads the report

## Database Schema

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│    User     │      │    Case     │      │StageResult  │
├─────────────┤      ├─────────────┤      ├─────────────┤
│id           │──┐   │id           │──┐   │id           │
│email        │  │   │user_id      │◄─┘   │case_id      │◄─┐
│name         │  │   │case_text    │      │stage_name   │  │
│hashed_pass  │  │   │current_stage│  ┌──►│result       │  │
│is_active    │  │   │is_complete  │  │   │is_approved  │  │
│role         │  │   │created_at   │  │   │created_at   │  │
│created_at   │  │   │updated_at   │  │   │updated_at   │  │
└─────────────┘  │   └─────────────┘  │   └─────────────┘  │
                 │                    │                    │
                 │   ┌─────────────┐  │   ┌─────────────┐  │
                 │   │   Message   │  │   │   Report    │  │
                 │   ├─────────────┤  │   ├─────────────┤  │
                 │   │id           │  │   │id           │  │
                 │   │case_id      │◄─┘   │case_id      │◄─┘
                 │   │role         │      │file_path    │
                 │   │content      │      │created_at   │
                 │   │created_at   │      └─────────────┘
                 │   └─────────────┘
                 │
```

## Technologies Used

- **FastAPI**: Web framework for building APIs
- **SQLAlchemy**: ORM for database interactions
- **Pydantic**: Data validation and settings management
- **PyJWT**: JWT token handling
- **Azure OpenAI SDK**: LLM integration
- **Markdown**: Report generation format

## Security Considerations

- JWT-based authentication with proper expiration
- Password hashing using bcrypt
- Input validation using Pydantic schemas
- Database session management
- Error handling with minimal exposure

## Deployment

The application can be deployed using:

1. **Docker**: Containerized deployment using Docker Compose
2. **Virtual Environment**: Direct deployment in a Python virtual environment