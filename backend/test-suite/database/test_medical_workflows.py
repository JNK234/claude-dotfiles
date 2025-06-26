#!/usr/bin/env python3
"""
ABOUTME: End-to-end medical workflow testing with authenticated Supabase operations
ABOUTME: Tests case creation, medical stages, message handling, and report generation
"""

import sys
import os
import asyncio
from pathlib import Path
from datetime import datetime
import json

# Set up path for imports
backend_dir = str(Path(__file__).parent.parent.parent)
sys.path.insert(0, backend_dir)
os.environ['PYTHONPATH'] = backend_dir

async def test_medical_case_creation():
    """Test creating a medical case with authenticated user"""
    print("🏥 Testing Medical Case Creation...")
    
    from app.core.supabase import SupabaseService
    
    service = SupabaseService(use_service_role=True)
    
    # Create test case
    test_case_text = """
    Patient: 35-year-old male
    Chief Complaint: Chest pain and shortness of breath for 2 days
    History: No previous cardiac issues, non-smoker
    Vital Signs: BP 140/90, HR 95, RR 22, Temp 98.6°F
    """
    
    test_user_id = "test-user-medical-workflow"
    
    try:
        # Create case
        case = await service.create_case(test_user_id, test_case_text)
        print(f"✅ Case created: {case['id']}")
        print(f"   User ID: {case['user_id']}")
        print(f"   Current Stage: {case['current_stage']}")
        print(f"   Is Complete: {case['is_complete']}")
        
        # Verify case retrieval
        retrieved_case = await service.get_case(case['id'])
        assert retrieved_case is not None, "Case should be retrievable"
        assert retrieved_case['case_text'] == test_case_text, "Case text should match"
        print(f"✅ Case retrieval verified")
        
        return case
        
    except Exception as e:
        print(f"❌ Case creation failed: {e}")
        raise

async def test_medical_messages():
    """Test medical message workflows"""
    print("\n💬 Testing Medical Message Workflows...")
    
    from app.core.supabase import SupabaseService
    
    service = SupabaseService(use_service_role=True)
    
    # Create a test case first
    case = await test_medical_case_creation()
    case_id = case['id']
    
    try:
        # Create user message
        user_message = await service.create_message(
            case_id=case_id,
            role="user", 
            content="Doctor, I'm experiencing chest pain that started 2 days ago. It's getting worse."
        )
        print(f"✅ User message created: {user_message['id']}")
        
        # Create assistant message
        assistant_message = await service.create_message(
            case_id=case_id,
            role="assistant",
            content="I understand your concern. Based on your symptoms, I'd like to gather more information about the nature of your chest pain."
        )
        print(f"✅ Assistant message created: {assistant_message['id']}")
        
        # Retrieve all messages for case
        messages = await service.get_case_messages(case_id)
        print(f"✅ Retrieved {len(messages)} messages for case")
        
        assert len(messages) >= 2, "Should have at least 2 messages"
        assert any(msg['role'] == 'user' for msg in messages), "Should have user message"
        assert any(msg['role'] == 'assistant' for msg in messages), "Should have assistant message"
        
        return messages
        
    except Exception as e:
        print(f"❌ Message workflow failed: {e}")
        raise

async def test_medical_stages():
    """Test medical diagnosis stage workflows"""
    print("\n🔬 Testing Medical Diagnosis Stages...")
    
    from app.core.supabase import SupabaseService
    
    service = SupabaseService(use_service_role=True)
    
    # Create a test case first
    case = await test_medical_case_creation()
    case_id = case['id']
    
    # Define medical stages to test
    stages = [
        {
            "stage_name": "initial",
            "result": {
                "patient_info": "35-year-old male with chest pain",
                "chief_complaint": "Chest pain and shortness of breath",
                "duration": "2 days"
            }
        },
        {
            "stage_name": "symptom_analysis", 
            "result": {
                "symptoms": ["chest pain", "shortness of breath"],
                "severity": "moderate to severe",
                "onset": "2 days ago",
                "characteristics": "progressively worsening"
            }
        },
        {
            "stage_name": "differential_diagnosis",
            "result": {
                "potential_diagnoses": [
                    "Myocardial infarction",
                    "Pulmonary embolism", 
                    "Pneumonia",
                    "Costochondritis"
                ],
                "most_likely": "Myocardial infarction",
                "confidence": 0.75
            }
        }
    ]
    
    try:
        created_stages = []
        
        for stage in stages:
            stage_result = await service.create_stage_result(
                case_id=case_id,
                stage_name=stage["stage_name"],
                result=stage["result"],
                is_approved=False,
                provider="gemini",
                model_name="gemini-2.5-pro"
            )
            
            created_stages.append(stage_result)
            print(f"✅ Stage '{stage['stage_name']}' created: {stage_result['id']}")
        
        # Retrieve all stage results
        all_stages = await service.get_stage_results(case_id)
        print(f"✅ Retrieved {len(all_stages)} stage results")
        
        assert len(all_stages) >= 3, "Should have at least 3 stages"
        
        # Verify stage progression
        stage_names = [s['stage_name'] for s in all_stages]
        assert 'initial' in stage_names, "Should have initial stage"
        assert 'symptom_analysis' in stage_names, "Should have symptom analysis"
        assert 'differential_diagnosis' in stage_names, "Should have differential diagnosis"
        
        return all_stages
        
    except Exception as e:
        print(f"❌ Medical stages workflow failed: {e}")
        raise

async def test_user_profiles():
    """Test user profile management"""
    print("\n👤 Testing User Profile Management...")
    
    from app.core.supabase import SupabaseService
    
    service = SupabaseService(use_service_role=True)
    
    test_user_id = "test-doctor-profile"
    test_email = "doctor.test@medhastra.ai"
    
    try:
        # Create user profile
        profile = await service.create_user_profile(
            user_id=test_user_id,
            email=test_email,
            first_name="Dr. Test",
            last_name="Physician", 
            role="doctor",
            is_onboarded=True
        )
        print(f"✅ Profile created: {profile['id']}")
        print(f"   Email: {profile['email']}")
        print(f"   Role: {profile['role']}")
        
        # Retrieve profile
        retrieved_profile = await service.get_user_profile(test_user_id)
        assert retrieved_profile is not None, "Profile should be retrievable"
        assert retrieved_profile['email'] == test_email, "Email should match"
        print(f"✅ Profile retrieval verified")
        
        # Update profile
        updates = {
            "first_name": "Dr. Updated",
            "is_onboarded": True
        }
        updated_profile = await service.update_user_profile(test_user_id, updates)
        assert updated_profile['first_name'] == "Dr. Updated", "Profile should be updated"
        print(f"✅ Profile update verified")
        
        return updated_profile
        
    except Exception as e:
        print(f"❌ User profile workflow failed: {e}")
        raise

async def test_case_management():
    """Test complete case management workflow"""
    print("\n📋 Testing Complete Case Management...")
    
    from app.core.supabase import SupabaseService
    
    service = SupabaseService(use_service_role=True)
    
    test_user_id = "test-case-management-user"
    
    try:
        # Create multiple cases
        cases = []
        for i in range(3):
            case = await service.create_case(
                test_user_id, 
                f"Test case {i+1}: Medical scenario {i+1}"
            )
            cases.append(case)
        
        print(f"✅ Created {len(cases)} test cases")
        
        # Retrieve user cases
        user_cases = await service.get_user_cases(test_user_id)
        print(f"✅ Retrieved {len(user_cases)} cases for user")
        
        assert len(user_cases) >= 3, "Should have at least 3 cases"
        
        # Update case status
        case_to_update = cases[0]
        updates = {
            "current_stage": "diagnosis",
            "is_complete": True
        }
        updated_case = await service.update_case(
            case_to_update['id'], 
            updates,
            test_user_id
        )
        assert updated_case['current_stage'] == "diagnosis", "Stage should be updated"
        assert updated_case['is_complete'] == True, "Case should be marked complete"
        print(f"✅ Case update verified")
        
        return user_cases
        
    except Exception as e:
        print(f"❌ Case management workflow failed: {e}")
        raise

async def test_health_checks():
    """Test database health and connectivity"""
    print("\n🔍 Testing Database Health Checks...")
    
    from app.core.supabase import SupabaseService
    
    service = SupabaseService(use_service_role=True)
    
    try:
        health_result = await service.health_check()
        print(f"✅ Health check result: {health_result}")
        
        assert health_result['status'] == 'healthy', "Database should be healthy"
        assert health_result['service'] == 'supabase', "Should be Supabase service"
        assert health_result['connection'] == 'successful', "Connection should be successful"
        
        return health_result
        
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        raise

def generate_test_summary(results):
    """Generate comprehensive test summary"""
    print("\n" + "="*80)
    print("🏥 MEDICAL WORKFLOW TEST SUMMARY")
    print("="*80)
    
    print(f"Timestamp: {datetime.now().isoformat()}")
    print(f"Total Tests: {len(results)}")
    print(f"Passed: {sum(1 for r in results if r['status'] == 'passed')}")
    print(f"Failed: {sum(1 for r in results if r['status'] == 'failed')}")
    
    print("\n📊 Test Results:")
    for result in results:
        status_icon = "✅" if result['status'] == 'passed' else "❌"
        print(f"{status_icon} {result['test_name']}: {result['message']}")
        
        if result['status'] == 'failed' and result.get('error'):
            print(f"   Error: {result['error']}")
    
    overall_status = "PASSED" if all(r['status'] == 'passed' for r in results) else "FAILED"
    print(f"\n🎯 Overall Status: {overall_status}")
    
    if overall_status == "PASSED":
        print("\n🎉 All medical workflows are working correctly!")
        print("✅ Ready for streaming integration (Phase 3)")
    else:
        print("\n⚠️ Some workflows failed - needs attention before streaming integration")
    
    return overall_status

async def main():
    """Run all medical workflow tests"""
    print("🚀 Starting Medical Workflow Integration Tests...")
    print("="*80)
    
    results = []
    
    # Define tests to run
    tests = [
        ("Database Health Check", test_health_checks),
        ("User Profile Management", test_user_profiles), 
        ("Medical Case Creation", test_medical_case_creation),
        ("Medical Message Workflows", test_medical_messages),
        ("Medical Diagnosis Stages", test_medical_stages),
        ("Complete Case Management", test_case_management)
    ]
    
    for test_name, test_func in tests:
        try:
            print(f"\n🔄 Running: {test_name}")
            await test_func()
            results.append({
                "test_name": test_name,
                "status": "passed", 
                "message": "All assertions passed"
            })
            print(f"✅ {test_name}: PASSED")
            
        except Exception as e:
            results.append({
                "test_name": test_name,
                "status": "failed",
                "message": f"Test failed: {str(e)}",
                "error": str(e)
            })
            print(f"❌ {test_name}: FAILED - {e}")
    
    # Generate summary
    overall_status = generate_test_summary(results)
    
    return overall_status == "PASSED"

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)