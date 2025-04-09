import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import ThreePanelLayout from './components/layout/ThreePanelLayout';
import CaseList from './components/cases/CaseList';
import ChatContainer from './components/chat/ChatContainer';
import ReasoningPanel from './components/analysis/ReasoningPanel';
import CaseInput from './components/cases/CaseInput';
import PHIDisclaimer from './components/ui/PHIDisclaimer';
import StageProgressIndicator from './components/workflow/StageProgressIndicator';
import Button from './components/ui/Button';
import Login from './pages/Login';
import PrivateRoute from './components/auth/PrivateRoute';
import { AuthProvider } from './contexts/AuthContext';
import { WorkflowProvider, useWorkflow } from './contexts/WorkflowContext';
import CaseService from './services/CaseService';
import ReportService from './services/ReportService';

// Container for stage progress indicator
const ProgressContainer = styled.div`
  padding: 1rem 2rem;
  border-bottom: 1px solid #e0e0e0;
  background-color: white;
`;

// Container for main content
const ContentContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

// Container for stage controls
const StageControlsContainer = styled.div`
  padding: 1rem;
  border-top: 1px solid #e0e0e0;
  background-color: white;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
`;

// Error container for displaying API errors
const ErrorContainer = styled.div`
  padding: 1rem;
  margin: 1rem;
  background-color: #fee2e2;
  color: #b91c1c;
  border-radius: 0.25rem;
  font-size: 0.875rem;
`;

const MainApp: React.FC = () => {
  const {
    // Case state
    selectedCaseId,
    selectCase,
    createNewCase,
    resetCase,
    caseStatus,
    
    // Stage state
    currentStage,
    stages,
    approveStage,
    
    // Message state
    messages,
    sendMessage,
    isProcessing,
    
    // Reasoning state
    reasoningContent,
    
    // PHI disclaimer state
    isPhiAcknowledged,
    acknowledgePhiDisclaimer,
    
    // Error state
    error,
    setError,
    
    // Note generation
    generateNote
  } = useWorkflow();
  
  // Handle case selection
  const handleSelectCase = async (caseData: { id: string }) => {
    await selectCase(caseData.id);
  };
  
  // Handle new case button
  const handleNewCase = () => {
    resetCase();
  };
  
  // Handle case submission
  const handleCaseSubmit = async (caseText: string) => {
    await createNewCase(caseText);
  };
  
  // Handle message sending
  const handleSendMessage = async (content: string) => {
    await sendMessage(content);
  };
  
  // Handle stage approval
  const handleStageApproval = async () => {
    await approveStage();
  };
  
  // Handle report download
  const handleDownloadReport = async () => {
    if (!selectedCaseId) return;
    
    const button = document.querySelector('button[data-action="generate-report"]');
    if (button) {
      button.setAttribute('disabled', 'true');
      button.textContent = 'Generating Report...';
    }

    try {
      // Generate report
      const report = await ReportService.generateReport(selectedCaseId);
      if (!report || !report.id) {
        throw new Error('Failed to generate report');
      }
      
      // Download report
      await ReportService.downloadReport(selectedCaseId, report.id);
      
      // Reset button
      if (button) {
        button.removeAttribute('disabled');
        button.textContent = 'Download Detailed Report';
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      // Show error in the ErrorContainer
      if (error instanceof Error) {
        setError(`Failed to generate report: ${error.message}`);
      } else {
        setError('Failed to generate report. Please try again.');
      }
      // Reset button
      if (button) {
        button.removeAttribute('disabled');
        button.textContent = 'Download Detailed Report';
      }
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    }
  };

  // Handle note generation
  const handleGenerateNote = async () => {
    if (!selectedCaseId) return;
    
    const button = document.querySelector('button[data-action="generate-note"]');
    if (button) {
      button.setAttribute('disabled', 'true');
      button.textContent = 'Generating Note...';
    }

    try {
      await generateNote(); // This uses the context's generateNote function
      
      // Reset button
      if (button) {
        button.removeAttribute('disabled');
        button.textContent = 'Generate Note';
      }
    } catch (error) {
      console.error('Error generating note:', error);
      // Show error in the ErrorContainer
      if (error instanceof Error) {
        setError(`Failed to generate note: ${error.message}`);
      } else {
        setError('Failed to generate note. Please try again.');
      }
      // Reset button
      if (button) {
        button.removeAttribute('disabled');
        button.textContent = 'Generate Note';
      }
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    }
  };
  
  // Render left panel
  const renderLeftPanel = () => {
    return (
      <CaseListConnector 
        onSelectCase={handleSelectCase} 
        onNewCase={handleNewCase} 
        selectedCaseId={selectedCaseId || undefined}
      />
    );
  };
  
  // Render center panel
  const renderCenterPanel = () => {
    return (
      <ContentContainer>
        <ProgressContainer>
          <StageProgressIndicator stages={stages} />
        </ProgressContainer>
        
        {error && <ErrorContainer>{error}</ErrorContainer>}
        
        {!isPhiAcknowledged && (
          <div style={{ padding: '1rem' }}>
            <PHIDisclaimer onAcknowledge={acknowledgePhiDisclaimer} />
          </div>
        )}
        
        {isPhiAcknowledged && (!currentStage || currentStage === 'initial' || currentStage === 'patient_case_analysis_group') && !selectedCaseId && (
          <div style={{ padding: '1rem' }}>
            <CaseInput onSubmit={handleCaseSubmit} />
          </div>
        )}
        
        {isPhiAcknowledged && selectedCaseId && (
          <>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <ChatContainer 
                messages={messages} 
                onSendMessage={handleSendMessage} 
                isProcessing={isProcessing}
              />
            </div>
            
            {selectedCaseId && (
              <StageControlsContainer>
                {currentStage !== 'treatment_planning_group' && (
                  <Button 
                    variant="approve" 
                    onClick={handleStageApproval}
                    disabled={isProcessing}
                  >
                    Approve & Continue to Next Stage
                  </Button>
                )}
                {currentStage === 'treatment_planning_group' && (
                  <>
                    <Button 
                      onClick={handleGenerateNote}
                      disabled={isProcessing}
                      data-action="generate-note"
                    >
                      Generate Note
                    </Button>
                    <Button 
                      onClick={handleDownloadReport}
                      disabled={isProcessing}
                      data-action="generate-report"
                    >
                      Download Detailed Report
                    </Button>
                  </>
                )}
              </StageControlsContainer>
            )}
          </>
        )}
      </ContentContainer>
    );
  };
  
  // Render right panel
  const renderRightPanel = () => {
    return (
      <ReasoningPanel 
        currentStage={stages.find(s => s.id === currentStage)?.name || currentStage}
        allStagesContent={stages.reduce((acc, stage) => {
          acc[stage.id] = stage.reasoningContent || '';
          return acc;
        }, {} as Record<string, string>)}
        caseId={selectedCaseId || ''}
        caseStatus={caseStatus}
      />
    );
  };
  
  return (
    <ThreePanelLayout
      leftPanel={renderLeftPanel()}
      centerPanel={renderCenterPanel()}
      rightPanel={renderRightPanel()}
    />
  );
};

// Component to connect CaseList to the API
const CaseListConnector: React.FC<{
  onSelectCase: (caseData: { id: string }) => void;
  onNewCase: () => void; // This function likely resets the selected case view
  selectedCaseId?: string;
}> = ({ onSelectCase, onNewCase, selectedCaseId }) => {
  const [cases, setCases] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [deleteError, setDeleteError] = React.useState<string | null>(null); // State for delete errors

  /**
   * Fetches the list of cases from the API on component mount.
   */
  React.useEffect(() => {
    const fetchCases = async () => {
      try {
        setLoading(true);
        const casesResponse = await CaseService.getCases();
        const formattedCases = casesResponse.cases.map(caseItem => 
          CaseService.formatCaseForUI(caseItem)
        );
        setCases(formattedCases);
      } catch (error) {
        console.error('Error fetching cases:', error);
        setCases([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCases();
  }, []);

  /**
   * Handles the deletion of a case.
   * Calls the CaseService to delete the case via API, updates the local state,
   * and resets the view if the currently selected case is deleted.
   * @param caseId - The ID of the case to delete.
   */
  const handleDeleteCase = async (caseId: string) => {
    // Optional: Add confirmation dialog here
    // if (!window.confirm('Are you sure you want to delete this case? This action cannot be undone.')) {
    //   return;
    // }
    setDeleteError(null); // Clear previous errors
    try {
      setLoading(true); // Indicate loading state during deletion
      await CaseService.deleteCase(caseId);

      // Update the local state by removing the deleted case
      setCases(prevCases => prevCases.filter(c => c.id !== caseId));

      // If the deleted case was the currently selected one, reset the view
      if (caseId === selectedCaseId) {
        onNewCase(); // Call the handler passed from MainApp to reset the case context
      }
      console.log(`Case ${caseId} deleted successfully.`);

    } catch (error) {
      console.error('Error deleting case:', error);
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      setDeleteError(`Failed to delete case: ${errorMsg}`);
      // Optionally clear the error after a few seconds
      setTimeout(() => setDeleteError(null), 5000);
    } finally {
      setLoading(false); // Stop loading indicator
    }
  };

  return (
    <>
      {/* Display delete error if any */}
      {deleteError && <ErrorContainer style={{ margin: '0 0 1rem 0' }}>{deleteError}</ErrorContainer>}
      <CaseList
        cases={cases}
        onSelectCase={onSelectCase}
        onNewCase={onNewCase}
        selectedCaseId={selectedCaseId}
        isLoading={loading}
        onDeleteCase={handleDeleteCase} // Pass the delete handler down
      />
    </>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <WorkflowProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<PrivateRoute />}>
              <Route path="/" element={<MainApp />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </WorkflowProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
