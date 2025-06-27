import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react'; // Added useRef
import WorkflowService, { StageResult as WorkflowStageResult } from '../services/WorkflowService'; // Renamed StageResult import
import MessageService from '../services/MessageService';
import CaseService, { CaseDetails, Message as CaseMessage, StageResult as CaseStageResult } from '../services/CaseService'; // Import new types
import ReportService from '../services/ReportService';
import { useAuth } from './AuthContext';
import StreamingService from '../services/StreamingService';
import { StreamEvent, StreamStatus } from '../types/streaming';
import { StreamingError, createStreamingError, StreamingErrorCode } from '../types/errors';

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

// Define streaming state interface
export interface StreamingState {
  status: StreamStatus;
  currentStageId: string | null;
  reasoningContent: string;
  chatContent: string;
  error: StreamingError | null;
  isStreaming: boolean;
}

// Define streaming content accumulator
export interface StreamingContentAccumulator {
  reasoning: string;
  chat: string;
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
  
  // Streaming state
  streamingState: StreamingState;
  startStreaming: (stageId: string) => Promise<void>;
  stopStreaming: () => void;
  clearStreamingContent: () => void;
}

const WorkflowContext = createContext<WorkflowContextData>({} as WorkflowContextData);

export const WorkflowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth context
  const { isAuthenticated } = useAuth();
  
  // Case state - initialize from sessionStorage
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(() => {
    // Restore selected case from session storage
    const sessionCaseId = sessionStorage.getItem('medhastra_selected_case_id');
    return sessionCaseId || null;
  });
  const [caseStatus, setCaseStatus] = useState<CaseStatus>('in_progress');
  
  // Stage state - initialize from sessionStorage  
  const [currentStage, setCurrentStage] = useState<string>(() => {
    const sessionCurrentStage = sessionStorage.getItem('medhastra_current_stage');
    return sessionCurrentStage || 'patient_case_analysis_group';
  });
  const [stages, setStages] = useState<Stage[]>(WorkflowService.getStagesInOrder().map(stage => ({
    id: stage,
    name: WorkflowService.mapStageToUI(stage).name,
    status: 'upcoming',
    reasoningContent: '',
  })));

  // Message state - initialize from sessionStorage
  const [messages, setMessages] = useState<UIMessage[]>(() => {
    // Restore messages from session storage
    const sessionMessages = sessionStorage.getItem('medhastra_messages');
    if (sessionMessages) {
      try {
        return JSON.parse(sessionMessages);
      } catch (error) {
        console.error('Failed to parse messages from sessionStorage:', error);
        return [];
      }
    }
    return [];
  });
  const [isProcessing, setIsProcessing] = useState<boolean>(() => {
    // Check if we're in the middle of processing from sessionStorage
    const sessionProcessing = sessionStorage.getItem('medhastra_is_processing');
    return sessionProcessing === 'true';
  });

  // Reasoning state
  const [reasoningContent, setReasoningContent] = useState<string>('');
  
  // PHI disclaimer state - initialize from sessionStorage
  const [isPhiAcknowledged, setIsPhiAcknowledged] = useState<boolean>(() => {
    // Check if PHI was already acknowledged in this session
    const sessionPhiAcknowledged = sessionStorage.getItem('medhastra_phi_acknowledged');
    return sessionPhiAcknowledged === 'true';
  });
  
  // Streaming state
  const [streamingState, setStreamingState] = useState<StreamingState>({
    status: StreamStatus.IDLE,
    currentStageId: null,
    reasoningContent: '',
    chatContent: '',
    error: null,
    isStreaming: false,
  });
  
  // StreamingService instance ref
  const streamingServiceRef = useRef<StreamingService | null>(null);
  const contentAccumulatorRef = useRef<StreamingContentAccumulator>({
    reasoning: '',
    chat: ''
  });

  // Helper function to persist messages to sessionStorage
  const persistMessages = useCallback((messagesToPersist: UIMessage[]) => {
    try {
      sessionStorage.setItem('medhastra_messages', JSON.stringify(messagesToPersist));
      console.log('💾 Persisted', messagesToPersist.length, 'messages to sessionStorage');
    } catch (error) {
      console.error('Failed to persist messages to sessionStorage:', error);
    }
  }, []);

  // Helper function to persist processing state
  const persistProcessingState = useCallback((processing: boolean) => {
    try {
      sessionStorage.setItem('medhastra_is_processing', processing.toString());
      console.log('💾 Persisted processing state:', processing);
    } catch (error) {
      console.error('Failed to persist processing state:', error);
    }
  }, []);
  
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
    // Ensure we have the necessary properties, adapting for potential differences if any
    const stageName = stageResult.stage_name;
    const resultData = stageResult.result; // Assuming 'result' structure is consistent enough

    if (!stageName || !resultData) {
      console.warn("Cannot update reasoning, missing stage_name or result in:", stageResult);
      return;
    }

    console.log('Updating reasoning content for stage:', stageName, 'with result:', resultData);

    // Create formatted content for the stage based on its name and result structure
    let stageContent = '';
    // Check if the resultData contains the nested 'backend_results' structure
    const resultsSource = resultData?.backend_results ? resultData.backend_results : resultData;

    console.log(`[updateReasoningForStage] Using resultsSource:`, resultsSource); // Log which part of the data is being used

    // Patient case analysis group stages
    if (stageName === 'patient_case_analysis_group') {
      // Access data within resultsSource (which might be resultData.backend_results)
      if (resultsSource?.extraction?.extracted_factors) {
        stageContent += `### Extracted Medical Factors\n\n${resultsSource.extraction.extracted_factors}\n\n`;
      }
      if (resultsSource?.causal_analysis?.causal_links) {
        stageContent += `### Causal Relationships\n\n${resultsSource.causal_analysis.causal_links}\n\n`;
      }
      if (resultsSource?.validation?.validation_result) {
        stageContent += `### Validation\n\n${resultsSource.validation.validation_result}\n\n`;
      }
    }
    // Diagnosis group stages
    else if (stageName === 'diagnosis_group') {
      if (resultsSource?.counterfactual?.counterfactual_analysis) {
        stageContent += `### Counterfactual Analysis\n\n${resultsSource.counterfactual.counterfactual_analysis}\n\n`;
      }
      if (resultsSource?.diagnosis?.diagnosis) {
        stageContent += `### Diagnosis\n\n${resultsSource.diagnosis.diagnosis}\n\n`;
      }
    }
    // Treatment planning group stages
    else if (stageName === 'treatment_planning_group') {
      if (resultsSource?.treatment_planning?.treatment_plan) {
        stageContent += `### Treatment Options\n\n${resultsSource.treatment_planning.treatment_plan}\n\n`;
      }
      if (resultsSource?.patient_specific?.patient_specific_plan) {
        stageContent += `### Patient-Specific Plan\n\n${resultsSource.patient_specific.patient_specific_plan}\n\n`;
      }
      if (resultsSource?.final_plan?.final_treatment_plan) {
        stageContent += `### Final Treatment Plan\n\n${resultsSource.final_plan.final_treatment_plan}\n\n`;
      }
    }
     // Handle legacy/individual stage names if necessary (accessing directly from resultsSource)
     else {
        switch (stageName) {
          case 'extraction': stageContent = `### Extracted Medical Factors\n\n${resultsSource?.extracted_factors || 'N/A'}`; break;
          case 'causal_analysis': stageContent = `### Causal Relationships\n\n${resultsSource?.causal_links || 'N/A'}`; break;
          case 'validation': stageContent = `### Validation\n\n${resultsSource?.validation_result || 'N/A'}`; break;
          case 'counterfactual': stageContent = `### Counterfactual Analysis\n\n${resultsSource?.counterfactual_analysis || 'N/A'}`; break;
          case 'diagnosis': stageContent = `### Diagnosis\n\n${resultsSource?.diagnosis || 'N/A'}`; break;
          case 'treatment_planning': stageContent = `### Treatment Plan\n\n${resultsSource?.treatment_plan || 'N/A'}`; break;
          case 'patient_specific': stageContent = `### Patient-Specific Plan\n\n${resultsSource?.patient_specific_plan || 'N/A'}`; break;
          case 'final_plan': stageContent = `### Final Treatment Plan\n\n${resultsSource?.final_treatment_plan || 'N/A'}`; break;
          default: console.warn(`Unknown stage name for reasoning update: ${stageName}`);
        }
     }


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
      
      // Map the current stage to its consolidated group if needed
      const currentStageInfo = WorkflowService.mapStageToUI(currentStage);
      // Find the consolidated stage that matches the current stage's name
      const consolidatedCurrentStage = orderedStages.includes(currentStage) 
        ? currentStage 
        : orderedStages.find(stageId => 
            WorkflowService.mapStageToUI(stageId).name === currentStageInfo.name
          ) || currentStage;
      
      console.log('Current stage:', currentStage, 'Consolidated stage:', consolidatedCurrentStage);
      
      // Update stage status based on consolidated current stage using functional update
      setStages(prevStages => orderedStages.map(stageId => {
        const stageInfo = WorkflowService.mapStageToUI(stageId);
        const currentIndex = orderedStages.indexOf(consolidatedCurrentStage);
        const stageIndex = orderedStages.indexOf(stageId);
        
        let status: 'upcoming' | 'active' | 'completed' = 'upcoming';
        if (stageId === consolidatedCurrentStage) {
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
      console.log(`🔄 Starting to load case details for ${caseId}`);

      // Reset existing data  
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
      
      // Persist selected case and current stage to sessionStorage
      sessionStorage.setItem('medhastra_selected_case_id', caseId);
      sessionStorage.setItem('medhastra_current_stage', caseDetails.current_stage);
      
      // Automatically acknowledge PHI for existing cases
      if (!isPhiAcknowledged) {
        setIsPhiAcknowledged(true);
        sessionStorage.setItem('medhastra_phi_acknowledged', 'true');
      }

      // Set case status
      if (caseDetails.is_complete) { // Use is_complete directly from details
        setCaseStatus('completed');
      } else {
        setCaseStatus('in_progress');
      }

      // Set messages from the response (but preserve persisted messages if they're more recent)
      if (caseDetails.messages && Array.isArray(caseDetails.messages)) {
        // Format messages using the existing MessageService formatter
        const apiMessages = caseDetails.messages.map(
          MessageService.formatMessageForUI
        );
        
        // Check if we have persisted messages that might be more recent
        const sessionMessages = sessionStorage.getItem('medhastra_messages');
        let shouldUseApiMessages = true;
        
        if (sessionMessages) {
          try {
            const persistedMessages = JSON.parse(sessionMessages);
            // If persisted messages are longer than API messages, they're more recent
            if (persistedMessages.length > apiMessages.length) {
              console.log('🔄 Using persisted messages (more recent than API):', persistedMessages.length, 'vs', apiMessages.length);
              setMessages(persistedMessages);
              shouldUseApiMessages = false;
            }
          } catch (error) {
            console.error('Failed to parse persisted messages:', error);
          }
        }
        
        if (shouldUseApiMessages) {
          console.log(`Successfully loaded ${apiMessages.length} messages for case ${caseId}`);
          setMessages(apiMessages);
        }
      } else {
        console.warn('CaseDetails response format unexpected or missing messages:', caseDetails);
        // Only clear messages if we don't have persisted ones
        const sessionMessages = sessionStorage.getItem('medhastra_messages');
        if (!sessionMessages) {
          setMessages([]);
        }
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
      console.log(`✅ Finished loading case ${caseId}`);
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
        // Use the stage name from the stages state which should be correctly mapped
        const formattedStageName = stage.name.charAt(0).toUpperCase() + stage.name.slice(1);
        return `## ${formattedStageName}\n\n${stage.reasoningContent.trim()}`;
      })
      .join('\n\n---\n\n');

    console.log(`Combined reasoning content updated: ${allStagesContent.substring(0, 100)}...`);
    setReasoningContent(allStagesContent);

  }, [stages]); // Dependency: run whenever the stages array changes

  // Automatically acknowledge PHI if there's an existing case (handles page refresh/return to app)
  useEffect(() => {
    if (selectedCaseId && !isPhiAcknowledged) {
      console.log('Auto-acknowledging PHI for existing case:', selectedCaseId);
      setIsPhiAcknowledged(true);
      sessionStorage.setItem('medhastra_phi_acknowledged', 'true');
    }
  }, [selectedCaseId, isPhiAcknowledged]);

  // Persist messages whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      persistMessages(messages);
    }
  }, [messages, persistMessages]);

  // Persist processing state whenever it changes
  useEffect(() => {
    persistProcessingState(isProcessing);
  }, [isProcessing, persistProcessingState]);

  // Auto-restore case state on app initialization
  useEffect(() => {
    const restoreCaseState = async () => {
      const sessionCaseId = sessionStorage.getItem('medhastra_selected_case_id');
      if (sessionCaseId && sessionCaseId !== selectedCaseId && isAuthenticated) {
        console.log('🔄 Restoring case state from session:', sessionCaseId);
        try {
          // Load the case details to restore state
          await selectCase(sessionCaseId);
        } catch (error) {
          console.error('Failed to restore case state:', error);
          // If restoration fails, clear the invalid session data
          sessionStorage.removeItem('medhastra_selected_case_id');
        }
      }
    };

    restoreCaseState();
  }, [isAuthenticated]); // Only run once when auth is ready

  // Function to create a new case
  const createNewCase = async (caseText: string) => {
    try {
      setError(null);
      setIsProcessing(true);
      
      // Create the case
      const newCase = await CaseService.createCase({ case_text: caseText });
      
      // Set the selected case ID first to trigger the case list refresh
      setSelectedCaseId(newCase.id);
      setCurrentStage(newCase.current_stage);
      
      // Persist selected case and current stage to sessionStorage
      sessionStorage.setItem('medhastra_selected_case_id', newCase.id);
      sessionStorage.setItem('medhastra_current_stage', newCase.current_stage);
      
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
      setCurrentStage(workflowResult.stage_name);
      setIsProcessing(false);
    } catch (error) {
      console.error('Error creating case:', error);
      setError('Failed to create case. Please try again.');
      setIsProcessing(false);
    }
  };

  // Function to reset the case state (only for new case creation)
  const resetCase = () => {
    setSelectedCaseId(null);
    setCurrentStage('patient_case_analysis_group');
    setMessages([]);
    setReasoningContent('');
    setCaseStatus('in_progress');
    // Only reset PHI acknowledgment when explicitly creating new cases
    setIsPhiAcknowledged(false);
    sessionStorage.removeItem('medhastra_phi_acknowledged');
    sessionStorage.removeItem('medhastra_selected_case_id');
    sessionStorage.removeItem('medhastra_messages');
    sessionStorage.removeItem('medhastra_current_stage');
    sessionStorage.removeItem('medhastra_is_processing');

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
      if (approvalResult.next_stage) {
        // Add a temporary message to show the assistant is working
        const tempMessage = {
          content: "Processing next stage...",
          sender: "assistant" as const,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, tempMessage]);
        
        const nextStageResult = await WorkflowService.processStage(selectedCaseId, approvalResult.next_stage);
        updateReasoningForStage(nextStageResult); // Use the correct function name
        
        // Remove the temporary message
        setMessages(prev => prev.filter(msg => msg.content !== "Processing next stage..."));
        
        // Add assistant message with the summary
        let assistantContent = `I'll now proceed with the ${WorkflowService.mapStageToUI(approvalResult.next_stage).name} stage.`;
        if (nextStageResult.result && nextStageResult.result.summary) {
          assistantContent = nextStageResult.result.summary;
        }
        
        const assistantMessage = await MessageService.createMessage(selectedCaseId, {
          role: 'assistant',
          content: assistantContent,
        });
        
        setMessages(prev => [...prev, MessageService.formatMessageForUI(assistantMessage)]);
        setCurrentStage(approvalResult.next_stage);
        sessionStorage.setItem('medhastra_current_stage', approvalResult.next_stage);
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
    // Persist acknowledgment for the session
    sessionStorage.setItem('medhastra_phi_acknowledged', 'true');
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

  // Initialize StreamingService
  useEffect(() => {
    if (!streamingServiceRef.current) {
      streamingServiceRef.current = new StreamingService();
      console.log('🚀 StreamingService initialized');
    }

    // Cleanup on unmount
    return () => {
      if (streamingServiceRef.current) {
        streamingServiceRef.current.disconnect();
        streamingServiceRef.current = null;
        console.log('🔌 StreamingService disconnected and cleaned up');
      }
    };
  }, []);

  // Streaming content accumulation handler
  const handleStreamingEvent = useCallback((event: StreamEvent) => {
    console.log('📡 Received streaming event:', event.type, event.data);
    
    // Accumulate content based on target panel
    if (event.type === 'chunk' && event.data?.content) {
      const targetPanel = event.data.target_panel || 'reasoning';
      
      if (targetPanel === 'reasoning') {
        contentAccumulatorRef.current.reasoning += event.data.content;
        setStreamingState(prev => ({
          ...prev,
          reasoningContent: contentAccumulatorRef.current.reasoning
        }));
      } else if (targetPanel === 'chat') {
        contentAccumulatorRef.current.chat += event.data.content;
        setStreamingState(prev => ({
          ...prev,
          chatContent: contentAccumulatorRef.current.chat
        }));
      }
    }
    
    // Handle stage completion
    if (event.type === 'end' || event.type === 'stage_complete') {
      console.log('✅ Stage streaming completed');
      setStreamingState(prev => ({
        ...prev,
        status: StreamStatus.COMPLETED,
        isStreaming: false
      }));
    }
  }, []);

  // Streaming error handler
  const handleStreamingError = useCallback((error: StreamingError) => {
    console.error('❌ Streaming error:', error);
    setStreamingState(prev => ({
      ...prev,
      status: StreamStatus.ERROR,
      error,
      isStreaming: false
    }));
    setError(`Streaming error: ${error.message}`);
  }, []);

  // Start streaming for a stage
  const startStreaming = useCallback(async (stageId: string) => {
    if (!selectedCaseId || !streamingServiceRef.current) {
      console.error('Cannot start streaming: missing case ID or service');
      return;
    }

    try {
      console.log(`🔄 Starting streaming for stage: ${stageId}`);
      
      // Clear previous content
      contentAccumulatorRef.current = { reasoning: '', chat: '' };
      
      // Update streaming state
      setStreamingState(prev => ({
        ...prev,
        status: StreamStatus.CONNECTING,
        currentStageId: stageId,
        reasoningContent: '',
        chatContent: '',
        error: null,
        isStreaming: true
      }));

      // Get auth token (assuming it's available from auth context)
      const authToken = localStorage.getItem('authToken') || '';
      
      // Set up event listeners
      const service = streamingServiceRef.current;
      service.onEvent(handleStreamingEvent);
      service.onError(handleStreamingError);
      service.onStatusChange((status) => {
        console.log('📊 Streaming status changed:', status);
        setStreamingState(prev => ({
          ...prev,
          status,
          isStreaming: status === StreamStatus.STREAMING
        }));
      });

      // Connect to streaming endpoint
      service.connect(selectedCaseId, stageId, authToken);
      
    } catch (error) {
      console.error('Failed to start streaming:', error);
      setStreamingState(prev => ({
        ...prev,
        status: StreamStatus.ERROR,
        error: createStreamingError(
          StreamingErrorCode.CONNECTION_ERROR,
          `Failed to start streaming: ${error}`,
          true,
          'Try again or check connection'
        ),
        isStreaming: false
      }));
    }
  }, [selectedCaseId, handleStreamingEvent, handleStreamingError]);

  // Stop streaming
  const stopStreaming = useCallback(() => {
    if (streamingServiceRef.current) {
      console.log('⏹️ Stopping streaming');
      streamingServiceRef.current.disconnect();
      setStreamingState(prev => ({
        ...prev,
        status: StreamStatus.IDLE,
        currentStageId: null,
        isStreaming: false
      }));
    }
  }, []);

  // Clear streaming content
  const clearStreamingContent = useCallback(() => {
    console.log('🧹 Clearing streaming content');
    contentAccumulatorRef.current = { reasoning: '', chat: '' };
    setStreamingState(prev => ({
      ...prev,
      reasoningContent: '',
      chatContent: '',
      error: null
    }));
  }, []);

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
        streamingState,
        startStreaming,
        stopStreaming,
        clearStreamingContent,
      }}
    >
      {children}
    </WorkflowContext.Provider>
  );
};

export const useWorkflow = () => useContext(WorkflowContext);
