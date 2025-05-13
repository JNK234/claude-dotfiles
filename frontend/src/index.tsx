import React from 'react';
import ReactDOM from 'react-dom/client';
// Removed ThemeProvider and GlobalStyles imports from styled-components
// import { ThemeProvider } from 'styled-components';
// import { GlobalStyles } from './styles/GlobalStyles';
import App from './App';
// Keep theme import if needed elsewhere, but ThemeProvider is removed
import { theme } from './styles/theme'; 
import './index.css'; // Import Tailwind CSS directives - Build process handles generation

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    {/* Removed ThemeProvider and GlobalStyles */}
    {/* <ThemeProvider theme={theme}> */}
      {/* <GlobalStyles /> */}
      <App />
    {/* </ThemeProvider> */}
  </React.StrictMode>
);