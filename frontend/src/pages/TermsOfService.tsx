import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  color: #171848;
  margin-bottom: 0.5rem;
`;

const LastUpdated = styled.p`
  color: #64748b;
  font-size: 0.875rem;
`;

const Section = styled.section`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  color: #171848;
  font-size: 1.5rem;
  margin-bottom: 1rem;
`;

const Text = styled.p`
  color: #1f2937;
  line-height: 1.6;
  margin-bottom: 1rem;
`;

const List = styled.ul`
  list-style-type: disc;
  margin-left: 1.5rem;
  margin-bottom: 1rem;
`;

const ListItem = styled.li`
  color: #1f2937;
  line-height: 1.6;
  margin-bottom: 0.5rem;
`;

const BackButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 2rem;
  padding: 0.75rem 1.5rem;
  background-color: #171848;
  color: #ffffff !important;
  border-radius: 0.375rem;
  text-decoration: none;
  font-weight: 500;
  font-size: 1rem;
  min-width: 120px;
  height: 44px;
  transition: all 0.2s ease-in-out;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &:hover {
    background-color: #232661;
    color: #ffffff !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &:visited {
    color: #ffffff !important;
  }
`;

const TermsOfService: React.FC = () => {
  return (
    <Container>
      <Header>
        <Title>Medhastra Terms of Service</Title>
        <LastUpdated>Last Updated: April 17, 2025</LastUpdated>
      </Header>

      <Section>
        <SectionTitle>1. Acceptance of Terms</SectionTitle>
        <Text>
          By accessing or using Medhastra's services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing our services.
        </Text>
      </Section>

      <Section>
        <SectionTitle>2. Use License</SectionTitle>
        <Text>
          Permission is granted to temporarily access and use Medhastra's services for personal, non-commercial purposes. This license does not include:
        </Text>
        <List>
          <ListItem>Modifying or copying our materials</ListItem>
          <ListItem>Using materials for commercial purposes</ListItem>
          <ListItem>Attempting to decompile or reverse engineer any software</ListItem>
          <ListItem>Removing any copyright or proprietary notations</ListItem>
          <ListItem>Transferring the materials to another person</ListItem>
        </List>
      </Section>

      <Section>
        <SectionTitle>3. Healthcare Disclaimer</SectionTitle>
        <Text>
          Medhastra is a diagnostic support tool and does not replace professional medical judgment. Healthcare providers should use their clinical expertise alongside our services. We are not responsible for medical decisions made using our platform.
        </Text>
      </Section>

      <Section>
        <SectionTitle>4. User Obligations</SectionTitle>
        <Text>
          Users must:
        </Text>
        <List>
          <ListItem>Provide accurate information</ListItem>
          <ListItem>Maintain confidentiality of login credentials</ListItem>
          <ListItem>Comply with all applicable laws and regulations</ListItem>
          <ListItem>Report any security vulnerabilities</ListItem>
          <ListItem>Use the service responsibly</ListItem>
        </List>
      </Section>

      <BackButton to="/login">Back to Login</BackButton>
    </Container>
  );
};

export default TermsOfService;