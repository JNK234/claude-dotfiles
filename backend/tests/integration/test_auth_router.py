"""
Tests for authentication endpoints
"""
import pytest
from fastapi import status

from app.schemas.user import Token, User

class TestAuthRouter:
    """
    Tests for authentication router
    """
    
    def test_login_success(self, client, test_user):
        """
        Test successful login with valid credentials
        """
        # Arrange
        login_data = {
            "username": test_user["email"],
            "password": test_user["password"],
        }
        
        # Act
        response = client.post("/api/auth/login", data=login_data)
        
        # Assert
        assert response.status_code == status.HTTP_200_OK
        token = response.json()
        assert "access_token" in token
        assert token["token_type"] == "bearer"
        
    def test_login_invalid_email(self, client, test_user):
        """
        Test failed login with invalid email
        """
        # Arrange
        login_data = {
            "username": "wrong@example.com",
            "password": test_user["password"],
        }
        
        # Act
        response = client.post("/api/auth/login", data=login_data)
        
        # Assert
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "detail" in response.json()
        assert "Incorrect email or password" in response.json()["detail"]
        
    def test_login_invalid_password(self, client, test_user):
        """
        Test failed login with invalid password
        """
        # Arrange
        login_data = {
            "username": test_user["email"],
            "password": "wrongpassword",
        }
        
        # Act
        response = client.post("/api/auth/login", data=login_data)
        
        # Assert
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "detail" in response.json()
        assert "Incorrect email or password" in response.json()["detail"]
        
    def test_get_current_user(self, auth_client):
        """
        Test getting current user information
        """
        # Act
        response = auth_client.get("/api/auth/me")
        
        # Assert
        assert response.status_code == status.HTTP_200_OK
        user_data = response.json()
        assert user_data["email"] == "testuser@example.com"
        assert user_data["name"] == "Test User"
        
    def test_get_current_user_unauthorized(self, client):
        """
        Test getting current user without authentication
        """
        # Act
        response = client.get("/api/auth/me")
        
        # Assert
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "detail" in response.json()
        assert "Not authenticated" in response.json()["detail"]
        
    @pytest.mark.parametrize(
        "invalid_token", 
        [
            "invalid-token",
            "Bearer invalid-token",
            "Token valid-looking-but-fake-token"
        ]
    )
    def test_get_current_user_invalid_token(self, client, invalid_token):
        """
        Test getting current user with invalid token
        
        Args:
            invalid_token: Invalid token to test
        """
        # Arrange
        client.headers = {"Authorization": invalid_token}
        
        # Act
        response = client.get("/api/auth/me")
        
        # Assert
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "detail" in response.json()
        assert "Could not validate credentials" in response.json()["detail"]
