"""
AI Workflow Service

This service encapsulates the logic for different AI tasks within the diagnosis workflow,
including interaction with LLMs, prompt management, and potentially agentic logic.
"""
import logging
import time # For processing_time
from typing import Dict, List, Any, Optional

from langchain_core.chat_history import BaseChatMessageHistory

from .schemas import (
    ExtractionInput, ExtractionOutput, CausalAnalysisInput, CausalAnalysisOutput,
    ValidationInput, ValidationOutput, CounterfactualInput, CounterfactualOutput,
    DiagnosisInput, DiagnosisOutput, TreatmentPlanningInput, TreatmentPlanningOutput,
    PatientSpecificInput, PatientSpecificOutput, FinalPlanInput, FinalPlanOutput,
    SummaryInput, NoteInput
)
from app.services.llm_service import LLMService
from app.services.prompts import (
    NODE_EXTRACTION_PROMPT, CAUSAL_ANALYSIS_PROMPT, VALIDATION_PROMPT,
    COUNTERFACTUAL_PROMPT, DIAGNOSIS_RANKING_PROMPT, TREATMENT_PROMPT,
    PATIENT_SPECIFIC_TREATMENT_PROMPT, FINAL_TREATMENT_PROMPT,
    CASE_ANALYSIS_SUMMARY_PROMPT, DIAGNOSIS_SUMMARY_PROMPT,
    TREATMENT_SUMMARY_PROMPT, NOTE_GENERATION_PROMPT
)

logger = logging.getLogger(__name__)

class AIWorkflowService:
    """
    Handles AI-related tasks for the diagnosis workflow.
    """
    def __init__(self, llm_service: LLMService):
        """
        Initialize the AI Workflow Service.

        Args:
            llm_service: An instance of the LLMService for interacting with the language model.
        """
        self.llm_service = llm_service
        logger.info("AIWorkflowService initialized.")

    async def extract_factors(self, data: ExtractionInput, chat_history: Optional[List[Dict[str, str]]] = None) -> ExtractionOutput:
        """
        Extracts key factors from the case text.
        (Corresponds to NODE_EXTRACTION_PROMPT logic)
        """
        start_time = time.time()
        logger.info(f"Extracting factors for case {data.case_id}...")
        prompt = NODE_EXTRACTION_PROMPT
        case_text = data.case_text

        try:
            if chat_history:
                formatted_prompt = prompt.format(case_text=case_text)
                messages = [{"role": "system", "content": formatted_prompt}] + chat_history
                # Assuming LLMService methods are async or wrapped appropriately
                response = await self.llm_service.generate_with_history(messages)
            else:
                response = await self.llm_service.generate(prompt, case_text=case_text)

            # TODO: Implement robust parsing of 'response' string into Dict structure
            # For now, storing raw output. Consider using PydanticOutputParser later.
            parsed_factors = {"raw_output": response}

            return ExtractionOutput(
                extracted_factors=parsed_factors,
                processing_time=time.time() - start_time
            )
        except Exception as e:
            logger.error(f"Error during factor extraction for case {data.case_id}: {e}")
            # Consider returning a specific error structure or raising exception
            return ExtractionOutput(extracted_factors={"error": str(e)}, processing_time=time.time() - start_time)


    async def analyze_causality(self, data: CausalAnalysisInput, chat_history: Optional[List[Dict[str, str]]] = None) -> CausalAnalysisOutput:
        """
        Analyzes causal relationships between extracted factors.
        (Corresponds to CAUSAL_ANALYSIS_PROMPT logic)
        """
        start_time = time.time()
        logger.info(f"Analyzing causality for case {data.case_id}...")
        prompt = CAUSAL_ANALYSIS_PROMPT
        # Adapt based on how extracted_factors are stored (assuming raw_output for now)
        extracted_factors_text = data.extracted_factors.get("raw_output", "") if isinstance(data.extracted_factors, dict) else str(data.extracted_factors)

        try:
            if chat_history:
                formatted_prompt = prompt.format(extracted_factors=extracted_factors_text)
                messages = [{"role": "system", "content": formatted_prompt}] + chat_history
                response = await self.llm_service.generate_with_history(messages)
            else:
                response = await self.llm_service.generate(prompt, extracted_factors=extracted_factors_text)

            # TODO: Implement robust parsing of 'response' string into Dict structure
            parsed_links = {"raw_output": response}

            return CausalAnalysisOutput(
                causal_links=parsed_links,
                processing_time=time.time() - start_time
            )
        except Exception as e:
            logger.error(f"Error during causality analysis for case {data.case_id}: {e}")
            return CausalAnalysisOutput(causal_links={"error": str(e)}, processing_time=time.time() - start_time)


    async def validate_information(self, data: ValidationInput, chat_history: Optional[List[Dict[str, str]]] = None) -> ValidationOutput:
        """
        Validates information completeness and identifies gaps.
        (Corresponds to VALIDATION_PROMPT logic)
        """
        start_time = time.time()
        logger.info(f"Validating information for case {data.case_id}...")
        prompt = VALIDATION_PROMPT

        extracted_factors_text = data.extracted_factors.get("raw_output", "") if isinstance(data.extracted_factors, dict) else str(data.extracted_factors)
        causal_links_text = data.causal_links.get("raw_output", "") if isinstance(data.causal_links, dict) else str(data.causal_links)
        combined_context = f"Extracted Factors:\n{extracted_factors_text}\n\nCausal Links:\n{causal_links_text}"
        if data.user_input:
            combined_context += f"\n\nAdditional Information:\n{data.user_input}"

        try:
            if chat_history:
                formatted_prompt = prompt.format(combined_context=combined_context)
                messages = [{"role": "system", "content": formatted_prompt}] + chat_history
                response = await self.llm_service.generate_with_history(messages)
            else:
                response = await self.llm_service.generate(prompt, combined_context=combined_context)

            # Basic parsing for readiness
            is_ready = "✅ Yes" in response
            questions = None
            if not is_ready:
                # TODO: Implement robust parsing to extract questions from 'response'
                questions = ["Placeholder: Parse questions from response"] # Placeholder

            return ValidationOutput(
                validation_result=response,
                is_ready=is_ready,
                clarifying_questions=questions,
                processing_time=time.time() - start_time
            )
        except Exception as e:
            logger.error(f"Error during information validation for case {data.case_id}: {e}")
            # Return error state
            return ValidationOutput(
                validation_result=f"Error: {str(e)}",
                is_ready=False, # Assume not ready on error
                clarifying_questions=["An internal error occurred during validation."],
                processing_time=time.time() - start_time
            )


    async def perform_counterfactual_analysis(self, data: CounterfactualInput, chat_history: Optional[List[Dict[str, str]]] = None) -> CounterfactualOutput:
        """
        Performs counterfactual reasoning.
        (Corresponds to COUNTERFACTUAL_PROMPT logic)
        """
        start_time = time.time()
        logger.info(f"Performing counterfactual analysis for case {data.case_id}...")
        prompt = COUNTERFACTUAL_PROMPT

        # Adapt context building based on stored formats
        extracted_factors_text = data.extracted_factors.get("raw_output", "") if isinstance(data.extracted_factors, dict) else str(data.extracted_factors)
        causal_links_text = data.causal_links.get("raw_output", "") if isinstance(data.causal_links, dict) else str(data.causal_links)
        # Assuming validation_result is stored as the raw string
        validation_result_text = str(data.validation_result)

        combined_context = f"Extracted Factors:\n{extracted_factors_text}\n\nCausal Links:\n{causal_links_text}\n\nValidation:\n{validation_result_text}"

        try:
            if chat_history:
                formatted_prompt = prompt.format(combined_context=combined_context)
                messages = [{"role": "system", "content": formatted_prompt}] + chat_history
                response = await self.llm_service.generate_with_history(messages)
            else:
                response = await self.llm_service.generate(prompt, combined_context=combined_context)

            # TODO: Implement robust parsing of 'response' string into Dict structure
            parsed_analysis = {"raw_output": response}

            return CounterfactualOutput(
                counterfactual_analysis=parsed_analysis,
                processing_time=time.time() - start_time
            )
        except Exception as e:
            logger.error(f"Error during counterfactual analysis for case {data.case_id}: {e}")
            return CounterfactualOutput(counterfactual_analysis={"error": str(e)}, processing_time=time.time() - start_time)


    async def rank_diagnoses(self, data: DiagnosisInput, chat_history: Optional[List[Dict[str, str]]] = None) -> DiagnosisOutput:
        """
        Ranks potential diagnoses based on analysis.
        (Corresponds to DIAGNOSIS_RANKING_PROMPT logic)
        """
        start_time = time.time()
        logger.info(f"Ranking diagnoses for case {data.case_id}...")
        prompt = DIAGNOSIS_RANKING_PROMPT

        # Adapt based on stored format
        counterfactual_text = data.counterfactual_analysis.get("raw_output", "") if isinstance(data.counterfactual_analysis, dict) else str(data.counterfactual_analysis)

        try:
            if chat_history:
                formatted_prompt = prompt.format(counterfactual_analysis=counterfactual_text)
                messages = [{"role": "system", "content": formatted_prompt}] + chat_history
                response = await self.llm_service.generate_with_history(messages)
            else:
                response = await self.llm_service.generate(prompt, counterfactual_analysis=counterfactual_text)

            # TODO: Implement robust parsing of 'response' into List[Dict] structure
            # For now, storing raw output in a placeholder structure
            parsed_ranking = [{"raw_output": response}]

            return DiagnosisOutput(
                diagnosis_ranking=parsed_ranking,
                processing_time=time.time() - start_time
            )
        except Exception as e:
            logger.error(f"Error during diagnosis ranking for case {data.case_id}: {e}")
            return DiagnosisOutput(diagnosis_ranking=[{"error": str(e)}], processing_time=time.time() - start_time)


    async def plan_treatment_options(self, data: TreatmentPlanningInput, chat_history: Optional[List[Dict[str, str]]] = None) -> TreatmentPlanningOutput:
        """
        Generates general treatment options for a diagnosis.
        (Corresponds to TREATMENT_PROMPT logic)
        """
        start_time = time.time()
        logger.info(f"Planning treatment options for case {data.case_id}...")
        prompt = TREATMENT_PROMPT

        # Adapt based on stored format (assuming raw_output in a list item)
        diagnosis_item = data.diagnosis[0] if isinstance(data.diagnosis, list) and data.diagnosis else {}
        diagnosis_text = diagnosis_item.get("raw_output", "") if isinstance(diagnosis_item, dict) else str(data.diagnosis)

        try:
            if chat_history:
                formatted_prompt = prompt.format(diagnosis=diagnosis_text)
                messages = [{"role": "system", "content": formatted_prompt}] + chat_history
                response = await self.llm_service.generate_with_history(messages)
            else:
                response = await self.llm_service.generate(prompt, diagnosis=diagnosis_text)

            # TODO: Implement robust parsing of 'response' string into Dict structure
            parsed_options = {"raw_output": response}

            return TreatmentPlanningOutput(
                treatment_options=parsed_options,
                processing_time=time.time() - start_time
            )
        except Exception as e:
            logger.error(f"Error during treatment planning for case {data.case_id}: {e}")
            return TreatmentPlanningOutput(treatment_options={"error": str(e)}, processing_time=time.time() - start_time)


    async def personalize_treatment_plan(self, data: PatientSpecificInput, chat_history: Optional[List[Dict[str, str]]] = None) -> PatientSpecificOutput:
        """
        Tailors treatment plan based on patient specifics.
        (Corresponds to PATIENT_SPECIFIC_TREATMENT_PROMPT logic)
        """
        start_time = time.time()
        logger.info(f"Personalizing treatment plan for case {data.case_id}...")
        prompt = PATIENT_SPECIFIC_TREATMENT_PROMPT

        # Adapt context building based on stored formats
        diagnosis_item = data.diagnosis[0] if isinstance(data.diagnosis, list) and data.diagnosis else {}
        diagnosis_text = diagnosis_item.get("raw_output", "") if isinstance(diagnosis_item, dict) else str(data.diagnosis)
        treatment_options_text = data.treatment_options.get("raw_output", "") if isinstance(data.treatment_options, dict) else str(data.treatment_options)

        combined_context = f"Diagnosis:\n{diagnosis_text}\n\nTreatment Options:\n{treatment_options_text}"
        if data.patient_specific_info:
             combined_context += f"\n\nPatient-Specific Information:\n{data.patient_specific_info}"

        try:
            if chat_history:
                formatted_prompt = prompt.format(combined_context=combined_context)
                messages = [{"role": "system", "content": formatted_prompt}] + chat_history
                response = await self.llm_service.generate_with_history(messages)
            else:
                response = await self.llm_service.generate(prompt, combined_context=combined_context)

            # TODO: Implement robust parsing of 'response' string into Dict structure
            parsed_plan = {"raw_output": response}

            return PatientSpecificOutput(
                patient_specific_plan=parsed_plan,
                processing_time=time.time() - start_time
            )
        except Exception as e:
            logger.error(f"Error during treatment personalization for case {data.case_id}: {e}")
            return PatientSpecificOutput(patient_specific_plan={"error": str(e)}, processing_time=time.time() - start_time)


    async def finalize_treatment_plan(self, data: FinalPlanInput, chat_history: Optional[List[Dict[str, str]]] = None) -> FinalPlanOutput:
        """
        Generates the final, actionable treatment plan.
        (Corresponds to FINAL_TREATMENT_PROMPT logic)
        """
        start_time = time.time()
        logger.info(f"Finalizing treatment plan for case {data.case_id}...")
        prompt = FINAL_TREATMENT_PROMPT

        # Adapt context building based on stored formats
        treatment_options_text = data.treatment_options.get("raw_output", "") if isinstance(data.treatment_options, dict) else str(data.treatment_options)
        patient_specific_plan_text = data.patient_specific_plan.get("raw_output", "") if isinstance(data.patient_specific_plan, dict) else str(data.patient_specific_plan)

        combined_context = f"Treatment Options:\n{treatment_options_text}\n\nPatient-Specific Plan:\n{patient_specific_plan_text}"

        try:
            if chat_history:
                formatted_prompt = prompt.format(combined_context=combined_context)
                messages = [{"role": "system", "content": formatted_prompt}] + chat_history
                response = await self.llm_service.generate_with_history(messages)
            else:
                response = await self.llm_service.generate(prompt, combined_context=combined_context)

            # TODO: Implement robust parsing of 'response' string into Dict structure
            parsed_final_plan = {"raw_output": response}

            return FinalPlanOutput(
                final_treatment_plan=parsed_final_plan,
                processing_time=time.time() - start_time
            )
        except Exception as e:
            logger.error(f"Error during treatment finalization for case {data.case_id}: {e}")
            return FinalPlanOutput(final_treatment_plan={"error": str(e)}, processing_time=time.time() - start_time)


    async def generate_summary(self, data: SummaryInput) -> str:
        """
        Generates a summary for a specific consolidated stage.
        (Corresponds to CASE_ANALYSIS_SUMMARY_PROMPT, DIAGNOSIS_SUMMARY_PROMPT, TREATMENT_SUMMARY_PROMPT)
        """
        start_time = time.time()
        logger.info(f"Generating summary for stage {data.stage_name} for case {data.case_id}...")
        prompt_map = {
            'patient_case_analysis_group': CASE_ANALYSIS_SUMMARY_PROMPT,
            'diagnosis_group': DIAGNOSIS_SUMMARY_PROMPT,
            'treatment_planning_group': TREATMENT_SUMMARY_PROMPT
        }
        prompt = prompt_map.get(data.stage_name)
        if not prompt:
            logger.error(f"No summary prompt found for stage: {data.stage_name}")
            return "Error: Could not generate summary."

        try:
            # Assuming context contains the necessary keys for the prompt format
            # Need to adapt keys based on how summaries are generated in original DiagnosisService
            # Example: Original used .generate(prompt, key1=value1, key2=value2)
            # We need to ensure data.context has key1, key2
            response = await self.llm_service.generate(prompt, **data.context)
            logger.info(f"Summary generation time for {data.stage_name}: {time.time() - start_time:.2f}s")
            return response
        except Exception as e:
            logger.error(f"Error generating summary for stage {data.stage_name} for case {data.case_id}: {e}")
            return f"Error generating summary: {str(e)}"


    async def generate_clinical_note(self, data: NoteInput) -> str:
        """
        Generates the final clinical note.
        (Corresponds to NOTE_GENERATION_PROMPT)
        """
        start_time = time.time()
        logger.info(f"Generating clinical note for case {data.case_id}...")
        prompt = NOTE_GENERATION_PROMPT

        # Adapt context extraction based on how results are stored (assuming raw_output)
        extracted_factors_text = data.extracted_factors.get("raw_output", str(data.extracted_factors))
        diagnosis_item = data.diagnosis_analysis[0] if isinstance(data.diagnosis_analysis, list) and data.diagnosis_analysis else {}
        diagnosis_analysis_text = diagnosis_item.get("raw_output", "") if isinstance(diagnosis_item, dict) else str(data.diagnosis_analysis)
        treatment_plan_text = data.treatment_plan.get("raw_output", str(data.treatment_plan))

        try:
            # Format prompt using NoteInput fields
            response = await self.llm_service.generate(
                prompt,
                case_details=data.case_details,
                extracted_factors=extracted_factors_text,
                diagnosis_analysis=diagnosis_analysis_text,
                treatment_plan=treatment_plan_text
            )
            logger.info(f"Note generation time for case {data.case_id}: {time.time() - start_time:.2f}s")
            return response
        except Exception as e:
            logger.error(f"Error generating clinical note for case {data.case_id}: {e}")
            return f"Error generating clinical note: {str(e)}"


    async def answer_question(self, static_context: Dict[str, Any], memory: BaseChatMessageHistory, question: str) -> str:
        """
        Answers a general question using provided context and conversation history (via memory).
        """
        logger.info(f"Answering general question...")
        # TODO: Implement logic using Langchain ConversationChain and Memory
        # 1. Instantiate ConversationChain with LLM, Memory, and QnA prompt
        # 2. Prepare input dict with question and static_context
        # 3. Run the chain
        # 4. Return the answer string
        pass

    # --- Placeholder for Agentic Workflow ---
    async def run_diagnosis_graph(self, initial_state: Any) -> Any:
        """
        Runs the diagnosis workflow using the LangGraph agentic system.
        (To be implemented in Phase 2)
        """
        logger.info("Running diagnosis graph (Phase 2)...")
        # TODO: Implement LangGraph invocation logic
        pass
