"""
Main Streamlit application for medical diagnosis using causal inference with LLMs.
"""
import streamlit as st
import os
import logging
import time
from datetime import datetime
import matplotlib.pyplot as plt
from medical_diagnosis import DiagnosisWorkflow, LLMService, Visualizer, ReportGenerator

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Set page config
st.set_page_config(
    page_title="Medhastra",
    page_icon="🏥",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Load custom CSS
def load_css():
    # Add Google Fonts
    st.markdown('<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&family=Roboto+Slab:wght@400;500&family=Open+Sans:wght@400;600&display=swap" rel="stylesheet">', unsafe_allow_html=True)
    
    # Load custom CSS
    with open("assets/styles.css") as f:
        st.markdown(f'<style>{f.read()}</style>', unsafe_allow_html=True)

# Initialize session state
def initialize_session_state():
    if 'workflow' not in st.session_state:
        st.session_state.workflow = DiagnosisWorkflow()
    if 'chat_history' not in st.session_state:
        st.session_state.chat_history = []
    if 'current_stage' not in st.session_state:
        st.session_state.current_stage = 'initial'
    if 'case_text' not in st.session_state:
        st.session_state.case_text = ""
    if 'additional_info' not in st.session_state:
        st.session_state.additional_info = ""
    if 'pdf_report_path' not in st.session_state:
        st.session_state.pdf_report_path = None
    if 'visualizer' not in st.session_state:
        st.session_state.visualizer = Visualizer()
    if 'report_generator' not in st.session_state:
        st.session_state.report_generator = ReportGenerator()
    if 'sample_case_clicked' not in st.session_state:
        st.session_state.sample_case_clicked = False
    if 'default_case_text' not in st.session_state:
        st.session_state.default_case_text = ""

# Process the current stage
def process_current_stage(input_text=None):
    workflow = st.session_state.workflow
    current_stage = st.session_state.current_stage
    
    # Create a placeholder for status messages
    status_placeholder = st.empty()
    
    # Show processing message
    status_placeholder.info(f"Processing {current_stage.replace('_', ' ').title()} stage...")
    
    try:
        # Log the start of processing
        logging.info(f"Starting processing of stage: {current_stage}")
        
        # Get chat history for context
        chat_history = st.session_state.chat_history if 'chat_history' in st.session_state else []
        
        # Process the stage with chat history without spinner
        result = workflow.process_stage(current_stage, input_text, chat_history=chat_history)
        
        # Log the result
        logging.info(f"Stage {current_stage} processed successfully")
        
        # Add assistant message to chat history
        if 'extracted_factors' in result:
            add_assistant_message(f"I've analyzed the case and extracted the key medical factors:\n\n{result['extracted_factors']}\n\nWould you like me to proceed with analyzing the causal relationships?")
        elif 'causal_links' in result:
            add_assistant_message(f"I've identified the potential causal relationships:\n\n{result['causal_links']}\n\nLet me validate if we have all the necessary information.")
        elif 'validation_result' in result:
            if result.get('ready', False):
                add_assistant_message(f"I've validated the information:\n\n{result['validation_result']}\n\nWe have all the necessary information. Should I proceed with the counterfactual analysis?")
            else:
                add_assistant_message(f"I need some additional information:\n\n{result['validation_result']}\n\nPlease provide the missing information so I can proceed.")
        elif 'counterfactual_analysis' in result:
            add_assistant_message(f"I've performed counterfactual analysis:\n\n{result['counterfactual_analysis']}\n\nNow I'll generate a diagnosis based on this analysis.")
        elif 'diagnosis' in result:
            add_assistant_message(f"Based on my analysis, here's the diagnosis:\n\n{result['diagnosis']}\n\nWould you like me to proceed with treatment planning?")
        elif 'treatment_plan' in result:
            add_assistant_message(f"I've identified potential treatment options:\n\n{result['treatment_plan']}\n\nNow I'll analyze patient-specific factors to refine these options.")
        elif 'patient_specific_plan' in result:
            add_assistant_message(f"I've considered patient-specific factors:\n\n{result['patient_specific_plan']}\n\nNow I'll prepare a final treatment plan.")
        elif 'final_treatment_plan' in result:
            add_assistant_message(f"Here's the final treatment plan:\n\n{result['final_treatment_plan']}\n\nNow I'll create visualizations to help understand the diagnosis.")
        elif 'graph_html_path' in result:
            add_assistant_message(f"I've created interactive visualizations for the diagnosis. Now I'll generate a comprehensive PDF report with all the analysis and results.")
        elif 'pdf_path' in result:
            add_assistant_message(f"I've generated a comprehensive PDF report with all the diagnosis results. You can download it using the button below.")
            # Store the PDF path in session state
            st.session_state.pdf_report_path = result.get('pdf_path')
        
        # Do not automatically update the current stage based on result
        # This will now be controlled by the approval button only
        
        # Show success message
        status_placeholder.success(f"{current_stage.replace('_', ' ').title()} stage completed!")
        
        return result
        
    except Exception as e:
        # Log the error
        logging.error(f"Error processing stage {current_stage}: {str(e)}")
        
        # Show error message
        status_placeholder.error(f"Error processing {current_stage} stage: {str(e)}")
        
        # Return empty result
        return {}

# Add a user message to the chat history
def add_user_message(message):
    st.session_state.chat_history.append({"role": "user", "content": message})

# Add an assistant message to the chat history
def add_assistant_message(message):
    st.session_state.chat_history.append({"role": "assistant", "content": message})

# Handle case submission
def handle_case_submission():
    case_text = st.session_state.case_input
    st.session_state.case_text = case_text
    add_user_message(case_text)
    
    # Process initial stage first (this just stores the case text)
    st.session_state.current_stage = 'initial'
    initial_result = process_current_stage(case_text)
    
    # Automatically proceed to extraction stage after submitting case
    st.session_state.current_stage = 'extraction'
    extraction_result = process_current_stage(case_text)
    
    # All subsequent stages will require clicking "Approve & Continue"
    
    # Force a rerun to update the UI
    st.rerun()

# Handle chat input
def handle_chat_input():
    user_input = st.session_state.chat_input
    add_user_message(user_input)
    
    # If in validation stage and waiting for additional info
    if st.session_state.current_stage == 'validation' and not st.session_state.workflow.get_stage_result('validation').get('ready', False):
        st.session_state.additional_info = user_input
        process_current_stage(user_input)
    # If in patient_specific stage and waiting for patient info
    elif st.session_state.current_stage == 'patient_specific':
        process_current_stage(user_input)
    else:
        # Just acknowledge the message
        add_assistant_message(f"Thank you for your input. You can proceed to the next stage when ready.")
        
        
     # Clear the chat input field after sending
    st.session_state.chat_input = ""
    
    # Force a rerun to update the UI
    st.rerun()

# Handle stage approval
def handle_stage_approval():
    current_stage = st.session_state.current_stage
    workflow = st.session_state.workflow
    
    # Add message to chat history showing user approved this stage
    current_stage_display = current_stage.replace('_', ' ').title()
    add_user_message(f"I approve the {current_stage_display} stage and would like to continue to the next stage.")
    
    # Get the correct next stage based on the workflow sequence
    next_stage = workflow.get_next_stage(current_stage)
    
    if next_stage != current_stage:
        # Update the current stage
        st.session_state.current_stage = next_stage
        
        # Process the stage with appropriate input based on the stage
        if next_stage == 'causal_analysis':
            # For causal analysis, use the extracted factors
            extracted_factors = workflow.get_stage_result('extraction').get('extracted_factors', '')
            process_current_stage(extracted_factors)
            
        elif next_stage == 'validation':
            # For validation, use combined context from extraction and causal analysis
            extracted_factors = workflow.get_stage_result('extraction').get('extracted_factors', '')
            causal_links = workflow.get_stage_result('causal_analysis').get('causal_links', '')
            combined_input = f"Extracted Factors:\n{extracted_factors}\n\nCausal Links:\n{causal_links}"
            process_current_stage(combined_input)
            
        elif next_stage == 'counterfactual':
            # For counterfactual, combine all previous results
            process_current_stage()
            
        elif next_stage == 'diagnosis':
            # For diagnosis, use the counterfactual analysis
            counterfactual = workflow.get_stage_result('counterfactual').get('counterfactual_analysis', '')
            process_current_stage(counterfactual)
            
        elif next_stage == 'treatment_planning':
            # For treatment planning, use the diagnosis
            diagnosis = workflow.get_stage_result('diagnosis').get('diagnosis', '')
            process_current_stage(diagnosis)
            
        elif next_stage == 'patient_specific':
            # For patient specific, combine diagnosis and treatment plan
            diagnosis = workflow.get_stage_result('diagnosis').get('diagnosis', '')
            treatment_plan = workflow.get_stage_result('treatment_planning').get('treatment_plan', '')
            combined_input = f"Diagnosis:\n{diagnosis}\n\nTreatment Options:\n{treatment_plan}"
            process_current_stage(combined_input)
            
        elif next_stage == 'final_plan':
            # For final plan, combine treatment and patient specific plan
            treatment_plan = workflow.get_stage_result('treatment_planning').get('treatment_plan', '')
            patient_plan = workflow.get_stage_result('patient_specific').get('patient_specific_plan', '')
            combined_input = f"Treatment Options:\n{treatment_plan}\n\nPatient-Specific Plan:\n{patient_plan}"
            process_current_stage(combined_input)
            
        else:
            # For other stages, process normally
            process_current_stage()
        
        # Force a rerun to update the UI
        st.rerun()

# Generate PDF report
def generate_report():
    workflow = st.session_state.workflow
    report_generator = st.session_state.report_generator
    
    # Generate report without spinner
    pdf_path = report_generator.generate_pdf_report(workflow.get_all_results())
    st.session_state.pdf_report_path = pdf_path
    
    if pdf_path:
        st.success("Report generated successfully!")
        return pdf_path
    else:
        st.error("Failed to generate report.")
        return None

# Reset the application
def reset_app():
    st.session_state.workflow = DiagnosisWorkflow()
    st.session_state.chat_history = []
    st.session_state.current_stage = 'initial'
    st.session_state.case_text = ""
    st.session_state.additional_info = ""
    st.session_state.pdf_report_path = None

# Main application
def main():
    # Load CSS and initialize session state
    load_css()
    initialize_session_state()
    
    # Sidebar
    with st.sidebar:
        st.title("Medhastra")
        st.markdown("*Intelligent Diagnostics for Modern Medicine*")
        st.markdown("---")
        
        # Display current stage
        st.subheader("Current Stage")
        current_stage_display = st.session_state.current_stage.replace('_', ' ').title()
        st.info(f"📍 {current_stage_display}")
        
        # Progress bar
        progress_value = 0
        stages = st.session_state.workflow.stage_sequence
        if st.session_state.current_stage in stages:
            progress_value = (stages.index(st.session_state.current_stage) + 1) / len(stages)
        st.progress(progress_value)
        
        # Stage descriptions
        st.markdown("### Diagnosis Workflow")
        st.markdown("1. **Initial** - Enter patient case details")
        st.markdown("2. **Extraction** - Extract medical factors")
        st.markdown("3. **Causal Analysis** - Identify causal relationships")
        st.markdown("4. **Validation** - Check for missing information")
        st.markdown("5. **Counterfactual** - Perform counterfactual analysis")
        st.markdown("6. **Diagnosis** - Generate diagnosis")
        st.markdown("7. **Treatment Planning** - Identify treatment options")
        st.markdown("8. **Patient Specific** - Personalize treatment")
        st.markdown("9. **Final Plan** - Create final treatment plan")
        st.markdown("10. **Visualization** - Create interactive visualizations")
        st.markdown("11. **PDF Generation** - Generate comprehensive PDF report")
        
        st.markdown("---")
        
        # Reset button
        if st.button("Start New Case", key="reset_button"):
            reset_app()
            st.rerun()
    
    # Main content - Two-column layout with more space for chat
    col1, col2 = st.columns([2, 1])
    
    # Left column - Chat interface
    with col1:
        st.header("Doctor Interaction")
        
        # Case input (only shown in initial stage)
        if st.session_state.current_stage == 'initial':
            st.subheader("Patient Case Details")
            # Use the default case text if sample case button was clicked
            default_value = st.session_state.default_case_text if st.session_state.sample_case_clicked else ""
            
            st.text_area(
                "Enter patient case information:",
                value=default_value,
                key="case_input",
                height=200,
                placeholder="Enter detailed patient case information here..."
            )
            
            # Reset the sample case clicked flag after rendering
            if st.session_state.sample_case_clicked:
                st.session_state.sample_case_clicked = False
            
            st.button(
                "Submit Case",
                key="submit_case",
                on_click=handle_case_submission
            )
        
        # Chat history
        st.subheader("Chat History")
        chat_container = st.container()
        
        with chat_container:
            for message in st.session_state.chat_history:
                if message["role"] == "user":
                    st.markdown(f"""
                    <div class="chat-message user-message">
                        <b>Doctor:</b><br>{message["content"]}
                    </div>
                    """, unsafe_allow_html=True)
                else:
                    st.markdown(f"""
                    <div class="chat-message assistant-message">
                        <b>Assistant:</b><br>{message["content"]}
                    </div>
                    """, unsafe_allow_html=True)
        
        # Chat input
        st.text_area(
            "Type your message:",
            key="chat_input",
            height=100,
            placeholder="Type your message or feedback here..."
        )
        
        st.button(
            "Send Message",
            key="send_message",
            on_click=handle_chat_input
        )
        
        # Stage controls
        if st.session_state.current_stage != 'initial':
            st.markdown("---")
            st.subheader("Stage Controls")
            
            if st.session_state.current_stage != 'complete':
                # Approval button
                st.markdown('<div class="approve-button">', unsafe_allow_html=True)
                st.button(
                    "Approve & Continue to Next Stage",
                    key="approve_stage",
                    on_click=handle_stage_approval
                )
                st.markdown('</div>', unsafe_allow_html=True)
            else:
                # Download button in the Stage Controls section when in complete stage
                st.markdown('<div class="download-button">', unsafe_allow_html=True)
                if st.session_state.pdf_report_path:
                    # Create download link if report already generated
                    report_generator = st.session_state.report_generator
                    download_link = report_generator.get_pdf_download_link(st.session_state.pdf_report_path)
                    st.markdown(download_link, unsafe_allow_html=True)
                else:
                    # Generate report button
                    if st.button("Download PDF Report", key="download_report_controls"):
                        pdf_path = generate_report()
                        if pdf_path:
                            # Create download link
                            report_generator = st.session_state.report_generator
                            download_link = report_generator.get_pdf_download_link(pdf_path)
                            st.markdown(download_link, unsafe_allow_html=True)
                            st.rerun()
                st.markdown('</div>', unsafe_allow_html=True)
    
    # Right column - Analysis and results
    with col2:
        st.header("Analysis & Results")
        
        # Causal Graph visualization (shown continuously after extraction stage)
        if st.session_state.current_stage != 'initial' and st.session_state.current_stage != 'extraction':
            # Try to get causal links from workflow results
            workflow = st.session_state.workflow
            causal_links = workflow.get_stage_result('causal_analysis').get('causal_links', '')
            
            if causal_links:
                st.subheader("Causal Graph")
                
                # Add legend
                st.markdown(st.session_state.visualizer.get_legend_html(), unsafe_allow_html=True)
                
                # Create and display the graph
                try:
                    fig = st.session_state.visualizer.create_causal_graph(causal_links)
                    st.pyplot(fig)
                except Exception as e:
                    st.error(f"Error creating causal graph: {str(e)}")
        
        # Display stage-specific content
        if st.session_state.current_stage == 'initial':
            st.info("Please enter patient case details in the left panel.")
            
            def set_sample_case():
                st.session_state.default_case_text = """Patient is a 45-year-old male presenting with severe abdominal pain in the right lower quadrant for the past 24 hours. Pain began as diffuse periumbilical discomfort and migrated to the right lower quadrant. Patient reports nausea, vomiting (twice), and loss of appetite. No diarrhea or constipation. Temperature is 38.2°C (100.8°F). Physical examination reveals rebound tenderness at McBurney's point and positive Rovsing's sign. WBC count is elevated at 14,500/μL with neutrophilia. Patient has no significant past medical history and no known allergies. No previous surgeries. Family history is non-contributory."""
                st.session_state.sample_case_clicked = True
            
            # Sample case button
            st.button("Use Sample Case", on_click=set_sample_case)
        
        elif st.session_state.current_stage == 'extraction':
            st.subheader("Extracted Medical Factors")
            
            # Get extracted factors
            extracted_factors = st.session_state.workflow.get_stage_result('extraction').get('extracted_factors', '')
            
            if extracted_factors:
                st.markdown(f"""
                <div class="highlight-box">
                {extracted_factors.replace('\n', '<br>')}
                </div>
                """, unsafe_allow_html=True)
            else:
                st.info("Extracting medical factors from the case...")
        
        elif st.session_state.current_stage == 'causal_analysis':
            st.subheader("Causal Relationships")
            
            # Get causal links
            causal_links = st.session_state.workflow.get_stage_result('causal_analysis').get('causal_links', '')
            
            if causal_links:
                # Display causal links text
                st.markdown(f"""
                <div class="highlight-box">
                {causal_links.replace('\n', '<br>').replace('→', '<span class="causal-arrow">→</span>')}
                </div>
                """, unsafe_allow_html=True)
            else:
                st.info("Analyzing causal relationships...")
        
        elif st.session_state.current_stage == 'validation':
            st.subheader("Information Validation")
            
            # Get validation result
            validation_result = st.session_state.workflow.get_stage_result('validation').get('validation_result', '')
            ready = st.session_state.workflow.get_stage_result('validation').get('ready', False)
            
            if validation_result:
                if ready:
                    st.markdown(f"""
                    <div class="success-box">
                    {validation_result.replace('\n', '<br>')}
                    </div>
                    """, unsafe_allow_html=True)
                else:
                    st.markdown(f"""
                    <div class="warning-box">
                    {validation_result.replace('\n', '<br>')}
                    </div>
                    """, unsafe_allow_html=True)
                    
                    # Input for additional information
                    st.subheader("Provide Additional Information")
                    st.info("Please provide the requested information in the chat box on the left.")
            else:
                st.info("Validating information completeness...")
        
        elif st.session_state.current_stage == 'counterfactual':
            st.subheader("Counterfactual Analysis")
            
            # Get counterfactual analysis
            counterfactual_analysis = st.session_state.workflow.get_stage_result('counterfactual').get('counterfactual_analysis', '')
            
            if counterfactual_analysis:
                st.markdown(f"""
                <div class="highlight-box">
                {counterfactual_analysis.replace('\n', '<br>')}
                </div>
                """, unsafe_allow_html=True)
            else:
                st.info("Performing counterfactual analysis...")
        
        elif st.session_state.current_stage == 'diagnosis':
            st.subheader("Diagnosis")
            
            # Get diagnosis
            diagnosis = st.session_state.workflow.get_stage_result('diagnosis').get('diagnosis', '')
            
            if diagnosis:
                st.markdown(f"""
                <div class="highlight-box">
                {diagnosis.replace('\n', '<br>')}
                </div>
                """, unsafe_allow_html=True)
            else:
                st.info("Generating diagnosis...")
        
        elif st.session_state.current_stage == 'treatment_planning':
            st.subheader("Treatment Plan")
            
            # Get treatment plan
            treatment_plan = st.session_state.workflow.get_stage_result('treatment_planning').get('treatment_plan', '')
            
            if treatment_plan:
                # Display treatment plan text
                st.markdown(f"""
                <div class="highlight-box">
                {treatment_plan.replace('\n', '<br>')
                    .replace('✅ Causal Treatment', '<span class="treatment-causal">✅ Causal Treatment</span>')
                    .replace('✅ Preventative Treatment', '<span class="treatment-preventative">✅ Preventative Treatment</span>')
                    .replace('❌ Symptomatic Treatment', '<span class="treatment-symptomatic">❌ Symptomatic Treatment</span>')}
                </div>
                """, unsafe_allow_html=True)
                
                # Display treatment comparison visualization
                st.subheader("Treatment Comparison") 
                
                try:
                    fig = st.session_state.visualizer.create_treatment_comparison(treatment_plan)
                    st.pyplot(fig)
                except Exception as e:
                    st.error(f"Error creating treatment comparison: {str(e)}")
            else:
                st.info("Generating treatment plan...")
        
        elif st.session_state.current_stage == 'patient_specific':
            st.subheader("Patient-Specific Treatment Considerations")
            
            # Get patient-specific plan
            patient_specific_plan = st.session_state.workflow.get_stage_result('patient_specific').get('patient_specific_plan', '')
            
            if patient_specific_plan:
                st.markdown(f"""
                <div class="highlight-box">
                {patient_specific_plan.replace('\n', '<br>')}
                </div>
                """, unsafe_allow_html=True)
                
                # Input for additional patient information
                st.subheader("Additional Patient Information")
                st.info("If you have additional patient-specific information that might affect treatment selection, please provide it in the chat box on the left.")
            else:
                st.info("Analyzing patient-specific factors...")
        
        elif st.session_state.current_stage == 'final_plan':
            st.subheader("Final Treatment Plan")
            
            # Get final treatment plan
            final_treatment_plan = st.session_state.workflow.get_stage_result('final_plan').get('final_treatment_plan', '')
            
            if final_treatment_plan:
                st.markdown(f"""
                <div class="success-box">
                {final_treatment_plan.replace('\n', '<br>')}
                </div>
                """, unsafe_allow_html=True)
                
                # Generate report button
                if st.button("Generate PDF Report"):
                    pdf_path = generate_report()
                    if pdf_path:
                        # Create download link
                        report_generator = st.session_state.report_generator
                        download_link = report_generator.get_pdf_download_link(pdf_path)
                        st.markdown(download_link, unsafe_allow_html=True)
            else:
                st.info("Generating final treatment plan...")
        
        elif st.session_state.current_stage == 'visualization':
            st.subheader("Interactive Visualizations")
            
            # Get visualization result
            visualization_result = st.session_state.workflow.get_stage_result('visualization')
            
            if 'graph_html_path' in visualization_result:
                st.success("Interactive causal graph created successfully!")
                
                # Display embedded graph HTML if available
                if 'embedded_graph_html' in visualization_result:
                    st.markdown("### Interactive Causal Graph")
                    st.markdown(visualization_result['embedded_graph_html'], unsafe_allow_html=True)
                
                st.info("Approve this stage to proceed to PDF generation.")
            else:
                st.info("Creating interactive visualizations...")
                
        elif st.session_state.current_stage == 'pdf_generation':
            st.subheader("PDF Report Generation")
            
            # Get PDF generation result
            pdf_result = st.session_state.workflow.get_stage_result('pdf_generation')
            
            if 'pdf_path' in pdf_result:
                st.success("PDF report generated successfully!")
                
                # Get the PDF path from the result
                pdf_path = pdf_result['pdf_path']
                
                # Store the PDF path in session state
                st.session_state.pdf_report_path = pdf_path
                
                # Create and display download link
                report_generator = st.session_state.report_generator
                download_link = report_generator.get_pdf_download_link(pdf_path)
                st.markdown("### Download PDF Report")
                st.markdown(download_link, unsafe_allow_html=True)
                
                st.info("Approve this stage to complete the diagnosis process.")
            else:
                st.info("Generating comprehensive PDF report...")
                
                # Add a button to manually trigger PDF generation
                if st.button("Generate PDF Report Now", key="generate_pdf_button"):
                    # Generate the PDF report
                    pdf_path = generate_report()
                    if pdf_path:
                        # Store the PDF path in the workflow results
                        workflow = st.session_state.workflow
                        if 'pdf_generation' not in workflow.results:
                            workflow.results['pdf_generation'] = {}
                        workflow.results['pdf_generation']['pdf_path'] = pdf_path
                        
                        # Store the PDF path in session state
                        st.session_state.pdf_report_path = pdf_path
                        
                        # Create download link
                        report_generator = st.session_state.report_generator
                        download_link = report_generator.get_pdf_download_link(pdf_path)
                        
                        # Display success message and download link
                        st.success("PDF report generated successfully!")
                        st.markdown("### Download PDF Report")
                        st.markdown(download_link, unsafe_allow_html=True)
                        
                        # Force a rerun to update the UI
                        st.rerun()
                
        elif st.session_state.current_stage == 'complete':
            st.subheader("Diagnosis and Treatment Complete")
            st.success("The diagnosis and treatment planning process is complete. You can download the report or start a new case.")
            
            # Get final treatment plan
            final_treatment_plan = st.session_state.workflow.get_stage_result('final_plan').get('final_treatment_plan', '')
            
            if final_treatment_plan:
                st.markdown(f"""
                <div class="success-box">
                {final_treatment_plan.replace('\n', '<br>')}
                </div>
                """, unsafe_allow_html=True)
            
            # Get PDF path from workflow or session state
            pdf_path = st.session_state.workflow.get_pdf_report_path() or st.session_state.pdf_report_path
            
            if pdf_path:
                # Create download link
                report_generator = st.session_state.report_generator
                download_link = report_generator.get_pdf_download_link(pdf_path)
                st.markdown("### Download Complete Report")
                st.markdown(download_link, unsafe_allow_html=True)
            else:
                if st.button("Generate PDF Report"):
                    pdf_path = generate_report()
                    if pdf_path:
                        # Create download link
                        report_generator = st.session_state.report_generator
                        download_link = report_generator.get_pdf_download_link(pdf_path)
                        st.markdown(download_link, unsafe_allow_html=True)

if __name__ == "__main__":
    main()
