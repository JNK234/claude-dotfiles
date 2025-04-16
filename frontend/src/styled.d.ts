import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    colors: {
      darkText: string;
      deepMedicalBlue: string;
      neutralGray: string;
    };
    layout: {
      borderRadius: string;
    };
    typography: {
      fontSizes: {
        body: string;
      };
    };
  }
} 