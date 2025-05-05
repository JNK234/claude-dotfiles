import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Trash2, Edit3 } from 'lucide-react'; // Removed ChevronRight as it wasn't used
import clsx from 'clsx'; // Import clsx

// Removed styled-components import
// import styled from 'styled-components';

export interface Case {
  id: string;
  patientName: string;
  date: string;
  summary: string; // Keep summary in interface even if not displayed here
  status: 'completed' | 'in-progress' | 'new';
}

interface CaseListItemProps {
  caseData: Case;
  isSelected: boolean;
  onClick: () => void;
  onDelete: (caseId: string) => void;
  onRename?: (caseId: string, newName: string) => void;
}

// Removed styled-component definitions
// const ListItem = styled.div`...`;
// const ContentWrapper = styled.div`...`;
// const PatientName = styled.h3`...`;
// const DateText = styled.p`...`;
// const ActionButton = styled.button`...`;
// const MenuContainer = styled.div`...`;
// const MenuItem = styled.button`...`;
// const StatusIndicator = styled.div`...`;

export const CaseListItem: React.FC<CaseListItemProps> = ({
  caseData,
  isSelected,
  onClick,
  onDelete,
  onRename
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside (remains the same)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current && 
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Event handlers remain the same
  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this case? This action cannot be undone.')) {
      onDelete(caseData.id);
    }
    setIsMenuOpen(false);
  };

  const handleRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newName = window.prompt('Enter new name for the case:', caseData.patientName);
    if (newName && onRename) {
      onRename(caseData.id, newName);
    }
    setIsMenuOpen(false);
  };

  // Determine border color based on status and selection
  const getBorderColorClass = () => {
    if (isSelected) return 'border-deepMedicalBlue';
    if (caseData.status === 'completed') return 'border-successGreen';
    if (caseData.status === 'in-progress') return 'border-alertAmber';
    return 'border-transparent';
  };

  return (
    // Replaced ListItem with div and Tailwind classes
    <div 
      className={clsx(
        "flex justify-between items-center p-3 rounded mb-1 cursor-pointer transition-all duration-300 ease-in-out relative min-h-[48px]",
        "border-l-3", // Set left border width
        getBorderColorClass(), // Apply dynamic border color
        isSelected ? 'bg-deepMedicalBlue/20 shadow-inner' : 'hover:bg-deepMedicalBlue/5' // Enhanced conditional background and shadow
      )}
      onClick={onClick}
    >
      {/* Replaced ContentWrapper with div and Tailwind classes */}
      <div className="flex-grow mr-2 min-w-0"> 
        <div className="flex items-center">
          {/* Replaced StatusIndicator with div and Tailwind classes */}
          <div 
            className={clsx(
              "w-1.5 h-1.5 rounded-full mr-2 flex-shrink-0",
              {
                'bg-successGreen': caseData.status === 'completed',
                'bg-alertAmber': caseData.status === 'in-progress',
                'bg-neutralGray': caseData.status === 'new',
              }
            )}
          />
          {/* Replaced PatientName with h3 and Tailwind classes */}
          <h3 className="text-sm font-medium text-darkText whitespace-nowrap overflow-hidden text-ellipsis">
            {caseData.patientName}
          </h3>
        </div>
        {/* Replaced DateText with p and Tailwind classes */}
        <p className="text-xs text-neutralGray mt-0.5">
          {caseData.date}
        </p>
      </div>
      
      {/* Replaced ActionButton with button and Tailwind classes */}
      <button
        ref={buttonRef}
        onClick={handleMenuClick}
        title="More options"
        className="bg-none border-none p-1 cursor-pointer text-neutralGray rounded flex items-center justify-center transition-all duration-300 ease-in-out flex-shrink-0 hover:bg-rightPanelBg hover:text-darkBlue focus:outline-none focus:ring-2 focus:ring-yellow/40"
      >
        <MoreVertical size={16} />
      </button>

      {/* Replaced MenuContainer with div and Tailwind classes */}
      <div 
        ref={menuRef} 
        className={clsx(
          "absolute top-full right-0 bg-white rounded shadow-lg min-w-[160px] z-[1000] mt-1 border border-borderColor",
          isMenuOpen ? 'block' : 'hidden' // Toggle visibility
        )}
      >
        {/* Replaced MenuItem with button and Tailwind classes */}
        <button 
          onClick={handleRename}
          className="w-full px-3 py-2 border-none bg-none text-left cursor-pointer flex items-center gap-2 text-darkText text-sm transition-all duration-300 ease-in-out hover:bg-rightPanelBg"
        >
          <Edit3 size={14} />
          Rename
        </button>
        {/* Replaced MenuItem with button and Tailwind classes */}
        <button 
          onClick={handleDelete}
          className="w-full px-3 py-2 border-none bg-none text-left cursor-pointer flex items-center gap-2 text-errorRed text-sm transition-all duration-300 ease-in-out hover:bg-errorRed/10"
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>
    </div>
  );
};

export default CaseListItem;
