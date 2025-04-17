import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from 'styled-components';
import App from './App';
import { theme } from './styles/theme';
import { GlobalStyles } from './styles/GlobalStyles';
import './index.css'; // Import Tailwind CSS directives - Build process handles generation

// Remove redundant import of generated CSS file: import './styles/tailwind.css'; 

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
