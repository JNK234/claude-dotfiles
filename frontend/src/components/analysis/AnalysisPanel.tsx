import React from 'react';
import styled from 'styled-components';
import Button from '../ui/Button';

interface AnalysisSection {
  id: string;
  title: string;
  content: string;
  type: 'factors' | 'causal' | 'diagnosis' | 'treatment';
  expanded?: boolean;
}

interface AnalysisPanelProps {
  sections: AnalysisSection[];
  currentStage: string;
  onToggleSection: (sectionId: string) => void;
  onDownload?: () => void;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
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

const SectionsContainer = styled.div`
  overflow-y: auto;
  flex-grow: 1;
`;

const Section = styled.div<{ expanded: boolean, type: string }>`
  margin-bottom: 1rem;
  border-radius: ${props => props.theme.layout.borderRadius};
  overflow: hidden;
  border: 1px solid #e0e0e0;
  background-color: white;
  box-shadow: ${props => props.theme.shadows.small};
`;

const SectionHeader = styled.div<{ type: string }>`
  padding: 1rem;
  background-color: ${props => {
    switch(props.type) {
      case 'factors': return props.theme.colors.darkBlue + '20';
      case 'causal': return props.theme.colors.yellow + '20';
      case 'diagnosis': return props.theme.colors.alertAmber + '20';
      case 'treatment': return props.theme.colors.successGreen + '20';
      default: return 'white';
    }
  }};
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SectionTitle = styled.h3<{ type: string }>`
  margin: 0;
  font-size: ${props => props.theme.typography.fontSizes.body};
  color: ${props => {
    switch(props.type) {
      case 'factors': return props.theme.colors.darkBlue;
      case 'causal': return props.theme.colors.yellow;
      case 'diagnosis': return props.theme.colors.alertAmber;
      case 'treatment': return props.theme.colors.successGreen;
      default: return props.theme.colors.darkText;
    }
  }};
`;

const SectionContent = styled.div<{ expanded: boolean }>`
  padding: ${props => props.expanded ? '1rem' : '0'};
  max-height: ${props => props.expanded ? '500px' : '0'};
  overflow: hidden;
  transition: all ${props => props.theme.transitions.default};
`;

const Content = styled.div`
  font-size: ${props => props.theme.typography.fontSizes.secondary};
  white-space: pre-wrap;
  word-break: break-word;
`;

const Footer = styled.div`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
`;

const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
  <svg 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0)', transition: '0.3s ease' }}
  >
    <path d="M7.41 8.59L12 13.17L16.59 8.59L18 10L12 16L6 10L7.41 8.59Z" fill="currentColor"/>
  </svg>
);

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ 
  sections, 
  currentStage,
  onToggleSection,
  onDownload 
}) => {
  return (
    <Container>
      <Header>
        <Title>Analysis & Results</Title>
        <Subtitle>Current stage: {currentStage}</Subtitle>
      </Header>
      
      <SectionsContainer>
        {sections.map((section) => (
          <Section key={section.id} expanded={!!section.expanded} type={section.type}>
            <SectionHeader 
              type={section.type} 
              onClick={() => onToggleSection(section.id)}
            >
              <SectionTitle type={section.type}>{section.title}</SectionTitle>
              <ChevronIcon expanded={!!section.expanded} />
            </SectionHeader>
            <SectionContent expanded={!!section.expanded}>
              <Content>{section.content}</Content>
            </SectionContent>
          </Section>
        ))}
      </SectionsContainer>
      
      {onDownload && (
        <Footer>
          <Button 
            variant="secondary" 
            fullWidth 
            onClick={onDownload}
          >
            Download Report
          </Button>
        </Footer>
      )}
    </Container>
  );
};

export default AnalysisPanel;