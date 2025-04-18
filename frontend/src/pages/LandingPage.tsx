import React, { useEffect, useRef } from 'react';
import styled, { ThemeProvider, keyframes, css } from 'styled-components';
// Assuming Button and theme are correctly exported and styled
import Button from '../components/ui/Button'; 
import { theme } from '../styles/theme'; 
import { FaStethoscope, FaBrain, FaClock, FaChartLine, FaShieldAlt, FaUserMd, FaHospital, FaAward, FaGlobe } from 'react-icons/fa';
import { IconType } from 'react-icons';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

// Basic Styling for the Landing Page
// These styles are basic; adjust them to fit your application's design system.
const LandingWrapper = styled.div`
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  color: ${props => props.theme.colors.darkText};
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: ${props => props.theme.colors.white};
  letter-spacing: -0.02em;
`;

const Navbar = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding: 1rem 2rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(5px);
  z-index: 1000;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  font-family: ${props => props.theme.typography.fontFamily.primary};
  font-weight: bold;
  font-size: 1.5rem;
  color: ${props => props.theme.colors.darkBlue};
  
  img {
    height: 32px;
    margin-right: 8px;
  }
  
  span.ai {
    color: ${props => props.theme.colors.yellow};
    margin-left: 4px;
  }
`;

const NavLinks = styled.div`
  display: flex;
  gap: 2rem;
  align-items: center;

  a {
    color: ${props => props.theme.colors.darkBlue};
    text-decoration: none;
    font-weight: 500;
    transition: color 0.3s ease;
    text-transform: none;

    &:hover {
      color: ${props => props.theme.colors.yellow};
    }
  }
`;

const NavButton = styled(Button)`
  background: ${props => props.theme.colors.darkBlue};
  color: white;
  padding: 0.5rem 1.5rem;
  border-radius: 25px;
  font-weight: 500;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  }
`;

const Header = styled.header`
  background: linear-gradient(135deg, ${props => props.theme.colors.darkBlue} 0%, #1a237e 100%);
  color: white;
  padding: 12rem 2rem 8rem;
  text-align: center;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    opacity: 0.1;
    z-index: 1;
  }

  > * {
    position: relative;
    z-index: 2;
    animation: ${fadeIn} 1s ease-out;
  }

  .hero-content {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .hero-title {
    font-family: 'Inter', sans-serif;
    font-size: 5rem;
    margin-bottom: 1.5rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    
    .medhastra {
      color: white;
    }
    
    .ai {
      color: ${props => props.theme.colors.yellow};
      font-weight: 800;
    }
  }

  p {
    font-size: 1.8rem;
    color: rgba(255, 255, 255, 0.95);
    max-width: 900px;
    margin: 0 auto 2rem;
    line-height: 1.6;
    font-weight: 300;
    text-transform: none;
  }

  .cta-button {
    background: ${props => props.theme.colors.yellow};
    color: ${props => props.theme.colors.darkBlue};
    padding: 1.2rem 3rem;
    font-size: 1.3rem;
    border-radius: 30px;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-top: 2rem;

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 6px 20px rgba(0,0,0,0.2);
    }
  }
`;

const TrustIndicators = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 3rem;
  margin-top: 3rem;
  flex-wrap: wrap;

  .stat {
    text-align: center;
    animation: ${fadeIn} 1s ease-out;
    
    .number {
      font-size: 2.5rem;
      font-weight: bold;
      color: ${props => props.theme.colors.yellow};
      margin-bottom: 0.5rem;
    }
    
    .label {
      font-size: 1rem;
      color: rgba(255, 255, 255, 0.8);
      text-transform: none;
      letter-spacing: 0.5px;
    }
  }
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const Section = styled.section<{ alternate?: boolean }>`
  width: 100%;
  padding: 6rem 2rem;
  position: relative;
  background: ${props => props.alternate ? 'white' : `linear-gradient(135deg, ${props.theme.colors.darkBlue} 0%, #1a237e 100%)`};
  color: ${props => props.alternate ? props.theme.colors.darkText : 'white'};

  .section-content {
    max-width: 1200px;
    margin: 0 auto;
  }

  h2 {
    font-family: 'Inter', sans-serif;
    font-size: 2.8rem;
    margin-bottom: 2rem;
    text-align: center;
    font-weight: 600;
    letter-spacing: -0.02em;
    color: ${props => props.alternate ? props.theme.colors.darkBlue : 'white'};
    text-transform: none;
    
    &::after {
      content: '';
      display: block;
      width: 60px;
      height: 3px;
      background: ${props => props.theme.colors.yellow};
      margin: 1rem auto;
      border-radius: 2px;
    }
  }

  p {
    color: ${props => props.alternate ? props.theme.colors.neutralGray : 'rgba(255, 255, 255, 0.9)'};
    line-height: 1.6;
    font-size: 1.1rem;
  }
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2.5rem;
  margin-top: 3rem;
`;

const FeatureCard = styled.div<{ alternate?: boolean }>`
  padding: 2.5rem;
  background: ${props => props.alternate ? 'white' : 'rgba(255, 255, 255, 0.05)'};
  border-radius: ${props => props.theme.layout.borderRadius};
  box-shadow: ${props => props.alternate ? props.theme.shadows.small : '0 4px 20px rgba(0, 0, 0, 0.1)'};
  transition: all 0.3s ease;
  backdrop-filter: ${props => props.alternate ? 'none' : 'blur(10px)'};

  &:hover {
    transform: translateY(-5px);
    box-shadow: ${props => props.alternate ? props.theme.shadows.large : '0 8px 30px rgba(0, 0, 0, 0.2)'};
  }

  h3 {
    color: ${props => props.alternate ? props.theme.colors.darkBlue : 'white'};
    margin-bottom: 1rem;
    font-family: 'Inter', sans-serif;
    font-size: 1.5rem;
    font-weight: 600;
    letter-spacing: -0.01em;
    text-transform: none;
  }

  p {
    color: ${props => props.alternate ? props.theme.colors.neutralGray : 'rgba(255, 255, 255, 0.8)'};
    line-height: 1.6;
    font-size: 1.1rem;
  }
`;

const SocialProof = styled(Section)`
  background: linear-gradient(135deg, ${props => props.theme.colors.white} 0%, ${props => props.theme.colors.rightPanelBg} 100%);
`;

const LogoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 2rem;
  align-items: center;
  justify-items: center;
  margin-top: 2rem;

  .logo {
    opacity: 0.7;
    transition: opacity 0.3s ease;
    filter: grayscale(100%);

    &:hover {
      opacity: 1;
      filter: grayscale(0%);
    }
  }
`;

const TestimonialCard = styled.div`
  background: white;
  padding: 2rem;
  border-radius: ${props => props.theme.layout.borderRadius};
  box-shadow: ${props => props.theme.shadows.small};
  margin: 1rem;
  position: relative;

  &::before {
    content: '"';
    position: absolute;
    top: -20px;
    left: 20px;
    font-size: 4rem;
    color: ${props => props.theme.colors.yellow};
    opacity: 0.2;
    font-family: serif;
  }

  .quote {
    font-style: italic;
    margin-bottom: 1rem;
    line-height: 1.6;
  }

  .author {
    font-weight: bold;
    color: ${props => props.theme.colors.darkBlue};
  }

  .title {
    color: ${props => props.theme.colors.neutralGray};
    font-size: 0.9rem;
  }
`;

const DemoSection = styled(Section)`
  background: linear-gradient(135deg, ${props => props.theme.colors.white} 0%, ${props => props.theme.colors.rightPanelBg} 100%);
  
  .video-container {
    width: 100%;
    max-width: 800px;
    margin: 2rem auto;
    aspect-ratio: 16/9;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: ${props => props.theme.shadows.large};
  }

  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .placeholder {
    width: 100%;
    height: 100%;
    background: ${props => props.theme.colors.darkBlue};
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.2rem;
  }
`;

const FAQContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const FAQItem = styled.div`
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  background: ${props => props.theme.colors.white};
  border-radius: ${props => props.theme.layout.borderRadius};
  box-shadow: ${props => props.theme.shadows.small};

  h3 {
    color: ${props => props.theme.colors.darkBlue};
    margin-bottom: 0.5rem;
    font-family: ${props => props.theme.typography.fontFamily.primary};
  }

  p {
    color: ${props => props.theme.colors.neutralGray};
    line-height: 1.6;
  }
`;

const CTASection = styled.div`
  text-align: center;
  background: linear-gradient(135deg, ${props => props.theme.colors.darkBlue} 0%, #1a237e 100%);
  color: white;
  padding: 6rem 2rem;
  border-radius: ${props => props.theme.layout.borderRadius};
  margin: 4rem auto;
  position: relative;
  overflow: hidden;
  max-width: 1000px;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    opacity: 0.1;
  }

  h2 {
    color: white;
    margin-bottom: 2rem;
    position: relative;
    z-index: 1;
  }

  p {
    color: rgba(255, 255, 255, 0.9);
    font-size: 1.2rem;
    margin-bottom: 2rem;
    position: relative;
    z-index: 1;
  }

  .cta-button {
    background: ${props => props.theme.colors.yellow};
    color: ${props => props.theme.colors.darkBlue};
    padding: 1.2rem 3rem;
    font-size: 1.3rem;
    border-radius: 30px;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    z-index: 1;
    display: inline-block;
    text-decoration: none;
    text-transform: none;
    margin: 0 auto;

    &:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }
  }
`;

const Footer = styled.footer`
  padding: 4rem 1rem;
  text-align: center;
  background-color: ${props => props.theme.colors.darkBlue};
  color: rgba(255, 255, 255, 0.8);
  
  .footer-content {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    text-align: left;
  }

  .footer-section {
    h3 {
      color: ${props => props.theme.colors.yellow};
      margin-bottom: 1rem;
    }

    ul {
      list-style: none;
      padding: 0;
      
      li {
        margin-bottom: 0.5rem;
        
        a {
          color: rgba(255, 255, 255, 0.8);
          text-decoration: none;
          transition: color 0.3s ease;
          
          &:hover {
            color: ${props => props.theme.colors.yellow};
          }
        }
      }
    }
  }
  
  .footer-bottom {
    margin-top: 3rem;
    padding-top: 2rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
`;

// Placeholder URL for the Google Form
const GOOGLE_FORM_URL_PLACEHOLDER = '#request-access-placeholder'; 

const FeatureIcon = styled.div<{ icon: IconType }>`
  color: ${props => props.theme.colors.yellow};
  font-size: 3rem;
  margin-bottom: 1.5rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 1em;
    height: 1em;
  }
`;

const HospitalIcon = styled.div<{ icon: IconType }>`
  color: ${props => props.theme.colors.darkBlue};
  opacity: 0.7;
  transition: opacity 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;

  svg {
    width: 40px;
    height: 40px;
  }
`;

/**
 * LandingPage Component
 * 
 * Public-facing entry point for MedhastraAI.
 * Highlights the value proposition, benefits, and provides a way for interested
 * users to request access or learn more via an external form.
 */
const LandingPage: React.FC = () => {
  const handleTransformClick = () => {
    window.location.href = '/register';
  };

  const handleDemoClick = () => {
    window.location.href = 'mailto:medhastra@gmail.com?subject=Schedule%20a%20Demo%20Request&body=I%20would%20like%20to%20schedule%20a%20demo%20of%20MedhastraAI.';
  };

  const handleLoginClick = () => {
    window.location.href = '/login';
  };

  return (
    <ThemeProvider theme={theme}>
      <LandingWrapper>
        <Navbar>
          <Logo>
            <img src="/favicon/android-chrome-192x192.png" alt="MedhastraAI Logo" />
            <span className="medhastra">Medhastra</span>
            <span className="ai">AI</span>
          </Logo>
          <NavLinks>
            <a href="#about">About</a>
            <a href="#features">Features</a>
            <a href="#demo">Demo</a>
            <a href="#contact">Contact</a>
            <NavButton onClick={handleLoginClick}>Login</NavButton>
          </NavLinks>
        </Navbar>

        <Header>
          <div className="hero-content">
            <h1 className="hero-title">
              <span className="medhastra">Medhastra</span>
              <span className="ai">AI</span>
            </h1>
            <p>Revolutionizing Healthcare with Advanced AI Diagnostics</p>
            <TrustIndicators>
              <div className="stat">
                <div className="number">50+</div>
                <div className="label">Leading hospitals</div>
              </div>
              <div className="stat">
                <div className="number">1M+</div>
                <div className="label">Cases analyzed</div>
              </div>
              <div className="stat">
                <div className="number">99.9%</div>
                <div className="label">Accuracy rate</div>
              </div>
            </TrustIndicators>
            <Button className="cta-button" onClick={handleTransformClick}>
              Transform your practice
            </Button>
          </div>
        </Header>

        <MainContent>
          <Section alternate id="about">
            <div className="section-content">
              <h2>About us</h2>
              <p>Leading the transformation in healthcare diagnostics through advanced artificial intelligence and machine learning technologies. Our mission is to enhance clinical decision-making and improve patient outcomes.</p>
            </div>
          </Section>

          <Section id="features">
            <div className="section-content">
              <h2>Features</h2>
              <FeaturesGrid>
                <FeatureCard>
                  <FeatureIcon icon={FaStethoscope} />
                  <h3>Advanced diagnostic intelligence</h3>
                  <p>Leverage state-of-the-art AI to identify potential diagnostic gaps and enhance clinical accuracy.</p>
                </FeatureCard>
                <FeatureCard>
                  <FeatureIcon icon={FaBrain} />
                  <h3>Deep learning analysis</h3>
                  <p>Our neural networks analyze complex medical data to provide comprehensive clinical insights.</p>
                </FeatureCard>
                <FeatureCard>
                  <FeatureIcon icon={FaClock} />
                  <h3>Real-time processing</h3>
                  <p>Get instant analysis and recommendations to streamline your diagnostic workflow.</p>
                </FeatureCard>
              </FeaturesGrid>
            </div>
          </Section>

          <Section alternate id="demo">
            <div className="section-content">
              <h2>See it in action</h2>
              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <p>Experience how MedhastraAI is revolutionizing clinical decision-making</p>
                <div className="video-container">
                  <div className="placeholder">
                    <p>Demo video coming soon</p>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          <Section id="contact">
            <div className="section-content">
              <h2>Contact us</h2>
              <CTASection>
                <h2>Ready to transform healthcare?</h2>
                <p>Get in touch with us to learn more about how MedhastraAI can benefit your practice</p>
                <a href="mailto:medhastra@gmail.com?subject=Schedule%20a%20Demo%20Request&body=I%20would%20like%20to%20schedule%20a%20demo%20of%20MedhastraAI." 
                   className="cta-button">
                  Schedule a demo
                </a>
              </CTASection>
            </div>
          </Section>
        </MainContent>

        <Footer>
          <div className="footer-content">
            <div className="footer-section">
              <h3>About MedhastraAI</h3>
              <ul>
                <li><a href="#about">Our mission</a></li>
                <li><a href="#team">Leadership</a></li>
                <li><a href="#careers">Careers</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h3>Resources</h3>
              <ul>
                <li><a href="#blog">Blog</a></li>
                <li><a href="#docs">Documentation</a></li>
                <li><a href="#support">Support</a></li>
              </ul>
            </div>
            <div className="footer-section" id="contact">
              <h3>Contact</h3>
              <ul>
                <li><a href="mailto:medhastra@gmail.com">Email us</a></li>
                <li><a href="#partners">Partnership</a></li>
                <li><a href="#press">Press</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2024 MedhastraAI. All rights reserved.</p>
            <p>HIPAA compliant | SOC 2 certified | ISO 27001</p>
          </div>
        </Footer>
      </LandingWrapper>
    </ThemeProvider>
  );
};

export default LandingPage;
