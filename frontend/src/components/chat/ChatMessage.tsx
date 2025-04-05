import React from 'react';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';

export interface MessageProps {
  content: string;
  sender: 'doctor' | 'assistant';
  timestamp: string;
}

interface ChatMessageProps {
  message: MessageProps;
}

const MessageContainer = styled.div<{ sender: 'doctor' | 'assistant' }>`
  display: flex;
  flex-direction: column;
  max-width: 80%;
  margin-bottom: 1.5rem;
  margin-top: 0.5rem;
  align-self: ${props => props.sender === 'doctor' ? 'flex-end' : 'flex-start'};
`;

const MessageBubble = styled.div<{ sender: 'doctor' | 'assistant' }>`
  padding: 1rem;
  border-radius: ${props => props.theme.layout.borderRadius};
  background-color: ${props => 
    props.sender === 'doctor' 
      ? props.theme.colors.doctorMessageBg 
      : props.theme.colors.aiMessageBg
  };
  border: ${props => 
    props.sender === 'doctor' 
      ? `1px solid ${props.theme.colors.doctorMessageBorder}` 
      : 'none'
  };
  box-shadow: ${props => props.theme.shadows.small};
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    width: 10px;
    height: 10px;
    transform: rotate(45deg);
    
    ${props => props.sender === 'doctor' ? `
      right: -5px;
      top: 15px;
      background-color: ${props.theme.colors.doctorMessageBg};
      border-right: 1px solid ${props.theme.colors.doctorMessageBorder};
      border-top: 1px solid ${props.theme.colors.doctorMessageBorder};
    ` : `
      left: -5px;
      top: 15px;
      background-color: ${props.theme.colors.aiMessageBg};
    `}
  }
`;

const MessageHeader = styled.div<{ sender: 'doctor' | 'assistant' }>`
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  align-self: ${props => props.sender === 'doctor' ? 'flex-end' : 'flex-start'};
`;

const SenderName = styled.span`
  font-weight: ${props => props.theme.typography.fontWeights.medium};
  margin-right: 0.5rem;
`;

const Timestamp = styled.span`
  font-size: ${props => props.theme.typography.fontSizes.small};
  color: ${props => props.theme.colors.neutralGray};
`;

const MessageContent = styled.div`
  font-size: ${props => props.theme.typography.fontSizes.body};
  line-height: ${props => props.theme.typography.lineHeights.body};
  word-break: break-word;
  
  /* Improved markdown formatting */
  & > *:first-child {
    margin-top: 0;
  }
  
  & > *:last-child {
    margin-bottom: 0;
  }

  /* Better spacing for markdown elements */
  p {
    margin: 0.75rem 0;
  }

  h1, h2, h3, h4, h5, h6 {
    margin: 1.25rem 0 0.75rem;
  }

  ul, ol {
    margin: 0.75rem 0;
    padding-left: 1.5rem;
  }

  li {
    margin: 0.5rem 0;
  }

  pre {
    margin: 1rem 0;
    padding: 1rem;
    background: #f5f5f5;
    border-radius: 4px;
    overflow-x: auto;
  }

  code {
    font-family: monospace;
    background: #f5f5f5;
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
  }

  blockquote {
    margin: 1rem 0;
    padding: 0.5rem 1rem;
    border-left: 3px solid #ddd;
    background: #f9f9f9;
  }

  table {
    margin: 1rem 0;
    border-collapse: collapse;
    width: 100%;
  }

  th, td {
    padding: 0.5rem;
    border: 1px solid #ddd;
  }
`;

const AIIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      fillRule="evenodd" 
      clipRule="evenodd" 
      d="M12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3ZM12 7C12.5523 7 13 7.44772 13 8V11H16C16.5523 11 17 11.4477 17 12C17 12.5523 16.5523 13 16 13H13V16C13 16.5523 12.5523 17 12 17C11.4477 17 11 16.5523 11 16V13H8C7.44772 13 7 12.5523 7 12C7 11.4477 7.44772 11 8 11H11V8C11 7.44772 11.4477 7 12 7Z"
      fill="#2964AB"
    />
  </svg>
);

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const { content, sender, timestamp } = message;
  
  return (
    <MessageContainer sender={sender}>
      <MessageHeader sender={sender}>
        {sender === 'assistant' && <AIIcon />}
        <SenderName>{sender === 'doctor' ? 'Doctor' : 'Assistant'}</SenderName>
        <Timestamp>{timestamp}</Timestamp>
      </MessageHeader>
      <MessageBubble sender={sender}>
        <MessageContent>
          <ReactMarkdown>{content}</ReactMarkdown>
        </MessageContent>
      </MessageBubble>
    </MessageContainer>
  );
};

export default ChatMessage;
