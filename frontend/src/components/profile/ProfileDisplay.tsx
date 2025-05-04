import React from 'react';
import { UserProfileResponse } from '../../services/UserService'; // Import the interface

interface ProfileDisplayProps {
  profile: UserProfileResponse;
}

/**
 * Displays the user's profile information in a read-only format.
 * Includes labels and values for key profile fields.
 * @param profile - The user profile data object.
 */
const ProfileDisplay: React.FC<ProfileDisplayProps> = ({ profile }) => {
  
  // Helper function to format date string
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return 'Invalid Date';
    }
  };

  // Helper function to display optional fields gracefully
  const displayValue = (value: string | null | undefined, placeholder: string = 'Not set') => {
    return value || placeholder;
  };

  return (
    <div className="space-y-4">
      {/* Use grid for better alignment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        <div>
          <label className="block text-sm font-medium text-neutralGray">Full Name</label>
          <p className="mt-1 text-base text-darkText">{displayValue(profile.name, 'N/A')}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutralGray">Email Address</label>
          <p className="mt-1 text-base text-darkText">{displayValue(profile.email, 'N/A')}</p>
         </div>
         <div>
           <label className="block text-sm font-medium text-neutralGray">Professional Title</label>
           <p className="mt-1 text-base text-darkText">{displayValue(profile.profile?.job_title)}</p> {/* Access nested profile */}
         </div>
         <div>
          <label className="block text-sm font-medium text-neutralGray">Account Type</label>
          <p className="mt-1 text-base text-darkText capitalize">{displayValue(profile.subscription_tier, 'N/A')}</p>
        </div>
         <div>
          <label className="block text-sm font-medium text-neutralGray">Date Joined</label>
          <p className="mt-1 text-base text-darkText">{formatDate(profile.created_at)}</p>
        </div>
         {/* Add other fields as needed */}
         {/* 
         <div>
           <label className="block text-sm font-medium text-neutralGray">Company</label>
           <p className="mt-1 text-base text-darkText">{displayValue(profile.company_name)}</p>
         </div>
         <div>
           <label className="block text-sm font-medium text-neutralGray">Phone Number</label>
           <p className="mt-1 text-base text-darkText">{displayValue(profile.phone_number)}</p>
         </div> 
         */}
      </div>
    </div>
  );
};

export default ProfileDisplay;
