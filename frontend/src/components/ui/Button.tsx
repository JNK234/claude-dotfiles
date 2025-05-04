import React, { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx'; // Utility for conditionally joining class names

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'approve' | 'reject';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  className?: string; // Allow passing additional Tailwind classes
}

// Define base styles using Tailwind classes
const baseStyles = `
  flex items-center justify-center 
  px-5 py-3 
  text-button font-medium font-primary // Using theme font sizes/weights via tailwind.config.js
  rounded // Using theme border-radius via tailwind.config.js
  cursor-pointer 
  transition duration-default ease-default // Using theme transitions via tailwind.config.js
  border // Add a default border width for variants that need it
  disabled:opacity-70 disabled:cursor-not-allowed
  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-deepMedicalBlue // Added focus state
`;

// Define styles for each variant using Tailwind classes
const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-darkBlue text-white border-transparent
    hover:bg-yellow hover:text-white hover:shadow-small // Corrected hover state
    active:bg-[#E6940A] active:shadow-inner // Darker yellow active state
    disabled:bg-neutralGray disabled:text-white
  `,
  secondary: `
    bg-white text-darkBlue border-darkBlue
    hover:bg-rightPanelBg hover:border-yellow // Light blue bg, yellow border hover
    active:bg-[#F0F2F8] // Slightly darker light blue active
    disabled:text-neutralGray disabled:border-neutralGray
  `,
  tertiary: `
    bg-transparent text-darkBlue border-transparent
    px-2 py-3 // Reduced padding for tertiary
    hover:text-yellow hover:bg-black/5 // Subtle background on hover
    active:text-[#E6940A] // Darker yellow active
    disabled:text-neutralGray
  `,
  approve: `
    bg-successGreen text-white border-transparent
    hover:bg-[#2AAD6F] hover:shadow-small // Darker green hover
    active:bg-[#239360] active:shadow-inner // Even darker green active
    disabled:bg-neutralGray disabled:text-white
  `,
  reject: `
    bg-white text-alertAmber border-alertAmber
    hover:bg-disclaimerBg hover:border-[#EAA008] // Light yellow bg, darker border hover
    active:bg-[#FDF1B6] // Slightly darker yellow active
    disabled:text-neutralGray disabled:border-neutralGray
  `,
};

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false,
  icon,
  className = '', // Default to empty string
  ...rest 
}) => {
  const combinedClasses = clsx(
    baseStyles,
    variantStyles[variant],
    fullWidth ? 'w-full' : 'w-auto',
    className // Combine with any passed classes
  );

  return (
    <button className={combinedClasses} {...rest}>
      {icon && <span className={children ? 'mr-2' : ''}>{icon}</span>} {/* Add margin if text exists */}
      {children}
    </button>
  );
};

export default Button;
