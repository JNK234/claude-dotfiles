import React, { createContext, useState, useEffect, useContext, useCallback } from 'react'; // Added useCallback
import WorkflowService, { StageResult as WorkflowStageResult } from '../services/WorkflowService'; // Renamed StageResult import
import MessageService from '../services/MessageService';
import CaseService, { CaseDetails, Message as CaseMessage, StageResult as CaseStageResult } from '../services/CaseService'; // Import new types
import ReportService from '../services/ReportService';
import { useAuth } from './AuthContext';

// Define the shape of the reasoning content
export interface ReasoningContent {
  content: string;
}

// Define the shape of the stage
export interface Stage {
  id: string;
  name: string;
  status: 'upcoming' | 'active' | 'completed';
  reasoningContent: string;
}

// Define the shape of the case status
export type CaseStatus = 'in_progress' | 'completed';

// Define the shape of the message (using CaseMessage now for consistency, but keeping UI shape)
export interface UIMessage {
  content: string;
  sender: 'doctor' | 'assistant';
  timestamp: string;
}

// Define the context data
interface WorkflowContextData {
  // Case state
  selectedCaseId: string | null;
  selectCase: (caseId: string) => Promise<void>;
  createNewCase: (caseText: string) => Promise<void>;
  resetCase: () => void;
  caseStatus: CaseStatus;
  
  // Stage state
  currentStage: string;
  stages: Stage[];
  approveStage: () => Promise<void>;
  isStageCompleted: (stageId: string) => boolean;
  isStageActive: (stageId: string) => boolean;

  // Message state
  messages: UIMessage[]; // Use UIMessage
  sendMessage: (content: string) => Promise<void>;
  isProcessing: boolean;

  // Reasoning state
  reasoningContent: string;
  
  // PHI disclaimer state
  isPhiAcknowledged: boolean;
  acknowledgePhiDisclaimer: () => void;
  
  // Error state
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  
  // Note generation
  generateNote: () => Promise<void>;
  
  // Completion functions
  isCaseCompleted: () => boolean;
  markCaseAsCompleted: () => void;
}

const WorkflowContext = createContext<WorkflowContextData>({} as WorkflowContextData);

export const WorkflowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth context
  const { isAuthenticated } = useAuth();
  
  // Case state
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [caseStatus, setCaseStatus] = useState<CaseStatus>('in_progress');
  
  // Stage state
  const [currentStage, setCurrentStage] = useState<string>('patient_case_analysis_group');
  const [stages, setStages] = useState<Stage[]>(WorkflowService.getStagesInOrder().map(stage => ({
    id: stage,
    name: WorkflowService.mapStageToUI(stage).name,
    status: 'upcoming',
    reasoningContent: '',
  })));

  // Message state
  const [messages, setMessages] = useState<UIMessage[]>([]); // Use UIMessage
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Reasoning state
  const [reasoningContent, setReasoningContent] = useState<string>('');
  
  // PHI disclaimer state
  const [isPhiAcknowledged, setIsPhiAcknowledged] = useState<boolean>(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  
  // Check if case is completed
  const isCaseCompleted = (): boolean => {
    return caseStatus === 'completed';
  };
  
  // Mark case as completed
  const markCaseAsCompleted = () => {
    setCaseStatus('completed');
  };

  // --- Helper function to update reasoning content based on stage result data ---
  // Adapt to accept both CaseStageResult (from getCaseDetails) and WorkflowStageResult (from processStage/startWorkflow)
  // Using useCallback to memoize the function
  const updateReasoningForStage = useCallback((stageResult: CaseStageResult | WorkflowStageResult) => {
    // --- Robust check for valid stageResult ---
    if (!stageResult || typeof stageResult !== 'object' || !stageResult.stage_name || !stageResult.result) {
      console.error("Invalid stageResult received in updateReasoningForStage:", stageResult);
      // Optionally set an error state here if needed
      // setError("Received invalid data while processing workflow stage.");
      return; // Stop processing if data is invalid
    }
    const stageName = stageResult.stage_name;
    const resultData = stageResult.result;
    // --- End robust check ---

    // --- Enhanced Logging ---
    console.log(`[updateReasoningForStage] Processing stage: '${stageName}'`);
    console.log(`[updateReasoningForStage] Full stageResult.result (resultData):`, JSON.stringify(resultData, null, 2)); // Log the raw result data structure
    // --- End Enhanced Logging ---

    // Create formatted content for the stage based on its name and result structure
    let stageContent = '';
    // --- Determine the source of the actual results data ---
    const resultsSource = resultData?.backend_results ? resultData.backend_results : resultData;
    console.log(`[updateReasoningForStage] Determined resultsSource:`, JSON.stringify(resultsSource, null, 2)); // Log the determined source structure
    // --- End source determination ---

    // --- Check if resultsSource is valid before proceeding ---
    if (!resultsSource || typeof resultsSource !== 'object') {
        console.warn(`[updateReasoningForStage] Invalid or missing resultsSource for stage '${stageName}'. Skipping content generation.`);
        stageContent = `Error: Could not process results for stage ${stageName}. Invalid data structure received.`;
    } else {
        // --- Generate content based on stage name ---
        try { // Add try-catch for safety when accessing potentially missing properties
            if (stageName === 'patient_case_analysis_group') {
                if (resultsSource.extraction && resultsSource.extraction.extracted_factors) {
                    stageContent += `### Extracted Medical Factors\n\n${resultsSource.extraction.extracted_factors}\n\n`;
                } else { console.warn(`[updateReasoningForStage] Missing extraction.extracted_factors for ${stageName}`); }

                if (resultsSource.causal_analysis && resultsSource.causal_analysis.causal_links) {
                    stageContent += `### Causal Relationships\n\n${resultsSource.causal_analysis.causal_links}\n\n`;
                } else { console.warn(`[updateReasoningForStage] Missing causal_analysis.causal_links for ${stageName}`); }

                if (resultsSource.validation && resultsSource.validation.validation_result) {
                    stageContent += `### Validation\n\n${resultsSource.validation.validation_result}\n\n`;
                } else { console.warn(`[updateReasoningForStage] Missing validation.validation_result for ${stageName}`); }
            }
            else if (stageName === 'diagnosis_group') {
                if (resultsSource.counterfactual && resultsSource.counterfactual.counterfactual_analysis) {
                    stageContent += `### Counterfactual Analysis\n\n${resultsSource.counterfactual.counterfactual_analysis}\n\n`;
                } else { console.warn(`[updateReasoningForStage] Missing counterfactual.counterfactual_analysis for ${stageName}`); }

                if (resultsSource.diagnosis && resultsSource.diagnosis.diagnosis) {
                    stageContent += `### Diagnosis\n\n${resultsSource.diagnosis.diagnosis}\n\n`;
                } else { console.warn(`[updateReasoningForStage] Missing diagnosis.diagnosis for ${stageName}`); }
            }
            else if (stageName === 'treatment_planning_group') {
                if (resultsSource.treatment_planning && resultsSource.treatment_planning.treatment_plan) {
                    stageContent += `### Treatment Options\n\n${resultsSource.treatment_planning.treatment_plan}\n\n`;
                } else { console.warn(`[updateReasoningForStage] Missing treatment_planning.treatment_plan for ${stageName}`); }

                if (resultsSource.patient_specific && resultsSource.patient_specific.patient_specific_plan) {
                    stageContent += `### Patient-Specific Plan\n\n${resultsSource.patient_specific.patient_specific_plan}\n\n`;
                } else { console.warn(`[updateReasoningForStage] Missing patient_specific.patient_specific_plan for ${stageName}`); }

                if (resultsSource.final_plan && resultsSource.final_plan.final_treatment_plan) {
                    stageContent += `### Final Treatment Plan\n\n${resultsSource.final_plan.final_treatment_plan}\n\n`;
                } else { console.warn(`[updateReasoningForStage] Missing final_plan.final_treatment_plan for ${stageName}`); }
            }
             // Handle legacy/individual stage names if necessary (accessing directly from resultsSource)
             // Consider if this 'else' block is still needed if backend always uses group names.
             else {
                console.warn(`[updateReasoningForStage] Attempting to handle potential legacy stage name: ${stageName}`);
                switch (stageName) {
                  case 'extraction': stageContent = `### Extracted Medical Factors\n\n${resultsSource?.extracted_factors || 'N/A'}`; break;
                  case 'causal_analysis': stageContent = `### Causal Relationships\n\n${resultsSource?.causal_links || 'N/A'}`; break;
                  case 'validation': stageContent = `### Validation\n\n${resultsSource?.validation_result || 'N/A'}`; break;
                  case 'counterfactual': stageContent = `### Counterfactual Analysis\n\n${resultsSource?.counterfactual_analysis || 'N/A'}`; break;
                  case 'diagnosis': stageContent = `### Diagnosis\n\n${resultsSource?.diagnosis || 'N/A'}`; break;
                  case 'treatment_planning': stageContent = `### Treatment Plan\n\n${resultsSource?.treatment_plan || 'N/A'}`; break;
                  case 'patient_specific': stageContent = `### Patient-Specific Plan\n\n${resultsSource?.patient_specific_plan || 'N/A'}`; break;
                  case 'final_plan': stageContent = `### Final Treatment Plan\n\n${resultsSource?.final_treatment_plan || 'N/A'}`; break;
                  default: console.warn(`[updateReasoningForStage] Unknown stage name encountered: ${stageName}`);
                         stageContent = `Error: Received results for an unknown stage type '${stageName}'.`;
                }
             }

             // If no specific content was added, provide a default message
             if (stageContent.trim() === '') {
                 console.warn(`[updateReasoningForStage] No specific content generated for stage '${stageName}'. Using default message.`);
                 stageContent = `Analysis results for stage '${stageName}' are available but could not be formatted for display. Please check console logs.`;
             }

        } catch (e) {
            console.error(`[updateReasoningForStage] Error accessing properties within resultsSource for stage '${stageName}':`, e);
            stageContent = `Error: Failed to process results for stage ${stageName}. Check console logs for details.`;
        }
        // --- End content generation ---
    }
    // --- End check for valid resultsSource ---

    // Update the specific stage's reasoning content in the stages state
    setStages(prevStages => prevStages.map(stage => {
      if (stage.id === stageName) { // Use stageName variable
        console.log(`Setting reasoning for ${stage.id}: ${stageContent.substring(0, 100)}...`);
        return { ...stage, reasoningContent: stageContent };
      }
      return stage;
    }));

  }, [setStages]); // Dependency: setStages


  // Update stages based on current stage
  useEffect(() => {
    if (currentStage) {
      // Get all stages in order
      const orderedStages = WorkflowService.getStagesInOrder();
      
      // Update stage status based on current stage using functional update
      setStages(prevStages => orderedStages.map(stageId => {
        const stageInfo = WorkflowService.mapStageToUI(stageId);
        const currentIndex = orderedStages.findIndex(s => s === currentStage);
        const stageIndex = orderedStages.findIndex(s => s === stageId);
        
        let status: 'upcoming' | 'active' | 'completed' = 'upcoming';
        if (stageId === currentStage) {
          status = 'active';
        } else if (stageIndex < currentIndex) {
          status = 'completed';
        }
        
        return {
          id: stageId,
          name: stageInfo.name,
          status,
          // Read reasoningContent from the *previous* state (prevStages) to avoid race condition
          reasoningContent: prevStages.find(s => s.id === stageId)?.reasoningContent || '', 
        };
      }));
    }
  }, [currentStage]);

  // Function to select a case and load its data
  const selectCase = async (caseId: string) => {
    try {
      setError(null);
      setIsProcessing(true);
      console.log(`Starting to load case details for ${caseId}`);

      // Reset existing data
      setMessages([]);
      setReasoningContent('');
      // Reset reasoning content for all stages before loading new data
      setStages(prevStages => prevStages.map(stage => ({
        ...stage,
        reasoningContent: '',
      })));

      // Get *all* case details using the new service method
      const caseDetails = await CaseService.getCaseDetails(caseId);
      console.log('Case details loaded:', caseDetails);

      // Set basic case info
      setSelectedCaseId(caseId);
      setCurrentStage(caseDetails.current_stage);

      // Set case status
      if (caseDetails.is_complete) { // Use is_complete directly from details
        setCaseStatus('completed');
      } else {
        setCaseStatus('in_progress');
      }

      // Set messages from the response
      if (caseDetails.messages && Array.isArray(caseDetails.messages)) {
        // Format messages using the existing MessageService formatter
        const formattedMessages = caseDetails.messages.map(
          MessageService.formatMessageForUI // Assuming this formatter works with the Message interface
        );
        console.log(`Successfully loaded ${formattedMessages.length} messages for case ${caseId}`);
        setMessages(formattedMessages);
      } else {
        console.warn('CaseDetails response format unexpected or missing messages:', caseDetails);
        setMessages([]); // Clear messages if response is not as expected
      }

      // Process stage results from the response to populate reasoning content
      if (caseDetails.stage_results && Array.isArray(caseDetails.stage_results)) {
        console.log(`Processing ${caseDetails.stage_results.length} stage results...`);
        // Use Promise.all to potentially update reasoning content in parallel if needed,
        // or simply loop if sequential updates are fine.
        // Using a simple loop here for clarity.
        caseDetails.stage_results.forEach(stageResult => {
          // Call the helper function to update reasoning for this specific stage
          updateReasoningForStage(stageResult);
        });

        // After processing all individual stages, update the combined reasoning content
        // Need to wait for state updates from updateReasoningForStage to propagate.
        // Using useEffect triggered by 'stages' state change might be more robust here.
        // For simplicity now, we'll try to build it directly, but this might have timing issues.
        // Consider moving the combined reasoning update logic to a separate useEffect hook.

      } else {
         console.warn('CaseDetails response format unexpected or missing stage results:', caseDetails);
      }


      setIsProcessing(false);
      console.log(`Finished loading case ${caseId}`);
    } catch (error) {
      console.error('Error selecting case:', error);
      setError('Failed to load case data. Please try again.');
      setIsProcessing(false);
    }
  };

  // --- Effect to update combined reasoning content whenever stages state changes ---
  useEffect(() => {
    // This effect runs after the stages state (including reasoningContent) has been updated
    // by the loop in selectCase or other functions.
    console.log("Stages updated, recalculating combined reasoning content.");
    const allStagesContent = stages
      .filter(stage => stage.reasoningContent && stage.reasoningContent.trim() !== '') // Ensure content exists
      .sort((a, b) => WorkflowService.getStagesInOrder().indexOf(a.id) - WorkflowService.getStagesInOrder().indexOf(b.id)) // Sort based on defined order
      .map(stage => {
        // --- Add check for stage.name before using charAt ---
        const stageTitle = stage.name && typeof stage.name === 'string' 
          ? stage.name.charAt(0).toUpperCase() + stage.name.slice(1) 
          : `Stage: ${stage.id}`; // Fallback title if name is missing
        // --- End check ---
        return `## ${stageTitle}\n\n${stage.reasoningContent.trim()}`;
      })
      .join('\n\n---\n\n');

    console.log(`Combined reasoning content updated: ${allStagesContent.substring(0, 100)}...`);
    setReasoningContent(allStagesContent);

  }, [stages]); // Dependency: run whenever the stages array changes


  // Function to create a new case
  const createNewCase = async (caseText: string) => {
    try {
      setError(null);
      setIsProcessing(true);
      
      // Create the case
      const newCase = await CaseService.createCase({ case_text: caseText });
      setSelectedCaseId(newCase.id);
      
      // --- Add check before setting currentStage ---
      if (newCase.current_stage && typeof newCase.current_stage === 'string') {
        setCurrentStage(newCase.current_stage);
        console.log(`Set currentStage from newCase: ${newCase.current_stage}`);
      } else {
        // Fallback or error handling if newCase.current_stage is invalid
        console.error("Invalid current_stage received from CaseService.createCase:", newCase.current_stage);
        // Fallback to the default initial stage
        setCurrentStage('patient_case_analysis_group'); 
        console.log("Fell back to default stage: patient_case_analysis_group");
      }
      // --- End check ---
      
      // Add initial patient case as a message
      const patientCaseMessage = await MessageService.createMessage(newCase.id, {
        role: 'user',
        content: caseText,
      });
      
      setMessages([MessageService.formatMessageForUI(patientCaseMessage)]);
      
      // Start the workflow - this will take some time, so we keep isProcessing true
      // to show the loading indicator
      const workflowResult = await WorkflowService.startWorkflow(newCase.id);
      console.log('Workflow result:', workflowResult);
      updateReasoningForStage(workflowResult); // Use the correct function name
      
      // Add assistant response with summary
      let assistantContent = 'I\'ve analyzed the case.';
      if (workflowResult.result && workflowResult.result.summary) {
        assistantContent = workflowResult.result.summary;
      }
      
      const assistantMessage = await MessageService.createMessage(newCase.id, {
        role: 'assistant',
        content: assistantContent,
      });
      
      setMessages(prev => [...prev, MessageService.formatMessageForUI(assistantMessage)]);
      // setCurrentStage(workflowResult.stage_name); // Removed: Redundant and potentially sets undefined if workflowResult is invalid
      setIsProcessing(false);
    } catch (error) {
      console.error('Error creating case:', error);
      setError('Failed to create case. Please try again.');
      setIsProcessing(false);
    }
  };

  // Function to reset the case state
  const resetCase = () => {
    setSelectedCaseId(null);
    setCurrentStage('patient_case_analysis_group');
    setMessages([]);
    setReasoningContent('');
    setCaseStatus('in_progress');
    setIsPhiAcknowledged(false); // Reset PHI acknowledgment for new cases

    // Also reset each stage's reasoning content
    setStages(prevStages => prevStages.map(stage => ({
      ...stage,
      reasoningContent: '',
    })));
  };

  // Function to approve the current stage and move to the next stage
  const approveStage = async () => {
    if (!selectedCaseId) return;
    
    try {
      setError(null);
      setIsProcessing(true);
      
      // Add doctor approval message
      const approvalMessage = await MessageService.createMessage(selectedCaseId, {
        role: 'user',
        content: `I approve the ${WorkflowService.mapStageToUI(currentStage).name} stage and would like to continue to the next stage.`,
      });
      
      setMessages(prev => [...prev, MessageService.formatMessageForUI(approvalMessage)]);
      
      // Call API to approve stage
      const approvalResult = await WorkflowService.approveStage(selectedCaseId, currentStage);
      
      // Process the next stage - this will take some time, so we keep isProcessing true
      // to show the loading indicator
      // --- FIX: Check the nested result object for the next_stage ---
      const nextStageId = approvalResult.result?.next_stage;
      console.log(`[approveStage] Determined next stage ID: '${nextStageId}' from approvalResult.result.next_stage`);

      if (nextStageId) { // Check if a valid next stage ID was found
        // Add a temporary message to show the assistant is working
        const tempMessage = {
          content: "Processing next stage...",
          sender: "assistant" as const,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, tempMessage]);

        // --- FIX: Use the determined nextStageId ---
        const nextStageResult = await WorkflowService.processStage(selectedCaseId, nextStageId);
        updateReasoningForStage(nextStageResult); // Use the correct function name

        // Remove the temporary message
        setMessages(prev => prev.filter(msg => msg.content !== "Processing next stage..."));

        // Add assistant message with the summary
        // --- FIX: Use the determined nextStageId for UI mapping ---
        let assistantContent = `I'll now proceed with the ${WorkflowService.mapStageToUI(nextStageId).name} stage.`;
        if (nextStageResult.result && nextStageResult.result.summary) {
          assistantContent = nextStageResult.result.summary;
        }
        
        const assistantMessage = await MessageService.createMessage(selectedCaseId, {
          role: 'assistant',
          content: assistantContent,
        });

        setMessages(prev => [...prev, MessageService.formatMessageForUI(assistantMessage)]);
        // --- FIX: Use the determined nextStageId to update context state ---
        setCurrentStage(nextStageId);
      } else {
         // Handle case where there is no next stage (workflow complete?)
         console.log("[approveStage] Approval result indicates no next stage (nextStageId is falsy). Workflow might be complete.");
         // Consider setting caseStatus or currentStage appropriately
         // Example: Check if the current stage was the last one
         const orderedStages = WorkflowService.getStagesInOrder();
         if (currentStage === orderedStages[orderedStages.length - 1]) {
            console.log("[approveStage] Current stage was the last stage. Marking case as potentially complete.");
            // You might want to confirm completion via API or just update UI state
            // markCaseAsCompleted(); // Uncomment if appropriate
         }
      }

      setIsProcessing(false);
    } catch (error) {
      console.error('Error approving stage:', error);
      setError('Failed to approve stage. Please try again.');
      setIsProcessing(false);
    }
  };

  // Function to send a message
  const sendMessage = async (content: string) => {
    // Prevent sending messages or processing if the case is already completed
    if (!selectedCaseId || caseStatus === 'completed') {
      console.log("sendMessage blocked: Case is completed or no case selected.");
      // Optionally provide user feedback here if needed, e.g., set an error message
      // setError("Cannot send messages or perform actions on a completed case.");
      return;
    }

    try {
      setError(null);
      setIsProcessing(true);
      
      // Create user message
      const userMessage = await MessageService.createMessage(selectedCaseId, {
        role: 'user',
        content,
      });
      
      setMessages(prev => [...prev, MessageService.formatMessageForUI(userMessage)]);
      
      // Add a temporary message to show the assistant is working
      const tempMessage = {
        content: "Processing your input...",
        sender: "assistant" as const,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, tempMessage]);
      
      // Process the current stage with the message as input
      const stageResult = await WorkflowService.processStage(selectedCaseId, currentStage, content);
      updateReasoningForStage(stageResult); // Use the correct function name
      
      // Remove the temporary message
      setMessages(prev => prev.filter(msg => msg.content !== "Processing your input..."));
      
      // Add assistant response with the summary if available
      let assistantContent = `Thank you for the additional information. I've updated the analysis for the ${WorkflowService.mapStageToUI(currentStage).name} stage.`;
      if (stageResult.result && stageResult.result.summary) {
        assistantContent = stageResult.result.summary;
      }
      
      const assistantMessage = await MessageService.createMessage(selectedCaseId, {
        role: 'assistant',
        content: assistantContent,
      });
      
      setMessages(prev => [...prev, MessageService.formatMessageForUI(assistantMessage)]);
      setIsProcessing(false);
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
      setIsProcessing(false);
    }
  };

  // NOTE: The old `updateReasoningContentFromWorkflowResult` function is removed.
  // Its logic is now partially incorporated into `updateReasoningForStage`
  // and the useEffect hook that updates the combined `reasoningContent`.

  // Function to acknowledge the PHI disclaimer
  const acknowledgePhiDisclaimer = () => {
    setIsPhiAcknowledged(true);
  };

  // Helper function to check if a stage is completed
  const isStageCompleted = (stageId: string): boolean => {
    return stages.some(stage => stage.id === stageId && stage.status === 'completed');
  };

  // Helper function to check if a stage is active
  const isStageActive = (stageId: string): boolean => {
    return stages.some(stage => stage.id === stageId && stage.status === 'active');
  };

  // Function to generate clinical note
  const generateNote = async () => {
    if (!selectedCaseId) return;
    
    try {
      setError(null);
      setIsProcessing(true);
      
      // Use ReportService to generate note
      const note = await ReportService.generateNote(selectedCaseId);
      
      // Download the generated note
      await ReportService.downloadNote(selectedCaseId, note.id, `clinical_note_${selectedCaseId}.pdf`);
      
      // Mark case as completed after note generation
      if (currentStage === 'treatment_planning_group') {
        markCaseAsCompleted();
        
        // Update all stages to completed
        setStages(prevStages => prevStages.map(stage => ({
          ...stage,
          status: 'completed'
        })));
      }
      
      setIsProcessing(false);
    } catch (error) {
      console.error('Error generating note:', error);
      setError('Failed to generate clinical note. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <WorkflowContext.Provider
      value={{
        selectedCaseId,
        selectCase,
        createNewCase,
        resetCase,
        caseStatus,
        currentStage,
        stages,
        approveStage,
        isStageCompleted,
        isStageActive,
        messages,
        sendMessage,
        isProcessing,
        reasoningContent,
        isPhiAcknowledged,
        acknowledgePhiDisclaimer,
        error,
        setError,
        generateNote,
        isCaseCompleted,
        markCaseAsCompleted,
      }}
    >
      {children}
    </WorkflowContext.Provider>
  );
};

export const useWorkflow = () => useContext(WorkflowContext);
