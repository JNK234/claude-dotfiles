# InferenceMD API

This is the API backend for the InferenceMD application, a medical diagnosis system using causal inference with LLMs.

## Features

- Authentication and user management
- Case management
- Medical diagnosis workflow
- Chat interaction
- Report generation (markdown and PDF)

## Getting Started

### Prerequisites

- Python 3.10+
- Docker (optional)

### Setup

1. Clone the repository
2. Create a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Create a `.env` file from the example:

```bash
cp .env.example .env
```

5. Update the `.env` file with your Azure OpenAI credentials

### Running the API

#### Without Docker

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### With Docker

```bash
docker-compose up -d
```

The API will be available at http://localhost:8000

### API Documentation

After starting the API, access the Swagger UI documentation at:

http://localhost:8000/docs

## API Structure

### Core Components

- **Authentication**: JWT-based authentication for doctors
- **Case Management**: CRUD operations for medical cases
- **Workflow Engine**: Stage-based progression through diagnosis workflow
- **LLM Integration**: Secure communication with Azure OpenAI
- **Report Generation**: Markdown and PDF generation from diagnosis results

### Main Endpoints

- **Authentication**: `/api/auth/login`
- **Cases**: `/api/cases`
- **Workflow**: `/api/cases/{case_id}/workflow`
- **Messages**: `/api/cases/{case_id}/messages`
- **Reports**: `/api/cases/{case_id}/reports`

## Development

### Project Structure

```
/app
  /core        # Core functionality (config, database, security)
  /models      # Database models
  /routers     # API routes
  /schemas     # Pydantic schemas
  /services    # Business logic
  main.py      # Application entry point
```

### Adding New Features

1. Create models in `/app/models/`
2. Create schemas in `/app/schemas/`
3. Create services in `/app/services/`
4. Create API routes in `/app/routers/`
5. Update the main application to include new routes

## License

This project is licensed under the MIT License.