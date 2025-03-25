import React from 'react';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';

interface ReasoningPanelProps {
  content: string;
  currentStage: string;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
`;

const Header = styled.div`
  margin-bottom: 1.5rem;
`;

const Title = styled.h2`
  margin-bottom: 0.5rem;
  color: ${props => props.theme.colors.darkText};
`;

const Subtitle = styled.p`
  color: ${props => props.theme.colors.neutralGray};
  margin-bottom: 1rem;
  font-size: ${props => props.theme.typography.fontSizes.secondary};
`;

const ContentContainer = styled.div`
  overflow-y: auto;
  flex-grow: 1;
  padding: 1rem;
  background-color: white;
  border-radius: ${props => props.theme.layout.borderRadius};
  box-shadow: ${props => props.theme.shadows.small};
  line-height: 1.6;
  font-size: ${props => props.theme.typography.fontSizes.body};
  
  /* Basic Markdown styling */
  h1, h2, h3, h4, h5, h6 {
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
    color: ${props => props.theme.colors.darkText};
  }
  
  h1 {
    font-size: 1.7rem;
  }
  
  h2 {
    font-size: 1.5rem;
  }
  
  h3 {
    font-size: 1.3rem;
  }
  
  p {
    margin-bottom: 1rem;
  }
  
  ul, ol {
    margin-bottom: 1rem;
    padding-left: 1.5rem;
  }
  
  li {
    margin-bottom: 0.5rem;
  }
  
  blockquote {
    border-left: 4px solid ${props => props.theme.colors.neutralGray};
    padding-left: 1rem;
    font-style: italic;
    margin: 1rem 0;
  }
  
  code {
    background-color: #f3f3f3;
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    font-family: monospace;
  }
  
  pre {
    background-color: #f3f3f3;
    padding: 1rem;
    border-radius: 5px;
    overflow-x: auto;
    margin-bottom: 1rem;
  }
  
  pre code {
    background-color: transparent;
    padding: 0;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1rem;
  }
  
  th, td {
    padding: 0.5rem;
    border: 1px solid #e0e0e0;
  }
  
  th {
    background-color: #f3f3f3;
    font-weight: bold;
  }
  
  hr {
    border: 0;
    border-top: 1px solid #e0e0e0;
    margin: 1.5rem 0;
  }
`;

export const ReasoningPanel: React.FC<ReasoningPanelProps> = ({ 
  content, 
  currentStage 
}) => {
  const stageName = currentStage.charAt(0).toUpperCase() + currentStage.slice(1).replace(/_/g, ' ');
  
  return (
    <Container>
      <Header>
        <Title>Reasoning</Title>
        <Subtitle>Current stage: {stageName}</Subtitle>
      </Header>
      
      <ContentContainer>
        {content ? (
          <ReactMarkdown>{content}</ReactMarkdown>
        ) : (
          <p>No analysis available yet. Submit a case to begin.</p>
        )}
      </ContentContainer>
    </Container>
  );
};

export default ReasoningPanel;
