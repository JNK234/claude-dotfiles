import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string; // Tailwind color class like 'text-blue-500'
  className?: string; // Allow additional custom classes
}

/**
 * @component Spinner
 * @description A simple SVG loading spinner component.
 * Uses Tailwind CSS for styling and animation.
 *
 * @param {object} props - Component props
 * @param {'sm' | 'md' | 'lg'} [props.size='md'] - Size of the spinner.
 * @param {string} [props.color='text-blue-600'] - Tailwind text color class for the spinner.
 * @param {string} [props.className] - Additional CSS classes to apply.
 *
 * @example
 * <Spinner size="lg" color="text-green-500" />
 */
export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'text-blue-600', // Default color
  className = '',
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <svg
      className={`animate-spin ${sizeClasses[size]} ${color} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-label="Loading..."
      role="status"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
};
