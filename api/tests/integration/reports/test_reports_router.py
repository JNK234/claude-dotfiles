"""
Tests for report endpoints
"""
import pytest
import uuid
import base64
from unittest.mock import patch, MagicMock
from fastapi import status

from app.services.report_service import ReportService

class TestReportsRouter:
    """
    Tests for reports router
    """
    
    @pytest.fixture
    def test_case_for_report(self, auth_client, test_db, test_user):
        """
        Create a test case for report generation
        """
        from app.models.user import User
        from app.models.case import Case
        
        # Get user_id from database
        user = test_db.query(User).filter(User.email == test_user["email"]).first()
        
        # Create test case in completed state
        case = Case(
            user_id=user.id,
            case_text="Patient presents with fever and cough.",
            current_stage="complete",
            is_complete=True
        )
        test_db.add(case)
        test_db.commit()
        test_db.refresh(case)
        
        return case
    
    @patch.object(ReportService, 'generate_report')
    def test_generate_report(self, mock_generate_report, auth_client, test_case_for_report):
        """
        Test generating a report
        """
        # Arrange
        report_id = uuid.uuid4()
        mock_generate_report.return_value = {
            "id": str(report_id),
            "case_id": str(test_case_for_report.id),
            "file_path": f"/app/reports/report_{report_id}.pdf",
            "markdown_path": f"/app/reports/report_{report_id}.md",
            "pdf_path": f"/app/reports/report_{report_id}.pdf",
            "created_at": "2025-03-23T12:00:00.000Z"
        }
        
        # Act
        response = auth_client.post(f"/api/cases/{test_case_for_report.id}/reports")
        
        # Assert
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["id"] == str(report_id)
        assert data["case_id"] == str(test_case_for_report.id)
        assert data["file_path"] == f"/app/reports/report_{report_id}.pdf"
        assert "created_at" in data
        
        # Verify mock called
        mock_generate_report.assert_called_once_with(str(test_case_for_report.id))
    
    @patch.object(ReportService, 'get_report')
    def test_get_report(self, mock_get_report, auth_client, test_case_for_report):
        """
        Test retrieving a report
        """
        # Arrange
        report_id = uuid.uuid4()
        mock_get_report.return_value = {
            "id": str(report_id),
            "case_id": str(test_case_for_report.id),
            "file_path": f"/app/reports/report_{report_id}.pdf",
            "content_type": "application/pdf",
            "created_at": "2025-03-23T12:00:00.000Z",
            "encoded_data": base64.b64encode(b"Test PDF content").decode('utf-8')
        }
        
        # Act
        response = auth_client.get(f"/api/cases/{test_case_for_report.id}/reports/{report_id}")
        
        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert response.headers["Content-Type"] == "application/pdf"
        assert response.headers["Content-Disposition"] == f"attachment; filename=report_{report_id}.pdf"
        
        # Verify mock called
        mock_get_report.assert_called_once_with(str(report_id))
    
    @patch.object(ReportService, 'generate_report')
    def test_generate_report_failure(self, mock_generate_report, auth_client, test_case_for_report):
        """
        Test report generation failure
        """
        # Arrange
        mock_generate_report.return_value = None
        
        # Act
        response = auth_client.post(f"/api/cases/{test_case_for_report.id}/reports")
        
        # Assert
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert "detail" in response.json()
        assert "Failed to generate report" in response.json()["detail"]
        
        # Verify mock called
        mock_generate_report.assert_called_once_with(str(test_case_for_report.id))
    
    @patch.object(ReportService, 'get_report')
    def test_get_report_failure(self, mock_get_report, auth_client, test_case_for_report):
        """
        Test report retrieval failure
        """
        # Arrange
        report_id = uuid.uuid4()
        mock_get_report.return_value = None
        
        # Act
        response = auth_client.get(f"/api/cases/{test_case_for_report.id}/reports/{report_id}")
        
        # Assert
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert "detail" in response.json()
        assert "Failed to retrieve report" in response.json()["detail"]
        
        # Verify mock called
        mock_get_report.assert_called_once_with(str(report_id))
    
    def test_generate_report_case_not_found(self, auth_client):
        """
        Test generating a report for a non-existent case
        """
        # Arrange
        non_existent_id = uuid.uuid4()
        
        # Act
        response = auth_client.post(f"/api/cases/{non_existent_id}/reports")
        
        # Assert
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "detail" in response.json()
        assert f"Case with ID {non_existent_id} not found" in response.json()["detail"]
    
    def test_get_report_case_not_found(self, auth_client):
        """
        Test retrieving a report for a non-existent case
        """
        # Arrange
        non_existent_case_id = uuid.uuid4()
        report_id = uuid.uuid4()
        
        # Act
        response = auth_client.get(f"/api/cases/{non_existent_case_id}/reports/{report_id}")
        
        # Assert
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "detail" in response.json()
        assert f"Case with ID {non_existent_case_id} not found" in response.json()["detail"]
    
    def test_get_report_not_found(self, auth_client, test_case_for_report, test_db):
        """
        Test retrieving a non-existent report
        """
        # Arrange
        non_existent_report_id = uuid.uuid4()
        
        # Act
        response = auth_client.get(f"/api/cases/{test_case_for_report.id}/reports/{non_existent_report_id}")
        
        # Assert
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "detail" in response.json()
        assert f"Report with ID {non_existent_report_id} not found" in response.json()["detail"]
    
    def test_unauthorized_access(self, client, test_case_for_report):
        """
        Test accessing reports without authentication
        """
        # Arrange
        report_id = uuid.uuid4()
        
        # Act
        generate_response = client.post(f"/api/cases/{test_case_for_report.id}/reports")
        get_response = client.get(f"/api/cases/{test_case_for_report.id}/reports/{report_id}")
        
        # Assert
        assert generate_response.status_code == status.HTTP_401_UNAUTHORIZED
        assert get_response.status_code == status.HTTP_401_UNAUTHORIZED
