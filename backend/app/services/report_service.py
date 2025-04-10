"""
Report generation service for creating markdown and PDF reports of diagnosis and treatment plans
"""
import os
import logging
from datetime import datetime
from typing import Dict, Any, Optional
import json
import base64
from uuid import UUID 

from sqlalchemy.orm import Session
from markdown_pdf import MarkdownPdf, Section

from app.core.config import settings
from app.models.case import Case, StageResult, Report
from app.services.diagnosis_service import DiagnosisService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ReportService:
    """
    Service for generating reports from diagnosis results
    """
    
    def __init__(self, db: Session):
        """
        Initialize the report service
        
        Args:
            db: Database session
        """
        self.db = db
        
        # Ensure reports and notes directories exist
        os.makedirs(settings.REPORTS_DIR, exist_ok=True)
        os.makedirs(settings.NOTES_DIR, exist_ok=True)
    
    def generate_report(self, case_id: str) -> Optional[Dict[str, Any]]:
        """
        Generate a markdown and PDF report of the diagnosis and treatment plan
        
        Args:
            case_id: Case ID
            
        Returns:
            Optional[Dict[str, Any]]: Report information or None if generation fails
        """
        
        if case_id is None:
            raise Exception("Case ID is required")
        try:
            if isinstance(case_id, str):
                case_id = UUID(case_id)
        except ValueError:
            raise Exception("Case ID is invalid")
        
        try:
            # Get case
            case = self.db.query(Case).filter(Case.id == case_id).first()
            if not case:
                logger.error(f"Case not found: {case_id}")
                return None
            
            # Get all stage results
            stage_results = self.db.query(StageResult).filter(StageResult.case_id == case_id).all()
                        
            # Convert to dictionary
            diagnosis_results = {
                'initial': {'case_text': case.case_text}
            }
            
            # Add stage results
            for result in stage_results:
                diagnosis_results[result.stage_name] = result.result
            
            # Generate PDF directly
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            pdf_filename = f"report_{case_id}_{timestamp}.pdf"
            pdf_path = os.path.join(settings.REPORTS_DIR, pdf_filename)
            
            success = self._generate_pdf_report(diagnosis_results, pdf_path)
            
            print(f"Success: {success}")
            
            # Create report record
            report = Report(
                case_id=case_id,
                file_path=pdf_path
            )
            
            # Save to database
            self.db.add(report)
            self.db.commit()
            self.db.refresh(report)
            
            return {
                "id": str(report.id),
                "case_id": str(report.case_id),
                "file_path": report.file_path,
                "pdf_path": pdf_path if success else None,
                "created_at": report.created_at
            }
        
        except Exception as e:
            logger.error(f"Error in generate_report: {str(e)}")
            return None

    def generate_note(self, case_id: str) -> Optional[Dict[str, Any]]:
        """
        Generate a clinical note based on the case data and diagnosis results
        
        Args:
            case_id: Case ID
            
        Returns:
            Optional[Dict[str, Any]]: Note information or None if generation fails
        """
        if case_id is None:
            raise Exception("Case ID is required")
        try:
            if isinstance(case_id, str):
                case_id = UUID(case_id)
        except ValueError:
            raise Exception("Case ID is invalid")
        
        try:
            # Get case
            case = self.db.query(Case).filter(Case.id == case_id).first()
            if not case:
                logger.error(f"Case not found: {case_id}")
                return None
            
            # Get all stage results
            stage_results = self.db.query(StageResult).filter(StageResult.case_id == case_id).all()
            
            # Convert to dictionary
            diagnosis_results = {
                'initial': {'case_text': case.case_text}
            }
            
            # Add stage results
            for result in stage_results:
                diagnosis_results[result.stage_name] = result.result
            
            # Generate note as PDF
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            note_filename = f"note_{case_id}_{timestamp}.pdf"
            note_path = os.path.join(settings.NOTES_DIR, note_filename)
            
            success = self._generate_note(case_id, diagnosis_results, note_path)
            
            if not success:
                return None
            
            # Create report record for the note
            report = Report(
                case_id=case_id,
                file_path=note_path
            )
            
            # Save to database
            self.db.add(report)
            self.db.commit()
            self.db.refresh(report)
            
            return {
                "id": str(report.id),
                "case_id": str(report.case_id),
                "file_path": note_path,
                "created_at": report.created_at
            }
        
        except Exception as e:
            logger.error(f"Error in generate_note: {str(e)}")
            return None
    
    def get_report(self, report_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a report by ID
        
        Args:
            report_id: Report ID
            
        Returns:
            Optional[Dict[str, Any]]: Report information or None if not found 
        """
        
        # Get report
        report = self.db.query(Report).filter(Report.id == UUID(report_id)).first()
        if not report:
            logger.error(f"Report not found: {report_id}")
            return None
        
        # Check if file exists
        if not os.path.exists(report.file_path):
            logger.error(f"Report file not found: {report.file_path}")
            return None
        
        # Read file data
        with open(report.file_path, 'rb') as f:
            file_data = f.read()
        
        # Get file extension
        _, file_ext = os.path.splitext(report.file_path)
        
        
        # Determine content type
        if file_ext.lower() == '.pdf':
            content_type = "application/pdf"
        elif file_ext.lower() == '.txt':
            content_type = "text/plain"
        else:
            content_type = "text/plain"
        
        # Encode file data
        encoded_data = base64.b64encode(file_data).decode('utf-8')
        
        return {
            "id": str(report.id),
            "case_id": str(report.case_id),
            "file_path": report.file_path,
            "created_at": report.created_at,
            "content_type": content_type,
            "encoded_data": encoded_data
        }
    
    def _generate_pdf_report(self, diagnosis_results: Dict[str, Any], pdf_path: str) -> bool:
        """
        Generate PDF report using markdown-pdf library with sections
        
        Args:
            diagnosis_results: Dictionary containing all diagnosis results
            pdf_path: Path to output PDF file
            
        Returns:
            bool: True if generation succeeded, False otherwise
        """
        try:
            # Extract data
            case_text = diagnosis_results.get('initial', {}).get('case_text', 'No case text provided')
            extracted_factors = diagnosis_results.get('extraction', {}).get('extracted_factors', 'No extracted factors available')
            causal_links = diagnosis_results.get('causal_analysis', {}).get('causal_links', 'No causal links available')
            diagnosis = diagnosis_results.get('diagnosis', {}).get('diagnosis', 'No diagnosis available')
            treatment_plan = diagnosis_results.get('treatment_planning', {}).get('treatment_plan', 'No treatment plan available')
            patient_specific_plan = diagnosis_results.get('patient_specific', {}).get('patient_specific_plan', 'No patient-specific plan available')
            final_treatment_plan = diagnosis_results.get('final_plan', {}).get('final_treatment_plan', 'No final treatment plan available')
            
            # Initialize markdown-pdf with custom styling and TOC
            pdf = MarkdownPdf(
                toc_level=1,  # Include h1 and h2 in table of contents
            )
            
            # Set PDF metadata
            pdf.meta["title"] = "Medical Diagnosis and Treatment Plan"
            pdf.meta["creator"] = "InferenceMD"
            pdf.meta["subject"] = "Medical Report"
            pdf.meta["keywords"] = "diagnosis,treatment,medical,report"
            
            # Add title section (excluded from TOC)
            pdf.add_section(Section(
                f"# Medical Diagnosis and Treatment Plan\n\nGenerated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n",
                toc=False
            ))
            
            # Add content sections
            pdf.add_section(Section("## Patient Case\n\n" + case_text + "\n\n"))
            pdf.add_section(Section("## Medical Factors\n\n" + extracted_factors + "\n\n"))
            pdf.add_section(Section("## Causal Analysis\n\n" + causal_links + "\n\n"))
            pdf.add_section(Section("## Diagnosis\n\n" + diagnosis + "\n\n"))
            pdf.add_section(Section("## Treatment Plan\n\n" + treatment_plan + "\n\n"))
            pdf.add_section(Section("## Patient-Specific Considerations\n\n" + patient_specific_plan + "\n\n"))
            pdf.add_section(Section("## Final Treatment Recommendation\n\n" + final_treatment_plan + "\n\n"))
            
            # Add disclaimer (excluded from TOC)
            pdf.add_section(Section(
                "\n---\n\n*This note was generated with the assistance of InferenceMD, "
                "an AI tool utilized in data collection, analysis and diagnostic support.*",
                toc=False
            ))
            
            # Generate PDF
            pdf.save(pdf_path)
            logger.info(f"PDF report generated at {pdf_path} using markdown-pdf")
            return True
            
        except Exception as e:
            logger.error(f"Error generating PDF report: {str(e)}")
            return False

    def _generate_note(self, case_id, diagnosis_results: Dict[str, Any], note_path: str) -> bool:
        """
        Generate clinical note as PDF using markdown-pdf library
        
        Args:
            diagnosis_results: Dictionary containing all diagnosis results
            note_path: Path to output PDF file
            
        Returns:
            bool: True if generation succeeded, False otherwise
        """
        try:
            if not case_id:
                logger.error("Invalid Case ID found")
                return False
                
            # Get LLM-generated note from DiagnosisService
            diagnosis_service = DiagnosisService(self.db)
            note_content = diagnosis_service.generate_clinical_note(case_id)
            
            # Initialize markdown-pdf with custom styling
            pdf = MarkdownPdf()
            
            # Set PDF metadata
            pdf.meta["title"] = "Clinical Note"
            pdf.meta["creator"] = "InferenceMD"
            pdf.meta["subject"] = "Medical Note"
            
            # Add title section
            pdf.add_section(Section(
                f"# Clinical Note\n\nGenerated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n",
                toc=False
            ))
            
            # Add the LLM-generated note content
            pdf.add_section(Section(note_content))
            
            # Add disclaimer
            pdf.add_section(Section(
                "\n---\n\n*This note was generated with the assistance of InferenceMD, "
                "an AI tool utilized in data collection, analysis and diagnostic support.*",
                toc=False
            ))
            
            # Generate PDF
            pdf.save(note_path)
            logger.info(f"PDF clinical note generated at {note_path}")
            return True
            
        except Exception as e:
            logger.error(f"Error generating clinical note: {str(e)}")
            return False
