# Second OpniAIon: Medical Diagnosis with Causal Inference

A sophisticated medical diagnosis system that leverages causal inference and large language models to provide comprehensive medical analysis, diagnosis, and treatment recommendations.

## 🏥 Overview

Second OpniAIon is an advanced medical diagnosis assistant that helps healthcare professionals analyze patient cases through a causal inference approach. The system extracts medical factors from patient cases, identifies causal relationships between symptoms and conditions, performs counterfactual analysis, and generates evidence-based diagnoses and treatment plans.

### Key Features

- **Causal Inference Analysis**: Identifies and visualizes causal relationships between medical factors
- **Interactive Visualization**: Displays causal graphs and treatment comparisons
- **Counterfactual Reasoning**: Evaluates alternative scenarios to strengthen diagnostic confidence
- **Treatment Categorization**: Classifies treatments as causal, preventative, or symptomatic
- **PDF Report Generation**: Creates comprehensive medical reports for documentation
- **Interactive Chat Interface**: Allows natural conversation with the AI assistant
- **Patient-Specific Considerations**: Tailors treatment plans to individual patient needs

## 📋 Requirements

- Python 3.8+
- Azure OpenAI API access
- Dependencies listed in `requirements.txt`

## 🚀 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/JNK234/Second-OpinAIon.git
   cd Second-OpinAIon
Install dependencies:

```
pip install -r requirements.txt
```
Set up environment variables:

Copy .env.sample to .env
Add your Azure OpenAI API credentials to the .env file:
```
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_API_BASE=your-api-base-url
AZURE_OPENAI_API_VERSION=your-api-version
AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment-name
```

🏃‍♂️ Running the Application

Start the Streamlit application:
```
streamlit run app.py
```

The application will be available at http://localhost:8501 in your web browser.

📊 Workflow Stages

- Initial: Enter patient case details
- Extraction: Extract medical factors from the case
- Causal Analysis: Identify causal relationships between factors
- Validation: Check for missing information
- Counterfactual: Perform counterfactual analysis
- Diagnosis: Generate diagnosis based on analysis
- Treatment Planning: Identify treatment options
- Patient-Specific: Tailor treatment to patient needs
- Final Plan: Create final treatment plan
- Visualization: Generate interactive causal graph


🧠 How It Works
The system uses a multi-stage approach to medical diagnosis:

- Medical Factor Extraction: Identifies symptoms, conditions, test results, and other relevant medical information from the patient case.

- Causal Analysis: Establishes causal relationships between medical factors (e.g., "Appendicitis → Right Lower Quadrant Pain").

- Validation: Checks if all necessary information is available for diagnosis.

- Counterfactual Analysis: Evaluates alternative explanations to strengthen diagnostic confidence.

- Diagnosis Ranking: Ranks potential diagnoses based on causal analysis and counterfactual reasoning.

- Treatment Planning: Identifies treatment options categorized as:

✅ Causal Treatment: Addresses the root cause
✅ Preventative Treatment: Prevents complications
❌ Symptomatic Treatment: Only addresses symptoms
Patient-Specific Planning: Tailors treatment options to the specific patient.

- Final Treatment Plan: Generates a comprehensive treatment plan.
