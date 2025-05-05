import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import CaseListItem, { Case } from './CaseListItem';
import Button from '../ui/Button'; // Uses the refactored Tailwind Button
import { useAuth } from '../../contexts/AuthContext';
import clsx from 'clsx'; // Import clsx

// Removed styled-components import
// import styled from 'styled-components';

interface CaseListProps {
  cases: Case[];
  onSelectCase: (caseData: Case) => void;
  onNewCase: () => void;
  selectedCaseId?: string;
  isLoading?: boolean;
  onDeleteCase: (caseId: string) => Promise<void>;
  onRenameCase: (caseId: string, newName: string) => Promise<void>;
}

// Removed styled-component definitions
// const Container = styled.div`...`;
// const Header = styled.div`...`;
// const Title = styled.h2`...`;
// const SearchContainer = styled.div`...`;
// const SearchInput = styled.input`...`;
// const SearchIconWrapper = styled.div`...`;
// const CasesContainer = styled.div`...`;
// const NoResultsMessage = styled.div`...`;
// const LoadingContainer = styled.div`...`;
// const ButtonContainer = styled.div`...`;

// Search Icon component remains the same
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15.5 14H14.7L14.4 13.7C15.4 12.6 16 11.1 16 9.5C16 5.9 13.1 3 9.5 3C5.9 3 3 5.9 3 9.5C3 13.1 5.9 16 9.5 16C11.1 16 12.6 15.4 13.7 14.4L14 14.7V15.5L19 20.5L20.5 19L15.5 14ZM9.5 14C7 14 5 12 5 9.5C5 7 7 5 9.5 5C12 5 14 7 14 9.5C14 12 12 14 9.5 14Z" fill="currentColor"/>
  </svg>
);

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
  const navigate = useNavigate(); // Initialize navigate

  // Handler functions remain the same
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
    // Replaced Container with div and Tailwind classes
    <div className="flex flex-col h-full">
      {/* Replaced Header with div and Tailwind classes */}
      <div className="mb-6">
        {/* Replaced Title with h2 and Tailwind classes */}
        <h2 className="mb-4 text-darkText text-h2 font-primary font-bold"> 
          Medhastra AI
        </h2>
        <Button 
          variant="primary" 
          fullWidth 
          onClick={onNewCase}
        >
          Start New Case
        </Button>
      </div>
      
      {/* Replaced SearchContainer with div and Tailwind classes */}
      <div className="relative mb-4">
        {/* Replaced SearchIconWrapper with div and Tailwind classes */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutralGray">
          <SearchIcon />
        </div >
        {/* Replaced SearchInput with input and Tailwind classes */}
        <input 
          type="text" 
          placeholder="Search cases..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full p-3 pl-10 rounded border border-[#e0e0e0] text-base focus:outline-none focus:border-deepMedicalBlue focus:ring-2 focus:ring-deepMedicalBlue/20"
        />
      </div>
      
      {/* Replaced CasesContainer with div and Tailwind classes */}
      <div className="overflow-y-auto mt-4 flex-grow">
        {isLoading ? (
          // Replaced LoadingContainer with div and Tailwind classes
          <div className="flex items-center justify-center p-8 text-neutralGray">
            {/* Replaced spinner div with Tailwind spinner (requires animation definition or use library) */}
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-deepMedicalBlue mr-2"></div>
            <span>Loading cases...</span>
          </div>
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
          // Replaced NoResultsMessage with div and Tailwind classes
          <div className="text-center p-8 text-neutralGray">
            {searchQuery ? "No cases found matching your search." : "No cases available. Start a new case."}
          </div>
        )}
      </div>
 
       {/* Replaced ButtonContainer with div and Tailwind classes */}
       <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-borderColor"> {/* Reduced gap */}
         {/* Add View Profile Button - Temporarily hidden for MVPv1 */}
         {/* 
         <Button 
           variant="secondary" // Or another appropriate variant
           fullWidth
           onClick={() => navigate('/app/profile')} // Navigate to profile page
         >
           View Profile
         </Button> 
         */}
         <Button 
           variant="secondary"
          fullWidth
          onClick={handleSignOut}
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default CaseList;
