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
    font-family: ${theme.typography.fontFamily.body};
    font-size: ${theme.typography.fontSizes.body};
    line-height: ${theme.typography.lineHeights.body};
    color: ${theme.colors.darkText};
    background-color: ${theme.colors.white};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  h1, h2, h3, h4, h5, h6 {
    font-family: ${theme.typography.fontFamily.primary};
    line-height: ${theme.typography.lineHeights.heading};
    margin-bottom: 0.5em;
    font-weight: ${theme.typography.fontWeights.bold};
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  h1 {
    font-size: ${theme.typography.fontSizes.h1};
    color: ${theme.colors.darkBlue};
  }
  
  h2 {
    font-size: ${theme.typography.fontSizes.h2};
    color: ${theme.colors.darkBlue};
  }
  
  h3 {
    font-size: ${theme.typography.fontSizes.h3};
    color: ${theme.colors.darkBlue};
  }

  .subheader {
    font-family: ${theme.typography.fontFamily.secondary};
    font-weight: ${theme.typography.fontWeights.medium};
    color: ${theme.colors.darkBlue};
  }
  
  p {
    margin-bottom: 1em;
    font-family: ${theme.typography.fontFamily.body};
  }
  
  a {
    color: ${theme.colors.darkBlue};
    text-decoration: none;
    transition: color ${theme.transitions.default};
    
    &:hover {
      color: ${theme.colors.yellow};
    }
  }
  
  button, input, textarea {
    font-family: ${theme.typography.fontFamily.primary};
  }
  
  /* Primary action buttons */
  .btn-primary {
    background-color: ${theme.colors.darkBlue};
    color: white;
    border: none;
  }

  /* Secondary action buttons */
  .btn-secondary {
    background-color: ${theme.colors.yellow};
    color: ${theme.colors.darkBlue};
    border: none;
  }

  /* Highlight elements */
  .highlight {
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
