"""
Diagnosis workflow module for managing the medical diagnosis process.
"""
import time
import logging
from .llm_service import LLMService
from .prompts import (
    NODE_EXTRACTION_PROMPT,
    CAUSAL_ANALYSIS_PROMPT,
    VALIDATION_PROMPT,
    COUNTERFACTUAL_PROMPT,
    DIAGNOSIS_RANKING_PROMPT,
    TREATMENT_PROMPT,
    PATIENT_SPECIFIC_TREATMENT_PROMPT,
    FINAL_TREATMENT_PROMPT
)

class DiagnosisWorkflow:
    """
    Manages the workflow for medical diagnosis using causal inference.
    Orchestrates the progression through different stages of diagnosis.
    """
    
    def __init__(self):
        """Initialize the diagnosis workflow."""
        self.llm_service = LLMService()
        self.results = {}
        self.stage_sequence = [
            'initial',
            'extraction',
            'causal_analysis',
            'validation',
            'counterfactual',
            'diagnosis',
            'treatment_planning',
            'patient_specific',
            'final_plan',
            'visualization',
            'pdf_generation'
        ]
        # Initialize visualizer
        from .visualizer import Visualizer
        self.visualizer = Visualizer()
        # Initialize report generator
        from .report_generator import ReportGenerator
        self.report_generator = ReportGenerator()
        # Track the causal graph path
        self.causal_graph_path = None
        # Track the PDF report path
        self.pdf_report_path = None
        # Store all causal links to create graph only at the end
        self.all_causal_links = []
        logging.info("DiagnosisWorkflow initialized")
    
    def get_next_stage(self, current_stage):
        """
        Get the next stage in the workflow.
        
        Args:
            current_stage (str): The current stage
            
        Returns:
            str: The next stage in the sequence
        """
        try:
            current_index = self.stage_sequence.index(current_stage)
            if current_index < len(self.stage_sequence) - 1:
                return self.stage_sequence[current_index + 1]
        except ValueError:
            logging.error(f"Invalid stage: {current_stage}")
        return current_stage
    
    def process_stage(self, stage, input_text=None, context=None, chat_history=None):
        """
        Process the current stage and return results.
        
        Args:
            stage (str): The current stage to process
            input_text (str, optional): Input text for the stage
            context (dict, optional): Additional context for the stage
            chat_history (list, optional): List of previous chat messages
            
        Returns:
            dict: Results of the stage processing
        """
        logging.info(f"Processing stage: {stage}")
        
        # Create a timestamp for this processing
        start_time = time.time()
        
        # Store results for this stage
        if stage not in self.results:
            self.results[stage] = {}
            
        # Add processing status to results
        self.results[stage]['processing'] = True
        
        if stage == 'initial':
            # Just store the case text
            self.results[stage] = {
                'case_text': input_text,
                'next_stage': 'extraction'
            }
            return self.results[stage]
        
        elif stage == 'extraction':
            # Extract medical factors
            prompt = NODE_EXTRACTION_PROMPT
            case_text = self.results.get('initial', {}).get('case_text', input_text)
            
            # Use chat history if available
            if chat_history and len(chat_history) > 0:
                # Format the prompt with the case text
                formatted_prompt = prompt.format(case_text=case_text)
                
                # Create a system message with the formatted prompt
                messages = [{"role": "system", "content": formatted_prompt}]
                
                # Add the chat history
                messages.extend(chat_history)
                
                response = self.llm_service.generate_with_history(messages)
            else:
                response = self.llm_service.generate(prompt, case_text=case_text)
            
            self.results[stage] = {
                'extracted_factors': response,
                'next_stage': 'causal_analysis'
            }
            return self.results[stage]
        
        elif stage == 'causal_analysis':
            # Analyze causal relationships
            prompt = CAUSAL_ANALYSIS_PROMPT
            extracted_factors = self.results.get('extraction', {}).get('extracted_factors', '')
            
            # Use chat history if available
            if chat_history and len(chat_history) > 0:
                # Format the prompt with the extracted factors
                formatted_prompt = prompt.format(extracted_factors=extracted_factors)
                
                # Create a system message with the formatted prompt
                messages = [{"role": "system", "content": formatted_prompt}]
                
                # Add the chat history
                messages.extend(chat_history)
                
                response = self.llm_service.generate_with_history(messages)
            else:
                response = self.llm_service.generate(prompt, extracted_factors=extracted_factors)
            
            # Store causal links for later graph creation
            self.all_causal_links.append({
                'stage': 'causal_analysis',
                'content': response
            })
            
            self.results[stage] = {
                'causal_links': response,
                'next_stage': 'validation'
            }
            
            return self.results[stage]
        
        elif stage == 'validation':
            # Validate information completeness
            prompt = VALIDATION_PROMPT
            
            # Combine extracted factors and causal links
            extracted_factors = self.results.get('extraction', {}).get('extracted_factors', '')
            causal_links = self.results.get('causal_analysis', {}).get('causal_links', '')
            combined_context = f"Extracted Factors:\n{extracted_factors}\n\nCausal Links:\n{causal_links}"
            
            # If additional input is provided, add it to the context
            additional_causal_links = ""
            if input_text:
                combined_context += f"\n\nAdditional Information:\n{input_text}"
                # Extract potential causal links from additional information
                additional_causal_links = input_text
                
                # Store additional causal links for later graph creation
                if additional_causal_links:
                    self.all_causal_links.append({
                        'stage': 'validation',
                        'content': additional_causal_links
                    })
            
            # Use chat history if available
            if chat_history and len(chat_history) > 0:
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
            
            self.results[stage] = {
                'validation_result': response,
                'ready': ready_to_proceed,
                'next_stage': 'counterfactual' if ready_to_proceed else 'validation'
            }
            
            return self.results[stage]
        
        elif stage == 'counterfactual':
            # Perform counterfactual analysis
            prompt = COUNTERFACTUAL_PROMPT
            
            # Combine all previous results
            extracted_factors = self.results.get('extraction', {}).get('extracted_factors', '')
            causal_links = self.results.get('causal_analysis', {}).get('causal_links', '')
            validation_result = self.results.get('validation', {}).get('validation_result', '')
            
            combined_context = f"Extracted Factors:\n{extracted_factors}\n\nCausal Links:\n{causal_links}\n\nValidation:\n{validation_result}"
            
            # Use chat history if available
            if chat_history and len(chat_history) > 0:
                # Format the prompt with the combined context
                formatted_prompt = prompt.format(combined_context=combined_context)
                
                # Create a system message with the formatted prompt
                messages = [{"role": "system", "content": formatted_prompt}]
                
                # Add the chat history
                messages.extend(chat_history)
                
                response = self.llm_service.generate_with_history(messages)
            else:
                response = self.llm_service.generate(prompt, combined_context=combined_context)
            
            # Extract potential new causal links from counterfactual analysis
            counterfactual_causal_links = ""
            
            # Look for sections like "Alternative Causal Pathways" or "Additional Causal Relationships"
            import re
            sections = re.split(r'#+\s+', response)
            for section in sections:
                if any(keyword in section.lower() for keyword in 
                       ['causal', 'pathway', 'relationship', 'mechanism', 'link']):
                    counterfactual_causal_links += section + "\n\n"
            
            # Store counterfactual causal links for later graph creation
            if counterfactual_causal_links:
                self.all_causal_links.append({
                    'stage': 'counterfactual',
                    'content': counterfactual_causal_links
                })
            
            self.results[stage] = {
                'counterfactual_analysis': response,
                'next_stage': 'diagnosis'
            }
            
            return self.results[stage]
        
        elif stage == 'diagnosis':
            # Generate diagnosis ranking
            prompt = DIAGNOSIS_RANKING_PROMPT
            
            # Combine all previous results
            counterfactual_analysis = self.results.get('counterfactual', {}).get('counterfactual_analysis', '')
            
            # Use chat history if available
            if chat_history and len(chat_history) > 0:
                # Format the prompt with the counterfactual analysis
                formatted_prompt = prompt.format(counterfactual_analysis=counterfactual_analysis)
                
                # Create a system message with the formatted prompt
                messages = [{"role": "system", "content": formatted_prompt}]
                
                # Add the chat history
                messages.extend(chat_history)
                
                response = self.llm_service.generate_with_history(messages)
            else:
                response = self.llm_service.generate(prompt, counterfactual_analysis=counterfactual_analysis)
            
            self.results[stage] = {
                'diagnosis': response,
                'next_stage': 'treatment_planning'
            }
            return self.results[stage]
        
        elif stage == 'treatment_planning':
            # Generate treatment plan
            prompt = TREATMENT_PROMPT
            
            # Use the diagnosis as context
            diagnosis = self.results.get('diagnosis', {}).get('diagnosis', '')
            
            # Use chat history if available
            if chat_history and len(chat_history) > 0:
                # Format the prompt with the diagnosis
                formatted_prompt = prompt.format(diagnosis=diagnosis)
                
                # Create a system message with the formatted prompt
                messages = [{"role": "system", "content": formatted_prompt}]
                
                # Add the chat history
                messages.extend(chat_history)
                
                response = self.llm_service.generate_with_history(messages)
            else:
                response = self.llm_service.generate(prompt, diagnosis=diagnosis)
            
            self.results[stage] = {
                'treatment_plan': response,
                'next_stage': 'patient_specific'
            }
            return self.results[stage]
        
        elif stage == 'patient_specific':
            # Generate patient-specific treatment plan
            prompt = PATIENT_SPECIFIC_TREATMENT_PROMPT
            
            # Combine diagnosis and treatment plan
            diagnosis = self.results.get('diagnosis', {}).get('diagnosis', '')
            treatment_plan = self.results.get('treatment_planning', {}).get('treatment_plan', '')
            
            combined_context = f"Diagnosis:\n{diagnosis}\n\nTreatment Options:\n{treatment_plan}"
            
            # If additional patient information is provided, add it
            if input_text:
                combined_context += f"\n\nPatient-Specific Information:\n{input_text}"
            
            # Use chat history if available
            if chat_history and len(chat_history) > 0:
                # Format the prompt with the combined context
                formatted_prompt = prompt.format(combined_context=combined_context)
                
                # Create a system message with the formatted prompt
                messages = [{"role": "system", "content": formatted_prompt}]
                
                # Add the chat history
                messages.extend(chat_history)
                
                response = self.llm_service.generate_with_history(messages)
            else:
                response = self.llm_service.generate(prompt, combined_context=combined_context)
            
            self.results[stage] = {
                'patient_specific_plan': response,
                'next_stage': 'final_plan'
            }
            return self.results[stage]
        
        elif stage == 'final_plan':
            # Generate final treatment plan
            prompt = FINAL_TREATMENT_PROMPT
            
            # Combine all treatment information
            treatment_plan = self.results.get('treatment_planning', {}).get('treatment_plan', '')
            patient_specific_plan = self.results.get('patient_specific', {}).get('patient_specific_plan', '')
            
            combined_context = f"Treatment Options:\n{treatment_plan}\n\nPatient-Specific Plan:\n{patient_specific_plan}"
            
            # Use chat history if available
            if chat_history and len(chat_history) > 0:
                # Format the prompt with the combined context
                formatted_prompt = prompt.format(combined_context=combined_context)
                
                # Create a system message with the formatted prompt
                messages = [{"role": "system", "content": formatted_prompt}]
                
                # Add the chat history
                messages.extend(chat_history)
                
                response = self.llm_service.generate_with_history(messages)
            else:
                response = self.llm_service.generate(prompt, combined_context=combined_context)
            
            self.results[stage] = {
                'final_treatment_plan': response,
                'next_stage': 'visualization'
            }
            return self.results[stage]
        
        elif stage == 'visualization':
            # Generate interactive causal graph visualization
            try:
                # Combine all causal links from all stages
                combined_causal_links = ""
                for link_data in self.all_causal_links:
                    combined_causal_links += f"--- {link_data['stage'].upper()} STAGE ---\n\n"
                    combined_causal_links += link_data['content'] + "\n\n"
                
                # If no causal links have been collected, use the ones from causal_analysis
                if not combined_causal_links:
                    combined_causal_links = self.results.get('causal_analysis', {}).get('causal_links', '')
                
                # Generate the interactive graph
                graph_html_path = self.visualizer.create_interactive_causal_graph(combined_causal_links)
                
                # Get the embedded HTML for the graph
                embedded_graph_html = self.visualizer.get_embedded_graph_html(graph_html_path)
                
                # Store the graph path for future reference
                self.causal_graph_path = graph_html_path
                
                self.results[stage] = {
                    'graph_html_path': graph_html_path,
                    'embedded_graph_html': embedded_graph_html,
                    'next_stage': 'pdf_generation',
                    'note': 'Created comprehensive causal graph from all stages'
                }
            except Exception as e:
                logging.error(f"Error creating interactive causal graph: {str(e)}")
                self.results[stage] = {
                    'error': f"Error creating visualization: {str(e)}",
                    'next_stage': 'pdf_generation'
                }
            
            return self.results[stage]
            
        elif stage == 'pdf_generation':
            # Generate PDF report with all progress and results
            try:
                # Generate the PDF report using the report generator
                pdf_path = self.report_generator.generate_pdf_report(self.results)
                
                # Store the PDF path for future reference
                self.pdf_report_path = pdf_path
                
                # Create a download link for the PDF
                pdf_download_link = self.report_generator.get_pdf_download_link(pdf_path)
                
                self.results[stage] = {
                    'pdf_path': pdf_path,
                    'pdf_download_link': pdf_download_link,
                    'next_stage': 'complete',
                    'note': 'Generated comprehensive PDF report with all diagnosis results'
                }
            except Exception as e:
                logging.error(f"Error generating PDF report: {str(e)}")
                self.results[stage] = {
                    'error': f"Error generating PDF report: {str(e)}",
                    'next_stage': 'complete'
                }
            
            return self.results[stage]
        
        else:
            logging.warning(f"Unknown stage: {stage}")
            return {'error': f"Unknown stage: {stage}"}
    
    def get_all_results(self):
        """
        Get all results from all stages.
        
        Returns:
            dict: All results from all stages
        """
        return self.results
    
    def get_stage_result(self, stage):
        """
        Get results for a specific stage.
        
        Args:
            stage (str): The stage to get results for
            
        Returns:
            dict: Results for the specified stage
        """
        return self.results.get(stage, {})
    
    def clear_results(self):
        """Clear all results."""
        self.results = {}
        # Also clear the stored paths
        self.causal_graph_path = None
        self.pdf_report_path = None
        self.all_causal_links = []
        logging.info("DiagnosisWorkflow results cleared")
        
    def get_pdf_report_path(self):
        """
        Get the path to the generated PDF report.
        
        Returns:
            str: Path to the PDF report, or None if not generated
        """
        return self.pdf_report_path
