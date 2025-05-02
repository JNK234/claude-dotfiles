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

const PrivacyPolicy: React.FC = () => {
  return (
    <Container>
      <Header>
        <Title>Medhastra Privacy Policy</Title>
        <LastUpdated>Last Updated: April 17, 2025</LastUpdated>
      </Header>

      <Section>
        <SectionTitle>1. Introduction</SectionTitle>
        <Text>
          Medhastra ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or request a product demo.
        </Text>
        <Text>
          We understand the sensitive nature of healthcare information and are committed to maintaining the confidentiality, integrity, and security of any personal information and protected health information collected.
        </Text>
        <Text>
          PLEASE READ THIS PRIVACY POLICY CAREFULLY. By accessing or using our services, you acknowledge that you have read, understood, and agree to be bound by all terms of this Privacy Policy.
        </Text>
      </Section>

      <Section>
        <SectionTitle>2. Information We Collect</SectionTitle>
        <Text>Personal Information</Text>
        <Text>We may collect the following personal information:</Text>
        <List>
          <ListItem>Name</ListItem>
          <ListItem>Email address</ListItem>
          <ListItem>Phone number</ListItem>
          <ListItem>Professional title</ListItem>
          <ListItem>Organization name and type</ListItem>
          <ListItem>IP address and browser information</ListItem>
        </List>
      </Section>

      <Section>
        <SectionTitle>3. How We Use Your Information</SectionTitle>
        <Text>We may use the information we collect for various purposes, including to:</Text>
        <List>
          <ListItem>Provide, operate, and maintain our services</ListItem>
          <ListItem>Process and fulfill demo requests</ListItem>
          <ListItem>Send administrative information</ListItem>
          <ListItem>Respond to your comments and questions</ListItem>
          <ListItem>Send marketing communications</ListItem>
          <ListItem>Improve our website and services</ListItem>
        </List>
      </Section>

      <Section>
        <SectionTitle>4. Contact Information</SectionTitle>
        <Text>
          If you have questions or concerns about this Privacy Policy or our privacy practices, please contact us at:
        </Text>
        <Text>
          Email: privacy@medhastra.com
        </Text>
      </Section>

      <BackButton to="/login">Back to Login</BackButton>
    </Container>
  );
};

export default PrivacyPolicy;