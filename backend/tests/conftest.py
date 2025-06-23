"""
Shared test configuration and fixtures.
"""
import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Set test environment variables before importing app modules
os.environ.update({
    "SUPABASE_URL": "https://test.supabase.co",
    "SUPABASE_ANON_KEY": "dummy_anon_key_for_testing",
    "SUPABASE_SERVICE_ROLE_KEY": "dummy_service_role_key_for_testing", 
    "SUPABASE_JWT_SECRET": "dummy_jwt_secret_for_testing",
    "SECRET_KEY": "test_secret_key_for_testing_only",
    "LLM_PROVIDER": "test",
    "LLM_MODEL_NAME": "test-model",
    "DEBUG": "true"
})

from app.core.database import Base, get_db
from app.core.security import get_password_hash
from app.models.user import User
from backend.app.main import app

# Test client
@pytest.fixture
def client():
    """
    Create a test client for testing endpoints
    
    Returns:
        TestClient: FastAPI test client
    """
    with TestClient(app) as test_client:
        yield test_client

# Database fixtures
@pytest.fixture
def test_db():
    """
    Create a test database for testing
    
    Yields:
        Session: SQLAlchemy session
    """
    # Create in-memory SQLite database
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    
    # Create tables
    Base.metadata.create_all(engine)
    
    # Create session
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # Override the get_db dependency
    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()
    
    # Set the override
    app.dependency_overrides[get_db] = override_get_db
    
    # Return a session for test setup
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(engine)
        
        # Reset dependency override
        app.dependency_overrides = {}

# Test user fixture
@pytest.fixture
def test_user(test_db):
    """
    Create a test user for authentication tests
    
    Args:
        test_db: Test database session
        
    Returns:
        dict: User credentials
    """
    user_data = {
        "email": "testuser@example.com",
        "name": "Test User",
        "password": "testpassword123",
    }
    
    # Create user in database
    user = User(
        email=user_data["email"],
        name=user_data["name"],
        hashed_password=get_password_hash(user_data["password"]),
        is_active=True,
        role="doctor"
    )
    
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    
    return user_data

# Test authenticated client fixture
@pytest.fixture
def auth_client(client, test_user):
    """
    Create an authenticated test client
    
    Args:
        client: Test client
        test_user: Test user credentials
        
    Returns:
        TestClient: Authenticated test client
    """
    # Login to get token
    login_data = {
        "username": test_user["email"],
        "password": test_user["password"],
    }
    
    response = client.post("/api/auth/login", data=login_data)
    token = response.json()["access_token"]
    
    # Set authorization header
    client.headers = {
        "Authorization": f"Bearer {token}"
    }
    
    return client
