import React, { useState } from 'react';
import styled from 'styled-components';
import Button from './Button';

interface PHIDisclaimerProps {
  onAcknowledge: () => void;
}

const DisclaimerContainer = styled.div`
  background-color: ${props => props.theme.colors.disclaimerBg};
  border: 1px solid ${props => props.theme.colors.disclaimerBorder};
  border-radius: ${props => props.theme.layout.borderRadius};
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  position: relative;
`;

const DisclaimerTitle = styled.h3`
  color: ${props => props.theme.colors.alertAmber};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const DisclaimerContent = styled.div`
  margin-bottom: 1.5rem;
  font-size: ${props => props.theme.typography.fontSizes.secondary};
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
  
  input {
    margin-right: 0.75rem;
    width: 18px;
    height: 18px;
  }
  
  label {
    font-weight: ${props => props.theme.typography.fontWeights.medium};
  }
`;

const WarningIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 21H23L12 2L1 21ZM13 18H11V16H13V18ZM13 14H11V10H13V14Z" fill="#F59E0B"/>
  </svg>
);

export const PHIDisclaimer: React.FC<PHIDisclaimerProps> = ({ onAcknowledge }) => {
  const [isChecked, setIsChecked] = useState(false);
  
  return (
    <DisclaimerContainer>
      <DisclaimerTitle>
        <WarningIcon />
        Protected Health Information (PHI) Warning
      </DisclaimerTitle>
      
      <DisclaimerContent>
        <p>This application is designed to assist healthcare professionals in analyzing medical cases. Please be aware of the following important information:</p>
        <ul>
          <li>Do not enter any personally identifiable information (PII) that could be used to identify a patient.</li>
          <li>The information you provide will be used solely for the purpose of medical analysis and diagnosis assistance.</li>
          <li>This tool is a supplement to, not a replacement for, professional medical judgment.</li>
          <li>All data entered is processed according to applicable healthcare privacy regulations.</li>
        </ul>
      </DisclaimerContent>
      
      <CheckboxContainer>
        <input 
          type="checkbox" 
          id="phi-acknowledgment" 
          checked={isChecked} 
          onChange={() => setIsChecked(!isChecked)}
        />
        <label htmlFor="phi-acknowledgment">
          I understand and acknowledge the PHI guidelines
        </label>
      </CheckboxContainer>
      
      <Button 
        onClick={onAcknowledge} 
        disabled={!isChecked}
        fullWidth
      >
        Continue
      </Button>
    </DisclaimerContainer>
  );
};

export default PHIDisclaimer;