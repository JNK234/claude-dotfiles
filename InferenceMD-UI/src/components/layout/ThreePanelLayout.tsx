import React, { ReactNode, useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

interface ThreePanelLayoutProps {
  leftPanel: ReactNode;
  centerPanel: ReactNode;
  rightPanel: ReactNode;
}

const LayoutContainer = styled.div`
  display: flex;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  position: relative;
`;

interface PanelProps {
  isVisible: boolean;
}

const LeftPanel = styled.div<PanelProps>`
  width: ${props => props.isVisible ? props.theme.layout.leftPanelWidth : '0'};
  max-width: ${props => props.theme.layout.leftPanelWidth};
  background-color: ${props => props.theme.colors.leftPanelBg};
  overflow-y: auto;
  padding: ${props => props.isVisible ? '1.5rem' : '0'};
  border-right: 1px solid ${props => props.theme.colors.borderColor}; // Use theme border color
  transition: width 0.3s ease, padding 0.3s ease;
  overflow-x: hidden;
  box-shadow: ${props => props.theme.shadows.medium}; // Add shadow for depth
  z-index: 1; // Ensure shadow renders correctly
`;

const CenterPanel = styled.div`
  flex: 1;
  background-color: ${props => props.theme.colors.hospitalWhite};
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  position: relative;
`;

interface RightPanelProps extends PanelProps {
  width: string;
}

const RightPanel = styled.div<RightPanelProps>`
  width: ${props => props.isVisible ? props.width : '0'};
  background-color: ${props => props.theme.colors.rightPanelBg};
  overflow-y: auto;
  padding: ${props => props.isVisible ? '1.5rem' : '0'};
  border-left: 1px solid ${props => props.theme.colors.borderColor}; // Use theme border color
  transition: width 0.3s ease, padding 0.3s ease;
  position: relative;
  overflow-x: hidden;
  box-shadow: ${props => props.theme.shadows.medium}; // Add shadow for depth
  z-index: 1; // Ensure shadow renders correctly
`;

const ResizeHandle = styled.div`
  position: absolute;
  top: 0;
  left: -5px;
  width: 10px;
  height: 100%;
  cursor: col-resize;
  z-index: 10;
  
  &:hover, &:active {
    background-color: rgba(0, 0, 0, 0.05);
  }
`;

const ToggleButton = styled.button<{ isPanelVisible: boolean }>`
  position: fixed;
  width: 24px;
  height: 60px;
  background-color: ${props => props.theme.colors.deepMedicalBlue};
  color: white;
  border: none;
  border-radius: 0 ${props => props.theme.layout.borderRadius} ${props => props.theme.layout.borderRadius} 0; // Use theme border radius
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 100;
  top: 50%;
  transform: translateY(-50%);
  left: ${props => props.isPanelVisible ? props.theme.layout.leftPanelWidth : '0'};
  transition: left 0.3s ease, background-color ${props => props.theme.transitions.default};
  
  &:hover {
    background-color: ${props => props.theme.colors.calmTeal}; // Use theme color for hover
  }
  
  &:focus {
    outline: none;
  }
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

export const ThreePanelLayout: React.FC<ThreePanelLayoutProps> = ({
  leftPanel,
  centerPanel,
  rightPanel,
}) => {
  // Panel visibility state
  const [leftPanelVisible, setLeftPanelVisible] = useState(true);
  
  // Right panel width state (default width but can be changed by user)
  const [rightPanelWidth, setRightPanelWidth] = useState('30%');
  
  // Refs for resize functionality
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const resizeStartX = useRef<number | null>(null);
  const startWidth = useRef<number | null>(null);

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent) => {
    resizeStartX.current = e.clientX;
    startWidth.current = rightPanelRef.current?.offsetWidth || 0;
    
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };
  
  // Handle resize move
  const handleResizeMove = (e: MouseEvent) => {
    if (resizeStartX.current === null || startWidth.current === null) return;
    
    const delta = resizeStartX.current - e.clientX;
    
    // Calculate window width and 50% limit
    const windowWidth = window.innerWidth;
    const maxWidth = windowWidth * 0.5; // 50% of screen width
    
    const newWidth = Math.max(200, Math.min(maxWidth, startWidth.current + delta));
    
    setRightPanelWidth(`${newWidth}px`);
  };
  
  // Handle resize end
  const handleResizeEnd = () => {
    resizeStartX.current = null;
    startWidth.current = null;
    
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  };
  
  // Clean up event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, []);
  
  // Toggle button icon
  const ToggleIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d={leftPanelVisible ? "M15 19l-7-7 7-7" : "M9 19l7-7-7-7"} stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  return (
    <LayoutContainer>
      <LeftPanel isVisible={leftPanelVisible}>
        {leftPanel}
      </LeftPanel>
      
      <ToggleButton 
        isPanelVisible={leftPanelVisible}
        onClick={() => setLeftPanelVisible(!leftPanelVisible)}
        title={leftPanelVisible ? "Hide case history" : "Show case history"}
      >
        <ToggleIcon />
      </ToggleButton>
      
      <CenterPanel>
        {centerPanel}
      </CenterPanel>
      
      <RightPanel 
        isVisible={true}
        width={rightPanelWidth}
        ref={rightPanelRef}
      >
        <ResizeHandle onMouseDown={handleResizeStart} />
        {rightPanel}
      </RightPanel>
    </LayoutContainer>
  );
};

export default ThreePanelLayout;
