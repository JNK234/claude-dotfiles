import React, { useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import ChatMessage, { MessageProps } from './ChatMessage';
import ChatInput from './ChatInput';

interface ChatContainerProps {
  messages: MessageProps[];
  onSendMessage: (message: string) => void;
  isProcessing?: boolean;
  disabled?: boolean;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
`;

const MessagesContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 1rem;
  overflow-y: auto;
  flex-grow: 1;
  gap: 1rem;
`;

const pulseAnimation = keyframes`
  0%, 100% { transform: scale(0.8); opacity: 0.5; }
  50% { transform: scale(1.2); opacity: 1; }
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: ${props => props.theme.colors.aiMessageBg};
  border-radius: ${props => props.theme.layout.borderRadius};
  margin-bottom: 1rem;
  max-width: 80%;
  align-self: flex-start;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    left: -5px;
    top: 15px;
    background-color: ${props => props.theme.colors.aiMessageBg};
    width: 10px;
    height: 10px;
    transform: rotate(45deg);
  }
`;

const LoadingDot = styled.div`
  width: 8px;
  height: 8px;
  background-color: ${props => props.theme.colors.darkBlue};
  border-radius: 50%;
  animation: ${pulseAnimation} 1.4s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite;

  &:nth-child(2) {
    animation-delay: 0.2s;
  }

  &:nth-child(3) {
    animation-delay: 0.4s;
  }
`;

const AssistantIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      fillRule="evenodd" 
      clipRule="evenodd" 
      d="M12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3ZM12 7C12.5523 7 13 7.44772 13 8V11H16C16.5523 11 17 11.4477 17 12C17 12.5523 16.5523 13 16 13H13V16C13 16.5523 12.5523 17 12 17C11.4477 17 11 16.5523 11 16V13H8C7.44772 13 7 12.5523 7 12C7 11.4477 7.44772 11 8 11H11V8C11 7.44772 11.4477 7 12 7Z"
      fill="#F49F0F"
    />
  </svg>
);

const LoadingIndicator = () => (
  <LoadingContainer>
    <AssistantIcon />
    <LoadingDot />
    <LoadingDot />
    <LoadingDot />
  </LoadingContainer>
);

const NoMessagesPlaceholder = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: ${props => props.theme.colors.neutralGray};
  text-align: center;
  padding: 2rem;
`;

export const ChatContainer: React.FC<ChatContainerProps> = ({ 
  messages, 
  onSendMessage, 
  isProcessing = false,
  disabled = false
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);
  
  return (
    <Container>
      <MessagesContainer>
        {messages.length === 0 ? (
          <NoMessagesPlaceholder>
            Start a conversation by typing a message below.
          </NoMessagesPlaceholder>
        ) : (
          <>
            {messages.map((message, index) => (
              <ChatMessage key={index} message={message} />
            ))}
            {isProcessing && <LoadingIndicator />}
          </>
        )}
        <div ref={messagesEndRef} />
      </MessagesContainer>
      <ChatInput 
        onSendMessage={onSendMessage} 
        disabled={disabled || isProcessing}
        placeholder={
          isProcessing 
            ? "Please wait while the assistant is responding..." 
            : "Type your message here..."
        }
      />
    </Container>
  );
};

export default ChatContainer;