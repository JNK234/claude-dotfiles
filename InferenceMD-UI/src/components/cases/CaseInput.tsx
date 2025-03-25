import React, { useState } from 'react';
import styled from 'styled-components';
import Button from '../ui/Button';
import { useWorkflow } from '../../contexts/WorkflowContext';

interface CaseInputProps {
  defaultValue?: string;
  onSubmit?: (caseText: string) => Promise<void>;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const Title = styled.h2`
  margin-bottom: 1rem;
  color: ${props => props.theme.colors.darkText};
`;

const TextAreaContainer = styled.div`
  margin-bottom: 1rem;
`;

const StyledTextArea = styled.textarea`
  width: 100%;
  min-height: 300px;
  resize: vertical;
  padding: 1rem;
  border-radius: ${props => props.theme.layout.borderRadius};
  border: 1px solid #e0e0e0;
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSizes.body};
  line-height: ${props => props.theme.typography.lineHeights.body};
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.deepMedicalBlue};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.deepMedicalBlue}20;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1rem;
`;

const HelpText = styled.p`
  font-size: ${props => props.theme.typography.fontSizes.secondary};
  color: ${props => props.theme.colors.neutralGray};
  margin-bottom: 1rem;
`;

export const CaseInput: React.FC<CaseInputProps> = ({ 
  defaultValue = "",
  onSubmit
}) => {
  const [caseText, setCaseText] = useState(defaultValue);
  const { createNewCase, isProcessing } = useWorkflow();
  
  const handleSubmit = async () => {
    if (caseText.trim()) {
      try {
        if (onSubmit) {
          await onSubmit(caseText);
        } else {
          await createNewCase(caseText);
        }
        console.log('Case submitted successfully');
      } catch (error) {
        console.error('Error submitting case:', error);
      }
    }
  };
  
  const handleSampleCase = () => {
    const sampleCase = `Patient is a 45-year-old male presenting with severe abdominal pain in the right lower quadrant for the past 24 hours. Pain began as diffuse periumbilical discomfort and migrated to the right lower quadrant. Patient reports nausea, vomiting (twice), and loss of appetite. No diarrhea or constipation. Temperature is 38.2°C (100.8°F). Physical examination reveals rebound tenderness at McBurney's point and positive Rovsing's sign. WBC count is elevated at 14,500/μL with neutrophilia. Patient has no significant past medical history and no known allergies. No previous surgeries. Family history is non-contributory.`;
    
    setCaseText(sampleCase);
  };
  
  return (
    <Container>
      <Title>Patient Case Details</Title>
      <HelpText>
        Enter detailed patient case information below. Include symptoms, vital signs, test results, medical history, and any other relevant information. 
        Avoid including personally identifiable information.
      </HelpText>
      
      <TextAreaContainer>
        <StyledTextArea 
          value={caseText}
          onChange={(e) => setCaseText(e.target.value)}
          placeholder="Enter detailed patient case information here..."
        />
      </TextAreaContainer>
      
      <ButtonContainer>
        <Button 
          variant="secondary" 
          onClick={handleSampleCase}
        >
          Use Sample Case
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={!caseText.trim() || isProcessing}
        >
          Submit Case
        </Button>
      </ButtonContainer>
    </Container>
  );
};

export default CaseInput;
