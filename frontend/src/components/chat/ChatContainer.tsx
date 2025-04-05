import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
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

const LoadingIndicator = styled.div`
  display: flex;
  align-items: center;
  padding: 0.5rem;
  margin-bottom: 1rem;
  font-size: ${props => props.theme.typography.fontSizes.small};
  color: ${props => props.theme.colors.neutralGray};
  
  .dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: ${props => props.theme.colors.deepMedicalBlue};
    margin-right: 4px;
    animation: pulse 1.5s infinite ease-in-out;
  }
  
  .dot:nth-child(2) {
    animation-delay: 0.2s;
  }
  
  .dot:nth-child(3) {
    animation-delay: 0.4s;
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 0.2;
      transform: scale(0.8);
    }
    50% {
      opacity: 1;
      transform: scale(1);
    }
  }
`;

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
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  return (
    <Container>
      <MessagesContainer>
        {messages.length === 0 ? (
          <NoMessagesPlaceholder>
            Start a conversation by typing a message below.
          </NoMessagesPlaceholder>
        ) : (
          messages.map((message, index) => (
            <ChatMessage key={index} message={message} />
          ))
        )}
        {isProcessing && (
          <LoadingIndicator>
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
            <span style={{ marginLeft: '8px' }}>Assistant is typing...</span>
          </LoadingIndicator>
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