import { createGlobalStyle } from 'styled-components';
import { theme } from './theme';

export const GlobalStyles = createGlobalStyle`
  * {
    box-sizing: border-box;
  }

  html, body, #root {
    height: 100%;
    width: 100%;
  }

  /* Only apply these styles to the main app, not the landing page */
  body:not(.landing-page) {
    font-family: ${theme.typography.fontFamily.body};
    font-size: ${theme.typography.fontSizes.body};
    line-height: ${theme.typography.lineHeights.body};
    color: ${theme.colors.darkText};
    background-color: ${theme.colors.white};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  /* Only apply these styles to the main app, not the landing page */
  body:not(.landing-page) h1, 
  body:not(.landing-page) h2, 
  body:not(.landing-page) h3, 
  body:not(.landing-page) h4, 
  body:not(.landing-page) h5, 
  body:not(.landing-page) h6 {
    font-family: ${theme.typography.fontFamily.primary};
    line-height: ${theme.typography.lineHeights.heading};
    margin-bottom: 0.5em;
    font-weight: ${theme.typography.fontWeights.bold};
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  /* Only apply these styles to the main app, not the landing page */
  body:not(.landing-page) h1 {
    font-size: ${theme.typography.fontSizes.h1};
    color: ${theme.colors.darkBlue};
  }
  
  /* Only apply these styles to the main app, not the landing page */
  body:not(.landing-page) h2 {
    font-size: ${theme.typography.fontSizes.h2};
    color: ${theme.colors.darkBlue};
  }
  
  /* Only apply these styles to the main app, not the landing page */
  body:not(.landing-page) h3 {
    font-size: ${theme.typography.fontSizes.h3};
    color: ${theme.colors.darkBlue};
  }

  /* Only apply these styles to the main app, not the landing page */
  body:not(.landing-page) .subheader {
    font-family: ${theme.typography.fontFamily.secondary};
    font-weight: ${theme.typography.fontWeights.medium};
    color: ${theme.colors.darkBlue};
  }
  
  /* Only apply these styles to the main app, not the landing page */
  body:not(.landing-page) p {
    margin-bottom: 1em;
    font-family: ${theme.typography.fontFamily.body};
  }
  
  /* Only apply these styles to the main app, not the landing page */
  body:not(.landing-page) a {
    color: ${theme.colors.darkBlue};
    text-decoration: none;
    transition: color ${theme.transitions.default};
    
    &:hover {
      color: ${theme.colors.yellow};
    }
  }
  
  /* Only apply these styles to the main app, not the landing page */
  body:not(.landing-page) button, 
  body:not(.landing-page) input, 
  body:not(.landing-page) textarea {
    font-family: ${theme.typography.fontFamily.primary};
  }
  
  /* Primary action buttons - only for main app */
  body:not(.landing-page) .btn-primary {
    background-color: ${theme.colors.darkBlue};
    color: white;
    border: none;
  }

  /* Secondary action buttons - only for main app */
  body:not(.landing-page) .btn-secondary {
    background-color: ${theme.colors.yellow};
    color: ${theme.colors.darkBlue};
    border: none;
  }

  /* Highlight elements - only for main app */
  body:not(.landing-page) .highlight {
    color: ${theme.colors.yellow};
  }
  
  /* For accessibility */
  button:focus, input:focus, textarea:focus, select:focus {
    outline: 2px solid ${theme.colors.yellow};
    outline-offset: 2px;
  }
  
  /* For users who prefer reduced motion */
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
`;
