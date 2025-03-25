"""
Report generation service for creating markdown and PDF reports of diagnosis and treatment plans
"""
import os
import subprocess
import logging
from datetime import datetime
from typing import Dict, Any, Optional
import json
import base64

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.case import Case, StageResult, Report

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
        
        # Ensure reports directory exists
        os.makedirs(settings.REPORTS_DIR, exist_ok=True)
    
    def generate_report(self, case_id: str) -> Optional[Dict[str, Any]]:
        """
        Generate a markdown and PDF report of the diagnosis and treatment plan
        
        Args:
            case_id: Case ID
            
        Returns:
            Optional[Dict[str, Any]]: Report information or None if generation fails
        """
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
            
            # Generate markdown content
            markdown_content = self._create_markdown_report(diagnosis_results)
            
            # Save markdown file
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            markdown_filename = f"report_{case_id}_{timestamp}.md"
            markdown_path = os.path.join(settings.REPORTS_DIR, markdown_filename)
            
            with open(markdown_path, 'w') as f:
                f.write(markdown_content)
                
            logger.info(f"Markdown report generated at {markdown_path}")
            
            # Convert markdown to PDF
            pdf_filename = f"report_{case_id}_{timestamp}.pdf"
            pdf_path = os.path.join(settings.REPORTS_DIR, pdf_filename)
            
            success = self._convert_markdown_to_pdf(markdown_path, pdf_path)
            
            # Create report record
            report = Report(
                case_id=case_id,
                file_path=pdf_path if success else markdown_path
            )
            
            # Save to database
            self.db.add(report)
            self.db.commit()
            self.db.refresh(report)
            
            return {
                "id": str(report.id),
                "case_id": str(report.case_id),
                "file_path": report.file_path,
                "markdown_path": markdown_path,
                "pdf_path": pdf_path if success else None,
                "created_at": report.created_at
            }
        
        except Exception as e:
            logger.error(f"Error in generate_report: {str(e)}")
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
        report = self.db.query(Report).filter(Report.id == report_id).first()
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
        elif file_ext.lower() == '.md':
            content_type = "text/markdown"
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
    
    def _create_markdown_report(self, diagnosis_results: Dict[str, Any]) -> str:
        """
        Create markdown content for the report
        
        Args:
            diagnosis_results: Dictionary containing all diagnosis results
            
        Returns:
            str: Markdown content for the report
        """
        # Extract data
        case_text = diagnosis_results.get('initial', {}).get('case_text', 'No case text provided')
        extracted_factors = diagnosis_results.get('extraction', {}).get('extracted_factors', 'No extracted factors available')
        causal_links = diagnosis_results.get('causal_analysis', {}).get('causal_links', 'No causal links available')
        diagnosis = diagnosis_results.get('diagnosis', {}).get('diagnosis', 'No diagnosis available')
        treatment_plan = diagnosis_results.get('treatment_planning', {}).get('treatment_plan', 'No treatment plan available')
        patient_specific_plan = diagnosis_results.get('patient_specific', {}).get('patient_specific_plan', 'No patient-specific plan available')
        final_treatment_plan = diagnosis_results.get('final_plan', {}).get('final_treatment_plan', 'No final treatment plan available')
        
        # Create markdown content
        content = f"""# Medical Diagnosis and Treatment Plan

Generated on: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

## Patient Case

{case_text}

## Medical Factors

{extracted_factors}

## Causal Analysis

{causal_links}

## Diagnosis

{diagnosis}

## Treatment Plan

{treatment_plan}

## Patient-Specific Considerations

{patient_specific_plan}

## Final Treatment Recommendation

{final_treatment_plan}

---

*This report was generated using causal inference with LLMs. It is intended for informational purposes only and should be reviewed by a qualified medical professional.*
"""
        
        return content
    
    def _convert_markdown_to_pdf(self, markdown_path: str, pdf_path: str) -> bool:
        """
        Convert markdown to PDF
        
        Args:
            markdown_path: Path to markdown file
            pdf_path: Path to output PDF file
            
        Returns:
            bool: True if conversion succeeded, False otherwise
        """
        try:
            # Method 1: Try using pandoc if available
            try:
                subprocess.run(
                    ["pandoc", markdown_path, "-o", pdf_path],
                    check=True,
                    capture_output=True
                )
                logger.info(f"PDF report generated at {pdf_path} using pandoc")
                return True
            except (subprocess.CalledProcessError, FileNotFoundError) as e:
                logger.warning(f"Failed to convert using pandoc: {str(e)}")
            
            # Method 2: Try using markdown-pdf if available
            try:
                subprocess.run(
                    ["markdown-pdf", markdown_path, "-o", pdf_path],
                    check=True,
                    capture_output=True
                )
                logger.info(f"PDF report generated at {pdf_path} using markdown-pdf")
                return True
            except (subprocess.CalledProcessError, FileNotFoundError) as e:
                logger.warning(f"Failed to convert using markdown-pdf: {str(e)}")
            
            # Method 3: Try using wkhtmltopdf directly if available
            try:
                # First convert markdown to HTML using a simple approach
                with open(markdown_path, 'r') as f:
                    markdown_content = f.read()
                
                html_content = f"""
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Medical Diagnosis Report</title>
                    <style>
                        body {{ font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }}
                        h1, h2 {{ color: #2C3E50; }}
                        h1 {{ border-bottom: 2px solid #3498DB; padding-bottom: 10px; }}
                        h2 {{ margin-top: 30px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }}
                        pre {{ background-color: #f9f9f9; padding: 10px; border-radius: 5px; }}
                    </style>
                </head>
                <body>
                    {self._simple_markdown_to_html(markdown_content)}
                </body>
                </html>
                """
                
                # Save HTML to temporary file
                html_path = markdown_path.replace('.md', '.html')
                with open(html_path, 'w') as f:
                    f.write(html_content)
                
                # Convert HTML to PDF using wkhtmltopdf
                subprocess.run(
                    ["wkhtmltopdf", html_path, pdf_path],
                    check=True,
                    capture_output=True
                )
                
                # Clean up temporary HTML file
                os.unlink(html_path)
                
                logger.info(f"PDF report generated at {pdf_path} using wkhtmltopdf")
                return True
            except (subprocess.CalledProcessError, FileNotFoundError) as e:
                logger.warning(f"Failed to convert using wkhtmltopdf: {str(e)}")
            
            logger.error("All PDF conversion methods failed")
            return False
            
        except Exception as e:
            logger.error(f"Error converting markdown to PDF: {str(e)}")
            return False
    
    def _simple_markdown_to_html(self, markdown: str) -> str:
        """
        Simple markdown to HTML converter
        
        Args:
            markdown: Markdown content
            
        Returns:
            str: HTML content
        """
        # This is a very simple converter for basic markdown
        html = markdown
        
        # Headers
        html = html.replace("# ", "<h1>").replace("\n## ", "</h1>\n<h2>").replace("\n### ", "</h2>\n<h3>")
        html = html.replace("\n#### ", "</h3>\n<h4>").replace("\n##### ", "</h4>\n<h5>").replace("\n###### ", "</h5>\n<h6>")
        html = html + "</h6>" if html.count("<h6>") > html.count("</h6>") else html
        html = html + "</h5>" if html.count("<h5>") > html.count("</h5>") else html
        html = html + "</h4>" if html.count("<h4>") > html.count("</h4>") else html
        html = html + "</h3>" if html.count("<h3>") > html.count("</h3>") else html
        html = html + "</h2>" if html.count("<h2>") > html.count("</h2>") else html
        html = html + "</h1>" if html.count("<h1>") > html.count("</h1>") else html
        
        # Emphasis
        for _ in range(html.count("**")):
            html = html.replace("**", "<strong>", 1).replace("**", "</strong>", 1)
        
        for _ in range(html.count("*")):
            html = html.replace("*", "<em>", 1).replace("*", "</em>", 1)
        
        # Paragraphs
        html = html.replace("\n\n", "</p>\n<p>")
        html = "<p>" + html + "</p>"
        
        # Horizontal rules
        html = html.replace("\n---\n", "<hr>")
        
        return html