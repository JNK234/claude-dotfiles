import React from 'react';
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
    error
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
    if (selectedCaseId) {
      try {
        // Generate report
        const report = await ReportService.generateReport(selectedCaseId);
        
        // Download report
        await ReportService.downloadReport(selectedCaseId, report.id);
      } catch (error) {
        console.error('Error downloading report:', error);
      }
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
        
        {isPhiAcknowledged && (!currentStage || currentStage === 'initial' || currentStage === 'patient_case_analysis') && !selectedCaseId && (
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
            
            {currentStage !== 'complete' && selectedCaseId && (
              <StageControlsContainer>
                <Button 
                  variant="approve" 
                  onClick={handleStageApproval}
                  disabled={isProcessing}
                >
                  Approve & Continue to Next Stage
                </Button>
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
        content={reasoningContent} 
        currentStage={stages.find(s => s.id === currentStage)?.name || currentStage}
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
  onNewCase: () => void;
  selectedCaseId?: string;
}> = ({ onSelectCase, onNewCase, selectedCaseId }) => {
  const [cases, setCases] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  
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
  
  return (
    <CaseList 
      cases={cases}
      onSelectCase={onSelectCase} 
      onNewCase={onNewCase} 
      selectedCaseId={selectedCaseId}
      isLoading={loading}
    />
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
