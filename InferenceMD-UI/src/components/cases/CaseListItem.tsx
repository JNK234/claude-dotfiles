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
}

const ListItem = styled.div<{ isSelected: boolean, status: string }>`
  padding: 1rem;
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
  margin-bottom: 0.75rem;
  cursor: pointer;
  transition: all ${props => props.theme.transitions.default};
  
  &:hover {
    background-color: ${props => props.isSelected ? props.theme.colors.deepMedicalBlue + '15' : props.theme.colors.deepMedicalBlue + '05'};
  }
`;

const PatientName = styled.h3`
  font-size: ${props => props.theme.typography.fontSizes.body};
  margin: 0 0 0.25rem 0;
  font-weight: ${props => props.theme.typography.fontWeights.semibold};
`;

const CaseDate = styled.div`
  font-size: ${props => props.theme.typography.fontSizes.small};
  color: ${props => props.theme.colors.neutralGray};
  margin-bottom: 0.5rem;
`;

const SummaryText = styled.p`
  font-size: ${props => props.theme.typography.fontSizes.secondary};
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const StatusBadge = styled.span<{ status: string }>`
  display: inline-block;
  font-size: ${props => props.theme.typography.fontSizes.small};
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  background-color: ${props => 
    props.status === 'completed' 
      ? props.theme.colors.successGreen + '20' 
      : props.status === 'in-progress' 
        ? props.theme.colors.alertAmber + '20' 
        : props.theme.colors.deepMedicalBlue + '20'
  };
  color: ${props => 
    props.status === 'completed' 
      ? props.theme.colors.successGreen 
      : props.status === 'in-progress' 
        ? props.theme.colors.alertAmber 
        : props.theme.colors.deepMedicalBlue
  };
  margin-top: 0.5rem;
`;

export const CaseListItem: React.FC<CaseListItemProps> = ({ 
  caseData, 
  isSelected, 
  onClick 
}) => {
  const { patientName, date, summary, status } = caseData;
  
  return (
    <ListItem isSelected={isSelected} status={status} onClick={onClick}>
      <PatientName>{patientName}</PatientName>
      <CaseDate>{date}</CaseDate>
      <SummaryText>{summary}</SummaryText>
      <StatusBadge status={status}>
        {status === 'completed' ? 'Completed' : status === 'in-progress' ? 'In Progress' : 'New'}
      </StatusBadge>
    </ListItem>
  );
};

export default CaseListItem;