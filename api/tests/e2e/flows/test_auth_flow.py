"""
End-to-end tests for authentication flow
"""
import pytest
from fastapi import status
from fastapi.testclient import TestClient

from app.core.security import get_password_hash
from app.main import app
from app.models.user import User

class TestAuthenticationFlow:
    """
    End-to-end tests for the authentication flow
    """
    
    @pytest.fixture
    def client(self):
        """
        Create a test client
        """
        return TestClient(app)
    
    @pytest.fixture
    def test_db(self):
        """
        Create a test database with a test user
        """
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        from sqlalchemy.pool import StaticPool
        from app.core.database import Base, get_db
        
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
    
    def test_full_auth_flow(self, client, test_db):
        """
        Test the complete authentication flow:
        1. Create user
        2. Login
        3. Access protected endpoint
        4. Verify user information
        """
        # Step 1: Create a test user
        test_user = {
            "email": "authflow@example.com",
            "name": "Auth Flow User",
            "password": "securepassword123"
        }
        
        # Add user to database
        db_user = User(
            email=test_user["email"],
            name=test_user["name"],
            hashed_password=get_password_hash(test_user["password"]),
            is_active=True,
            role="doctor"
        )
        test_db.add(db_user)
        test_db.commit()
        test_db.refresh(db_user)
        
        # Step 2: Login
        login_data = {
            "username": test_user["email"],
            "password": test_user["password"]
        }
        
        login_response = client.post("/api/auth/login", data=login_data)
        
        # Verify login successful
        assert login_response.status_code == status.HTTP_200_OK
        login_result = login_response.json()
        assert "access_token" in login_result
        assert login_result["token_type"] == "bearer"
        
        # Get token
        token = login_result["access_token"]
        
        # Step 3: Access protected endpoint with token
        headers = {"Authorization": f"Bearer {token}"}
        me_response = client.get("/api/auth/me", headers=headers)
        
        # Verify access successful
        assert me_response.status_code == status.HTTP_200_OK
        user_data = me_response.json()
        assert user_data["email"] == test_user["email"]
        assert user_data["name"] == test_user["name"]
        
        # Step 4: Access another protected endpoint (cases)
        cases_response = client.get("/api/cases", headers=headers)
        
        # Verify access successful
        assert cases_response.status_code == status.HTTP_200_OK
        cases_data = cases_response.json()
        assert "cases" in cases_data
        assert "total" in cases_data
        
        # Step 5: Try to access protected endpoint without token
        unauthorized_response = client.get("/api/auth/me")
        
        # Verify access denied
        assert unauthorized_response.status_code == status.HTTP_401_UNAUTHORIZED
