import React from 'react';
import { UserStats } from '../../services/UserService'; // Import the interface

interface StatsDisplayProps {
  stats: UserStats;
}

/**
 * Displays user statistics like subscription tier and cases processed.
 * @param stats - The user statistics data object.
 */
const StatsDisplay: React.FC<StatsDisplayProps> = ({ stats }) => {
  
  // Helper function to display optional fields gracefully
  const displayValue = (value: string | number | null | undefined, placeholder: string = 'N/A') => {
    // Handle 0 explicitly for cases_processed
    if (value === 0) return '0'; 
    return value || placeholder;
  };

  return (
    <div className="space-y-4">
      {/* Use grid for better alignment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        <div>
          <label className="block text-sm font-medium text-neutralGray">Subscription Tier</label>
          <p className="mt-1 text-base text-darkText capitalize">
            {displayValue(stats.subscription_tier)}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutralGray">Cases Processed</label>
          <p className="mt-1 text-base text-darkText">
            {displayValue(stats.cases_processed)}
          </p>
        </div>
        {/* Add more stats here if needed in the future */}
      </div>
    </div>
  );
};

export default StatsDisplay;
