"""
DiagnosisService for handling the medical diagnosis workflow
"""
import logging
import time
from typing import Dict, List, Optional, Any, Union
import json, uuid

from sqlalchemy.orm import Session

from app.models.case import Case, StageResult, Message
from app.services.llm_service import LLMService
from app.services.prompts import (
    NODE_EXTRACTION_PROMPT,
    CAUSAL_ANALYSIS_PROMPT,
    VALIDATION_PROMPT,
    COUNTERFACTUAL_PROMPT,
    DIAGNOSIS_RANKING_PROMPT,
    TREATMENT_PROMPT,
    PATIENT_SPECIFIC_TREATMENT_PROMPT,
    FINAL_TREATMENT_PROMPT,
    CASE_ANALYSIS_SUMMARY_PROMPT,
    DIAGNOSIS_SUMMARY_PROMPT,
    TREATMENT_SUMMARY_PROMPT
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DiagnosisService:
    """
    Service for managing the medical diagnosis workflow
    """
    
    def __init__(self, db: Session):
        """
        Initialize the diagnosis service
        
        Args:
            db: Database session
        """
        self.db = db
        self.llm_service = LLMService()
        
        # Define the new consolidated stage sequence
        self.stage_sequence = [
            'patient_case_analysis_group',
            'diagnosis_group',
            'treatment_planning_group'
        ]
        
        # Define the backend stages that belong to each consolidated stage
        self.backend_stage_mapping = {
            'patient_case_analysis_group': ['initial', 'extraction', 'causal_analysis', 'validation'],
            'diagnosis_group': ['counterfactual', 'diagnosis'],
            'treatment_planning_group': ['treatment_planning', 'patient_specific', 'final_plan']
        }
        
        # Define which backend stage comes after each backend stage
        self.backend_stage_sequence = [
            'initial',
            'extraction',
            'causal_analysis',
            'validation',
            'counterfactual',
            'diagnosis',
            'treatment_planning',
            'patient_specific',
            'final_plan'
        ]
            
    def get_next_stage(self, current_stage: str) -> str:
        """
        Get the next stage in the workflow
        
        Args:
            current_stage: The current stage
            
        Returns:
            str: The next stage in the sequence
        """
        # Check if the current stage is a consolidated stage
        if current_stage in self.stage_sequence:
            try:
                current_index = self.stage_sequence.index(current_stage)
                if current_index < len(self.stage_sequence) - 1:
                    return self.stage_sequence[current_index + 1]
            except ValueError:
                logger.error(f"Invalid stage: {current_stage}")
        else:
            # It's a backend stage, get the next backend stage
            try:
                current_index = self.backend_stage_sequence.index(current_stage)
                if current_index < len(self.backend_stage_sequence) - 1:
                    return self.backend_stage_sequence[current_index + 1]
            except ValueError:
                logger.error(f"Invalid backend stage: {current_stage}")
        
        return current_stage
    
    def get_consolidated_stage(self, backend_stage: str) -> str:
        """
        Get the consolidated stage that a backend stage belongs to
        
        Args:
            backend_stage: The backend stage name
            
        Returns:
            str: The consolidated stage name
        """
        for consolidated_stage, backend_stages in self.backend_stage_mapping.items():
            if backend_stage in backend_stages:
                return consolidated_stage
        
        return backend_stage  # Return as-is if not found
    
    def get_stage_result(self, case_id: str, stage_name: str) -> Optional[Dict[str, Any]]:
        """
        Get the result of a stage for a case
        
        Args:
            case_id: Case ID
            stage_name: Stage name
            
        Returns:
            Optional[Dict[str, Any]]: Stage result or None if not found
        """
        # Query the stage result
        stage_result = self.db.query(StageResult).filter(
            StageResult.case_id == case_id,
            StageResult.stage_name == stage_name
        ).first()
        
        if stage_result:
            return stage_result.result
        
        return None
    
    def get_case_messages(self, case_id: str) -> List[Dict[str, str]]:
        """
        Get all messages for a case
        
        Args:
            case_id: Case ID
            
        Returns:
            List[Dict[str, str]]: List of messages
        """
        # Query messages
        messages = self.db.query(Message).filter(Message.case_id == case_id).order_by(Message.created_at).all()
        
        # Convert to list of dictionaries
        return [{"role": msg.role, "content": msg.content} for msg in messages]
    
    def generate_patient_case_analysis_summary(self, case_id: str) -> str:
        """
        Generate a markdown-formatted patient case analysis with questions
        
        Args:
            case_id: Case ID
            
        Returns:
            str: Formatted analysis with key findings and questions
        """
        # Get results from relevant stages
        extracted_factors = self.get_stage_result(case_id, 'extraction')
        causal_links = self.get_stage_result(case_id, 'causal_analysis')
        validation = self.get_stage_result(case_id, 'validation')
        
        # Extract content
        extracted_factors_text = extracted_factors.get('extracted_factors', '') if extracted_factors else ''
        causal_links_text = causal_links.get('causal_links', '') if causal_links else ''
        validation_text = validation.get('validation_result', '') if validation else ''
        
        # Generate markdown-formatted summary
        prompt = f"""
        Review the patient's details below, including the extracted factors, causal relationships, and validation insights.

Extracted Factors:

{extracted_factors_text}

Causal Links:

{causal_links_text}

Validation Results:

{validation_text}

Based on the validation results above, please provide a concise response summarizing your findings clearly. If there's any missing information or uncertainty, ask specific questions to fill those gaps. If all necessary details are available, confirm clearly that no further information is required.

Conclude your response by explicitly stating the current status based on the validation results, indicating if it's appropriate to proceed.
"""
        response = self.llm_service.generate(prompt)
        return response
    
    def generate_diagnosis_summary(self, case_id: str) -> str:
        """
        Generate a concise summary of the diagnosis stage
        
        Args:
            case_id: Case ID
            
        Returns:
            str: Summary of the diagnosis
        """
        # Get results from the relevant backend stages
        counterfactual = self.get_stage_result(case_id, 'counterfactual')
        diagnosis = self.get_stage_result(case_id, 'diagnosis')
        
        # Extract the content
        counterfactual_text = counterfactual.get('counterfactual_analysis', '') if counterfactual else ''
        diagnosis_text = diagnosis.get('diagnosis', '') if diagnosis else ''
        
        # Generate the summary
        prompt = DIAGNOSIS_SUMMARY_PROMPT
        response = self.llm_service.generate(
            prompt, 
            counterfactual_analysis=counterfactual_text,
            diagnosis=diagnosis_text
        )
        
        return response
    
    def generate_treatment_summary(self, case_id: str) -> str:
        """
        Generate a concise summary of the treatment planning stage
        
        Args:
            case_id: Case ID
            
        Returns:
            str: Summary of the treatment plan
        """
        # Get results from the relevant backend stages
        treatment_plan = self.get_stage_result(case_id, 'treatment_planning')
        patient_specific = self.get_stage_result(case_id, 'patient_specific')
        final_plan = self.get_stage_result(case_id, 'final_plan')
        
        # Extract the content
        treatment_plan_text = treatment_plan.get('treatment_plan', '') if treatment_plan else ''
        patient_specific_text = patient_specific.get('patient_specific_plan', '') if patient_specific else ''
        final_plan_text = final_plan.get('final_treatment_plan', '') if final_plan else ''
        
        # Generate the summary
        prompt = TREATMENT_SUMMARY_PROMPT
        response = self.llm_service.generate(
            prompt, 
            treatment_plan=treatment_plan_text,
            patient_specific_plan=patient_specific_text,
            final_treatment_plan=final_plan_text
        )
        
        return response
    
    def process_stage(self, case_id: str, stage_name: str, input_text: Optional[str] = None) -> Dict[str, Any]:
        """
        Process a stage in the diagnosis workflow
        
        Args:
            case_id: Case ID
            stage_name: Stage name (can be either a consolidated stage or a backend stage)
            input_text: Optional input text
            
        Returns:
            Dict[str, Any]: Stage result 
        """
        if case_id is None:
            raise Exception("Case ID is required")
        try:
            case_id = uuid.UUID(case_id)
        except ValueError:
            raise Exception("Case ID is invalid")
        
        # Get case
        case = self.db.query(Case).filter(Case.id == case_id).first()
        if not case:
            logger.error(f"Case not found: {case_id}")
            return {"error": f"Case not found: {case_id}"}
        
        # Get chat history
        chat_history = self.get_case_messages(case_id)
        
        # Create a timestamp for this processing
        start_time = time.time()
        
        # Initialize result
        result = {}
        
        # Check if this is a consolidated stage
        if stage_name in self.stage_sequence:
            # This is a consolidated stage, determine which backend stages to process
            if stage_name == 'patient_case_analysis_group':
                # Process initial, extraction, causal_analysis, and validation stages
                initial_result = self._process_backend_stage(case_id, 'initial', input_text, chat_history)
                extraction_result = self._process_backend_stage(case_id, 'extraction', input_text, chat_history)
                causal_result = self._process_backend_stage(case_id, 'causal_analysis', None, chat_history)
                validation_result = self._process_backend_stage(case_id, 'validation', None, chat_history)
                
                # Generate a concise summary for the chat panel
                summary = self.generate_patient_case_analysis_summary(case_id)
                
                result = {
                    'backend_results': {
                        'initial': initial_result,
                        'extraction': extraction_result,
                        'causal_analysis': causal_result,
                        'validation': validation_result
                    },
                    'summary': summary,
                    'next_stage': 'diagnosis'
                }
                
            elif stage_name == 'diagnosis_group':
                # Process counterfactual and diagnosis stages
                counterfactual_result = self._process_backend_stage(case_id, 'counterfactual', None, chat_history)
                diagnosis_result = self._process_backend_stage(case_id, 'diagnosis', input_text, chat_history)
            
                # Generate a concise summary for the chat panel
                summary = self.generate_diagnosis_summary(case_id)
                
                result = {
                    'backend_results': {
                        'counterfactual': counterfactual_result,
                        'diagnosis': diagnosis_result
                    },
                    'summary': summary,
                    'next_stage': 'treatment_planning'
                }
                
            elif stage_name == 'treatment_planning_group':
                # Process treatment_planning, patient_specific, and final_plan stages
                treatment_result = self._process_backend_stage(case_id, 'treatment_planning', None, chat_history)
                patient_specific_result = self._process_backend_stage(case_id, 'patient_specific', input_text, chat_history)
                final_plan_result = self._process_backend_stage(case_id, 'final_plan', None, chat_history)
                
                # Generate a concise summary for the chat panel
                summary = self.generate_treatment_summary(case_id)
                
                result = {
                    'backend_results': {
                        'treatment_planning': treatment_result,
                        'patient_specific': patient_specific_result,
                        'final_plan': final_plan_result
                    },
                    'summary': summary,
                    'next_stage': 'complete'
                }
                
                # Mark the case as complete
                case.is_complete = True
                self.db.commit()
        else:
            # This is a backend stage, process it directly
            result = self._process_backend_stage(case_id, stage_name, input_text, chat_history)
            
            # Update the consolidated stage result as well
            consolidated_stage = self.get_consolidated_stage(stage_name)
            if consolidated_stage != stage_name:
                logger.info(f"Updating consolidated stage {consolidated_stage} based on backend stage {stage_name}")
                
                # Get any existing consolidated stage result
                consolidated_result = self.get_stage_result(case_id, consolidated_stage) or {}
                
                # Initialize backend_results if needed
                if 'backend_results' not in consolidated_result:
                    consolidated_result['backend_results'] = {}
                
                # Update the backend result
                consolidated_result['backend_results'][stage_name] = result
                
                # Generate a summary based on the consolidated stage
                if consolidated_stage == 'patient_case_analysis_group':
                    consolidated_result['summary'] = self.generate_patient_case_analysis_summary(case_id)
                elif consolidated_stage == 'diagnosis_group':
                    consolidated_result['summary'] = self.generate_diagnosis_summary(case_id)
                elif consolidated_stage == 'treatment_planning_group':
                    consolidated_result['summary'] = self.generate_treatment_summary(case_id)
                
                # Determine the next stage (either the next consolidated stage or 'complete')
                next_consolidated_stage = self.get_next_stage(consolidated_stage)
                consolidated_result['next_stage'] = next_consolidated_stage
                
                # Save the consolidated stage result
                self._save_stage_result(case_id, consolidated_stage, consolidated_result)
        
        # Save stage result to database
        self._save_stage_result(case_id, stage_name, result)
        
        # Update case current stage
        case.current_stage = stage_name
        
        # Commit changes
        self.db.commit()
        
        # Add processing time to result
        result['processing_time'] = time.time() - start_time
        
        return result
    
    def _process_backend_stage(self, case_id: str, stage_name: str, input_text: Optional[str], chat_history: List[Dict[str, str]]) -> Dict[str, Any]:
        """
        Process a backend stage in the workflow (private helper method)
        
        Args:
            case_id: Case ID
            stage_name: Backend stage name
            input_text: Optional input text
            chat_history: Chat history
            
        Returns:
            Dict[str, Any]: Stage result
        """
        case = self.db.query(Case).filter(Case.id == case_id).first()
        
        # Initialize result
        result = {}
        
        # Process backend stage
        if stage_name == 'initial':
            # Just store the case text
            result = {
                'case_text': input_text or case.case_text,
                'next_stage': 'extraction'
            }
        
        elif stage_name == 'extraction':
            # Extract medical factors
            prompt = NODE_EXTRACTION_PROMPT
            case_text = input_text or case.case_text
            
            # Use chat history if available
            if chat_history:
                # Format the prompt with the case text
                formatted_prompt = prompt.format(case_text=case_text)
                
                # Create a system message with the formatted prompt
                messages = [{"role": "system", "content": formatted_prompt}]
                
                # Add the chat history
                messages.extend(chat_history)
                
                response = self.llm_service.generate_with_history(messages)
            else:
                response = self.llm_service.generate(prompt, case_text=case_text)
            
            result = {
                'extracted_factors': response,
                'next_stage': 'causal_analysis'
            }
        
        elif stage_name == 'causal_analysis':
            # Analyze causal relationships
            prompt = CAUSAL_ANALYSIS_PROMPT
            
            # Get extracted factors from previous stage
            extracted_factors = self.get_stage_result(case_id, 'extraction')
            if extracted_factors and 'extracted_factors' in extracted_factors:
                extracted_factors_text = extracted_factors['extracted_factors']
            else:
                extracted_factors_text = input_text or ""
            
            # Use chat history if available
            if chat_history:
                # Format the prompt with the extracted factors
                formatted_prompt = prompt.format(extracted_factors=extracted_factors_text)
                
                # Create a system message with the formatted prompt
                messages = [{"role": "system", "content": formatted_prompt}]
                
                # Add the chat history
                messages.extend(chat_history)
                
                response = self.llm_service.generate_with_history(messages)
            else:
                response = self.llm_service.generate(prompt, extracted_factors=extracted_factors_text)
            
            result = {
                'causal_links': response,
                'next_stage': 'validation'
            }
        
        elif stage_name == 'validation':
            # Validate information completeness
            prompt = VALIDATION_PROMPT
            
            # Combine extracted factors and causal links
            extracted_factors = self.get_stage_result(case_id, 'extraction')
            causal_links = self.get_stage_result(case_id, 'causal_analysis')
            
            extracted_factors_text = extracted_factors.get('extracted_factors', '') if extracted_factors else ''
            causal_links_text = causal_links.get('causal_links', '') if causal_links else ''
            
            combined_context = f"Extracted Factors:\n{extracted_factors_text}\n\nCausal Links:\n{causal_links_text}"
            
            # If additional input is provided, add it to the context
            if input_text:
                combined_context += f"\n\nAdditional Information:\n{input_text}"
            
            # Use chat history if available
            if chat_history:
                # Format the prompt with the combined context
                formatted_prompt = prompt.format(combined_context=combined_context)
                
                # Create a system message with the formatted prompt
                messages = [{"role": "system", "content": formatted_prompt}]
                
                # Add the chat history
                messages.extend(chat_history)
                
                response = self.llm_service.generate_with_history(messages)
            else:
                response = self.llm_service.generate(prompt, combined_context=combined_context)
            
            # Check if the response indicates readiness to proceed
            ready_to_proceed = "✅ Yes" in response
            
            result = {
                'validation_result': response,
                'ready': ready_to_proceed,
                'next_stage': 'counterfactual' if ready_to_proceed else 'validation'
            }
        
        elif stage_name == 'counterfactual':
            # Perform counterfactual analysis
            prompt = COUNTERFACTUAL_PROMPT
            
            # Combine all previous results
            extracted_factors = self.get_stage_result(case_id, 'extraction')
            causal_links = self.get_stage_result(case_id, 'causal_analysis')
            validation_result = self.get_stage_result(case_id, 'validation')
            
            extracted_factors_text = extracted_factors.get('extracted_factors', '') if extracted_factors else ''
            causal_links_text = causal_links.get('causal_links', '') if causal_links else ''
            validation_result_text = validation_result.get('validation_result', '') if validation_result else ''
            
            combined_context = f"Extracted Factors:\n{extracted_factors_text}\n\nCausal Links:\n{causal_links_text}\n\nValidation:\n{validation_result_text}"
            
            # Use chat history if available
            if chat_history:
                # Format the prompt with the combined context
                formatted_prompt = prompt.format(combined_context=combined_context)
                
                # Create a system message with the formatted prompt
                messages = [{"role": "system", "content": formatted_prompt}]
                
                # Add the chat history
                messages.extend(chat_history)
                
                response = self.llm_service.generate_with_history(messages)
            else:
                response = self.llm_service.generate(prompt, combined_context=combined_context)
            
            result = {
                'counterfactual_analysis': response,
                'next_stage': 'diagnosis'
            }
        
        elif stage_name == 'diagnosis':
            # Generate diagnosis ranking
            prompt = DIAGNOSIS_RANKING_PROMPT
            
            # Get counterfactual analysis from previous stage
            counterfactual = self.get_stage_result(case_id, 'counterfactual')
            counterfactual_text = counterfactual.get('counterfactual_analysis', '') if counterfactual else (input_text or "")
            
            # Use chat history if available
            if chat_history:
                # Format the prompt with the counterfactual analysis
                formatted_prompt = prompt.format(counterfactual_analysis=counterfactual_text)
                
                # Create a system message with the formatted prompt
                messages = [{"role": "system", "content": formatted_prompt}]
                
                # Add the chat history
                messages.extend(chat_history)
                
                response = self.llm_service.generate_with_history(messages)
            else:
                response = self.llm_service.generate(prompt, counterfactual_analysis=counterfactual_text)
            
            result = {
                'diagnosis': response,
                'next_stage': 'treatment_planning'
            }
        
        elif stage_name == 'treatment_planning':
            # Generate treatment plan
            prompt = TREATMENT_PROMPT
            
            # Get diagnosis from previous stage
            diagnosis = self.get_stage_result(case_id, 'diagnosis')
            diagnosis_text = diagnosis.get('diagnosis', '') if diagnosis else (input_text or "")
            
            # Use chat history if available
            if chat_history:
                # Format the prompt with the diagnosis
                formatted_prompt = prompt.format(diagnosis=diagnosis_text)
                
                # Create a system message with the formatted prompt
                messages = [{"role": "system", "content": formatted_prompt}]
                
                # Add the chat history
                messages.extend(chat_history)
                
                response = self.llm_service.generate_with_history(messages)
            else:
                response = self.llm_service.generate(prompt, diagnosis=diagnosis_text)
            
            result = {
                'treatment_plan': response,
                'next_stage': 'patient_specific'
            }
        
        elif stage_name == 'patient_specific':
            # Generate patient-specific treatment plan
            prompt = PATIENT_SPECIFIC_TREATMENT_PROMPT
            
            # Combine diagnosis and treatment plan
            diagnosis = self.get_stage_result(case_id, 'diagnosis')
            treatment_plan = self.get_stage_result(case_id, 'treatment_planning')
            
            diagnosis_text = diagnosis.get('diagnosis', '') if diagnosis else ''
            treatment_plan_text = treatment_plan.get('treatment_plan', '') if treatment_plan else ''
            
            combined_context = f"Diagnosis:\n{diagnosis_text}\n\nTreatment Options:\n{treatment_plan_text}"
            
            # If additional patient information is provided, add it
            if input_text:
                combined_context += f"\n\nPatient-Specific Information:\n{input_text}"
            
            # Use chat history if available
            if chat_history:
                # Format the prompt with the combined context
                formatted_prompt = prompt.format(combined_context=combined_context)
                
                # Create a system message with the formatted prompt
                messages = [{"role": "system", "content": formatted_prompt}]
                
                # Add the chat history
                messages.extend(chat_history)
                
                response = self.llm_service.generate_with_history(messages)
            else:
                response = self.llm_service.generate(prompt, combined_context=combined_context)
            
            result = {
                'patient_specific_plan': response,
                'next_stage': 'final_plan'
            }
        
        elif stage_name == 'final_plan':
            # Generate final treatment plan
            prompt = FINAL_TREATMENT_PROMPT
            
            # Combine all treatment information
            treatment_plan = self.get_stage_result(case_id, 'treatment_planning')
            patient_specific_plan = self.get_stage_result(case_id, 'patient_specific')
            
            treatment_plan_text = treatment_plan.get('treatment_plan', '') if treatment_plan else ''
            patient_specific_plan_text = patient_specific_plan.get('patient_specific_plan', '') if patient_specific_plan else ''
            
            combined_context = f"Treatment Options:\n{treatment_plan_text}\n\nPatient-Specific Plan:\n{patient_specific_plan_text}"
            
            # Use chat history if available
            if chat_history:
                # Format the prompt with the combined context
                formatted_prompt = prompt.format(combined_context=combined_context)
                
                # Create a system message with the formatted prompt
                messages = [{"role": "system", "content": formatted_prompt}]
                
                # Add the chat history
                messages.extend(chat_history)
                
                response = self.llm_service.generate_with_history(messages)
            else:
                response = self.llm_service.generate(prompt, combined_context=combined_context)
            
            result = {
                'final_treatment_plan': response,
                'next_stage': 'complete'
            }
        
        else:
            logger.warning(f"Unknown stage: {stage_name}")
            return {'error': f"Unknown stage: {stage_name}"}
        
        
         # Save stage result to database
        self._save_stage_result(case_id, stage_name, result)
        
         # Commit changes
        self.db.commit()
        
        return result
    
    def _save_stage_result(self, case_id: str, stage_name: str, result: Dict[str, Any]) -> None:
        """
        Save a stage result to the database (private helper method)
        
        Args:
            case_id: Case ID
            stage_name: Stage name
            result: Stage result
        """
        # Query for existing stage result
        stage_result = self.db.query(StageResult).filter(
            StageResult.case_id == case_id,
            StageResult.stage_name == stage_name
        ).first()
        
        if stage_result:
            # Update existing stage result
            stage_result.result = result
        else:
            # Create new stage result
            stage_result = StageResult(
                case_id=case_id,
                stage_name=stage_name,
                result=result
            )
            self.db.add(stage_result)
    
    def approve_stage(self, case_id: str, stage_name: str) -> Dict[str, Any]:
        """
        Approve a stage and move to the next stage
        
        Args:
            case_id: Case ID
            stage_name: Stage name
            
        Returns:
            Dict[str, Any]: Result with next stage information
        """
        
        if case_id is None:
            raise Exception("Case ID is required")
        try:
            if isinstance(case_id, str):
                case_id = uuid.UUID(case_id)
        except ValueError:
            raise Exception("Case ID is invalid")
    
        
        # Get case
        case = self.db.query(Case).filter(Case.id == case_id).first()
        if not case:
            logger.error(f"Case not found: {case_id}")
            return {"error": f"Case not found: {case_id}"}
        
        # Get stage result
        stage_result = self.db.query(StageResult).filter(
            StageResult.case_id == case_id,
            StageResult.stage_name == stage_name
        ).first()
        
        if not stage_result:
            logger.error(f"Stage result not found: {stage_name}")
            return {"error": f"Stage result not found: {stage_name}"}
        
        # Mark as approved
        stage_result.is_approved = True
        
        # Get next stage
        next_stage = self.get_next_stage(stage_name)
        
        # Update case current stage
        case.current_stage = next_stage
        
        # Commit changes
        self.db.commit()
        
        return {
            "stage_name": stage_name,
            "is_approved": True,
            "next_stage": next_stage,
            "message": f"Stage {stage_name} approved. Moving to {next_stage}."
        }
    
    def add_message(self, case_id: str, role: str, content: str) -> Dict[str, Any]:
        """
        Add a message to the case chat history
        
        Args:
            case_id: Case ID
            role: Message role ("user" or "assistant")
            content: Message content
            
        Returns:
            Dict[str, Any]: Added message
        """
        if case_id is None:
            raise Exception("Case ID is required")
        try:
            if isinstance(case_id, str):
                case_id = uuid.UUID(case_id)
        except ValueError:
            raise Exception("Case ID is invalid")
        
        
        # Create message
        message = Message(
            case_id=case_id,
            role=role,
            content=content
        )
        
        # Save to database
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        
        return {
            "id": str(message.id),
            "case_id": str(message.case_id),
            "role": message.role,
            "content": message.content,
            "created_at": message.created_at
        }
