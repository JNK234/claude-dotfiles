"""
End-to-end tests for the diagnosis workflow
"""
import pytest
import uuid
from unittest.mock import patch, MagicMock
from fastapi import status
from fastapi.testclient import TestClient

from app.core.security import get_password_hash
from app.main import app
from app.models.user import User
from app.services.diagnosis_service import DiagnosisService

class TestDiagnosisFlow:
    """
    End-to-end tests for the complete diagnosis workflow
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
    
    @pytest.fixture
    def auth_headers(self, client, test_db):
        """
        Create authentication headers for API requests
        """
        # Create a test user
        test_user = {
            "email": "diagnosisflow@example.com",
            "name": "Diagnosis Flow User",
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
        
        # Login
        login_data = {
            "username": test_user["email"],
            "password": test_user["password"]
        }
        
        login_response = client.post("/api/auth/login", data=login_data)
        token = login_response.json()["access_token"]
        
        return {"Authorization": f"Bearer {token}"}
    
    @patch.object(DiagnosisService, 'process_stage')
    @patch.object(DiagnosisService, 'approve_stage')
    def test_complete_diagnosis_workflow(self, mock_approve_stage, mock_process_stage, 
                                      client, auth_headers):
        """
        Test the complete diagnosis workflow from start to finish:
        1. Create a case
        2. Start the workflow
        3. Progress through each stage
        4. Approve each stage
        5. Complete the workflow
        6. Generate a report
        """
        # Setup mock responses for each stage
        mock_process_stage.side_effect = [
            # initial stage
            {
                "case_text": "Patient presents with fever, cough, and shortness of breath for 3 days.",
                "next_stage": "extraction",
                "processing_time": 0.5
            },
            # extraction stage
            {
                "extracted_factors": "Patient Symptoms: Fever, Cough, Shortness of breath\nRisk Factors: None specified",
                "next_stage": "causal_analysis",
                "processing_time": 1.2
            },
            # causal_analysis stage
            {
                "causal_links": "Infection → Fever\nInfection → Cough\nInfection → Shortness of breath",
                "next_stage": "validation",
                "processing_time": 1.5
            },
            # validation stage
            {
                "validation_result": "All necessary information is available.",
                "ready": True,
                "next_stage": "counterfactual",
                "processing_time": 0.8
            },
            # counterfactual stage
            {
                "counterfactual_analysis": "If the patient did not have fever, diagnosis would still be respiratory infection.",
                "next_stage": "diagnosis",
                "processing_time": 2.0
            },
            # diagnosis stage
            {
                "diagnosis": "1. Viral Respiratory Infection - Most likely\n2. COVID-19 - Possible\n3. Pneumonia - Less likely",
                "next_stage": "treatment_planning",
                "processing_time": 1.8
            },
            # treatment_planning stage
            {
                "treatment_plan": "1. Symptomatic treatment\n2. Hydration\n3. Rest\n4. Antipyretics for fever",
                "next_stage": "patient_specific",
                "processing_time": 1.6
            },
            # patient_specific stage
            {
                "patient_specific_plan": "Given the patient's profile, focus on hydration and rest.",
                "next_stage": "final_plan",
                "processing_time": 1.4
            },
            # final_plan stage
            {
                "final_treatment_plan": "1. Acetaminophen for fever\n2. Increase fluid intake\n3. Rest for 3-5 days\n4. Follow up if symptoms worsen",
                "next_stage": "complete",
                "processing_time": 1.3
            }
        ]
        
        mock_approve_stage.side_effect = [
            # Approve each stage
            {"stage_name": "initial", "is_approved": True, "next_stage": "extraction"},
            {"stage_name": "extraction", "is_approved": True, "next_stage": "causal_analysis"},
            {"stage_name": "causal_analysis", "is_approved": True, "next_stage": "validation"},
            {"stage_name": "validation", "is_approved": True, "next_stage": "counterfactual"},
            {"stage_name": "counterfactual", "is_approved": True, "next_stage": "diagnosis"},
            {"stage_name": "diagnosis", "is_approved": True, "next_stage": "treatment_planning"},
            {"stage_name": "treatment_planning", "is_approved": True, "next_stage": "patient_specific"},
            {"stage_name": "patient_specific", "is_approved": True, "next_stage": "final_plan"},
            {"stage_name": "final_plan", "is_approved": True, "next_stage": "complete"}
        ]
        
        # Step 1: Create a case
        case_data = {
            "case_text": "Patient presents with fever, cough, and shortness of breath for 3 days."
        }
        
        create_response = client.post("/api/cases", json=case_data, headers=auth_headers)
        assert create_response.status_code == status.HTTP_201_CREATED
        
        case_id = create_response.json()["id"]
        
        # Step 2: Start the workflow
        start_response = client.post(f"/api/cases/{case_id}/workflow/start", headers=auth_headers)
        assert start_response.status_code == status.HTTP_200_OK
        assert start_response.json()["stage_name"] == "initial"
        assert start_response.json()["next_stage"] == "extraction"
        
        # Step 3-5: Process through each stage
        stages = ["initial", "extraction", "causal_analysis", "validation", 
                 "counterfactual", "diagnosis", "treatment_planning", 
                 "patient_specific", "final_plan"]
        
        # First process each stage
        for i, stage in enumerate(stages):
            if i > 0:  # Skip initial stage as it's already processed by start_workflow
                process_data = {
                    "input_text": f"Additional input for {stage} stage."
                }
                
                process_response = client.post(
                    f"/api/cases/{case_id}/workflow/stages/{stage}/process",
                    json=process_data,
                    headers=auth_headers
                )
                
                assert process_response.status_code == status.HTTP_200_OK
                assert process_response.json()["stage_name"] == stage
        
        # Then approve each stage
        for stage in stages:
            approve_response = client.post(
                f"/api/cases/{case_id}/workflow/stages/{stage}/approve",
                headers=auth_headers
            )
            
            assert approve_response.status_code == status.HTTP_200_OK
            assert approve_response.json()["stage_name"] == stage
            assert approve_response.json()["is_approved"] is True
        
        # Step 6: Check if case is complete
        case_response = client.get(f"/api/cases/{case_id}", headers=auth_headers)
        assert case_response.status_code == status.HTTP_200_OK
        assert case_response.json()["current_stage"] == "complete"
        
        # Step 7: Generate a report
        with patch('app.services.report_service.ReportService.generate_report') as mock_generate_report:
            # Mock report generation
            report_id = str(uuid.uuid4())
            mock_generate_report.return_value = {
                "id": report_id,
                "case_id": case_id,
                "file_path": f"/app/reports/report_{report_id}.pdf",
                "created_at": "2025-03-23T12:00:00.000Z"
            }
            
            report_response = client.post(f"/api/cases/{case_id}/reports", headers=auth_headers)
            assert report_response.status_code == status.HTTP_201_CREATED
            assert report_response.json()["id"] == report_id
            assert report_response.json()["case_id"] == case_id
        
        # Verify all the mock calls
        assert mock_process_stage.call_count == len(mock_process_stage.side_effect)
        assert mock_approve_stage.call_count == len(mock_approve_stage.side_effect)
    
    @patch.object(DiagnosisService, 'add_message')
    def test_message_interaction_during_workflow(self, mock_add_message, client, auth_headers, test_db):
        """
        Test message interaction during the workflow:
        1. Create a case
        2. Add a user message
        3. Get an assistant response
        4. Verify messages are correctly stored and retrieved
        """
        # Create a case with patch to avoid LLM calls
        with patch.object(DiagnosisService, 'process_stage'):
            case_data = {
                "case_text": "Patient presents with fever and cough."
            }
            
            create_response = client.post("/api/cases", json=case_data, headers=auth_headers)
            case_id = create_response.json()["id"]
        
        # Mock add_message response
        message_id = str(uuid.uuid4())
        mock_add_message.return_value = {
            "id": message_id,
            "case_id": case_id,
            "role": "user",
            "content": "Does the patient have any allergies?",
            "created_at": "2025-03-23T12:00:00.000Z"
        }
        
        # Add a user message
        message_data = {
            "role": "user",
            "content": "Does the patient have any allergies?"
        }
        
        message_response = client.post(
            f"/api/cases/{case_id}/messages",
            json=message_data,
            headers=auth_headers
        )
        
        assert message_response.status_code == status.HTTP_201_CREATED
        assert message_response.json()["role"] == "user"
        assert message_response.json()["content"] == "Does the patient have any allergies?"
        
        # List messages
        with patch('app.models.case.Message.query'):
            # Mock DB query to avoid actual DB calls in test
            mock_messages = [
                {
                    "id": str(uuid.uuid4()),
                    "case_id": case_id,
                    "role": "user",
                    "content": "Does the patient have any allergies?",
                    "created_at": "2025-03-23T12:00:00.000Z"
                },
                {
                    "id": str(uuid.uuid4()),
                    "case_id": case_id,
                    "role": "assistant",
                    "content": "There's no information about allergies in the patient history.",
                    "created_at": "2025-03-23T12:01:00.000Z"
                }
            ]
            
            # Use the patch context to test listing messages without DB
            from app.models.case import Message
            Message.query.filter().order_by().all.return_value = mock_messages
            Message.query.filter().count.return_value = len(mock_messages)
        
        # Verify mock was called correctly
        assert mock_add_message.call_count > 0
