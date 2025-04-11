import React, { ButtonHTMLAttributes } from 'react';
import styled, { css } from 'styled-components';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'approve' | 'reject';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const getButtonStyles = (variant: ButtonVariant) => {
  switch (variant) {
    case 'primary':
      return css`
        background-color: ${props => props.theme.colors.darkBlue};
        color: white;
        border: none;
        
        &:hover:not(:disabled) {
          background-color: ${props => props.theme.colors.yellow}; // Use theme accent for hover
          color: ${props => props.theme.colors.darkBlue}; // Dark text on yellow
          box-shadow: ${props => props.theme.shadows.small}; // Add subtle lift
        }
        
        &:active:not(:disabled) {
          background-color: #E6940A; // Slightly darker yellow for active
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1); // Subtle inset shadow
        }

        &:disabled {
          background-color: ${props => props.theme.colors.neutralGray};
          opacity: 0.7;
          cursor: not-allowed;
        }
      `;
    case 'secondary':
      return css`
        background-color: white;
        color: ${props => props.theme.colors.darkBlue};
        border: 1px solid ${props => props.theme.colors.darkBlue};
        
        &:hover:not(:disabled) {
          background-color: ${props => props.theme.colors.rightPanelBg}; // Use light blue from theme
          border-color: ${props => props.theme.colors.yellow}; // Accent border on hover
        }
        
        &:active:not(:disabled) {
          background-color: #F0F2F8; // Slightly darker light blue
        }

        &:disabled {
          color: ${props => props.theme.colors.neutralGray};
          border-color: ${props => props.theme.colors.neutralGray};
          opacity: 0.7;
          cursor: not-allowed;
        }
      `;
    case 'tertiary':
      return css`
        background-color: transparent;
        color: ${props => props.theme.colors.darkBlue};
        border: none;
        text-decoration: none;
        padding: 0.75rem 0.5rem; // Reduce padding for tertiary

        &:hover:not(:disabled) {
          color: ${props => props.theme.colors.yellow};
          background-color: rgba(0,0,0,0.03); // Subtle background on hover
        }
        
        &:active:not(:disabled) {
          color: #E6940A; // Darker yellow
        }

        &:disabled {
          color: ${props => props.theme.colors.neutralGray};
          opacity: 0.7;
          cursor: not-allowed;
          text-decoration: none;
        }
      `;
    case 'approve':
      return css`
        background-color: ${props => props.theme.colors.successGreen};
        color: white;
        border: none;
        
        &:hover:not(:disabled) {
          background-color: #2AAD6F; // Slightly darker green
          box-shadow: ${props => props.theme.shadows.small}; // Add subtle lift
        }
        
        &:active:not(:disabled) {
          background-color: #239360; // Even darker green
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1); // Subtle inset shadow
        }

        &:disabled {
          background-color: ${props => props.theme.colors.neutralGray};
          opacity: 0.7;
          cursor: not-allowed;
        }
      `;
    case 'reject':
      return css`
        background-color: white;
        color: ${props => props.theme.colors.alertAmber};
        border: 1px solid ${props => props.theme.colors.alertAmber};
        
        &:hover:not(:disabled) {
          background-color: ${props => props.theme.colors.disclaimerBg}; // Use theme yellow
          border-color: #EAA008; // Darker amber border
        }
        
        &:active:not(:disabled) {
          background-color: #FDF1B6; // Slightly darker yellow
        }

        &:disabled {
          color: ${props => props.theme.colors.neutralGray};
          border-color: ${props => props.theme.colors.neutralGray};
          opacity: 0.7;
          cursor: not-allowed;
        }
      `;
    default:
      return css``;
  }
};

const StyledButton = styled.button<ButtonProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.25rem;
  font-size: ${props => props.theme.typography.fontSizes.button};
  font-family: ${props => props.theme.typography.fontFamily};
  font-weight: ${props => props.theme.typography.fontWeights.medium};
  border-radius: ${props => props.theme.layout.borderRadius};
  cursor: pointer;
  transition: background-color ${props => props.theme.transitions.default}, 
              color ${props => props.theme.transitions.default},
              border-color ${props => props.theme.transitions.default},
              box-shadow ${props => props.theme.transitions.default},
              opacity ${props => props.theme.transitions.default};
  width: ${props => props.fullWidth ? '100%' : 'auto'};
  line-height: 1.2; // Ensure text aligns well vertically
  
  ${props => getButtonStyles(props.variant || 'primary')}
  
  /* If has icon, add spacing */
  svg {
    margin-right: ${props => props.children ? '0.5rem' : '0'};
  }
`;

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false,
  icon,
  ...rest 
}) => {
  return (
    <StyledButton variant={variant} fullWidth={fullWidth} {...rest}>
      {icon}
      {children}
    </StyledButton>
  );
};

export default Button;
