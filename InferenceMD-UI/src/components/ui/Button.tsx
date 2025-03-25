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
        background-color: ${props => props.theme.colors.deepMedicalBlue};
        color: white;
        border: none;
        
        &:hover {
          background-color: #22538C; /* Slightly darker blue */
        }
        
        &:active {
          background-color: #1B4370; /* Even darker blue */
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
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
        color: ${props => props.theme.colors.deepMedicalBlue};
        border: 1px solid ${props => props.theme.colors.deepMedicalBlue};
        
        &:hover {
          background-color: #F0F7FF;
        }
        
        &:active {
          background-color: #E1EFFF;
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
        color: ${props => props.theme.colors.deepMedicalBlue};
        border: none;
        text-decoration: none;
        
        &:hover {
          text-decoration: underline;
        }
        
        &:active {
          color: #1B4370; /* Darker blue */
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
        
        &:hover {
          background-color: #27A067; /* Slightly darker green */
        }
        
        &:active {
          background-color: #1D8954; /* Even darker green */
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
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
        
        &:hover {
          background-color: #FEF9C3;
        }
        
        &:active {
          background-color: #FEF3B4;
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
  transition: all ${props => props.theme.transitions.default};
  width: ${props => props.fullWidth ? '100%' : 'auto'};
  
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