import React, { createContext, useState, useEffect, useContext } from 'react';
import WorkflowService, { StageResult } from '../services/WorkflowService';
import MessageService from '../services/MessageService';
import CaseService from '../services/CaseService';
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
}

// Define the shape of the message
export interface Message {
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
  
  // Stage state
  currentStage: string;
  stages: Stage[];
  approveStage: () => Promise<void>;
  isStageCompleted: (stageId: string) => boolean;
  isStageActive: (stageId: string) => boolean;
  
  // Message state
  messages: Message[];
  sendMessage: (content: string) => Promise<void>;
  isProcessing: boolean;
  
  // Reasoning state
  reasoningContent: string;
  
  // PHI disclaimer state
  isPhiAcknowledged: boolean;
  acknowledgePhiDisclaimer: () => void;
  
  // Error state
  error: string | null;
}

const WorkflowContext = createContext<WorkflowContextData>({} as WorkflowContextData);

export const WorkflowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth context
  const { isAuthenticated } = useAuth();
  
  // Case state
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  
  // Stage state
  const [currentStage, setCurrentStage] = useState<string>('patient_case_analysis');
  const [stages, setStages] = useState<Stage[]>(WorkflowService.getStagesInOrder().map(stage => ({
    id: stage,
    name: WorkflowService.mapStageToUI(stage).name,
    status: 'upcoming',
  })));
  
  // Message state
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  // Reasoning state
  const [reasoningContent, setReasoningContent] = useState<string>('');
  
  // PHI disclaimer state
  const [isPhiAcknowledged, setIsPhiAcknowledged] = useState<boolean>(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);

  // Update stages based on current stage
  useEffect(() => {
    if (currentStage) {
      // Get all stages in order
      const orderedStages = WorkflowService.getStagesInOrder();
      
      // Update stage status based on current stage
      setStages(orderedStages.map(stageId => {
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
        };
      }));
    }
  }, [currentStage]);

  // Function to select a case and load its data
  const selectCase = async (caseId: string) => {
    try {
      setError(null);
      setIsProcessing(true);
      
      // Get case details
      const caseDetails = await CaseService.getCase(caseId);
      setSelectedCaseId(caseId);
      setCurrentStage(caseDetails.current_stage);
      
      // Get case messages
      const messagesResponse = await MessageService.getMessages(caseId);
      setMessages(messagesResponse.messages.map(msg => MessageService.formatMessageForUI(msg)));
      
      // If case needs to start workflow, start it
      if (caseDetails.current_stage === 'initial' || caseDetails.current_stage === 'patient_case_analysis') {
        const workflowResult = await WorkflowService.startWorkflow(caseId);
        updateReasoningContentFromWorkflowResult(workflowResult);
      }
      
      setIsProcessing(false);
    } catch (error) {
      console.error('Error selecting case:', error);
      setError('Failed to load case data. Please try again.');
      setIsProcessing(false);
    }
  };

  // Function to create a new case
  const createNewCase = async (caseText: string) => {
    try {
      setError(null);
      setIsProcessing(true);
      
      // Create the case
      const newCase = await CaseService.createCase({ case_text: caseText });
      setSelectedCaseId(newCase.id);
      setCurrentStage(newCase.current_stage);
      
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
      updateReasoningContentFromWorkflowResult(workflowResult);
      
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

  // Function to reset the case state
  const resetCase = () => {
    setSelectedCaseId(null);
    setCurrentStage('patient_case_analysis');
    setMessages([]);
    setReasoningContent('');
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
        updateReasoningContentFromWorkflowResult(nextStageResult);
        
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
    if (!selectedCaseId) return;
    
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
      updateReasoningContentFromWorkflowResult(stageResult);
      
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

  // Helper function to update reasoning content based on workflow result
  const updateReasoningContentFromWorkflowResult = (result: StageResult) => {
    console.log('Updating reasoning content with result:', result);
    
    if (result && result.result) {
      // For the intermediate results, use backend_results to populate the reasoning panel
      if (result.result.backend_results) {
        // This is a consolidated stage, show all intermediate outputs
        const backendResults = result.result.backend_results;
        let combinedContent = '';
        
        // Patient case analysis stage
        if (result.stage_name === 'patient_case_analysis') {
          if (backendResults.extraction && backendResults.extraction.extracted_factors) {
            combinedContent += `## Extracted Medical Factors\n\n${backendResults.extraction.extracted_factors}\n\n`;
          }
          if (backendResults.causal_analysis && backendResults.causal_analysis.causal_links) {
            combinedContent += `## Causal Relationships\n\n${backendResults.causal_analysis.causal_links}\n\n`;
          }
          if (backendResults.validation && backendResults.validation.validation_result) {
            combinedContent += `## Validation\n\n${backendResults.validation.validation_result}\n\n`;
          }
        }
        // Diagnosis stage
        else if (result.stage_name === 'diagnosis') {
          if (backendResults.counterfactual && backendResults.counterfactual.counterfactual_analysis) {
            combinedContent += `## Counterfactual Analysis\n\n${backendResults.counterfactual.counterfactual_analysis}\n\n`;
          }
          if (backendResults.diagnosis && backendResults.diagnosis.diagnosis) {
            combinedContent += `## Diagnosis\n\n${backendResults.diagnosis.diagnosis}\n\n`;
          }
        }
        // Treatment planning stage
        else if (result.stage_name === 'treatment_planning') {
          if (backendResults.treatment_planning && backendResults.treatment_planning.treatment_plan) {
            combinedContent += `## Treatment Options\n\n${backendResults.treatment_planning.treatment_plan}\n\n`;
          }
          if (backendResults.patient_specific && backendResults.patient_specific.patient_specific_plan) {
            combinedContent += `## Patient-Specific Plan\n\n${backendResults.patient_specific.patient_specific_plan}\n\n`;
          }
          if (backendResults.final_plan && backendResults.final_plan.final_treatment_plan) {
            combinedContent += `## Final Treatment Plan\n\n${backendResults.final_plan.final_treatment_plan}\n\n`;
          }
        }
        
        setReasoningContent(combinedContent);
      }
      // For legacy backend stages, map them to the right content
      else {
        let content = '';
        
        switch (result.stage_name) {
          case 'extraction':
            if (result.result.extracted_factors) {
              content = `## Extracted Medical Factors\n\n${result.result.extracted_factors}`;
            }
            break;
            
          case 'causal_analysis':
            if (result.result.causal_links) {
              content = `## Causal Relationships\n\n${result.result.causal_links}`;
            }
            break;
            
          case 'validation':
            if (result.result.validation_result) {
              content = `## Validation\n\n${result.result.validation_result}`;
            }
            break;
            
          case 'counterfactual':
            if (result.result.counterfactual_analysis) {
              content = `## Counterfactual Analysis\n\n${result.result.counterfactual_analysis}`;
            }
            break;
            
          case 'diagnosis':
            if (result.result.diagnosis) {
              content = `## Diagnosis\n\n${result.result.diagnosis}`;
            }
            break;
            
          case 'treatment_planning':
            if (result.result.treatment_plan) {
              content = `## Treatment Plan\n\n${result.result.treatment_plan}`;
            }
            break;
            
          case 'patient_specific':
            if (result.result.patient_specific_plan) {
              content = `## Patient-Specific Plan\n\n${result.result.patient_specific_plan}`;
            }
            break;
            
          case 'final_plan':
            if (result.result.final_treatment_plan) {
              content = `## Final Treatment Plan\n\n${result.result.final_treatment_plan}`;
            }
            break;
        }
        
        // Only update if we have content
        if (content) {
          setReasoningContent(prev => {
            // If we already have content, append the new content
            if (prev) {
              return `${prev}\n\n${content}`;
            }
            return content;
          });
        }
      }
    }
  };

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

  return (
    <WorkflowContext.Provider
      value={{
        selectedCaseId,
        selectCase,
        createNewCase,
        resetCase,
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
      }}
    >
      {children}
    </WorkflowContext.Provider>
  );
};

export const useWorkflow = () => useContext(WorkflowContext);
