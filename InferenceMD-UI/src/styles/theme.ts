// Theme file based on inference-md-design.md guidelines

export const theme = {
  colors: {
    // Primary colors
    deepMedicalBlue: '#2964AB',
    calmTeal: '#218F8D',
    hospitalWhite: '#FAFCFD',
    
    // Supporting colors
    successGreen: '#31B77A',
    alertAmber: '#F59E0B',
    errorRed: '#E63946',
    neutralGray: '#8C9BAB',
    darkText: '#1A2A40',
    
    // Panel background colors
    leftPanelBg: '#F5F7F9',
    rightPanelBg: '#F0F7FF',
    
    // Chat message colors
    aiMessageBg: '#F0F7FF',
    doctorMessageBg: '#FFFFFF',
    doctorMessageBorder: '#2964AB',
    
    // Disclaimer box
    disclaimerBg: '#FEF9C3',
    disclaimerBorder: '#F59E0B',
  },
  
  typography: {
    fontFamily: '"Inter", sans-serif',
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