import React, { useState, useEffect } from 'react';
import UserService, { UserProfileResponse, UserStats, ProfileUpdate } from '../services/UserService';
import ProfileDisplay from '../components/profile/ProfileDisplay';
import ProfileEditForm from '../components/profile/ProfileEditForm';
import StatsDisplay from '../components/profile/StatsDisplay';
import Button from '../components/ui/Button'; // Assuming Button component exists

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  /**
   * Fetches profile and stats data on component mount.
   */
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch profile and stats in parallel
        const [profileData, statsData] = await Promise.all([
          UserService.getUserProfile(),
          UserService.getUserStats()
        ]);
        setProfile(profileData);
        setStats(statsData);
      } catch (err) {
        console.error("Error fetching profile data:", err);
        setError(err instanceof Error ? err.message : 'Failed to load profile data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []); // Empty dependency array ensures this runs only once on mount

  /**
   * Handles saving the updated profile information.
   * @param updatedData - The data from the edit form.
   */
  const handleSaveProfile = async (updatedData: ProfileUpdate) => {
    if (!profile) return;

    setIsLoading(true); // Indicate loading during save
    setError(null);
    try {
      const updatedProfile = await UserService.updateUserProfile(updatedData);
      setProfile(updatedProfile); // Update local state with the response
      setIsEditing(false); // Exit editing mode
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err instanceof Error ? err.message : 'Failed to save profile.');
    } finally {
      setIsLoading(false);
    }
  };

  // Render loading state
  if (isLoading && !profile) { // Show initial loading indicator
    return <div className="p-8 text-center">Loading profile...</div>;
  }

  // Render error state
  if (error) {
    return <div className="p-8 text-center text-red-600">Error: {error}</div>;
  }

  // Render profile not found (shouldn't happen if user is authenticated)
  if (!profile) {
    return <div className="p-8 text-center">Could not load profile information.</div>;
  }

  // Main profile page content
  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-darkText">Your Profile</h1>

      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-darkBlue">Account Information</h2>
         {isEditing ? (
           <ProfileEditForm 
             initialData={{ name: profile.name, job_title: profile.profile?.job_title }} // Access nested profile data
             onSave={handleSaveProfile} 
             onCancel={() => setIsEditing(false)}
            isSaving={isLoading} // Pass loading state to disable form during save
          />
        ) : (
          <>
            <ProfileDisplay profile={profile} />
            <Button onClick={() => setIsEditing(true)} variant="primary" className="mt-6">Edit Profile</Button>
          </>
        )}
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-darkBlue">Account Statistics</h2>
        {stats ? (
           <StatsDisplay stats={stats} />
        ) : isLoading ? (
          <p>Loading stats...</p>
        ) : (
          <p className="text-neutralGray">Could not load statistics.</p>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
