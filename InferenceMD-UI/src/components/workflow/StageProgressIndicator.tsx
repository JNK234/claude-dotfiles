import React from 'react';
import styled from 'styled-components';

export interface Stage {
  id: string;
  name: string;
  status: 'completed' | 'active' | 'upcoming';
}

interface StageProgressIndicatorProps {
  stages: Stage[];
}

const ProgressContainer = styled.div`
  display: flex;
  width: 100%;
  margin: 2rem 0;
  position: relative;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
`;

const ProgressLine = styled.div`
  position: absolute;
  top: 12px; /* Aligned with center of dots */
  left: 0;
  right: 0;
  height: 2px;
  background-color: ${props => props.theme.colors.neutralGray};
  z-index: 1;
`;

const StageWrapper = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  position: relative;
`;

const StageNode = styled.div<{ status: 'completed' | 'active' | 'upcoming' }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 2;

  .node {
    width: ${props => props.status === 'active' ? '24px' : '20px'};
    height: ${props => props.status === 'active' ? '24px' : '20px'};
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: ${props => 
      props.status === 'completed' 
        ? props.theme.colors.successGreen 
        : props.status === 'active' 
          ? props.theme.colors.deepMedicalBlue 
          : props.theme.colors.neutralGray
    };
    color: white;
    margin-bottom: 12px;
    transition: all ${props => props.theme.transitions.default};
  }

  .label {
    font-size: ${props => 
      props.status === 'active' 
        ? props.theme.typography.fontSizes.body 
        : props.theme.typography.fontSizes.small
    };
    font-weight: ${props => 
      props.status === 'active' 
        ? props.theme.typography.fontWeights.medium 
        : props.theme.typography.fontWeights.regular
    };
    color: ${props => 
      props.status === 'active' 
        ? props.theme.colors.deepMedicalBlue 
        : props.theme.colors.darkText
    };
    text-align: center;
    width: 100px; /* Fixed width for consistent text alignment */
    position: absolute;
    top: 28px; /* Position text below the dots */
    left: 50%;
    transform: translateX(-50%);
  }
`;

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="white"/>
  </svg>
);

export const StageProgressIndicator: React.FC<StageProgressIndicatorProps> = ({ stages }) => {
  return (
    <ProgressContainer>
      <ProgressLine />
      {stages.map((stage) => (
        <StageWrapper key={stage.id}>
          <StageNode status={stage.status}>
            <div className="node">
              {stage.status === 'completed' ? <CheckIcon /> : null}
            </div>
            <div className="label">{stage.name}</div>
          </StageNode>
        </StageWrapper>
      ))}
    </ProgressContainer>
  );
};

export default StageProgressIndicator;
