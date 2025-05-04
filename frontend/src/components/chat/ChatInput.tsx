import React, { useState } from 'react';
import Button from '../ui/Button'; // Uses refactored Tailwind Button
import clsx from 'clsx'; // Import clsx

// Removed styled-components import
// import styled from 'styled-components';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

// Removed styled-component definitions
// const ChatInputContainer = styled.div`...`;
// const StyledTextArea = styled.textarea`...`;
// const ActionBar = styled.div`...`;

export const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  placeholder = 'Type your message here...', 
  disabled = false 
}) => {
  const [message, setMessage] = useState('');
  
  // Handler functions remain the same
  const handleSubmit = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  return (
    // Replaced ChatInputContainer with div and Tailwind classes
    <div className="flex flex-col bg-white rounded-lg border border-[#e0e0e0] p-2 shadow-small mt-auto">
      {/* Replaced StyledTextArea with textarea and Tailwind classes */}
      <textarea 
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={clsx(
          "w-full min-h-[100px] resize-none border-none p-3 font-body text-base leading-body",
          "focus:outline-none focus:ring-2 focus:ring-deepMedicalBlue/20", // Adjusted focus style
          "disabled:bg-gray-100 disabled:cursor-not-allowed" // Adjusted disabled style
        )}
      />
      {/* Replaced ActionBar with div and Tailwind classes */}
      <div className="flex justify-end p-2">
        {/* Using the refactored Button component */}
        <Button 
          onClick={handleSubmit} 
          disabled={!message.trim() || disabled}
          className="!py-2 !px-4 !text-sm" // Make send button slightly smaller
        >
          Send
        </Button>
      </div>
    </div>
  );
};

export default ChatInput;
