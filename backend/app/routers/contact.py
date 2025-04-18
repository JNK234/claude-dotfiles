"""
API Router for handling contact form submissions.
"""
import logging
from fastapi import APIRouter, HTTPException, status, BackgroundTasks
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr

from app.schemas.contact import ContactFormSchema
from app.core.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# --- Email Configuration ---
# Load email settings from the central config
# Basic validation to ensure required settings are present
if not all([settings.MAIL_USERNAME, settings.MAIL_PASSWORD, settings.MAIL_FROM, settings.MAIL_SERVER]):
    logger.error("Email configuration is incomplete. Please check MAIL_USERNAME, MAIL_PASSWORD, MAIL_FROM, MAIL_SERVER in your environment variables.")
    # Depending on deployment strategy, you might raise an error here or allow startup but fail requests.
    # For now, we log an error but allow the app to start. The endpoint will fail if config is missing.
    conf = None # Indicate config is invalid
else:
    conf = ConnectionConfig(
        MAIL_USERNAME=settings.MAIL_USERNAME,
        MAIL_PASSWORD=settings.MAIL_PASSWORD,
        MAIL_FROM=settings.MAIL_FROM,
        MAIL_PORT=settings.MAIL_PORT,
        MAIL_SERVER=settings.MAIL_SERVER,
        MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
        MAIL_STARTTLS=settings.MAIL_STARTTLS,
        MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
        USE_CREDENTIALS=settings.USE_CREDENTIALS,
        VALIDATE_CERTS=settings.VALIDATE_CERTS,
        TEMPLATE_FOLDER=settings.TEMPLATE_FOLDER # Pass template folder if set
    )

# --- Helper Function for Sending Email ---
async def send_email_background(fm: FastMail, message: MessageSchema):
    """Sends email in the background to avoid blocking the request."""
    try:
        await fm.send_message(message)
        logger.info(f"Contact email sent successfully to {message.recipients}")
    except Exception as e:
        logger.error(f"Failed to send contact email: {e}", exc_info=True)
        # Note: Background task errors don't directly inform the client.
        # Consider adding monitoring or alternative notification for failures here.

# --- API Endpoint ---
@router.post("/contact", status_code=status.HTTP_200_OK, summary="Submit Contact Form")
async def submit_contact_form(
    contact_data: ContactFormSchema,
    background_tasks: BackgroundTasks
):
    """
    Receives contact form data, validates it, and sends an email notification.

    - **name**: Sender's name.
    - **email**: Sender's email address.
    - **subject**: Message subject.
    - **message**: Message content.

    Sends an email to the configured recipient (medhastra@gmail.com)
    with the submitted details.
    """
    if not conf:
        logger.error("Attempted to send email, but email configuration is invalid or incomplete.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Email service is not configured correctly.",
        )

    # Construct the email message
    email_subject = f"Contact Form Submission: {contact_data.subject}"
    email_body = f"""
    You received a new message from the Medhastra AI contact form:

    Name: {contact_data.name}
    Email: {contact_data.email}
    Subject: {contact_data.subject}

    Message:
    --------------------------------------------------
    {contact_data.message}
    --------------------------------------------------
    """

    message = MessageSchema(
        subject=email_subject,
        recipients=["medhastra@gmail.com"],  # Hardcoded recipient address
        body=email_body,
        subtype=MessageType.plain,
        reply_to=[contact_data.email] # Set Reply-To header to the sender's email
    )

    # Initialize FastMail instance with the configuration
    fm = FastMail(conf)

    # Add the email sending task to be run in the background
    background_tasks.add_task(send_email_background, fm, message)

    # Return success response immediately
    # The email sending happens in the background
    logger.info(f"Contact form submitted by {contact_data.email}. Email sending queued.")
    return {"message": "Your message has been received and is being processed."}

# --- Documentation & Explanation ---
"""
## Contact Router Documentation

### Purpose
This router handles submissions from the website's contact form. Its primary function is to take the user's name, email, subject, and message, validate this information, and then forward it as an email to a designated recipient (`medhastra@gmail.com`).

### Implementation Details
1.  **Configuration (`ConnectionConfig`)**:
    *   Email server details (SMTP server, port, credentials, TLS settings) are loaded from environment variables via the `settings` object (`app.core.config.settings`). This keeps sensitive information out of the codebase.
    *   A basic check ensures essential configuration variables are present before creating the `ConnectionConfig`. If not, an error is logged, and the endpoint will fail gracefully.

2.  **Schema Validation (`ContactFormSchema`)**:
    *   The incoming request body is automatically validated against the `ContactFormSchema` (`app.schemas.contact.ContactFormSchema`).
    *   FastAPI handles returning a `422 Unprocessable Entity` error if the data doesn't match the schema (e.g., invalid email format, missing fields, fields too long/short).

3.  **Email Construction (`MessageSchema`)**:
    *   A `MessageSchema` object is created to represent the email.
    *   The recipient is hardcoded to `medhastra@gmail.com`.
    *   The subject line includes a prefix ("Contact Form Submission:") for easy identification.
    *   The email body is formatted as plain text, clearly presenting all the submitted information (name, email, subject, message).
    *   Crucially, the `reply_to` header is set to the sender's email address (`contact_data.email`). This allows the recipient (Medhastra) to simply hit "Reply" in their email client to respond directly to the user who submitted the form.

4.  **Asynchronous Email Sending (`BackgroundTasks`)**:
    *   Sending emails can sometimes be slow due to network latency or SMTP server response times. To avoid blocking the API response and making the user wait, the email sending operation is delegated to FastAPI's `BackgroundTasks`.
    *   The `send_email_background` helper function contains the actual `fm.send_message(message)` call.
    *   The main endpoint (`submit_contact_form`) adds this helper function to the `background_tasks` queue and returns a `200 OK` response immediately to the frontend.
    *   **Error Handling**: Errors within the background task (e.g., SMTP connection failure, authentication error) are logged but *do not* automatically result in an error response to the original client request (as the request has already completed). Robust error monitoring for background tasks (e.g., using Sentry, specific logging aggregation) is recommended for production environments.

5.  **Error Handling (Endpoint)**:
    *   If the initial email configuration check fails (missing environment variables), the endpoint raises a `500 Internal Server Error` immediately, preventing attempts to send email with invalid settings.

### Integration
*   This router needs to be included in the main FastAPI application instance in `app/main.py` under the `/api/v1` prefix.
*   The frontend needs to make a `POST` request to `/api/v1/contact` with a JSON body matching the `ContactFormSchema`.

### Future Considerations
*   **Email Templates**: For more complex or HTML-formatted emails, `fastapi-mail` supports Jinja2 templates. The `TEMPLATE_FOLDER` setting would need to be configured.
*   **Rate Limiting**: To prevent abuse, consider adding rate limiting to this endpoint.
*   **Database Logging**: Optionally, log contact form submissions to a database table for record-keeping or tracking purposes.
*   **More Robust Error Notification**: Implement a system (e.g., dedicated monitoring, alerts) to notify administrators if background email sending fails consistently.
"""
