import React, { useState } from 'react';
import Button from '../ui/Button'; // Uses refactored Tailwind Button
import { useWorkflow } from '../../contexts/WorkflowContext';
import clsx from 'clsx'; // Import clsx

// Removed styled-components import
// import styled from 'styled-components';

interface CaseInputProps {
  defaultValue?: string;
  onSubmit?: (caseText: string) => Promise<void>;
}

// Removed styled-component definitions
// const Container = styled.div`...`;
// const Title = styled.h2`...`;
// const TextAreaContainer = styled.div`...`;
// const StyledTextArea = styled.textarea`...`;
// const ButtonContainer = styled.div`...`;
// const HelpText = styled.p`...`;

export const CaseInput: React.FC<CaseInputProps> = ({ 
  defaultValue = "",
  onSubmit
}) => {
  const [caseText, setCaseText] = useState(defaultValue);
  const { createNewCase, isProcessing } = useWorkflow();
  
  // Handler functions remain the same
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
    // Replaced Container with div and Tailwind classes
    <div className="flex flex-col w-full">
      {/* Replaced Title with h2 and Tailwind classes */}
      <h2 className="mb-4 text-darkText text-h2 font-primary font-bold"> 
        Patient Case Details
      </h2>
      {/* Replaced HelpText with p and Tailwind classes */}
      <p className="text-secondary text-neutralGray mb-4">
        Enter detailed patient case information below. Include symptoms, vital signs, test results, medical history, and any other relevant information. 
        Avoid including personally identifiable information.
      </p>
      
      {/* Replaced TextAreaContainer with div */}
      <div className="mb-4">
        {/* Replaced StyledTextArea with textarea and Tailwind classes */}
        <textarea 
          value={caseText}
          onChange={(e) => setCaseText(e.target.value)}
          placeholder="Enter detailed patient case information here..."
          className={clsx(
            "w-full min-h-[300px] resize-y p-4 rounded border border-[#e0e0e0] font-body text-base leading-body",
            "focus:outline-none focus:border-deepMedicalBlue focus:ring-2 focus:ring-deepMedicalBlue/20"
          )}
        />
      </div>
      
      {/* Replaced ButtonContainer with div and Tailwind classes */}
      <div className="flex justify-between gap-4 mt-4">
        <Button 
          variant="secondary" 
          onClick={handleSampleCase}
        >
          Use Sample Case
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={!caseText.trim() || isProcessing}
          variant="primary" // Explicitly set variant
        >
          Submit Case
        </Button>
      </div>
    </div>
  );
};

export default CaseInput;
