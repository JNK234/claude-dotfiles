# InferenceMD Diagnosis Workflow

This document describes the diagnosis workflow used in the InferenceMD application.

## Overview

The InferenceMD application uses a structured, stage-based workflow for medical diagnosis using causal inference with LLMs. Each stage builds upon the results of previous stages to create a comprehensive diagnosis and treatment plan.

## Workflow Stages

The diagnosis workflow consists of the following stages:

1. **Initial**: Entry point for the workflow, stores the case text
2. **Extraction**: Extracts medical factors from the case text
3. **Causal Analysis**: Identifies causal relationships between medical factors
4. **Validation**: Validates completeness of information
5. **Counterfactual**: Performs counterfactual analysis using causal relationships
6. **Diagnosis**: Generates diagnosis based on counterfactual analysis
7. **Treatment Planning**: Identifies treatment options based on diagnosis
8. **Patient Specific**: Personalizes treatment options based on patient factors
9. **Final Plan**: Creates final treatment plan based on personalized options

## Stage Details

### 1. Initial Stage

- **Input**: Patient case text
- **Process**: Stores the case text
- **Output**: Case text for extraction stage

### 2. Extraction Stage

- **Input**: Patient case text
- **Process**: Uses LLM to extract medical factors like symptoms, conditions, history, etc.
- **Output**: Structured list of medical factors categorized by type

Example output:
```
Patient Symptoms & Observations
- Severe abdominal pain in right lower quadrant
- Nausea and vomiting
- Temperature of 38.2°C

Suspected Conditions
- Appendicitis

Relevant Past Medical History & Risk Factors
- No significant past medical history
- No known allergies

Key Physical Exam Findings
- Rebound tenderness at McBurney's point
- Positive Rovsing's sign

Performed or Suggested Diagnostic Tests
- WBC count: 14,500/μL with neutrophilia

Trialed Interventions
- None mentioned
```

### 3. Causal Analysis Stage

- **Input**: Extracted medical factors
- **Process**: Uses LLM to identify causal relationships between factors
- **Output**: List of causal links, confounders, and mediators

Example output:
```
1. Direct Causal Links
Right lower quadrant pain → Appendicitis
Appendicitis → Rebound tenderness at McBurney's point
Appendicitis → Elevated WBC count
Appendicitis → Fever

2. Identified Confounders
Infection influences both Appendicitis and Elevated WBC count

3. Identified Mediators
Inflammation lies between Appendicitis → Rebound tenderness
```

### 4. Validation Stage

- **Input**: Extracted factors and causal links
- **Process**: Uses LLM to check for missing critical information
- **Output**: List of missing information, follow-up questions, and readiness status

Example output:
```
Missing Information Identified
- No imaging studies (CT scan or ultrasound) to confirm appendicitis

Follow-Up Questions
- Has the patient had any imaging studies performed?
- What is the duration of symptoms?

Status: Ready to Proceed?
❌ No – Missing critical information. Request follow-up data.
```

### 5. Counterfactual Stage

- **Input**: Extracted factors, causal links, and validation results
- **Process**: Uses LLM to trace symptoms to root causes and test "what if" scenarios
- **Output**: Direct causes, causal chains, and counterfactual analysis

Example output:
```
2. Direct Causes of Symptoms
Right lower quadrant pain → Appendicitis
Fever → Appendicitis
Elevated WBC → Infection/Inflammation

3. Expanded Causal Chains (Tracing to Root Cause)
Appendicitis → Inflammation → Rebound tenderness and pain

5. Counterfactual Analysis (What-If Scenarios)
What if pain were in left lower quadrant? → Diverticulitis more likely than appendicitis
What if WBC was normal? → Viral cause more likely than bacterial appendicitis
```

### 6. Diagnosis Stage

- **Input**: Counterfactual analysis
- **Process**: Uses LLM to generate and rank diagnoses
- **Output**: Ranked diagnoses with justifications

Example output:
```
5. Updated Ranked Diagnoses
Acute appendicitis – Justified by: Classic presentation with RLQ pain, rebound tenderness, fever, and elevated WBC
Mesenteric adenitis – Justified by: Similar symptoms but typically less severe pain
Gastroenteritis – Justified by: Can cause abdominal pain and fever but typically more diffuse
```

### 7. Treatment Planning Stage

- **Input**: Diagnosis
- **Process**: Uses LLM to identify treatment options and categorize them
- **Output**: Available treatments, categorization, and contraindications

Example output:
```
1. Available Treatment Options
- Appendectomy (surgical removal)
- Antibiotics
- Pain management
- IV fluids

2. Categorization of Treatments
1. Appendectomy – ✅ Causal Treatment (Removes infected appendix, addressing root cause)
2. Antibiotics – ✅ Preventative Treatment (Prevents spread of infection)
3. Pain management – ❌ Symptomatic Treatment (Addresses pain but not underlying cause)
4. IV fluids – ❌ Symptomatic Treatment (Addresses dehydration but not underlying cause)
```

### 8. Patient Specific Stage

- **Input**: Diagnosis and treatment plan
- **Process**: Uses LLM to personalize treatment based on patient factors
- **Output**: Patient-specific treatment considerations and rankings

Example output:
```
1. Patient-Specific Information:
Diagnosis: Acute appendicitis
Comorbidities: None significant
Current Medications: None
Organ Function Status: Normal liver and kidney function
Severity Level: Moderate to severe

5. Final Treatment Ranking & Justification:
- Laparoscopic Appendectomy – Best option for definitive treatment in a healthy patient
- IV Antibiotics – Essential pre-surgery and post-surgery to prevent complications
- IV Fluids – Necessary to maintain hydration status during perioperative period
```

### 9. Final Plan Stage

- **Input**: Treatment plan and patient-specific considerations
- **Process**: Uses LLM to create final treatment plan with monitoring
- **Output**: Final treatment recommendation, outcomes, and monitoring

Example output:
```
1. Final Treatment Plan:
Laparoscopic Appendectomy → Definitive treatment with minimal invasiveness
IV Antibiotics (Ceftriaxone and Metronidazole) → Prevent and treat infection
IV Fluids → Maintain hydration status
Pain Management → Control post-operative pain

2. Expected Patient Outcomes:
Short-term: Complete resolution of acute symptoms, 2-3 days hospitalization
Long-term: Full recovery expected within 2-3 weeks
Overall Prognosis: Excellent with timely surgical intervention
```

## Workflow Flow

1. The user starts by creating a case with patient information
2. The workflow begins with the **Initial** stage
3. Each stage is processed by the LLM and the results are stored
4. The user reviews each stage and approves it to move to the next stage
5. If additional information is needed (especially in the **Validation** stage), the user can provide it via chat
6. After the **Final Plan** stage, the user can generate a report with all the results

## Benefits of Stage-Based Workflow

1. **Transparency**: Each stage provides clear reasoning and outputs
2. **Control**: User can review and approve each stage before proceeding
3. **Iteration**: Additional information can be added at each stage
4. **Completeness**: Ensures all aspects of diagnosis are considered
5. **Documentation**: Complete record of the diagnosis process