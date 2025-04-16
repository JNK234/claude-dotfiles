import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { marked } from 'marked';

interface ReasoningPanelProps {
  currentStage: string;
  allStagesContent: Record<string, string>;
  caseId: string;
  caseStatus?: 'in_progress' | 'completed';
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
  display: flex;
  align-items: center;
`;

const StatusIndicator = styled.span<{ status: 'in_progress' | 'completed' }>`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-left: 8px;
  background-color: ${props => 
    props.status === 'completed' 
      ? props.theme.colors.successGreen 
      : props.theme.colors.deepMedicalBlue
  };
`;

const StageLabel = styled.span<{ isCompleted: boolean }>`
  color: ${props => props.isCompleted ? props.theme.colors.successGreen : 'inherit'};
  font-weight: ${props => props.isCompleted ? 'bold' : 'normal'};
`;

const ContentContainer = styled.div`
  overflow-y: auto;
  flex-grow: 1;
  padding: 1.5rem;
  background-color: white;
  border-radius: ${props => props.theme.layout.borderRadius};
  box-shadow: ${props => props.theme.shadows.small};
  
  /* Rich text content styling */
  .markdown-content {
    font-size: ${props => props.theme.typography.fontSizes.body};
    line-height: 1.6;
    color: ${props => props.theme.colors.darkText};
    
    /* Headings */
    h1, h2, h3, h4, h5, h6 {
      color: ${props => props.theme.colors.darkBlue};
      font-family: ${props => props.theme.typography.fontFamily.primary};
      font-weight: ${props => props.theme.typography.fontWeights.bold};
      margin: 1.5em 0 0.75em;
      line-height: 1.3;
    }
    
    h1 { font-size: 2em; }
    h2 { font-size: 1.75em; }
    h3 { font-size: 1.5em; }
    h4 { font-size: 1.25em; }
    h5 { font-size: 1.1em; }
    h6 { font-size: 1em; }
    
    /* First heading should not have top margin */
    h1:first-child,
    h2:first-child,
    h3:first-child,
    h4:first-child,
    h5:first-child,
    h6:first-child {
      margin-top: 0;
    }
    
    /* Paragraphs and Lists */
    p {
      margin: 0 0 1em;
    }
    
    ul, ol {
      margin: 0 0 1em;
      padding-left: 1.5em;
    }
    
    li {
      margin: 0.5em 0;
    }
    
    /* Tables */
    table {
      width: 100%;
      margin: 1em 0;
      border-collapse: collapse;
      background-color: white;
      font-size: ${props => props.theme.typography.fontSizes.body};
      border-radius: ${props => props.theme.layout.borderRadius};
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    th {
      background-color: ${props => props.theme.colors.rightPanelBg};
      color: ${props => props.theme.colors.darkBlue};
      font-weight: ${props => props.theme.typography.fontWeights.semibold};
      text-align: left;
      padding: 0.75rem 1rem;
      border: 1px solid ${props => props.theme.colors.borderColor};
      white-space: nowrap;
    }
    
    td {
      padding: 0.75rem 1rem;
      border: 1px solid ${props => props.theme.colors.borderColor};
      vertical-align: top;
    }
    
    tr:nth-child(even) {
      background-color: ${props => props.theme.colors.rightPanelBg}30;
    }
    
    tr:hover {
      background-color: ${props => props.theme.colors.rightPanelBg}50;
    }
    
    /* Code blocks */
    pre {
      background-color: ${props => props.theme.colors.rightPanelBg};
      padding: 1rem;
      border-radius: ${props => props.theme.layout.borderRadius};
      overflow-x: auto;
      margin: 1em 0;
    }
    
    code {
      font-family: monospace;
      font-size: 0.9em;
      padding: 0.2em 0.4em;
      background-color: ${props => props.theme.colors.rightPanelBg};
      border-radius: 3px;
    }
    
    /* Blockquotes */
    blockquote {
      border-left: 4px solid ${props => props.theme.colors.yellow};
      margin: 1em 0;
      padding: 0.5em 1em;
      background-color: ${props => props.theme.colors.rightPanelBg}30;
      
      p:last-child {
        margin-bottom: 0;
      }
    }
    
    /* Horizontal rule */
    hr {
      border: 0;
      border-top: 1px solid ${props => props.theme.colors.borderColor};
      margin: 2em 0;
    }
    
    /* Links */
    a {
      color: ${props => props.theme.colors.darkBlue};
      text-decoration: none;
      border-bottom: 1px solid ${props => props.theme.colors.yellow};
      transition: all ${props => props.theme.transitions.default};
      
      &:hover {
        color: ${props => props.theme.colors.yellow};
        border-bottom-color: transparent;
      }
    }
  }
`;

export const ReasoningPanel: React.FC<ReasoningPanelProps> = ({ 
  currentStage,
  allStagesContent,
  caseId,
  caseStatus = 'in_progress'
}) => {
  const stageName = currentStage.charAt(0).toUpperCase() + currentStage.slice(1).replace(/_/g, ' ');
  const isCompleted = caseStatus === 'completed';

  // Configure marked options
  useEffect(() => {
    marked.setOptions({
      gfm: true, // GitHub Flavored Markdown
      breaks: true, // Convert line breaks to <br>
      headerIds: true, // Add IDs to headers
      mangle: false, // Don't escape HTML
      sanitize: false, // Don't sanitize HTML
    });
  }, []);
  
  return (
    <Container>
      <Header>
        <Title>Analysis Results</Title>
        <Subtitle>
          Current stage: <StageLabel isCompleted={isCompleted}>{stageName}</StageLabel>
          <StatusIndicator status={caseStatus} />
          {isCompleted && ' (Completed)'}
        </Subtitle>
      </Header>
      
      <ContentContainer>
        {Object.entries(allStagesContent).some(([_, content]) => content) ? (
          Object.entries(allStagesContent)
            .filter(([_, content]) => content)
            .map(([stage, content], index, array) => {
              const formattedStage = stage.charAt(0).toUpperCase() + stage.slice(1).replace(/_/g, ' ');
              const htmlContent = marked(content);
              
              return (
                <div key={stage}>
                  <h2>{formattedStage}</h2>
                  <div 
                    className="markdown-content"
                    dangerouslySetInnerHTML={{ __html: htmlContent }} 
                  />
                  {index < array.length - 1 && <hr />}
                </div>
              );
            })
        ) : (
          <p>No analysis available yet. Submit a case to begin.</p>
        )}
      </ContentContainer>
    </Container>
  );
};

export default ReasoningPanel;