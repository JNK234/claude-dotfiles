# InferenceMD Application Usage Guide

## Getting Started

### 1. Start the Backend (API)

First, you need to start the FastAPI backend:

```bash
cd /Users/jnk789/Desktop/NW/InferenceMD/api
./run.sh
```

If that doesn't work, try:

```bash
cd /Users/jnk789/Desktop/NW/InferenceMD/api
python -m app.main
```

This will start the backend server, typically on port 8000 (http://localhost:8000).

### 2. Start the Frontend (UI)

Next, in a separate terminal window, start the React frontend:

```bash
cd /Users/jnk789/Desktop/NW/InferenceMD/InferenceMD-UI
npm install  # Only needed first time or when dependencies change
npm start
```

This will start the development server on port 3000 (http://localhost:3000).

## Testing the Application

### Authentication Flow

1. **Login**
   - When you first open the application, you'll be redirected to the login page
   - Enter doctor credentials provided by the backend (e.g., username: "doctor@example.com", password: "password")
   - If authentication is successful, you'll be redirected to the main application interface

### Case Management

1. **View Existing Cases**
   - The left panel displays a list of existing cases
   - You can search for cases using the search bar at the top of the panel
   - Cases are color-coded by status: new, in-progress, and completed

2. **Create a New Case**
   - Click "Start New Case" button in the left panel
   - Accept the PHI disclaimer by clicking "I Acknowledge"
   - Enter the patient case details in the text area
   - You can use the "Use Sample Case" button to populate with sample data
   - Click "Submit Case" to create the case and start the workflow

3. **Select an Existing Case**
   - Click on any case in the left panel to load it
   - The application will fetch its current stage, messages, and analysis data

### Workflow Stages

1. **Patient Info Stage**
   - This is the initial stage where you submit the case details
   - After submission, the system extracts medical factors automatically

2. **Extraction Stage**
   - Review the extracted medical factors in the right panel
   - You'll see a chat message from the assistant summarizing the findings
   - Click "Approve & Continue to Next Stage" to proceed

3. **Causal Analysis Stage**
   - The system analyzes causal relationships between medical factors
   - Review the causal links in the right panel
   - Continue the conversation or approve to proceed

4. **Validation Stage**
   - The system validates if all necessary information is available
   - If information is missing, you'll be prompted with questions
   - Respond to these questions in the chat interface
   - Approve to proceed once validation is complete

5. **Counterfactual Stage**
   - Review counterfactual scenarios for the diagnosis
   - These are "what if" analyses that test alternative hypotheses
   - Approve to proceed

6. **Diagnosis Stage**
   - Review the ranked diagnoses in the right panel
   - Discuss with the assistant if you have questions
   - Approve to proceed

7. **Treatment Planning Stage**
   - Review treatment options and their classifications
   - Approve to proceed

8. **Patient Specific Stage**
   - Review personalized treatment considerations
   - Approve to proceed

9. **Final Plan Stage**
   - Review the final treatment plan
   - When complete, you'll be able to generate a report

### Chat Interface

1. **Sending Messages**
   - Use the chat box at the bottom of the center panel to send messages
   - Type your message and press Enter or click the send button
   - The system will process your message in the context of the current stage

2. **Viewing Messages**
   - Doctor messages appear on the right side (blue)
   - Assistant messages appear on the left side (gray)
   - A typing indicator appears when the assistant is processing

### Analysis Panel

1. **Viewing Analysis Sections**
   - The right panel shows different analysis sections based on the current stage
   - Click on a section header to expand or collapse it
   - Sections are color-coded by type (factors, causal, diagnosis, treatment)

2. **Generating Report**
   - When the workflow is complete, a "Download Report" button appears
   - Click this button to generate and download a PDF report of the case

## Troubleshooting

If you encounter issues, try these steps:

1. **Authentication Issues**
   - Check the browser console for errors
   - Verify the backend is running and accessible
   - Try refreshing the page or logging in again

2. **API Connection Issues**
   - Ensure the backend is running on the expected port
   - Check network requests in browser dev tools
   - Verify CORS is properly configured on the backend

3. **Workflow Issues**
   - If a stage appears stuck, check the browser console for errors
   - Try refreshing the page and selecting the case again
   - Check the backend logs for any errors processing the stage

4. **UI Rendering Issues**
   - Clear your browser cache and reload
   - Check for console errors related to React rendering
   - Verify all required dependencies are installed

For development-specific issues, check the terminal running the frontend and backend for more detailed error messages.