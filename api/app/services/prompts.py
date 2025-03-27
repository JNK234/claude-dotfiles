"""
Collection of prompt templates for different stages of diagnosis.
"""

# New summary prompts for consolidated stages

CASE_ANALYSIS_SUMMARY_PROMPT = """
Consider the following extracted factors and causal links for the patient case. 

Extracted Factors:
{extracted_factors}

Causal Links:
{causal_links}

Now consider the following Validation information:

Validation:
{validation_result}

Now briefly summarise the findings of extracted factors and causal links for the physician. Then in details explain the validation information and ask for questions or 
requirements if any. Have a chat kind of conversation with the physician while asking questions. Be direct and precise. Provide response in first person or active voice.
"""

DIAGNOSIS_SUMMARY_PROMPT = """
Provide a concise summary of the diagnosis analysis:

Counterfactual Analysis:
{counterfactual_analysis}

Diagnosis:
{diagnosis}

Highlight only the most important findings that the physician needs to know.
"""

TREATMENT_SUMMARY_PROMPT = """
Summarize the key aspects of the treatment plan:

Treatment Plan:
{treatment_plan}

Patient-Specific Plan:
{patient_specific_plan}

Final Treatment Plan:
{final_treatment_plan}

Provide a concise, actionable summary for the physician.
"""


# 1. Node Extraction Prompt
NODE_EXTRACTION_PROMPT = """You are an intelligent medical student and assistant assisting a team of highly qualified doctors and
physicians working on analyzing and addressing a patient case. You have to help with based on the
requirements in analysing the patient's case and addressing by giving suitable treatment.
Your goal is to extract all key factors (nodes) relevant to the patient's condition. List these factors
without making decisions or suggesting treatments. Extract and categorize them carefully as follows.
Put the point in the category it most suited to be in.

Categories of Nodes:

Patient Symptoms & Observations
List all key symptoms and vitals.

Suspected Conditions
List differential diagnoses, if mentioned.

Relevant Past Medical History & Risk Factors
Identify any past medical conditions, past surgical history, lifestyle and social factors, or genetic
predispositions, including family history, that could be relevant.

Key Physical Exam Findings
List any key physical findings mentioned.

Performed or Suggested Diagnostic Tests
List any laboratory tests, imaging studies, or procedures used for evaluation so far.

Trialed Interventions (Do not evaluate yet! Just extract.)
List treatments, medications, surgeries, or supportive interventions mentioned in the case that have
been done so far.

Response Format:

Patient Symptoms & Observations
[List]
Suspected Conditions
[List]
Relevant Past Medical History & Risk Factors
[List]
Key Physical Exam Findings
[List]
Performed or Suggested Diagnostic Tests
[List]
Trialed Interventions
[List]

Instructions:
Do not explain or analyze the relationships yet.
Do not suggest next steps or treatments.
Simply extract and categorize all relevant factors from the case.

Case:
{case_text}
"""
# PROMPTS['NODE_EXTRACTION_PROMPT'] = NODE_EXTRACTION_PROMPT

# 2. Causal Analysis Prompt
CAUSAL_ANALYSIS_PROMPT = """You are analyzing a medical case to build a causal understanding of the patient's condition. Based on
the extracted key nodes, your task is to establish the causal relationships between them. Follow these
steps:

Identify Direct Causal Links
For each symptom, identify the most probable direct cause (e.g., "Massive hematemesis →
Esophageal varices").
For each diagnosis, identify what directly led to its development.
For each treatment, specify what it directly influences.
Identify Confounders
Identify any factors that influence both a cause and an effect, potentially misleading the diagnosis.
Example: Cirrhosis affects both esophageal varices and coagulopathy, making it a confounder in
bleeding severity.
Identify Mediators
Identify any stepwise dependencies where one factor leads to another before reaching the final
outcome.
Example: Liver dysfunction → Impaired clotting → Uncontrolled bleeding (impaired clotting is the
mediator).
Identify Possible Instrumental Variables (IVs) for Diagnosis
Are there any factors that influence treatment selection but not the disease itself?
Example: Previous use of beta-blockers (IV) can help assess the effect of portal hypertension
management without being a direct cause of bleeding.

Response Format:
1. Direct Causal Links
[Cause] → [Effect]
[Cause] → [Effect]
2. Identified Confounders
[Confounder] influences both [Cause] and [Effect]
3. Identified Mediators
[Mediator] lies between [Cause] → [Effect]
4. Potential Instrumental Variables (IVs)
[IV] affects [Treatment] but is unrelated to [Disease]

Instructions:
Do not recommend treatments yet.
Do not analyze or make decisions—just establish causal links.
"""
# PROMPTS['CAUSAL_ANALYSIS_PROMPT'] = CAUSAL_ANALYSIS_PROMPT

# 3. Information Validation Prompt
VALIDATION_PROMPT = """Before proceeding with causal reasoning for diagnosis, you must verify that all essential information is
present. Evaluate the extracted data and identify any gaps. Follow these steps:

1. Check for Missing Information
Review all symptoms, diagnoses, medical history, tests, and interventions.
Identify any critical missing elements that would affect diagnosis.

Example:
If sepsis is suspected but no white blood cell count (WBC) is available → Follow-up question
needed.
If esophageal varices bleeding is suspected but no endoscopy report is given → Follow-up
question needed.

2. Generate Follow-Up Questions for Missing Information
If any key element is missing, generate a follow-up question to request the data.
Example:
"What are the patient's liver function test results?"
"Has the patient been on anticoagulation therapy?"

3. Confirm Readiness to Proceed
If all necessary data is present, confirm readiness to move to the diagnosis step.
If data is missing, pause and request additional details before proceeding.

Response Format:
Missing Information Identified
[List missing clinical data points]

Follow-Up Questions
[List specific questions needed to obtain missing data]

Status: Ready to Proceed?
✅ Yes – All data is available. Proceed to reasoning.
❌ No – Missing critical information. Request follow-up data.
"""
# PROMPTS['VALIDATION_PROMPT'] = VALIDATION_PROMPT

# 4. Counterfactual Analysis Prompt
COUNTERFACTUAL_PROMPT = """Before proceeding with diagnosis, ensure that all required information is available and logical. Then,
systematically trace symptoms back to their most probable root causes using a causal graph.

1. Confirm Readiness to Proceed
Review the available information:
Are all required symptoms, history, tests, and interventions present?
Are any critical data points missing?
If missing, pause and generate follow-up questions before proceeding.

2. Identify Direct Causes of Symptoms
For each symptom, identify the most direct possible cause using the causal graph.
Example:
Severe upper GI bleeding → Possible cause: Esophageal varices OR Peptic ulcer
Hypotension → Possible cause: Blood loss OR Sepsis OR Heart failure

3. Expand Causal Chains to Find Root Causes
For each direct cause, determine what could have led to that condition.
Example:
Esophageal varices → Portal hypertension → Cirrhosis
Severe sepsis → UTI or pneumonia or bloodstream infection
Repeat this process until a root cause is identified (e.g., Cirrhosis in this case).

4. Identify Confounders and Mediators
Confounders: Are there factors that affect both cause and effect?
Example: Liver disease affects both coagulation and GI bleeding severity (confounder).
Mediators: Are there intermediate steps linking cause and effect?
Example: Portal hypertension → Esophageal varices → GI bleeding (mediators).

5. Use Counterfactual Reasoning to Validate Diagnosis
Ask "what if" questions to test causal reasoning:
If the patient did NOT have symptom X, would the diagnosis change?
If symptom Y were absent, would a different cause be more likely?
If a treatment (e.g., blood transfusion) fixes the symptom, what does that imply about the root
cause?

6. Rank Most Probable Diagnoses
Based on the causal chain analysis, list the most likely diagnoses in descending order of
probability.
Indicate key evidence supporting each diagnosis and why other possibilities are less likely.

Response Format:

1. Confirm Readiness to Proceed
✅ Yes – All data is available. Proceed to reasoning.
❌ No – Missing critical information. Follow-up questions:
[List follow-up questions]

2. Direct Causes of Symptoms
[Symptom] → [Direct Cause]
[Symptom] → [Direct Cause]

3. Expanded Causal Chains (Tracing to Root Cause)
[Cause] → [Mediators] → [Root Cause]

4. Confounders & Mediators
Confounders: [List]
Mediators: [List]

5. Counterfactual Analysis (What-If Scenarios)
What if [Symptom X] were absent? → [Expected Change in Diagnosis]
What if [Treatment Y] worked instantly? → [Implication for Root Cause]

6. Ranked Most Probable Diagnoses
1. [Most likely diagnosis] – Supported by: [Key evidence]
2. [Second most likely diagnosis] – Supported by: [Key evidence]
3. [Alternative diagnosis] – Supported by: [Key evidence]
"""
# PROMPTS['COUNTERFACTUAL_PROMPT'] = COUNTERFACTUAL_PROMPT

# 5. Diagnosis Ranking Prompt
DIAGNOSIS_RANKING_PROMPT = """Now that you have traced symptoms back to their probable root causes using causal analysis, your
next task is to validate the diagnosis by testing counterfactual scenarios. Carefully follow the steps
below

1. Confirm Readiness to Proceed
Review the structured causal pathway from the previous step.
Identify if any key information is still missing that would impact the counterfactual analysis.
If critical data is missing, pause and generate follow-up questions before proceeding.
✅ Do you have all essential medical details for reasoning? If yes, continue.
❌ If no, list the missing elements and generate follow-up questions.

2. Test "What If" Scenarios on Symptoms
Consider the absence of a key symptom and predict how it would affect the diagnosis.
Ask:
If Symptom X were missing, would the diagnosis change?
Would another condition now be more likely?
Which causal pathway is weakened or eliminated?
Example:
If the patient had GI bleeding but NOT hypotension, would cirrhosis still be the most probable
cause?
If jaundice were absent, would liver failure still be a likely factor?
🔹 List each tested symptom and its effect on diagnosis.

3. Test the Effect of Interventions
Consider whether a treatment changes symptoms as expected.
Ask:
If a particular treatment resolved the condition, what does that imply about the cause?
If the treatment had no effect, does that rule out a suspected cause?
Example:
If blood transfusion stabilizes the patient, does that confirm the primary cause was acute blood
loss?
If IV antibiotics do NOT improve the condition, does that weaken the likelihood of sepsis?
🔹 List each tested intervention and its effect on diagnosis.

4. Consider the Impact of Test Results
Evaluate whether the presence or absence of specific test results changes the diagnosis.
Ask:
If the test result for X was abnormal, how would that affect the causal graph?
If the test result was normal, would it weaken a particular causal path?
Example:
If liver enzymes are normal, does that weaken the cirrhosis diagnosis?
If the endoscopy does NOT show varices, does that eliminate portal hypertension as a cause?

🔹 List each tested test result and its effect on diagnosis.
5. Rank the Adjusted Diagnoses Based on Counterfactual Testing
Based on the above symptom, intervention, and test counterfactuals, update the diagnosis
rankings.

If a previously high-likelihood diagnosis is weakened, adjust rankings accordingly.
Example:
Updated Ranked Diagnoses:
Most likely: Cirrhosis with variceal bleeding (high confidence)
Alternative: Peptic ulcer with hemorrhage (moderate confidence)
Less likely: Gastric cancer (low confidence)
Provide justification for ranking changes.

Response Format:

1. Readiness Check
✅ Yes – All data is available. Proceed to counterfactual testing.
❌ No – Missing critical information. Follow-up questions:
[List missing elements and follow-up questions]

2. Counterfactual Analysis on Symptoms
If [Symptom X] were missing, the diagnosis would change as follows:
[Explain impact on causal pathways]

3. Counterfactual Testing on Interventions
If [Treatment Y] worked, this would confirm [Diagnosis A] because:
[Explain impact]
If [Treatment Z] failed, this would weaken [Diagnosis B] because:
[Explain impact]

4. Counterfactual Testing on Test Results
If [Test X] was abnormal, this would strengthen [Diagnosis C] because:
[Explain impact]
If [Test Y] was normal, this would weaken [Diagnosis D] because:
[Explain impact]

5. Updated Ranked Diagnoses
[Most likely diagnosis] – Justified by: [Counterfactual insights]
[Alternative diagnosis] – Justified by: [Counterfactual insights]
[Less likely diagnosis] – Justified by: [Counterfactual insights]
"""
# PROMPTS['DIAGNOSIS_RANKING_PROMPT'] = DIAGNOSIS_RANKING_PROMPT

# 6. Treatment Planning Prompt
TREATMENT_PROMPT = """You are now responsible for determining the best possible treatment for the confirmed diagnosis. Your
task is to systematically identify and evaluate all available treatment options, classifying them based on
their effectiveness in treating the root cause rather than just managing symptoms. Follow the steps
below:

List All Possible Treatment Options for the Confirmed Diagnosis
Identify all available treatments that can be used for this condition.
Include medications, surgical interventions, lifestyle modifications, and supportive care if relevant.
Ensure all listed treatments are evidence-based and commonly used in medical practice.

Format Example:

Available Treatments:
1. TIPS Procedure
2. Endoscopic Band Ligation
3. Beta-Blockers
4. Blood Transfusion
5. IV Fluids
6. Antibiotics
Categorize Treatments by Their Impact on the Disease Mechanism
For each treatment, determine whether it treats the root cause, prevents future episodes, or only
manages symptoms.
📌 Categories:
✅ Causal Treatment – Directly addresses the root cause.
✅ Preventative Treatment – Reduces the risk of recurrence.
❌ Symptomatic Treatment – Controls symptoms without fixing the cause.

Format Example:

Categorization of Treatments:
1. TIPS Procedure – ✅ Causal Treatment (Reduces portal hypertension, preventing variceal
bleeding)
2. Endoscopic Band Ligation – ✅ Causal Treatment (Stops bleeding directly, but does not prevent
recurrence)
3. Beta-Blockers – ✅ Preventative Treatment (Reduces variceal pressure, lowering future risk)
4. Blood Transfusion – ❌ Symptomatic Treatment (Replaces lost blood but does not stop bleeding)
5. IV Fluids – ❌ Symptomatic Treatment (Supports hemodynamic stability but does not treat
bleeding)
6. Antibiotics – ✅ Preventative Treatment (Prevents infection, which could trigger further
complications)
Identify Treatment Dependencies & Synergies
Some treatments must be combined to be effective. Determine:
Which treatments must be given together for best results?
Which treatments work independently?
Are there order-dependent treatments (e.g., some must be given before others)?

📌 Format Example:
Contraindications & Risks:
TIPS Procedure: Risk of hepatic encephalopathy; contraindicated in severe liver failure.
Beta-Blockers: Can cause hypotension; avoid in patients with severe heart failure.
Endoscopic Banding: Not effective for severe varices that cannot be ligated.
Blood Transfusion: Risk of iron overload with repeated transfusions.
IV Fluids: May worsen volume overload in cirrhotic patients.


Final Response Format:

1. Available Treatment Options
[List all treatments]

2. Categorization of Treatments
[List with causal, preventative, or symptomatic classification]

3. Treatment Dependencies & Synergies
[List how treatments work together]

4. Contraindications & Side Effects
[List risks and limitations]
"""
# PROMPTS['TREATMENT_PROMPT'] = TREATMENT_PROMPT

# 7. Patient-Specific Treatment Prompt
PATIENT_SPECIFIC_TREATMENT_PROMPT = """Now that all possible treatments have been listed and categorized, your next task is to use causal
inference to determine which treatment(s) will be most effective for this specific patient. Carefully follow
the steps below to ensure your reasoning is accurate and patient-specific
Review Patient-Specific Factors Before Proceeding
Before reasoning about treatment, ensure you have all relevant patient information that could affect
treatment selection. Review:
Confirmed Diagnosis (from previous steps)
Patient Age & Gender
Comorbidities & Medical History
Current Medications
Allergies & Contraindications
Organ Function (e.g., Liver, Kidney, Heart Status)
Severity of Condition (Mild, Moderate, Severe, Emergency)
📌 If any of this information is missing, generate follow-up questions before proceeding.

📌 Example:
Patient Details:
Diagnosis: Esophageal varices with acute GI bleeding.
Age & Gender: 55-year-old male.
Comorbidities: Cirrhosis (Child-Pugh Class C), Type 2 Diabetes, Chronic Kidney Disease (Stage
3).
Current Medications: Spironolactone, Furosemide, Metformin.
Allergies: None known.
Organ Function: Severe liver dysfunction, moderate kidney impairment.
Severity: Emergency (active bleeding, hypotension).
Construct a Causal Graph for Treatment Impact
Map out the causal relationships between the disease, symptoms, and treatment options.
Identify how each treatment affects the causal pathway (direct or indirect impact).
Determine if a treatment disrupts the disease mechanism or just alleviates symptoms.

📌 Example Causal Graph for GI Bleeding Treatment:
Cirrhosis
↓
Portal Hypertension
↓ ↓
Beta-blockers TIPS Procedure
↓ ↓
↓
Esophageal Varices
GI Bleeding
↓ ↓
Endoscopic Banding Blood Transfusion

How to analyze this graph?
✅ Beta-blockers reduce variceal pressure but are not useful in active bleeding.
✅ TIPS directly relieves portal hypertension, but has contraindications in liver failure.
✅ Endoscopic banding immediately stops bleeding but does not prevent recurrence.
❌ Blood transfusion only replaces lost blood but does not fix the cause.

Format Example:
Causal Graph Analysis:
1. TIPS Procedure → ✅ Directly reduces portal hypertension, treating the root cause.
2. Endoscopic Banding → ✅ Stops active bleeding but does not prevent future episodes.
3. Beta-blockers → ✅ Prevents recurrence but does not treat active bleeding.
4. Blood Transfusion → ❌ Temporary measure; does not treat the underlying disease.
Evaluate Treatment Impact Based on Patient Condition
Can the patient safely undergo the most effective treatment?
Are there any contraindications or organ function concerns?
What happens if a treatment is delayed or omitted?

📌 Example Analysis Based on the Patient's Condition:
Patient-Specific Treatment Considerations:
TIPS Procedure: High risk due to severe liver dysfunction; hepatic encephalopathy is a major
concern.
Endoscopic Banding: Best for immediate bleeding control and feasible given current condition.
Beta-blockers: Safe, but should be introduced only after acute bleeding is controlled.
Blood Transfusion & IV Fluids: Necessary for stabilization, but not a definitive treatment.
Test Counterfactuals for Treatment Selection
Now, simulate "What if" scenarios to validate treatment impact:
What if the patient receives Treatment X but not Treatment Y?
What if Treatment Z is delayed?
Would the disease outcome change significantly?

📌 Example Counterfactual Tests:
What if the patient does not undergo TIPS?
Prediction: Increased risk of future bleeding, but avoids encephalopathy.
What if beta-blockers are given before controlling bleeding?
Prediction: Could cause hypotension, worsening shock.
What if only endoscopic banding is done without other interventions?
Prediction: Immediate bleeding control but risk of rebleeding remains.

Format Example:
Counterfactual Analysis:
1. Without TIPS → High risk of future variceal bleeding.
2. Without Endoscopic Banding → Acute bleeding continues, high mortality risk.
3. Without Beta-blockers → Increased recurrence risk but no immediate effect.
4. Delaying Blood Transfusion → Increased hypovolemic shock risk.
Prioritize the Best Treatment Plan
Based on the causal graph, patient condition, and counterfactual reasoning, rank the treatments:

📌 Example Final Treatment Plan:
Final Treatment Recommendation:
- Endoscopic Banding – Most immediate and effective for active bleeding.
- Blood Transfusion + IV Fluids – Supports hemodynamic stability.
- Beta-blockers (after bleeding control) – Reduces long-term recurrence risk.
- TIPS Procedure (if patient is stable & indicated later) – Best long-term prevention but high risk
now.
Why this ranking? ✅ Banding is the best immediate solution.
✅ Transfusion stabilizes the patient before further interventions.
✅ Beta-blockers are effective for prevention but must be introduced later.
❌ TIPS is ideal for long-term control but is risky given current liver function.

Final Response Format:
1. Patient-Specific Information:
Diagnosis: [Confirmed Condition]
Comorbidities: [List]
Current Medications: [List]
Organ Function Status: [Liver, Kidney, Heart, etc.]
Severity Level: [Mild/Moderate/Severe]

2. Causal Graph Analysis of Treatments:
Causal Graph: [Visual representation or text description]
How Each Treatment Affects the Disease Mechanism:
[Treatment X] → [Impact]
[Treatment Y] → [Impact]

3. Patient-Specific Treatment Considerations:
[Treatment X] → [Contraindications/Risks]
[Treatment Y] → [Feasibility]

4. Counterfactual Testing:
What if [Treatment A] is omitted? → [Predicted outcome]
What if [Treatment B] is delayed? → [Predicted outcome]

5. Final Treatment Ranking & Justification:
- [Best Treatment] – [Reason]
- [Second Best Treatment] – [Reason]
- [Additional Supportive Treatment] – [Reason]
"""
# PROMPTS['PATIENT_SPECIFIC_TREATMENT_PROMPT'] = PATIENT_SPECIFIC_TREATMENT_PROMPT

# 8. Final Treatment Plan Prompt
FINAL_TREATMENT_PROMPT = """You are now responsible for formulating the final treatment plan based on causal inference, patient-
specific considerations, and counterfactual reasoning. Carefully follow the steps below to ensure the
most effective treatment strategy is selected.
Confirm the Finalized Treatment Strategy
List the selected treatment(s) in order of priority.
Ensure each treatment directly affects the disease mechanism.
Explain why this treatment is preferred over alternatives.

Example Format:
Final Treatment Plan:
- Endoscopic Banding → Stops active bleeding.
- Blood Transfusion + IV Fluids → Stabilizes hemodynamics.
- Beta-blockers (after bleeding control) → Prevents future recurrence.
- TIPS Procedure (later consideration) → Long-term solution, but high risk now.

Key Question:
"Why is this the optimal treatment plan based on the patient's condition?"
Predict Expected Patient Outcomes for Selected Treatment Plan
What is the most likely outcome if this treatment is implemented?
How will the treatment alter the disease progression?
What are the potential short-term vs. long-term benefits?

📌 Example Format:
Expected Patient Outcomes:
Short-term: Bleeding stops, hemodynamic stability restored.
Long-term: Beta-blockers reduce recurrence risk; TIPS may be needed if future bleeding occurs.
Overall Prognosis: Favorable with close monitoring.

Key Question:
"How will this treatment improve the patient's condition both immediately and in the long run?"
Compare Expected Outcomes Against Alternative Treatments
What if an alternative treatment was used instead?
Would the patient have a higher or lower survival/recovery rate?
Would complications increase or decrease?

📌 Example Counterfactual Comparisons:
Treatment Plan Predicted Outcome Complications/Risks
Endoscopic Banding + Beta-blockers Stops bleeding, prevents recurrence Low risk
TIPS Procedure Immediately Stops bleeding + long-term prevention High encephalopathy risk
Blood Transfusion Only Temporary stabilization Does not prevent recurrence

📌 Key Question:
"If we used a different treatment plan, would the outcome be better or worse?"
Define Post-Treatment Monitoring & Next Steps
What needs to be monitored after treatment?
What are the key warning signs for recurrence?
What follow-up interventions might be necessary?

📌 Example Format:
Post-Treatment Monitoring Plan:
Vital Signs: Monitor BP & heart rate every 2 hours for 24 hours.
Repeat Endoscopy: Within 48 hours to assess rebleeding risk.
Medication Adherence: Ensure beta-blockers are tolerated.
Liver Function Tests: Evaluate risk of hepatic encephalopathy.

📌 Key Question:
"How do we ensure the patient continues to improve after the initial treatment?"

Final Response Format:
1. Final Treatment Plan:
[Primary Treatment] → [Why it is the best option]
[Secondary Treatment] → [How it supports the primary treatment]
[Additional Supportive Treatment] → [Why it is included]
[Long-term Considerations] → [If applicable]

2. Expected Patient Outcomes:
Short-term: [What happens immediately after treatment]
Long-term: [What happens in weeks/months after treatment]
Overall Prognosis: [Likelihood of full recovery or risk of recurrence]

3. Alternative Treatment Comparisons:
Treatment Plan Predicted Outcome Complications/Risks
[Plan 1] [Outcome] [Risks]
Treatment Plan Predicted Outcome Complications/Risks
[Plan 2] [Outcome] [Risks]

4. Post-Treatment Monitoring Plan:
[Vital Sign Monitoring]
[Follow-up Tests]
[Medication Adherence]
[Key Risk Factors to Watch]
"""
# PROMPTS['FINAL_TREATMENT_PROMPT'] = FINAL_TREATMENT_PROMPT

def format_prompt(prompt_template, **kwargs):
    """Format any prompt template with the given arguments."""
    return prompt_template.format(**kwargs)

# Clinical Note Generation Prompt
NOTE_GENERATION_PROMPT = """Generate a comprehensive clinical note using the analyzed case information, strictly following this template structure:

--- NOTE STARTS HERE ---

Subjective
[Patient's chief complaint and relevant history]
The patient is a [age] year old [gender] with PMHx of [list relevant conditions] who presents with [chief complaint]. [Detailed description of symptoms including onset, duration, characteristics, associated symptoms, and relieving/aggravating factors]. 

[Review of Systems - list pertinent positives and negatives]
Patient reports: [positive symptoms]
Patient denies: [negative symptoms]

PMHx
[All relevant past medical conditions]

PSHx
[All past surgical history]

FHx
[Relevant family history]

Medications
[Current medications]

Allergies
[Known allergies]

Objective

Physical Exam:
General: [appearance, distress level]
Vital Signs: BP [value], HR [value], Temp [value], SpO2 [value]
[Other relevant exam findings by system]

Labs
[Relevant lab results]

Imaging
[Relevant imaging findings]

Assessment
[Concise summary of the case including:
1. Patient presentation
2. Key findings supporting diagnosis
3. Differential diagnosis considered
4. Final diagnosis with reasoning
5. Any concerns or complications]

Plan
[Numbered list of treatment actions:
1. Admission status (admit/discharge)
2. Medications (new/continued/discontinued)
3. Monitoring requirements
4. Follow-up plans
5. Patient instructions]

--- NOTE ENDS HERE ---

Required Formatting:
- Use standard medical abbreviations (PMHx, PSHx, FHx, etc.)
- Maintain consistent section headers and structure
- Use bullet points for lists where appropriate
- Keep paragraphs concise and clinically relevant
- Include all verified information from:
  - Case Details: {case_details}
  - Extracted Factors: {extracted_factors} 
  - Diagnosis Analysis: {diagnosis_analysis}
  - Treatment Plan: {treatment_plan}

Include this exact disclaimer at the end:
"This note was generated with the assistance of InferenceMD, an AI tool utilized in data collection, analysis and diagnostic support."

Output must be ready for direct use in medical records with no placeholder text remaining.
"""
