# InferenceMD API Documentation

This document provides detailed information about the InferenceMD API endpoints and their usage.

## Base URL

All API endpoints are prefixed with `/api`.

## Authentication

The API uses JWT (JSON Web Token) authentication. To access protected endpoints, you need to include the token in the `Authorization` header:

```
Authorization: Bearer <token>
```

### Endpoints

#### Login

```
POST /api/auth/login
```

Authenticates a user and returns a JWT token.

**Request Body:**
```json
{
  "username": "doctor@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

#### Get Current User

```
GET /api/auth/me
```

Returns information about the currently authenticated user.

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "doctor@example.com",
  "name": "Demo Doctor",
  "is_active": true,
  "role": "doctor",
  "created_at": "2023-01-01T00:00:00Z"
}
```

## Cases

### List Cases

```
GET /api/cases
```

Returns a list of cases for the current user.

**Query Parameters:**
- `skip`: Number of records to skip (default: 0)
- `limit`: Maximum number of records to return (default: 100)

**Response:**
```json
{
  "cases": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "user_id": "123e4567-e89b-12d3-a456-426614174000",
      "case_text": "Patient case description...",
      "current_stage": "extraction",
      "is_complete": false,
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T01:00:00Z"
    }
  ],
  "total": 1
}
```

### Create Case

```
POST /api/cases
```

Creates a new case.

**Request Body:**
```json
{
  "case_text": "Patient is a 45-year-old male presenting with severe abdominal pain..."
}
```

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "case_text": "Patient is a 45-year-old male presenting with severe abdominal pain...",
  "current_stage": "initial",
  "is_complete": false,
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z"
}
```

### Get Case

```
GET /api/cases/{case_id}
```

Returns a specific case.

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "case_text": "Patient case description...",
  "current_stage": "extraction",
  "is_complete": false,
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T01:00:00Z"
}
```

### Delete Case

```
DELETE /api/cases/{case_id}
```

Deletes a specific case.

**Response:**
- Status Code: 204 No Content

## Workflow

### Start Workflow

```
POST /api/cases/{case_id}/workflow/start
```

Starts the diagnosis workflow for a case.

**Response:**
```json
{
  "stage_name": "initial",
  "result": {
    "case_text": "Patient case description...",
    "next_stage": "extraction"
  },
  "is_approved": false,
  "next_stage": "extraction"
}
```

### Process Stage

```
POST /api/cases/{case_id}/workflow/stages/{stage_name}/process
```

Processes a specific stage in the diagnosis workflow.

**Request Body:**
```json
{
  "input_text": "Additional information for the stage..."
}
```

**Response:**
```json
{
  "stage_name": "extraction",
  "result": {
    "extracted_factors": "Factors extracted from the case...",
    "next_stage": "causal_analysis"
  },
  "is_approved": false,
  "next_stage": "causal_analysis"
}
```

### Approve Stage

```
POST /api/cases/{case_id}/workflow/stages/{stage_name}/approve
```

Approves a stage and moves to the next stage.

**Response:**
```json
{
  "stage_name": "extraction",
  "result": {
    "stage_name": "extraction",
    "is_approved": true,
    "next_stage": "causal_analysis",
    "message": "Stage extraction approved. Moving to causal_analysis."
  },
  "is_approved": true,
  "next_stage": "causal_analysis"
}
```

## Messages

### List Messages

```
GET /api/cases/{case_id}/messages
```

Returns a list of messages for a case.

**Query Parameters:**
- `skip`: Number of records to skip (default: 0)
- `limit`: Maximum number of records to return (default: 100)

**Response:**
```json
{
  "messages": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "case_id": "123e4567-e89b-12d3-a456-426614174000",
      "role": "user",
      "content": "Message content...",
      "created_at": "2023-01-01T00:00:00Z"
    },
    {
      "id": "123e4567-e89b-12d3-a456-426614174001",
      "case_id": "123e4567-e89b-12d3-a456-426614174000",
      "role": "assistant",
      "content": "Response content...",
      "created_at": "2023-01-01T00:00:01Z"
    }
  ],
  "total": 2
}
```

### Create Message

```
POST /api/cases/{case_id}/messages
```

Creates a new message for a case.

**Request Body:**
```json
{
  "role": "user",
  "content": "Message content..."
}
```

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "case_id": "123e4567-e89b-12d3-a456-426614174000",
  "role": "user",
  "content": "Message content...",
  "created_at": "2023-01-01T00:00:00Z"
}
```

## Reports

### Generate Report

```
POST /api/cases/{case_id}/reports
```

Generates a report for a case.

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "case_id": "123e4567-e89b-12d3-a456-426614174000",
  "file_path": "/app/reports/report_123e4567-e89b-12d3-a456-426614174000_20230101000000.pdf",
  "created_at": "2023-01-01T00:00:00Z"
}
```

### Get Report

```
GET /api/cases/{case_id}/reports/{report_id}
```

Returns the report file.

**Response:**
- Content-Type: application/pdf or text/markdown
- Content-Disposition: attachment; filename=report_123e4567-e89b-12d3-a456-426614174000.pdf
- Body: Binary file content