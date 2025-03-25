"""
Tests for workflow endpoints
"""
import pytest
import uuid
from unittest.mock import patch, MagicMock
from fastapi import status

from app.services.diagnosis_service import DiagnosisService

class TestWorkflowRouter:
    """
    Tests for workflow router
    """
    
    @pytest.fixture
    def test_case(self, auth_client, test_db, test_user):
        """
        Create a test case for workflow tests
        """
        from app.models.user import User
        from app.models.case import Case
        
        # Get user_id from database
        user = test_db.query(User).filter(User.email == test_user["email"]).first()
        
        # Create test case
        case = Case(
            user_id=user.id,
            case_text="Patient presents with fever, cough, and shortness of breath for 3 days.",
            current_stage="initial"
        )
        test_db.add(case)
        test_db.commit()
        test_db.refresh(case)
        
        return case
    
    @patch.object(DiagnosisService, 'process_stage')
    def test_start_workflow(self, mock_process_stage, auth_client, test_case):
        """
        Test starting a workflow
        """
        # Arrange
        mock_process_stage.return_value = {
            "case_text": "Patient presents with fever, cough, and shortness of breath for 3 days.",
            "next_stage": "extraction"
        }
        
        # Act
        response = auth_client.post(f"/api/cases/{test_case.id}/workflow/start")
        
        # Assert
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["stage_name"] == "initial"
        assert "result" in data
        assert data["is_approved"] is False
        assert data["next_stage"] == "extraction"
        
        # Verify mock called
        mock_process_stage.assert_called_once_with(str(test_case.id), 'initial')
    
    @patch.object(DiagnosisService, 'process_stage')
    def test_process_stage(self, mock_process_stage, auth_client, test_case):
        """
        Test processing a stage
        """
        # Arrange
        stage_name = "extraction"
        stage_data = {
            "input_text": "Additional information: The patient has a history of asthma."
        }
        
        mock_process_stage.return_value = {
            "extracted_factors": "Factors extracted from the case...",
            "next_stage": "causal_analysis"
        }
        
        # Act
        response = auth_client.post(
            f"/api/cases/{test_case.id}/workflow/stages/{stage_name}/process",
            json=stage_data
        )
        
        # Assert
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["stage_name"] == stage_name
        assert "result" in data
        assert data["is_approved"] is False
        assert data["next_stage"] == "causal_analysis"
        
        # Verify mock called
        mock_process_stage.assert_called_once_with(
            str(test_case.id), 
            stage_name, 
            stage_data["input_text"]
        )
    
    @patch.object(DiagnosisService, 'approve_stage')
    def test_approve_stage(self, mock_approve_stage, auth_client, test_case):
        """
        Test approving a stage
        """
        # Arrange
        stage_name = "extraction"
        
        mock_approve_stage.return_value = {
            "stage_name": stage_name,
            "is_approved": True,
            "next_stage": "causal_analysis",
            "message": "Stage extraction approved. Moving to causal_analysis."
        }
        
        # Act
        response = auth_client.post(
            f"/api/cases/{test_case.id}/workflow/stages/{stage_name}/approve"
        )
        
        # Assert
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["stage_name"] == stage_name
        assert data["is_approved"] is True
        assert data["next_stage"] == "causal_analysis"
        
        # Verify mock called
        mock_approve_stage.assert_called_once_with(str(test_case.id), stage_name)
    
    def test_start_workflow_case_not_found(self, auth_client):
        """
        Test starting a workflow for a non-existent case
        """
        # Arrange
        non_existent_id = str(uuid.uuid4())
        
        # Act
        response = auth_client.post(f"/api/cases/{non_existent_id}/workflow/start")
        
        # Assert
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "detail" in response.json()
        assert f"Case with ID {non_existent_id} not found" in response.json()["detail"]
    
    def test_process_stage_case_not_found(self, auth_client):
        """
        Test processing a stage for a non-existent case
        """
        # Arrange
        non_existent_id = str(uuid.uuid4())
        stage_name = "extraction"
        stage_data = {
            "input_text": "Additional information."
        }
        
        # Act
        response = auth_client.post(
            f"/api/cases/{non_existent_id}/workflow/stages/{stage_name}/process",
            json=stage_data
        )
        
        # Assert
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "detail" in response.json()
        assert f"Case with ID {non_existent_id} not found" in response.json()["detail"]
    
    def test_approve_stage_case_not_found(self, auth_client):
        """
        Test approving a stage for a non-existent case
        """
        # Arrange
        non_existent_id = str(uuid.uuid4())
        stage_name = "extraction"
        
        # Act
        response = auth_client.post(
            f"/api/cases/{non_existent_id}/workflow/stages/{stage_name}/approve"
        )
        
        # Assert
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "detail" in response.json()
        assert f"Case with ID {non_existent_id} not found" in response.json()["detail"]
    
    def test_unauthorized_access(self, client, test_case):
        """
        Test accessing workflow without authentication
        """
        # Act
        start_response = client.post(f"/api/cases/{test_case.id}/workflow/start")
        process_response = client.post(
            f"/api/cases/{test_case.id}/workflow/stages/extraction/process",
            json={"input_text": "Test"}
        )
        approve_response = client.post(
            f"/api/cases/{test_case.id}/workflow/stages/extraction/approve"
        )
        
        # Assert
        assert start_response.status_code == status.HTTP_401_UNAUTHORIZED
        assert process_response.status_code == status.HTTP_401_UNAUTHORIZED
        assert approve_response.status_code == status.HTTP_401_UNAUTHORIZED
