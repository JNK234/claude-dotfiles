"""
Tests for case management endpoints
"""
import pytest
import uuid
from fastapi import status

class TestCasesRouter:
    """
    Tests for cases router
    """
    
    def test_list_cases_empty(self, auth_client, test_db):
        """
        Test listing cases when there are no cases
        """
        # Act
        response = auth_client.get("/api/cases")
        
        # Assert
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total"] == 0
        assert len(data["cases"]) == 0
        
    def test_list_cases(self, auth_client, test_db, test_user, monkeypatch):
        """
        Test listing cases when there are cases
        """
        # Arrange - Create test cases
        from app.models.user import User
        from app.models.case import Case
        
        # Get user_id from database
        user = test_db.query(User).filter(User.email == test_user["email"]).first()
        
        # Create test cases
        for i in range(3):
            case = Case(
                user_id=user.id,
                case_text=f"Test case {i}",
                current_stage="initial"
            )
            test_db.add(case)
        
        test_db.commit()
        
        # Act
        response = auth_client.get("/api/cases")
        
        # Assert
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total"] == 3
        assert len(data["cases"]) == 3
        
    def test_create_case(self, auth_client):
        """
        Test creating a new case
        """
        # Arrange
        case_data = {
            "case_text": "Patient presents with fever, cough, and shortness of breath for 3 days."
        }
        
        # Act
        response = auth_client.post("/api/cases", json=case_data)
        
        # Assert
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["case_text"] == case_data["case_text"]
        assert data["current_stage"] == "initial"
        assert data["is_complete"] is False
        assert "id" in data
        assert "user_id" in data
        assert "created_at" in data
        
    def test_get_case(self, auth_client, test_db, test_user):
        """
        Test getting a case by ID
        """
        # Arrange - Create test case
        from app.models.user import User
        from app.models.case import Case
        
        # Get user_id from database
        user = test_db.query(User).filter(User.email == test_user["email"]).first()
        
        # Create test case
        case = Case(
            user_id=user.id,
            case_text="Test case for retrieval",
            current_stage="initial"
        )
        test_db.add(case)
        test_db.commit()
        test_db.refresh(case)
        
        # Act
        response = auth_client.get(f"/api/cases/{case.id}")
        
        # Assert
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == str(case.id)
        assert data["case_text"] == "Test case for retrieval"
        assert data["current_stage"] == "initial"
        
    def test_get_case_not_found(self, auth_client):
        """
        Test getting a non-existent case
        """
        # Arrange
        non_existent_id = str(uuid.uuid4())
        
        # Act
        response = auth_client.get(f"/api/cases/{non_existent_id}")
        
        # Assert
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "detail" in response.json()
        assert f"Case with ID {non_existent_id} not found" in response.json()["detail"]
        
    def test_delete_case(self, auth_client, test_db, test_user):
        """
        Test deleting a case
        """
        # Arrange - Create test case
        from app.models.user import User
        from app.models.case import Case
        
        # Get user_id from database
        user = test_db.query(User).filter(User.email == test_user["email"]).first()
        
        # Create test case
        case = Case(
            user_id=user.id,
            case_text="Test case for deletion",
            current_stage="initial"
        )
        test_db.add(case)
        test_db.commit()
        test_db.refresh(case)
        
        # Act
        response = auth_client.delete(f"/api/cases/{case.id}")
        
        # Assert
        assert response.status_code == status.HTTP_204_NO_CONTENT
        
        # Verify case is deleted
        get_response = auth_client.get(f"/api/cases/{case.id}")
        assert get_response.status_code == status.HTTP_404_NOT_FOUND
        
    def test_delete_case_not_found(self, auth_client):
        """
        Test deleting a non-existent case
        """
        # Arrange
        non_existent_id = str(uuid.uuid4())
        
        # Act
        response = auth_client.delete(f"/api/cases/{non_existent_id}")
        
        # Assert
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "detail" in response.json()
        assert f"Case with ID {non_existent_id} not found" in response.json()["detail"]
        
    def test_unauthorized_access(self, client):
        """
        Test accessing cases without authentication
        """
        # Act
        list_response = client.get("/api/cases")
        create_response = client.post("/api/cases", json={"case_text": "Test"})
        get_response = client.get(f"/api/cases/{uuid.uuid4()}")
        delete_response = client.delete(f"/api/cases/{uuid.uuid4()}")
        
        # Assert
        assert list_response.status_code == status.HTTP_401_UNAUTHORIZED
        assert create_response.status_code == status.HTTP_401_UNAUTHORIZED
        assert get_response.status_code == status.HTTP_401_UNAUTHORIZED
        assert delete_response.status_code == status.HTTP_401_UNAUTHORIZED
