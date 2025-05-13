import { theme as appTheme } from './src/styles/theme';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary colors
        darkBlue: appTheme.colors.darkBlue,
        yellow: appTheme.colors.yellow,
        white: appTheme.colors.white,
        surgicalGreen: appTheme.colors.surgicalGreen,
        
        // Supporting colors
        successGreen: appTheme.colors.successGreen,
        alertAmber: appTheme.colors.alertAmber,
        errorRed: appTheme.colors.errorRed,
        neutralGray: appTheme.colors.neutralGray,
        darkText: appTheme.colors.darkText,
        
        // Panel background colors
        leftPanelBg: appTheme.colors.leftPanelBg,
        rightPanelBg: appTheme.colors.rightPanelBg,
        
        // Border color
        borderColor: appTheme.colors.borderColor,
        
        // Chat message colors
        aiMessageBg: appTheme.colors.aiMessageBg,
        doctorMessageBg: appTheme.colors.doctorMessageBg,
        doctorMessageBorder: appTheme.colors.doctorMessageBorder,
        
        // Disclaimer box
        disclaimerBg: appTheme.colors.disclaimerBg,
        disclaimerBorder: appTheme.colors.disclaimerBorder,
      },
      fontFamily: {
        primary: ['"Montserrat"', 'sans-serif'],
        secondary: ['"Roboto Slab"', 'serif'],
        body: ['"Open Sans"', 'sans-serif'],
      },
      fontSize: {
        body: appTheme.typography.fontSizes.body,
        secondary: appTheme.typography.fontSizes.secondary,
        h1: appTheme.typography.fontSizes.h1,
        h2: appTheme.typography.fontSizes.h2,
        h3: appTheme.typography.fontSizes.h3,
        button: appTheme.typography.fontSizes.button,
        small: appTheme.typography.fontSizes.small,
      },
      fontWeight: {
        regular: appTheme.typography.fontWeights.regular,
        medium: appTheme.typography.fontWeights.medium,
        semibold: appTheme.typography.fontWeights.semibold,
        bold: appTheme.typography.fontWeights.bold,
      },
      lineHeight: {
        body: appTheme.typography.lineHeights.body,
        heading: appTheme.typography.lineHeights.heading,
      },
      borderRadius: {
        DEFAULT: appTheme.layout.borderRadius,
      },
      boxShadow: {
        small: appTheme.shadows.small,
        medium: appTheme.shadows.medium,
        large: appTheme.shadows.large,
      },
      transitionDuration: {
        DEFAULT: '300ms',
      },
      transitionTimingFunction: {
        DEFAULT: 'ease',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'), // Add the typography plugin
  ],
}