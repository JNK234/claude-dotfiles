import React from 'react';
import clsx from 'clsx'; // Import clsx

// Removed styled-components import
// import styled from 'styled-components';

export interface Stage {
  id: string;
  name: string;
  status: 'completed' | 'active' | 'upcoming';
}

interface StageProgressIndicatorProps {
  stages: Stage[];
}

// Removed styled-component definitions
// const ProgressContainer = styled.div`...`;
// const ProgressLine = styled.div`...`;
// const StageWrapper = styled.div`...`;
// const StageNode = styled.div`...`;

// CheckIcon component remains the same
const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="white"/>
  </svg>
);

export const StageProgressIndicator: React.FC<StageProgressIndicatorProps> = ({ stages }) => {
  return (
    // Replaced ProgressContainer with div and Tailwind classes
    <div className="flex w-full my-8 relative max-w-xl mx-auto"> {/* Adjusted max-width */}
      {/* Replaced ProgressLine with div and Tailwind classes */}
      <div className="absolute top-[12px] left-0 right-0 h-0.5 bg-neutralGray z-[1]"></div>
      
      {stages.map((stage) => (
        // Replaced StageWrapper with div and Tailwind classes
        <div key={stage.id} className="flex-1 flex justify-center relative">
          {/* Replaced StageNode with div and Tailwind classes */}
          <div className="flex flex-col items-center z-[2]">
            {/* Node circle */}
            <div 
              className={clsx(
                "rounded-full flex items-center justify-center text-white mb-3 transition-all duration-300 ease-in-out",
                {
                  'w-5 h-5': stage.status !== 'active',
                  'w-6 h-6': stage.status === 'active', // Larger for active stage
                  'bg-successGreen': stage.status === 'completed',
                  'bg-darkBlue': stage.status === 'active',
                  'bg-neutralGray': stage.status === 'upcoming',
                }
              )}
            >
              {stage.status === 'completed' ? <CheckIcon /> : null}
            </div>
            {/* Label */}
            <div 
              className={clsx(
                "text-center w-24 absolute top-7 left-1/2 -translate-x-1/2", // Position label below dot
                {
                  'text-sm font-regular text-darkText': stage.status !== 'active',
                  'text-base font-medium text-darkBlue': stage.status === 'active',
                }
              )}
            >
              {stage.name}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StageProgressIndicator;
