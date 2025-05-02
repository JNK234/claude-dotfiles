import React, { useState } from 'react';
import styled from 'styled-components';
import CaseListItem, { Case } from './CaseListItem';
import Button from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';

interface CaseListProps {
  cases: Case[];
  onSelectCase: (caseData: Case) => void;
  onNewCase: () => void;
  selectedCaseId?: string;
  isLoading?: boolean;
  onDeleteCase: (caseId: string) => Promise<void>;
  onRenameCase: (caseId: string, newName: string) => Promise<void>;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const Header = styled.div`
  margin-bottom: 1.5rem;
`;

const Title = styled.h2`
  margin-bottom: 1rem;
  color: ${props => props.theme.colors.darkText};
`;

const SearchContainer = styled.div`
  position: relative;
  margin-bottom: 1rem;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  padding-left: 2.5rem;
  border-radius: ${props => props.theme.layout.borderRadius};
  border: 1px solid #e0e0e0;
  font-size: ${props => props.theme.typography.fontSizes.body};
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.deepMedicalBlue};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.deepMedicalBlue}20;
  }
`;

const SearchIconWrapper = styled.div`
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.theme.colors.neutralGray};
`;

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15.5 14H14.7L14.4 13.7C15.4 12.6 16 11.1 16 9.5C16 5.9 13.1 3 9.5 3C5.9 3 3 5.9 3 9.5C3 13.1 5.9 16 9.5 16C11.1 16 12.6 15.4 13.7 14.4L14 14.7V15.5L19 20.5L20.5 19L15.5 14ZM9.5 14C7 14 5 12 5 9.5C5 7 7 5 9.5 5C12 5 14 7 14 9.5C14 12 12 14 9.5 14Z" fill="currentColor"/>
  </svg>
);

const CasesContainer = styled.div`
  overflow-y: auto;
  margin-top: 1rem;
  flex-grow: 1;
`;

const NoResultsMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: ${props => props.theme.colors.neutralGray};
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: ${props => props.theme.colors.neutralGray};
  
  .spinner {
    border: 3px solid #f3f3f3;
    border-top: 3px solid ${props => props.theme.colors.deepMedicalBlue};
    border-radius: 50%;
    width: 24px;
    height: 24px;
    animation: spin 1s linear infinite;
    margin-right: 0.5rem;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid ${props => props.theme.colors.borderColor};
`;

export const CaseList: React.FC<CaseListProps> = ({ 
  cases, 
  onSelectCase, 
  onNewCase,
  selectedCaseId,
  isLoading = false,
  onDeleteCase,
  onRenameCase
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { signOut } = useAuth();

  const handleDeleteRequest = async (caseId: string) => {
    try {
      await onDeleteCase(caseId);
      console.log(`Deletion requested and handled by parent for case ID: ${caseId}`);
    } catch (error) {
      console.error('Error requesting case deletion:', error);
      alert(`Failed to delete case: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleRenameRequest = async (caseId: string, newName: string) => {
    try {
      await onRenameCase(caseId, newName);
      console.log(`Rename requested and handled by parent for case ID: ${caseId}`);
    } catch (error) {
      console.error('Error requesting case rename:', error);
      alert(`Failed to rename case: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const filteredCases = cases.filter(caseItem => 
    caseItem.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    caseItem.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <Container>
      <Header>
        <Title>Medhastra</Title>
        <Button 
          variant="primary" 
          fullWidth 
          onClick={onNewCase}
        >
          Start New Case
        </Button>
      </Header>
      
      <SearchContainer>
        <SearchIconWrapper>
          <SearchIcon />
        </SearchIconWrapper>
        <SearchInput 
          type="text" 
          placeholder="Search cases..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </SearchContainer>
      
      <CasesContainer>
        {isLoading ? (
          <LoadingContainer>
            <div className="spinner"></div>
            <span>Loading cases...</span>
          </LoadingContainer>
        ) : filteredCases.length > 0 ? (
          filteredCases.map(caseItem => (
            <CaseListItem 
              key={caseItem.id} 
              caseData={caseItem} 
              isSelected={caseItem.id === selectedCaseId}
              onClick={() => onSelectCase(caseItem)}
              onDelete={handleDeleteRequest}
              onRename={handleRenameRequest}
            />
          ))
        ) : (
          <NoResultsMessage>
            {searchQuery ? "No cases found matching your search." : "No cases available. Start a new case."}
          </NoResultsMessage>
        )}
      </CasesContainer>

      <ButtonContainer>
        <Button 
          variant="secondary"
          fullWidth
          onClick={handleSignOut}
        >
          Sign Out
        </Button>
      </ButtonContainer>
    </Container>
  );
};

export default CaseList;