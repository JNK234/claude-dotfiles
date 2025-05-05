import React from 'react';
import ReactMarkdown from 'react-markdown';
import clsx from 'clsx'; // Import clsx
import { useAuth } from '../../contexts/AuthContext'; // Import useAuth hook

// Removed styled-components import
// import styled from 'styled-components';

export interface MessageProps {
  content: string;
  sender: 'doctor' | 'assistant';
  timestamp: string;
}

interface ChatMessageProps {
  message: MessageProps;
}

// Removed styled-component definitions
// const MessageContainer = styled.div`...`;
// const MessageBubble = styled.div`...`;
// const MessageHeader = styled.div`...`;
// const SenderName = styled.span`...`;
// const Timestamp = styled.span`...`;
// const MessageContent = styled.div`...`;

// AIIcon component remains the same
const AIIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      fillRule="evenodd" 
      clipRule="evenodd" 
      d="M12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3ZM12 7C12.5523 7 13 7.44772 13 8V11H16C16.5523 11 17 11.4477 17 12C17 12.5523 16.5523 13 16 13H13V16C13 16.5523 12.5523 17 12 17C11.4477 17 11 16.5523 11 16V13H8C7.44772 13 7 12.5523 7 12C7 11.4477 7.44772 11 8 11H11V8C11 7.44772 11.4477 7 12 7Z"
      fill="#F49F0F" // Using theme.colors.yellow directly
    />
  </svg>
);

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const { content, sender, timestamp } = message;
  const { user } = useAuth(); // Get user from AuthContext
  
  const isDoctor = sender === 'doctor';

  // Determine the display name for the 'doctor' sender
  // Use the first name directly from the user object in context, default to 'Doctor'
  const doctorFirstName = user?.first_name ?? 'Doctor';

  return (
    // Replaced MessageContainer with div and Tailwind classes
    <div 
      className={clsx(
        "flex flex-col max-w-[80%] mb-6 mt-2",
        isDoctor ? "self-end" : "self-start"
      )}
    >
      {/* Replaced MessageHeader with div and Tailwind classes */}
      <div 
        className={clsx(
          "flex items-center mb-2",
          isDoctor ? "self-end" : "self-start"
        )}
      >
        {sender === 'assistant' && <AIIcon />}
        {/* Replaced SenderName with span and Tailwind classes */}
        {/* Display user's first name if sender is 'doctor', otherwise 'Assistant' */}
        <span className="font-medium mr-2 ml-1"> 
          {isDoctor ? doctorFirstName : 'Assistant'}
        </span>
        {/* Replaced Timestamp with span and Tailwind classes */}
        <span className="text-sm text-neutralGray"> 
          {timestamp}
        </span>
      </div>
      {/* Replaced MessageBubble with div and Tailwind classes */}
      {/* Note: Bubble arrow pseudo-element is complex with Tailwind, omitted for simplicity */}
      {/* Consider using a library or more complex CSS if arrow is essential */}
      <div 
        className={clsx(
          "p-4 rounded-lg shadow-small relative",
          isDoctor 
            ? "bg-doctorMessageBg border border-doctorMessageBorder" 
            : "bg-aiMessageBg border-none"
        )}
      >
        {/* Replaced MessageContent with div and applied prose styles */}
        <div 
          className={clsx(
            "text-base leading-body break-words",
            "prose prose-sm max-w-none", // Base prose styles
             // Customize prose colors to match theme (similar to ReasoningPanel)
            "prose-headings:font-primary prose-headings:font-bold prose-headings:text-darkBlue", 
            "prose-p:text-darkText", 
            "prose-strong:text-darkText", 
            "prose-ul:text-darkText prose-ol:text-darkText", 
            "prose-li:marker:text-darkBlue", 
            "prose-a:text-darkBlue prose-a:border-b prose-a:border-yellow hover:prose-a:text-yellow hover:prose-a:border-transparent", 
            "prose-blockquote:border-l-yellow prose-blockquote:bg-rightPanelBg/30 prose-blockquote:text-darkText", 
            "prose-code:bg-rightPanelBg prose-code:text-darkText prose-code:font-mono prose-code:text-sm prose-code:px-1 prose-code:py-0.5 prose-code:rounded", 
            "prose-pre:bg-rightPanelBg prose-pre:text-darkText prose-pre:font-mono prose-pre:text-sm prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto", 
            "prose-hr:border-borderColor", 
          )}
        >
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
