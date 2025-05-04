import React, { ReactNode, useState, useRef, useEffect } from 'react';
import clsx from 'clsx'; // Import clsx for conditional classes

// Removed styled-components import
// import styled from 'styled-components'; 

interface ThreePanelLayoutProps {
  leftPanel: ReactNode;
  centerPanel: ReactNode;
  rightPanel: ReactNode;
}

// Removed styled-component definitions
// const LayoutContainer = styled.div`...`;
// const LeftPanel = styled.div<PanelProps>`...`;
// const CenterPanel = styled.div`...`;
// const RightPanel = styled.div<RightPanelProps>`...`;
// const ResizeHandle = styled.div`...`;
// const ToggleButton = styled.button<{ isPanelVisible: boolean }>`...`;
// const PanelHeader = styled.div`...`; // This wasn't used, can be ignored

// Define fixed left panel width based on previous theme value
const LEFT_PANEL_WIDTH_PX = 250; 

export const ThreePanelLayout: React.FC<ThreePanelLayoutProps> = ({
  leftPanel,
  centerPanel,
  rightPanel,
}) => {
  // Panel visibility state
  const [leftPanelVisible, setLeftPanelVisible] = useState(true);
  
  // Right panel width state (default width but can be changed by user)
  // Initialize with a percentage or pixel value suitable for Tailwind/inline style
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
    
    // Ensure minimum width (e.g., 200px) and maximum width
    const newWidth = Math.max(200, Math.min(maxWidth, startWidth.current + delta));
    
    setRightPanelWidth(`${newWidth}px`); // Set width in pixels for inline style
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
  
  // Toggle button icon component remains the same
  const ToggleIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d={leftPanelVisible ? "M15 19l-7-7 7-7" : "M9 19l7-7-7-7"} stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  return (
    // Replaced LayoutContainer with div and Tailwind classes
    <div className="flex h-screen w-full overflow-hidden relative">
      {/* Replaced LeftPanel with div and Tailwind classes */}
      <div 
        className={clsx(
          "bg-leftPanelBg overflow-y-auto overflow-x-hidden border-r border-borderColor shadow-medium z-[1] transition-all duration-300 ease-in-out",
          leftPanelVisible ? `w-[${LEFT_PANEL_WIDTH_PX}px] p-6` : "w-0 p-0 border-r-0" // Use fixed width and conditional padding/border
        )}
        style={{ width: leftPanelVisible ? `${LEFT_PANEL_WIDTH_PX}px` : '0px' }} // Explicit width for transition
      >
        {leftPanel}
      </div>
      
      {/* Replaced ToggleButton with button and Tailwind classes */}
      <button 
        className={clsx(
          "fixed w-6 h-[60px] bg-darkBlue text-white border-none rounded-r-lg flex items-center justify-center cursor-pointer z-50 top-1/2 -translate-y-1/2 transition-all duration-300 ease-in-out hover:bg-yellow focus:outline-none",
          leftPanelVisible ? `left-[${LEFT_PANEL_WIDTH_PX}px]` : "left-0" // Dynamic left position
        )}
        style={{ left: leftPanelVisible ? `${LEFT_PANEL_WIDTH_PX}px` : '0px' }} // Explicit left for transition
        onClick={() => setLeftPanelVisible(!leftPanelVisible)}
        title={leftPanelVisible ? "Hide case history" : "Show case history"}
      >
        <ToggleIcon />
      </button>
      
      {/* Replaced CenterPanel with div and Tailwind classes */}
      <div className="flex-1 bg-white overflow-y-auto p-6 flex flex-col relative">
        {centerPanel}
      </div>
      
      {/* Replaced RightPanel with div and Tailwind classes/inline style */}
      <div 
        className="bg-rightPanelBg overflow-y-auto border-l border-borderColor shadow-medium z-[1] relative overflow-x-hidden p-6 transition-all duration-300 ease-in-out" // Added padding back
        style={{ width: rightPanelWidth }} // Apply dynamic width via inline style
        ref={rightPanelRef}
      >
        {/* Replaced ResizeHandle with div and Tailwind classes */}
        <div 
          className="absolute top-0 left-[-5px] w-[10px] h-full cursor-col-resize z-10 hover:bg-black/5 active:bg-black/5"
          onMouseDown={handleResizeStart} 
        />
        {rightPanel}
      </div>
    </div>
  );
};

export default ThreePanelLayout;
