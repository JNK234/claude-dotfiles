import React, { useState } from 'react';
import Button from './Button'; // Uses refactored Tailwind Button
import clsx from 'clsx'; // Import clsx

// Removed styled-components import
// import styled from 'styled-components';

interface PHIDisclaimerProps {
  onAcknowledge: () => void;
}

// Removed styled-component definitions
// const DisclaimerContainer = styled.div`...`;
// const DisclaimerTitle = styled.h3`...`;
// const DisclaimerContent = styled.div`...`;
// const CheckboxContainer = styled.div`...`;

// Warning Icon component remains the same
const WarningIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 21H23L12 2L1 21ZM13 18H11V16H13V18ZM13 14H11V10H13V14Z" fill="#F59E0B"/> {/* Using alertAmber color directly */}
  </svg>
);

export const PHIDisclaimer: React.FC<PHIDisclaimerProps> = ({ onAcknowledge }) => {
  const [isChecked, setIsChecked] = useState(false);
  
  return (
    // Replaced DisclaimerContainer with div and Tailwind classes
    <div className="bg-disclaimerBg border border-disclaimerBorder rounded p-6 mb-6 relative">
      {/* Replaced DisclaimerTitle with h3 and Tailwind classes */}
      <h3 className="text-alertAmber flex items-center gap-2 mb-4 text-lg font-semibold">
        <WarningIcon />
        Protected Health Information (PHI) Warning
      </h3>
      
      {/* Replaced DisclaimerContent with div and Tailwind classes */}
      {/* Added prose for basic list/paragraph styling */}
      <div className="mb-6 text-secondary prose prose-sm max-w-none prose-li:my-1 prose-p:mb-2">
        <p>This application is designed to assist healthcare professionals in analyzing medical cases. Please be aware of the following important information:</p>
        <ul>
          <li>Do not enter any personally identifiable information (PII) that could be used to identify a patient.</li>
          <li>The information you provide will be used solely for the purpose of medical analysis and diagnosis assistance.</li>
          <li>This tool is a supplement to, not a replacement for, professional medical judgment.</li>
          <li>All data entered is processed according to applicable healthcare privacy regulations.</li>
        </ul>
      </div>
      
      {/* Replaced CheckboxContainer with div and Tailwind classes */}
      <div className="flex items-center mb-6">
        <input 
          type="checkbox" 
          id="phi-acknowledgment" 
          checked={isChecked} 
          onChange={() => setIsChecked(!isChecked)}
          className="mr-3 h-5 w-5 rounded border-gray-300 text-darkBlue focus:ring-darkBlue" // Basic checkbox styling
        />
        <label htmlFor="phi-acknowledgment" className="font-medium text-sm">
          I understand and acknowledge the PHI guidelines
        </label>
      </div>
      
      {/* Using the refactored Button component */}
      <Button 
        onClick={onAcknowledge} 
        disabled={!isChecked}
        fullWidth
        variant="primary" // Explicitly set variant if needed, defaults to primary
      >
        Continue
      </Button>
    </div>
  );
};

export default PHIDisclaimer;
