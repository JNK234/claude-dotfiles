import React, { useState } from 'react';
import styled from 'styled-components';
import Button from '../ui/Button';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const ChatInputContainer = styled.div`
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: ${props => props.theme.layout.borderRadius};
  border: 1px solid #e0e0e0;
  padding: 0.5rem;
  box-shadow: ${props => props.theme.shadows.small};
  margin-top: auto;
`;

const StyledTextArea = styled.textarea`
  width: 100%;
  min-height: 100px;
  resize: none;
  border: none;
  padding: 0.75rem;
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSizes.body};
  line-height: ${props => props.theme.typography.lineHeights.body};
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${props => props.theme.colors.deepMedicalBlue}20;
  }
  
  &:disabled {
    background-color: #f9f9f9;
    cursor: not-allowed;
  }
`;

const ActionBar = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 0.5rem;
`;

export const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  placeholder = 'Type your message here...', 
  disabled = false 
}) => {
  const [message, setMessage] = useState('');
  
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
    <ChatInputContainer>
      <StyledTextArea 
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
      />
      <ActionBar>
        <Button 
          onClick={handleSubmit} 
          disabled={!message.trim() || disabled}
        >
          Send
        </Button>
      </ActionBar>
    </ChatInputContainer>
  );
};

export default ChatInput;