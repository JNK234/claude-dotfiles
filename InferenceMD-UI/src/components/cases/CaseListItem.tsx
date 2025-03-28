import React from 'react';
import styled from 'styled-components';

export interface Case {
  id: string;
  patientName: string;
  date: string;
  summary: string;
  status: 'completed' | 'in-progress' | 'new';
}

interface CaseListItemProps {
  caseData: Case;
  isSelected: boolean;
  onClick: () => void;
  onDelete: (caseId: string) => void; // Add onDelete prop
}

// --- Styled Components ---

const DeleteButton = styled.button`
  background-color: ${props => props.theme.colors.errorRed + '20'};
  color: ${props => props.theme.colors.errorRed};
  border: none;
  padding: 0.3rem 0.6rem;
  border-radius: ${props => props.theme.layout.borderRadiusSmall};
  cursor: pointer;
  font-size: ${props => props.theme.typography.fontSizes.small};
  transition: background-color ${props => props.theme.transitions.fast};

  &:hover {
    background-color: ${props => props.theme.colors.errorRed + '40'};
  }
`;

const DeleteMenu = styled.div`
  position: absolute;
  right: 0;
  top: 100%; // Position below the dots
  background-color: ${props => props.theme.colors.backgroundLight};
  border: 1px solid ${props => props.theme.colors.borderLight};
  border-radius: ${props => props.theme.layout.borderRadiusSmall};
  padding: 0.5rem;
  box-shadow: ${props => props.theme.shadows.subtle};
  z-index: 10;
  display: none; // Hidden by default
  min-width: 80px; // Ensure enough space for the button
  text-align: center;
`;

const DotsIcon = styled.span`
  padding: 0 0.5rem;
  cursor: pointer;
  font-weight: bold;
  color: ${props => props.theme.colors.neutralGray};
  &:hover {
    color: ${props => props.theme.colors.textPrimary};
  }
`;

const DotsMenuContainer = styled.div`
  position: relative; // Needed for absolute positioning of DeleteMenu

  &:hover ${DeleteMenu} {
    display: block; // Show menu on hover
  }
`;


const ListItem = styled.div<{ isSelected: boolean, status: string }>`
  display: flex; // Use flexbox for layout
  justify-content: space-between; // Space out title and dots
  align-items: center; // Vertically align items
  padding: 0.8rem 1rem; // Adjust padding
  background-color: ${props => props.isSelected ? props.theme.colors.deepMedicalBlue + '15' : 'transparent'};
  border-radius: ${props => props.theme.layout.borderRadius};
  border-left: 3px solid ${props => 
    props.isSelected 
      ? props.theme.colors.deepMedicalBlue 
      : props.status === 'completed' 
        ? props.theme.colors.successGreen 
        : props.status === 'in-progress' 
          ? props.theme.colors.alertAmber 
          : 'transparent'
  };
  margin-bottom: 0.5rem; // Reduce margin slightly
  cursor: pointer;
  transition: background-color ${props => props.theme.transitions.default}; // Only transition background

  &:hover {
    background-color: ${props => props.isSelected ? props.theme.colors.deepMedicalBlue + '15' : props.theme.colors.deepMedicalBlue + '05'};
  }
`;

const PatientName = styled.h3`
  font-size: ${props => props.theme.typography.fontSizes.body};
  margin: 0; // Remove bottom margin
  font-weight: ${props => props.theme.typography.fontWeights.medium}; // Slightly less bold
  // Ensure text doesn't wrap excessively and truncate if needed
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-grow: 1; // Allow title to take available space
  margin-right: 0.5rem; // Add space between title and dots
`;


// --- Component Implementation ---

export const CaseListItem: React.FC<CaseListItemProps> = ({
  caseData,
  isSelected,
  onClick,
  onDelete // Destructure onDelete
}) => {
  const { id, patientName, status } = caseData; // Only need id, patientName, status

  // Prevent click propagation when interacting with the menu/delete button
  const handleMenuInteraction = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the main item onClick from firing
    onDelete(id); // Call the passed-in delete handler
  };

  return (
    // Pass status to ListItem for potential future styling, though it's not used visually now
    <ListItem isSelected={isSelected} status={status} onClick={onClick} title={patientName}>
      {/* Case Title */}
      <PatientName>{patientName}</PatientName>

      {/* Dots Menu */}
      <DotsMenuContainer onClick={handleMenuInteraction}>
        <DotsIcon>...</DotsIcon>
        <DeleteMenu>
          <DeleteButton onClick={handleDeleteClick}>
            Delete
          </DeleteButton>
        </DeleteMenu>
      </DotsMenuContainer>
    </ListItem>
  );
};

export default CaseListItem;
