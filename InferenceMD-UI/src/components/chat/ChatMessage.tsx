import React from 'react';
import styled from 'styled-components';

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
  margin-bottom: 1rem;
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
  white-space: pre-wrap;
  word-break: break-word;
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
        <MessageContent>{content}</MessageContent>
      </MessageBubble>
    </MessageContainer>
  );
};

export default ChatMessage;