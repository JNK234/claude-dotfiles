import React from 'react';
// Removed styled-components imports
// import styled, { ThemeProvider, keyframes, css } from 'styled-components'; 
import Button from '../components/ui/Button'; // Keep Button import (now Tailwind-based)
import { theme } from '../styles/theme'; // Keep theme import for potential direct value use if needed
import { FaStethoscope, FaBrain, FaClock, FaArrowRight, FaUserMd, FaHospital, FaAward, FaGlobe } from 'react-icons/fa'; // Added FaArrowRight
// Removed IconType import as it's no longer needed for styled FeatureIcon/HospitalIcon
// import { IconType } from 'react-icons'; 

// Removed styled-components keyframes and definitions
// const fadeIn = keyframes`...`;
// const float = keyframes`...`;
// const pulse = keyframes`...`;
// const LandingWrapper = styled.div`...`;
// const Navbar = styled.nav`...`;
// const Logo = styled.div`...`;
// const NavLinks = styled.div`...`;
// const NavButton = styled(Button)`...`; // No longer needed
// const Header = styled.header`...`;
// const TrustIndicators = styled.div`...`;
// const MainContent = styled.main`...`;
// const Section = styled.section`...`;
// const FeaturesGrid = styled.div`...`;
// const FeatureCard = styled.div`...`;
// const SocialProof = styled(Section)`...`;
// const LogoGrid = styled.div`...`;
// const TestimonialCard = styled.div`...`;
// const DemoSection = styled(Section)`...`;
// const FAQContainer = styled.div`...`;
// const FAQItem = styled.div`...`;
// const CTASection = styled.div`...`;
// const Footer = styled.footer`...`;
// const FeatureIcon = styled.div`...`;
// const HospitalIcon = styled.div`...`;

/**
 * LandingPage Component - Refactored to use Tailwind CSS
 * 
 * Public-facing entry point for MedhastraAI.
 * Highlights the value proposition, benefits, and provides a way for interested
 * users to request access or learn more via an external form.
 */
const LandingPage: React.FC = () => {
  // Event handlers remain the same
  const handleTransformClick = () => {
    window.location.href = '/register'; // Consider using react-router Link/navigate
  };

  const handleDemoClick = () => {
    window.location.href = 'mailto:medhastra@gmail.com?subject=Schedule%20a%20Demo%20Request&body=I%20would%20like%20to%20schedule%20a%20demo%20of%20MedhastraAI.';
  };

  const handleLoginClick = () => {
    window.location.href = '/login'; // Consider using react-router Link/navigate
  };

  // Define Tailwind classes for reuse (optional, but can help readability)
  const sectionPadding = 'py-24 px-8'; // Equivalent to padding: 6rem 2rem;
  const sectionMaxWidth = 'max-w-7xl mx-auto'; // Equivalent to max-width: 1200px; margin: 0 auto;

  return (
    // Removed ThemeProvider
    // Apply base styles to the main wrapper div
    <div className="font-body text-darkText min-h-screen flex flex-col bg-white tracking-tight">
      {/* Navbar with Tailwind */}
      <nav className="fixed top-0 left-0 right-0 px-8 py-4 bg-white/95 backdrop-blur-sm z-[1000] shadow-md flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center font-primary font-bold text-2xl text-darkBlue">
          <img src="/favicon/android-chrome-192x192.png" alt="MedhastraAI Logo" className="h-8 mr-2" />
          <span className="medhastra">Medhastra</span>
          <span className="ml-1 text-yellow">AI</span>
        </div>
        {/* Nav Links */}
        <div className="flex gap-8 items-center">
          <a href="#about" className="text-darkBlue no-underline font-medium transition-colors duration-300 hover:text-yellow">About</a>
          <a href="#features" className="text-darkBlue no-underline font-medium transition-colors duration-300 hover:text-yellow">Features</a>
          <a href="#demo" className="text-darkBlue no-underline font-medium transition-colors duration-300 hover:text-yellow">Demo</a>
          <a href="#contact" className="text-darkBlue no-underline font-medium transition-colors duration-300 hover:text-yellow">Contact</a>
          {/* Use refactored Button component with primary variant and specific layout classes */}
          <Button 
            variant="primary" 
            onClick={handleLoginClick} 
            className="!py-2 !px-6 rounded-[25px] !font-medium hover:-translate-y-0.5 hover:shadow-md" // Use ! to ensure override if needed, adjust padding/radius
          >
            Login
          </Button>
        </div>
      </nav>

      {/* Header with Tailwind */}
      <header className="bg-gradient-to-br from-darkBlue to-[#1a237e] text-white pt-48 pb-32 px-8 text-center relative overflow-hidden flex flex-col items-center">
        {/* Background pattern can be added via pseudo-element if needed, or omitted */}
        <div className="relative z-10 animate-fadeIn"> {/* Simple fade-in animation class needed or use library */}
          <div className="w-full max-w-7xl mx-auto flex flex-col items-center">
            {/* Hero Title */}
            <h1 className="font-primary text-7xl mb-6 font-bold flex items-center gap-2">
              <span className="text-white">Medhastra</span>
              <span className="text-yellow font-extrabold">AI</span>
            </h1>
            {/* Hero Subtitle */}
            <div className="font-body text-5xl leading-tight font-semibold mb-8 max-w-4xl w-full text-left px-4">
              <span className="block text-darkBlue">Clinical reasoning</span>
              <span className="block text-yellow font-bold">Made visible</span>
            </div>
            {/* Trust Indicators */}
            <div className="flex justify-center items-center gap-12 mt-12 flex-wrap">
              <div className="text-center animate-fadeIn">
                <div className="text-4xl font-bold text-yellow mb-2">50+</div>
                <div className="text-base text-white/80">Leading hospitals</div>
              </div>
              <div className="text-center animate-fadeIn">
                <div className="text-4xl font-bold text-yellow mb-2">1M+</div>
                <div className="text-base text-white/80">Cases analyzed</div>
              </div>
              <div className="text-center animate-fadeIn">
                <div className="text-4xl font-bold text-yellow mb-2">99.9%</div>
                <div className="text-base text-white/80">Accuracy rate</div>
              </div>
            </div>
            {/* CTA Button - Use refactored Button component */}
            <Button 
              variant="primary" 
              className="!py-3 !px-6 !text-base !rounded mt-6 hover:-translate-y-0.5 hover:shadow-lg" // Adjust padding/size/radius, ensure primary styles apply
              onClick={handleTransformClick}
              icon={<FaArrowRight />} // Add icon prop
            >
              Request Demo
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col w-full">
        {/* About Section */}
        <section id="about" className={`bg-white text-darkText ${sectionPadding}`}>
          <div className={`${sectionMaxWidth}`}>
            <h2 className="font-primary text-4xl mb-8 text-center font-semibold text-darkBlue after:content-[''] after:block after:w-16 after:h-1 after:bg-yellow after:mx-auto after:mt-4 after:rounded">
              About us
            </h2>
            <p className="text-neutralGray leading-relaxed text-lg text-center max-w-3xl mx-auto">
              Leading the transformation in healthcare diagnostics through advanced artificial intelligence and machine learning technologies. Our mission is to enhance clinical decision-making and improve patient outcomes.
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className={`bg-gradient-to-br from-darkBlue to-[#1a237e] text-white ${sectionPadding}`}>
          <div className={`${sectionMaxWidth}`}>
            <h2 className="font-primary text-4xl mb-8 text-center font-semibold text-white after:content-[''] after:block after:w-16 after:h-1 after:bg-yellow after:mx-auto after:mt-4 after:rounded">
              Features
            </h2>
            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-12">
              {/* Feature Card 1 */}
              <div className="p-10 bg-white/5 rounded-lg shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-2xl backdrop-blur-md">
                <div className="text-yellow text-5xl mb-6 flex justify-center"><FaStethoscope /></div>
                <h3 className="text-white mb-4 font-primary text-2xl font-semibold">Advanced diagnostic intelligence</h3>
                <p className="text-white/80 leading-relaxed text-lg">Leverage state-of-the-art AI to identify potential diagnostic gaps and enhance clinical accuracy.</p>
              </div>
              {/* Feature Card 2 */}
              <div className="p-10 bg-white/5 rounded-lg shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-2xl backdrop-blur-md">
                <div className="text-yellow text-5xl mb-6 flex justify-center"><FaBrain /></div>
                <h3 className="text-white mb-4 font-primary text-2xl font-semibold">Deep learning analysis</h3>
                <p className="text-white/80 leading-relaxed text-lg">Our neural networks analyze complex medical data to provide comprehensive clinical insights.</p>
              </div>
              {/* Feature Card 3 */}
              <div className="p-10 bg-white/5 rounded-lg shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-2xl backdrop-blur-md">
                <div className="text-yellow text-5xl mb-6 flex justify-center"><FaClock /></div>
                <h3 className="text-white mb-4 font-primary text-2xl font-semibold">Real-time processing</h3>
                <p className="text-white/80 leading-relaxed text-lg">Get instant analysis and recommendations to streamline your diagnostic workflow.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Demo Section */}
        <section id="demo" className={`bg-gradient-to-br from-white to-rightPanelBg text-darkText ${sectionPadding}`}>
           <div className={`${sectionMaxWidth}`}>
             <h2 className="font-primary text-4xl mb-8 text-center font-semibold text-darkBlue after:content-[''] after:block after:w-16 after:h-1 after:bg-yellow after:mx-auto after:mt-4 after:rounded">
               See it in action
             </h2>
             <div className="text-center mt-8">
               <p className="text-neutralGray leading-relaxed text-lg mb-8">Experience how MedhastraAI is revolutionizing clinical decision-making</p>
               <div className="w-full max-w-3xl mx-auto aspect-video rounded-xl overflow-hidden shadow-2xl">
                 <div className="w-full h-full bg-darkBlue flex items-center justify-center text-white text-lg">
                   <p>Demo video coming soon</p>
                 </div>
                 {/* Replace div above with <video> tag when ready */}
                 {/* <video controls poster="/path/to/poster.jpg"> <source src="/path/to/video.mp4" type="video/mp4" /> Your browser does not support the video tag. </video> */}
               </div>
             </div>
           </div>
         </section>

        {/* Contact Section */}
        <section id="contact" className={`bg-white text-darkText ${sectionPadding}`}>
           <div className={`${sectionMaxWidth}`}>
             <h2 className="font-primary text-4xl mb-8 text-center font-semibold text-darkBlue after:content-[''] after:block after:w-16 after:h-1 after:bg-yellow after:mx-auto after:mt-4 after:rounded">
               Contact us
             </h2>
             {/* CTA Box */}
             <div className="text-center bg-gradient-to-br from-darkBlue to-[#1a237e] text-white p-16 rounded-lg my-16 relative overflow-hidden max-w-4xl mx-auto">
                {/* Optional background pattern */}
               <div className="relative z-10">
                 <h2 className="text-white text-3xl mb-8 font-semibold">Ready to transform healthcare?</h2>
                 <p className="text-white/90 text-xl mb-8">Get in touch with us to learn more about how MedhastraAI can benefit your practice</p>
                  {/* Use an anchor tag styled as a button for mailto link */}
                  <a 
                    href="mailto:info@medhastra.com?subject=Schedule%20a%20Demo%20Request&body=I%20would%20like%20to%20schedule%20a%20demo%20of%20MedhastraAI."
                    className="inline-flex items-center gap-2 bg-yellow text-darkBlue px-8 py-4 text-lg rounded-lg border-none cursor-pointer transition-all duration-300 ease-in-out font-semibold hover:scale-105 hover:shadow-lg"
                  >
                   Schedule a demo
                 </a>
               </div>
             </div>
           </div>
         </section>
      </main>

      {/* Footer */}
      <footer className="pt-16 pb-8 px-4 text-center bg-darkBlue text-white/80">
        <div className={`${sectionMaxWidth} grid grid-cols-1 md:grid-cols-3 gap-8 text-left`}>
          {/* Footer Section 1 */}
          <div className="footer-section">
            <h3 className="text-yellow mb-4 text-lg font-semibold">About MedhastraAI</h3>
            <ul className="list-none p-0">
              <li className="mb-2"><a href="#about" className="text-white/80 no-underline transition-colors duration-300 hover:text-yellow">Our mission</a></li>
              <li className="mb-2"><a href="#team" className="text-white/80 no-underline transition-colors duration-300 hover:text-yellow">Leadership</a></li>
              <li className="mb-2"><a href="#careers" className="text-white/80 no-underline transition-colors duration-300 hover:text-yellow">Careers</a></li>
            </ul>
          </div>
          {/* Footer Section 2 */}
          <div className="footer-section">
            <h3 className="text-yellow mb-4 text-lg font-semibold">Resources</h3>
            <ul className="list-none p-0">
              <li className="mb-2"><a href="#blog" className="text-white/80 no-underline transition-colors duration-300 hover:text-yellow">Blog</a></li>
              <li className="mb-2"><a href="#docs" className="text-white/80 no-underline transition-colors duration-300 hover:text-yellow">Documentation</a></li>
              <li className="mb-2"><a href="#support" className="text-white/80 no-underline transition-colors duration-300 hover:text-yellow">Support</a></li>
            </ul>
          </div>
          {/* Footer Section 3 */}
          <div className="footer-section">
             <h3 className="text-yellow mb-4 text-lg font-semibold">Contact</h3>
             <ul className="list-none p-0">
               <li className="mb-2"><a href="mailto:info@medhastra.com" className="text-white/80 no-underline transition-colors duration-300 hover:text-yellow">Email us</a></li>
               <li className="mb-2"><a href="#partners" className="text-white/80 no-underline transition-colors duration-300 hover:text-yellow">Partnership</a></li>
               <li className="mb-2"><a href="#press" className="text-white/80 no-underline transition-colors duration-300 hover:text-yellow">Press</a></li>
            </ul>
          </div>
        </div>
        {/* Footer Bottom */}
        <div className="mt-12 pt-8 border-t border-white/10 text-sm">
          <p>© 2024 MedhastraAI. All rights reserved.</p>
          <p>HIPAA compliant | SOC 2 certified | ISO 27001</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
