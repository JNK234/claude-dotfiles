import React, { useEffect } from 'react';
import { marked } from 'marked';
import clsx from 'clsx'; // Import clsx

// Removed styled-components import
// import styled from 'styled-components';

interface ReasoningPanelProps {
  currentStage: string;
  allStagesContent: Record<string, string>;
  caseId: string;
  caseStatus?: 'in_progress' | 'completed';
}

// Removed styled-component definitions
// const Container = styled.div`...`;
// const Header = styled.div`...`;
// const Title = styled.h2`...`;
// const Subtitle = styled.p`...`;
// const StatusIndicator = styled.span`...`;
// const StageLabel = styled.span`...`;
// const ContentContainer = styled.div`...`;

export const ReasoningPanel: React.FC<ReasoningPanelProps> = ({ 
  currentStage,
  allStagesContent,
  caseId,
  caseStatus = 'in_progress'
}) => {
  const stageName = currentStage.charAt(0).toUpperCase() + currentStage.slice(1).replace(/_/g, ' ');
  const isCompleted = caseStatus === 'completed';

  // Configure marked options (can remain the same)
  useEffect(() => {
    marked.setOptions({
      gfm: true, 
      breaks: true, 
    });
  }, []);
  
  return (
    // Replaced Container with div and Tailwind classes
    <div className="flex flex-col h-full overflow-hidden">
      {/* Replaced Header with div and Tailwind classes */}
      <div className="mb-6"> 
        {/* Replaced Title with h2 and Tailwind classes */}
        <h2 className="mb-2 text-darkText text-h2 font-primary font-bold"> 
          Analysis Results
        </h2>
        {/* Replaced Subtitle with p and Tailwind classes */}
        <p className="text-neutralGray text-secondary flex items-center mb-4"> 
          Current stage: 
          {/* Display Stage Name */}
          <span className="ml-1 font-medium"> {/* Consistent medium weight for stage name */}
            {stageName}
          </span>
          {/* Display Status Text */}
          <span 
            className={clsx(
              "ml-1.5", // Added spacing
              {
                'text-successGreen font-bold': isCompleted, // Style completed status
                'text-deepMedicalBlue font-normal': !isCompleted // Style in-progress status
              }
            )}
          >
            ({isCompleted ? 'Completed' : 'In Progress'}) {/* Show status text */}
          </span>
        </p>
      </div>
      
      {/* Replaced ContentContainer with div and Tailwind classes */}
      <div className="overflow-y-auto flex-grow p-6 bg-white rounded-lg shadow-small">
        {Object.entries(allStagesContent).some(([_, content]) => content) ? (
          Object.entries(allStagesContent)
            .filter(([_, content]) => content)
            .map(([stage, content], index, array) => {
              const formattedStage = stage.charAt(0).toUpperCase() + stage.slice(1).replace(/_/g, ' ');
              const htmlContent = marked(content);
              
              return (
                <div key={stage}>
                  {/* Apply prose styles for Markdown content */}
                  {/* Customize prose colors to match theme */}
                  <article 
                    className={clsx(
                      "prose prose-base max-w-none", // Base prose styles
                      "prose-headings:font-primary prose-headings:font-bold prose-headings:text-darkBlue", // Heading styles
                      "prose-p:text-darkText", // Paragraph text color
                      "prose-strong:text-darkText", // Bold text color
                      "prose-ul:text-darkText prose-ol:text-darkText", // List text color
                      "prose-li:marker:text-darkBlue", // List marker color
                      "prose-a:text-darkBlue prose-a:border-b prose-a:border-yellow hover:prose-a:text-yellow hover:prose-a:border-transparent", // Link styles
                      "prose-blockquote:border-l-yellow prose-blockquote:bg-rightPanelBg/30 prose-blockquote:text-darkText", // Blockquote styles
                      "prose-code:bg-rightPanelBg prose-code:text-darkText prose-code:font-mono prose-code:text-sm prose-code:px-1 prose-code:py-0.5 prose-code:rounded", // Inline code
                      "prose-pre:bg-rightPanelBg prose-pre:text-darkText prose-pre:font-mono prose-pre:text-sm prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto", // Code blocks
                      "prose-hr:border-borderColor", // Horizontal rule
                      // Add table styles if needed, prose defaults might be okay
                      // "prose-table:..." 
                      // "prose-th:..."
                      // "prose-td:..."
                    )}
                    dangerouslySetInnerHTML={{ __html: htmlContent }} 
                  />
                  {index < array.length - 1 && <hr className="my-8 border-borderColor" />} 
                </div>
              );
            })
        ) : (
          <p className="text-neutralGray">No analysis available yet. Submit a case to begin.</p>
        )}
      </div>
    </div> // Replaced </Container> with </div>
  );
};

export default ReasoningPanel;
