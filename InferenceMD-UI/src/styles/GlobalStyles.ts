import { createGlobalStyle } from 'styled-components';
import { theme } from './theme';

export const GlobalStyles = createGlobalStyle`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html, body, #root {
    height: 100%;
    width: 100%;
  }

  body {
    font-family: ${theme.typography.fontFamily};
    font-size: ${theme.typography.fontSizes.body};
    line-height: ${theme.typography.lineHeights.body};
    color: ${theme.colors.darkText};
    background-color: ${theme.colors.hospitalWhite};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  h1, h2, h3, h4, h5, h6 {
    line-height: ${theme.typography.lineHeights.heading};
    margin-bottom: 0.5em;
    font-weight: ${theme.typography.fontWeights.semibold};
  }
  
  h1 {
    font-size: ${theme.typography.fontSizes.h1};
  }
  
  h2 {
    font-size: ${theme.typography.fontSizes.h2};
  }
  
  h3 {
    font-size: ${theme.typography.fontSizes.h3};
  }
  
  p {
    margin-bottom: 1em;
  }
  
  a {
    color: ${theme.colors.deepMedicalBlue};
    text-decoration: none;
    transition: color ${theme.transitions.default};
    
    &:hover {
      color: ${theme.colors.calmTeal};
    }
  }
  
  button, input, textarea {
    font-family: ${theme.typography.fontFamily};
  }
  
  /* For accessibility */
  button:focus, input:focus, textarea:focus, select:focus {
    outline: 2px solid ${theme.colors.deepMedicalBlue};
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