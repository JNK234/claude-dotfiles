"""
Pydantic schemas for Contact Form data.
"""
from pydantic import BaseModel, EmailStr, Field

class ContactFormSchema(BaseModel):
    """
    Schema for validating contact form submissions.

    Attributes:
        name: The name of the person submitting the form.
        email: The email address of the person submitting the form. Must be a valid email format.
        subject: The subject line of the message.
        message: The content of the message.
    """
    name: str = Field(..., min_length=1, max_length=100, description="Sender's name")
    email: EmailStr = Field(..., description="Sender's email address")
    subject: str = Field(..., min_length=1, max_length=200, description="Message subject")
    message: str = Field(..., min_length=1, max_length=5000, description="Message content")

    class Config:
        # Example for OpenAPI documentation
        json_schema_extra = {
            "example": {
                "name": "Jane Doe",
                "email": "jane.doe@example.com",
                "subject": "Inquiry about Medhastra AI",
                "message": "I would like to learn more about your product."
            }
        }
