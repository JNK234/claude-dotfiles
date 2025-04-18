// Theme file for Medhastra branding

export const theme = {
  colors: {
    // Primary colors
    darkBlue: '#171848',      // Primary brand color - dark blue
    yellow: '#F49F0F',        // Accent color - yellow
    white: '#FFFBF5',         // Background color - white
    surgicalGreen: '#3CCFA8', // For success states
    
    // Supporting colors
    successGreen: '#3CCFA8',    // Using surgical green for success
    alertAmber: '#F49F0F',      // Using yellow for alerts
    errorRed: '#E63946',        // Keeping error red for contrast
    neutralGray: '#8C9BAB',     // Neutral gray for secondary text
    darkText: '#171848',        // Using dark blue for text
    deepMedicalBlue: '#2A64F5', // Added for focus states, distinct blue
    
    // Panel background colors
    leftPanelBg: '#FFFBF5',     // White for clean look
    rightPanelBg: '#F7F8FC',    // Light blue tint for subtle contrast
    
    // Border color
    borderColor: '#E0E4E8',     // Subtle border for separation

    // Chat message colors
    aiMessageBg: '#F7F8FC',     // Light blue for AI messages
    doctorMessageBg: '#FFFFFF', // White for doctor messages
    doctorMessageBorder: '#171848', // Dark blue for border
    
    // Disclaimer box
    disclaimerBg: '#FFF8E6',    // Light gold for disclaimers
    disclaimerBorder: '#F49F0F' // Yellow for borders
  },
  
  typography: {
    // Primary: Montserrat - Modern, geometric, high legibility
    // Secondary: Roboto Slab - Serious, clinical but not cold
    // Tertiary: Open Sans - For body text, accessible, clean
    fontFamily: {
      primary: '"Montserrat", sans-serif',
      secondary: '"Roboto Slab", serif',
      body: '"Open Sans", sans-serif'
    },
    fontSizes: {
      body: '16px',
      secondary: '14px',
      h1: '24px',
      h2: '20px',
      h3: '18px',
      button: '16px',
      small: '12px',
    },
    fontWeights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },
    lineHeights: {
      body: 1.5,
      heading: 1.2,
    },
  },
  
  layout: {
    leftPanelWidth: '250px',
    rightPanelWidth: '350px',
    borderRadius: '8px',
  },
  
  breakpoints: {
    tablet: '768px',
    desktop: '1280px',
  },
  
  shadows: {
    small: '0 2px 4px rgba(0, 0, 0, 0.1)',
    medium: '0 4px 8px rgba(0, 0, 0, 0.1)',
    large: '0 8px 16px rgba(0, 0, 0, 0.1)',
  },
  
  transitions: {
    default: '0.3s ease',
  },
};

export type Theme = typeof theme;
