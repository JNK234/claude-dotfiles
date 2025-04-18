import React, { useState } from 'react';
import styled from 'styled-components';
import { MoreVertical, Trash2, Edit3, ChevronRight } from 'lucide-react';

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
  onDelete: (caseId: string) => void;
  onRename?: (caseId: string, newName: string) => void;
}

const ListItem = styled.div<{ isSelected: boolean; status: string }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
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
  margin-bottom: 0.25rem;
  cursor: pointer;
  transition: all ${props => props.theme.transitions.default};
  position: relative;
  min-height: 48px;

  &:hover {
    background-color: ${props => props.isSelected ? props.theme.colors.deepMedicalBlue + '15' : props.theme.colors.deepMedicalBlue + '05'};
  }
`;

const ContentWrapper = styled.div`
  flex-grow: 1;
  margin-right: 0.5rem;
  min-width: 0; /* Enable text truncation */
`;

const PatientName = styled.h3`
  font-size: ${props => props.theme.typography.fontSizes.secondary};
  margin: 0;
  font-weight: ${props => props.theme.typography.fontWeights.medium};
  color: ${props => props.theme.colors.darkText};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const DateText = styled.p`
  font-size: ${props => props.theme.typography.fontSizes.small};
  color: ${props => props.theme.colors.neutralGray};
  margin: 0.125rem 0 0 0;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  padding: 0.25rem;
  cursor: pointer;
  color: ${props => props.theme.colors.neutralGray};
  border-radius: ${props => props.theme.layout.borderRadius};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all ${props => props.theme.transitions.default};
  flex-shrink: 0;

  &:hover {
    background-color: ${props => props.theme.colors.rightPanelBg};
    color: ${props => props.theme.colors.darkBlue};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${props => props.theme.colors.yellow}40;
  }
`;

const MenuContainer = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: 100%;
  right: 0;
  background-color: white;
  border-radius: ${props => props.theme.layout.borderRadius};
  box-shadow: ${props => props.theme.shadows.large};
  min-width: 160px;
  z-index: 1000;
  display: ${props => props.isOpen ? 'block' : 'none'};
  margin-top: 0.25rem;
  border: 1px solid ${props => props.theme.colors.borderColor};
`;

const MenuItem = styled.button`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${props => props.theme.colors.darkText};
  font-size: ${props => props.theme.typography.fontSizes.secondary};
  transition: all ${props => props.theme.transitions.default};

  &:hover {
    background-color: ${props => props.theme.colors.rightPanelBg};
  }

  &.delete {
    color: ${props => props.theme.colors.errorRed};
    
    &:hover {
      background-color: ${props => props.theme.colors.errorRed}10;
    }
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const StatusIndicator = styled.div<{ status: string }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 0.5rem;
  background-color: ${props => 
    props.status === 'completed'
      ? props.theme.colors.successGreen
      : props.status === 'in-progress'
        ? props.theme.colors.alertAmber
        : props.theme.colors.neutralGray
  };
  flex-shrink: 0;
`;

export const CaseListItem: React.FC<CaseListItemProps> = ({
  caseData,
  isSelected,
  onClick,
  onDelete,
  onRename
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current && 
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this case? This action cannot be undone.')) {
      onDelete(caseData.id);
    }
    setIsMenuOpen(false);
  };

  const handleRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newName = window.prompt('Enter new name for the case:', caseData.patientName);
    if (newName && onRename) {
      onRename(caseData.id, newName);
    }
    setIsMenuOpen(false);
  };

  return (
    <ListItem isSelected={isSelected} status={caseData.status} onClick={onClick}>
      <ContentWrapper>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <StatusIndicator status={caseData.status} />
          <PatientName>{caseData.patientName}</PatientName>
        </div>
        <DateText>{caseData.date}</DateText>
      </ContentWrapper>
      
      <ActionButton
        ref={buttonRef}
        onClick={handleMenuClick}
        title="More options"
      >
        <MoreVertical size={16} />
      </ActionButton>

      <MenuContainer ref={menuRef} isOpen={isMenuOpen}>
        <MenuItem onClick={handleRename}>
          <Edit3 />
          Rename
        </MenuItem>
        <MenuItem className="delete" onClick={handleDelete}>
          <Trash2 />
          Delete
        </MenuItem>
      </MenuContainer>
    </ListItem>
  );
};

export default CaseListItem;