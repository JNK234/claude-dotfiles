"""
Pydantic Schemas for AI Workflow Service

These schemas define the structured inputs and outputs for the different AI tasks
handled by the AIWorkflowService.
"""
from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field

# --- Input Schemas ---

class BaseInput(BaseModel):
    """Base model for inputs, potentially including case_id"""
    case_id: Optional[str] = None # Or UUID if preferred

class ExtractionInput(BaseInput):
    case_text: str

class CausalAnalysisInput(BaseInput):
    extracted_factors: Dict[str, Any] # Or a more specific schema

class ValidationInput(BaseInput):
    extracted_factors: Dict[str, Any]
    causal_links: Dict[str, Any] # Or a more specific schema
    user_input: Optional[str] = None # For additional info provided by user

class CounterfactualInput(BaseInput):
    extracted_factors: Dict[str, Any]
    causal_links: Dict[str, Any]
    validation_result: Dict[str, Any] # Or a more specific schema

class DiagnosisInput(BaseInput):
    counterfactual_analysis: Dict[str, Any] # Or a more specific schema

class TreatmentPlanningInput(BaseInput):
    diagnosis: Dict[str, Any] # Or a more specific schema

class PatientSpecificInput(BaseInput):
    diagnosis: Dict[str, Any]
    treatment_options: Dict[str, Any] # Or a more specific schema
    patient_specific_info: Optional[str] = None # From user input or case details

class FinalPlanInput(BaseInput):
    treatment_options: Dict[str, Any]
    patient_specific_plan: Dict[str, Any] # Or a more specific schema

class SummaryInput(BaseInput):
    stage_name: str # e.g., 'patient_case_analysis_group'
    context: Dict[str, Any] # Contains results needed for the summary

class NoteInput(BaseInput):
    case_details: str
    extracted_factors: Dict[str, Any]
    diagnosis_analysis: Dict[str, Any]
    treatment_plan: Dict[str, Any]

# --- Output Schemas ---
# These should ideally mirror the structure expected/produced by the prompts

class BaseOutput(BaseModel):
    """Base model for outputs"""
    processing_time: Optional[float] = None

class ExtractionOutput(BaseOutput):
    extracted_factors: Dict[str, Any] # Could be Dict[str, List[str]] based on prompt format
    # Example: {"Patient Symptoms & Observations": ["Fever", "Cough"], ...}

class CausalAnalysisOutput(BaseOutput):
    causal_links: Dict[str, Any] # Could be more structured
    # Example: {"Direct Causal Links": ["Fever -> Infection"], "Confounders": [...]}

class ValidationOutput(BaseOutput):
    validation_result: str # The raw text output from the LLM for now
    is_ready: bool = Field(..., description="Indicates if workflow can proceed")
    clarifying_questions: Optional[List[str]] = None # If not ready

class CounterfactualOutput(BaseOutput):
    counterfactual_analysis: Dict[str, Any] # Could be more structured based on prompt

class DiagnosisOutput(BaseOutput):
    diagnosis_ranking: List[Dict[str, Any]] # e.g., [{"diagnosis": "Pneumonia", "confidence": "High", "reasoning": "..."}]
    # Or keep as raw text/dict for now:
    # diagnosis_details: Dict[str, Any]

class TreatmentPlanningOutput(BaseOutput):
    treatment_options: Dict[str, Any] # Could be more structured based on prompt

class PatientSpecificOutput(BaseOutput):
    patient_specific_plan: Dict[str, Any] # Could be more structured

class FinalPlanOutput(BaseOutput):
    final_treatment_plan: Dict[str, Any] # Could be more structured

# Note: Summary and Note outputs are just strings for now
# QnA schemas might not be needed if using ConversationChain directly
