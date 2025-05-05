import React from 'react';
import Button from '../ui/Button'; // Uses refactored Tailwind Button
import clsx from 'clsx'; // Import clsx

// Removed styled-components import
// import styled from 'styled-components';

interface AnalysisSection {
  id: string;
  title: string;
  content: string;
  type: 'factors' | 'causal' | 'diagnosis' | 'treatment';
  expanded?: boolean;
}

interface AnalysisPanelProps {
  sections: AnalysisSection[];
  currentStage: string;
  onToggleSection: (sectionId: string) => void;
  onDownload?: () => void;
}

// Removed styled-component definitions
// const Container = styled.div`...`;
// const Header = styled.div`...`;
// const Title = styled.h2`...`;
// const Subtitle = styled.p`...`;
// const SectionsContainer = styled.div`...`;
// const Section = styled.div`...`;
// const SectionHeader = styled.div`...`;
// const SectionTitle = styled.h3`...`;
// const SectionContent = styled.div`...`;
// const Content = styled.div`...`;
// const Footer = styled.div`...`;

// ChevronIcon component remains the same, using inline styles for transform
const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
  <svg 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className="transition-transform duration-300 ease-in-out" // Added Tailwind transition
    style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0)' }}
  >
    <path d="M7.41 8.59L12 13.17L16.59 8.59L18 10L12 16L6 10L7.41 8.59Z" fill="currentColor"/> {/* Use currentColor */}
  </svg>
);

// Helper function to get Tailwind classes based on section type
const getSectionTypeClasses = (type: string) => {
  switch(type) {
    case 'factors': return { bg: 'bg-darkBlue/20', text: 'text-darkBlue' };
    case 'causal': return { bg: 'bg-yellow/20', text: 'text-yellow' }; // Assuming yellow text is desired
    case 'diagnosis': return { bg: 'bg-alertAmber/20', text: 'text-alertAmber' };
    case 'treatment': return { bg: 'bg-successGreen/20', text: 'text-successGreen' };
    default: return { bg: 'bg-white', text: 'text-darkText' };
  }
};

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ 
  sections, 
  currentStage,
  onToggleSection,
  onDownload 
}) => {
  return (
    // Replaced Container with div and Tailwind classes
    <div className="flex flex-col h-full">
      {/* Replaced Header with div and Tailwind classes */}
      <div className="mb-6">
        {/* Replaced Title with h2 and Tailwind classes */}
        <h2 className="mb-2 text-darkText text-h2 font-primary font-bold">
          Analysis & Results
        </h2>
        {/* Replaced Subtitle with p and Tailwind classes */}
        <p className="text-neutralGray text-secondary mb-4">
          Current stage: {currentStage}
        </p>
      </div>
      
      {/* Replaced SectionsContainer with div and Tailwind classes */}
      <div className="overflow-y-auto flex-grow">
        {sections.map((section) => {
          const typeClasses = getSectionTypeClasses(section.type);
          const isExpanded = !!section.expanded;

          return (
            // Replaced Section with div and Tailwind classes
            <div 
              key={section.id} 
              className="mb-4 rounded-lg overflow-hidden border border-[#e0e0e0] bg-white shadow-small"
            >
              {/* Replaced SectionHeader with div and Tailwind classes */}
              <div 
                className={clsx(
                  "p-4 cursor-pointer flex justify-between items-center",
                  typeClasses.bg // Apply dynamic background
                )}
                onClick={() => onToggleSection(section.id)}
              >
                {/* Replaced SectionTitle with h3 and Tailwind classes */}
                <h3 className={clsx("m-0 text-base font-medium", typeClasses.text)}> {/* Apply dynamic text color */}
                  {section.title}
                </h3>
                <span className={typeClasses.text}> {/* Apply dynamic text color to icon */}
                  <ChevronIcon expanded={isExpanded} />
                </span>
              </div>
              {/* Replaced SectionContent with div and Tailwind classes */}
              {/* Use grid for smooth height transition */}
              <div 
                className={clsx(
                  "grid transition-all duration-300 ease-in-out",
                  isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                )}
              >
                <div className="overflow-hidden"> {/* Needed for grid transition */}
                  {/* Replaced Content with div and Tailwind classes */}
                  <div className="p-4 text-secondary whitespace-pre-wrap break-words">
                    {section.content}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div> {/* Corrected closing tag for SectionsContainer */}
      
      {onDownload && (
        // Replaced Footer with div and Tailwind classes
        <div className="mt-4 pt-4 border-t border-[#e0e0e0]">
          <Button 
            variant="secondary" 
            fullWidth 
            onClick={onDownload}
          >
            Download Report
          </Button>
        </div>
      )}
    </div> // Corrected closing tag for Container
  );
};

export default AnalysisPanel;
