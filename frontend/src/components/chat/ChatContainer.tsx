import React, { useEffect, useRef } from 'react';
import ChatMessage, { MessageProps } from './ChatMessage'; // Refactored
import ChatInput from './ChatInput'; // Refactored
import clsx from 'clsx'; // Import clsx

// Removed styled-components import
// import styled, { keyframes } from 'styled-components';

interface ChatContainerProps {
  messages: MessageProps[];
  onSendMessage: (message: string) => void;
  isProcessing?: boolean;
  disabled?: boolean;
}

// Removed styled-component definitions and keyframes
// const Container = styled.div`...`;
// const MessagesContainer = styled.div`...`;
// const pulseAnimation = keyframes`...`;
// const LoadingContainer = styled.div`...`;
// const LoadingDot = styled.div`...`;
// const NoMessagesPlaceholder = styled.div`...`;

// AssistantIcon component remains the same
const AssistantIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      fillRule="evenodd" 
      clipRule="evenodd" 
      d="M12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3ZM12 7C12.5523 7 13 7.44772 13 8V11H16C16.5523 11 17 11.4477 17 12C17 12.5523 16.5523 13 16 13H13V16C13 16.5523 12.5523 17 12 17C11.4477 17 11 16.5523 11 16V13H8C7.44772 13 7 12.5523 7 12C7 11.4477 7.44772 11 8 11H11V8C11 7.44772 11.4477 7 12 7Z"
      fill="#F49F0F" // Using theme.colors.yellow directly
    />
  </svg>
);

// LoadingIndicator component refactored with Tailwind
const LoadingIndicator = () => (
  // Replaced LoadingContainer with div and Tailwind classes
  // Note: Bubble arrow pseudo-element omitted for simplicity
  <div className="flex items-center gap-4 p-4 bg-aiMessageBg rounded-lg mb-4 max-w-[80%] self-start relative shadow-small">
    <AssistantIcon />
    {/* Replaced LoadingDot with divs and Tailwind classes */}
    {/* Define pulse animation in tailwind.config.js or global CSS if needed */}
    <div className="w-2 h-2 bg-darkBlue rounded-full animate-pulse delay-0"></div>
    <div className="w-2 h-2 bg-darkBlue rounded-full animate-pulse delay-200"></div>
    <div className="w-2 h-2 bg-darkBlue rounded-full animate-pulse delay-400"></div>
  </div>
);

export const ChatContainer: React.FC<ChatContainerProps> = ({ 
  messages, 
  onSendMessage, 
  isProcessing = false,
  disabled = false
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // scrollToBottom function remains the same
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);
  
  return (
    // Replaced Container with div and Tailwind classes
    <div className="flex flex-col h-full w-full">
      {/* Replaced MessagesContainer with div and Tailwind classes */}
      <div className="flex flex-col p-4 overflow-y-auto flex-grow gap-4">
        {messages.length === 0 && !isProcessing ? (
          // Replaced NoMessagesPlaceholder with div and Tailwind classes
          <div className="flex justify-center items-center h-full text-neutralGray text-center p-8">
            Start a conversation by typing a message below.
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <ChatMessage key={index} message={message} /> // Uses refactored ChatMessage
            ))}
            {isProcessing && <LoadingIndicator />}
          </>
        )}
        <div ref={messagesEndRef} /> {/* Scroll target */}
      </div>
      <ChatInput // Uses refactored ChatInput
        onSendMessage={onSendMessage} 
        disabled={disabled || isProcessing}
        placeholder={
          isProcessing 
            ? "Please wait while the assistant is responding..." 
            : "Type your message here..."
        }
      />
    </div>
  );
};

export default ChatContainer;
