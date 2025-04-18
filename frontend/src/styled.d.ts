import 'styled-components';

import { theme } from './styles/theme'; // Import the theme type itself

// Infer the theme type from the theme object
type AppTheme = typeof theme;

declare module 'styled-components' {
  // Extend the DefaultTheme interface with our AppTheme
  export interface DefaultTheme extends AppTheme {}
}
