"""
Tests for message endpoints
"""
import pytest
import uuid
from unittest.mock import patch, MagicMock
from fastapi import status

from app.services.diagnosis_service import DiagnosisService

class TestMessagesRouter:
    """
    Tests for messages router
    """
    
    @pytest.fixture
    def test_case_with_messages(self, auth_client, test_db, test_user):
        """
        Create a test case with messages for testing
        """
        from app.models.user import User
        from app.models.case import Case, Message
        
        # Get user_id from database
        user = test_db.query(User).filter(User.email == test_user["email"]).first()
        
        # Create test case
        case = Case(
            user_id=user.id,
            case_text="Patient presents with fever and cough.",
            current_stage="initial"
        )
        test_db.add(case)
        test_db.commit()
        test_db.refresh(case)
        
        # Add test messages
        messages = [
            Message(
                case_id=case.id,
                role="user",
                content="How long has the patient had these symptoms?"
            ),
            Message(
                case_id=case.id,
                role="assistant",
                content="The patient has had symptoms for 3 days."
            )
        ]
        
        test_db.add_all(messages)
        test_db.commit()
        
        return case
    
    def test_list_messages(self, auth_client, test_case_with_messages):
        """
        Test listing messages for a case
        """
        # Act
        response = auth_client.get(f"/api/cases/{test_case_with_messages.id}/messages")
        
        # Assert
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total"] == 2
        assert len(data["messages"]) == 2
        assert data["messages"][0]["role"] == "user"
        assert data["messages"][1]["role"] == "assistant"
    
    def test_list_messages_empty(self, auth_client, test_db, test_user):
        """
        Test listing messages when there are no messages
        """
        # Arrange - Create test case without messages
        from app.models.user import User
        from app.models.case import Case
        
        # Get user_id from database
        user = test_db.query(User).filter(User.email == test_user["email"]).first()
        
        # Create test case
        case = Case(
            user_id=user.id,
            case_text="Test case without messages",
            current_stage="initial"
        )
        test_db.add(case)
        test_db.commit()
        test_db.refresh(case)
        
        # Act
        response = auth_client.get(f"/api/cases/{case.id}/messages")
        
        # Assert
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total"] == 0
        assert len(data["messages"]) == 0
    
    @patch.object(DiagnosisService, 'add_message')
    def test_create_message(self, mock_add_message, auth_client, test_case_with_messages):
        """
        Test creating a new message
        """
        # Arrange
        message_data = {
            "role": "user",
            "content": "Is there any history of asthma?"
        }
        
        # Mock the response
        mock_add_message.return_value = {
            "id": str(uuid.uuid4()),
            "case_id": str(test_case_with_messages.id),
            "role": message_data["role"],
            "content": message_data["content"],
            "created_at": "2025-03-23T12:00:00.000Z"
        }
        
        # Act
        response = auth_client.post(
            f"/api/cases/{test_case_with_messages.id}/messages",
            json=message_data
        )
        
        # Assert
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["role"] == message_data["role"]
        assert data["content"] == message_data["content"]
        assert "id" in data
        assert "case_id" in data
        assert "created_at" in data
        
        # Verify mock called
        mock_add_message.assert_called_once_with(
            str(test_case_with_messages.id),
            message_data["role"],
            message_data["content"]
        )
    
    def test_list_messages_case_not_found(self, auth_client):
        """
        Test listing messages for a non-existent case
        """
        # Arrange
        non_existent_id = str(uuid.uuid4())
        
        # Act
        response = auth_client.get(f"/api/cases/{non_existent_id}/messages")
        
        # Assert
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "detail" in response.json()
        assert f"Case with ID {non_existent_id} not found" in response.json()["detail"]
    
    def test_create_message_case_not_found(self, auth_client):
        """
        Test creating a message for a non-existent case
        """
        # Arrange
        non_existent_id = str(uuid.uuid4())
        message_data = {
            "role": "user",
            "content": "Test message"
        }
        
        # Act
        response = auth_client.post(
            f"/api/cases/{non_existent_id}/messages",
            json=message_data
        )
        
        # Assert
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "detail" in response.json()
        assert f"Case with ID {non_existent_id} not found" in response.json()["detail"]
    
    @patch.object(DiagnosisService, 'add_message')
    @patch.object(DiagnosisService, 'process_stage')
    def test_create_message_with_validation_response(self, mock_process_stage, mock_add_message, 
                                                 auth_client, test_db, test_user):
        """
        Test creating a user message during validation stage, which triggers an assistant response
        """
        # Arrange - Create test case in validation stage
        from app.models.user import User
        from app.models.case import Case
        
        # Get user_id from database
        user = test_db.query(User).filter(User.email == test_user["email"]).first()
        
        # Create test case in validation stage
        case = Case(
            user_id=user.id,
            case_text="Test case in validation stage",
            current_stage="validation"
        )
        test_db.add(case)
        test_db.commit()
        test_db.refresh(case)
        
        # Message data
        message_data = {
            "role": "user",
            "content": "The patient has a history of asthma."
        }
        
        # Mock the response for add_message
        mock_add_message.return_value = {
            "id": str(uuid.uuid4()),
            "case_id": str(case.id),
            "role": message_data["role"],
            "content": message_data["content"],
            "created_at": "2025-03-23T12:00:00.000Z"
        }
        
        # Act
        response = auth_client.post(
            f"/api/cases/{case.id}/messages",
            json=message_data
        )
        
        # Assert
        assert response.status_code == status.HTTP_201_CREATED
        
        # Verify mocks called - process_stage should be called for validation stage
        mock_process_stage.assert_called_once_with(str(case.id), "validation", message_data["content"])
        
        # Verify add_message called twice (once for user message, once for assistant response)
        assert mock_add_message.call_count == 2
    
    def test_unauthorized_access(self, client, test_case_with_messages):
        """
        Test accessing messages without authentication
        """
        # Act
        list_response = client.get(f"/api/cases/{test_case_with_messages.id}/messages")
        create_response = client.post(
            f"/api/cases/{test_case_with_messages.id}/messages",
            json={"role": "user", "content": "Test"}
        )
        
        # Assert
        assert list_response.status_code == status.HTTP_401_UNAUTHORIZED
        assert create_response.status_code == status.HTTP_401_UNAUTHORIZED
