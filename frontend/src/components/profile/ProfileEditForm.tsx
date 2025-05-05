import React, { useState } from 'react';
import { ProfileUpdate } from '../../services/UserService'; // Import the interface
import Button from '../ui/Button'; // Assuming Button component exists

interface ProfileEditFormProps {
  initialData: {
    name?: string | null;
    job_title?: string | null;
  };
  onSave: (updatedData: ProfileUpdate) => Promise<void>; // Make onSave async
  onCancel: () => void;
  isSaving: boolean; // To disable form while saving
}

/**
 * A form for editing user profile information (Name, Title).
 * Handles form state, input changes, and submission.
 * @param initialData - The current profile data to pre-fill the form.
 * @param onSave - Async function to call when the form is submitted with valid data.
 * @param onCancel - Function to call when the cancel button is clicked.
 * @param isSaving - Boolean indicating if the save operation is in progress.
 */
const ProfileEditForm: React.FC<ProfileEditFormProps> = ({ 
  initialData, 
  onSave, 
  onCancel,
  isSaving 
}) => {
  const [formData, setFormData] = useState<ProfileUpdate>({
    name: initialData.name ?? '', // Use empty string as default for controlled input
    job_title: initialData.job_title ?? '', // Use empty string as default
  });
  const [error, setError] = useState<string | null>(null);

  /**
   * Handles changes in form input fields.
   * Updates the corresponding field in the formData state.
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  /**
   * Handles form submission.
   * Performs basic validation and calls the onSave prop.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors

    // Basic validation (e.g., name should not be empty)
    if (!formData.name?.trim()) {
      setError('Full Name cannot be empty.');
      return;
    }

    // Prepare data to save, ensuring types match ProfileUpdate (string | undefined)
    const trimmedJobTitle = formData.job_title?.trim(); // Get trimmed string or undefined
    const dataToSave: ProfileUpdate = {
        name: formData.name.trim(),
        job_title: trimmedJobTitle || undefined // Ensure job_title is string | undefined
    };

    try {
      await onSave(dataToSave);
      // Success handling (e.g., showing a message) is managed by the parent component (ProfilePage)
    } catch (err) {
      // Error handling is managed by the parent component, but we could show local errors too
      setError(err instanceof Error ? err.message : 'An unexpected error occurred during save.');
      console.error("Error in form submission:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded text-sm">
          {error}
        </div>
      )}
      {/* Grid layout for form fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-neutralGray mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={isSaving}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-deepMedicalBlue focus:border-deepMedicalBlue disabled:bg-gray-100"
          />
        </div>
        <div>
          <label htmlFor="job_title" className="block text-sm font-medium text-neutralGray mb-1">
            Professional Title
          </label>
          <input
            type="text"
             id="job_title"
             name="job_title"
             value={formData.job_title ?? ''} // Ensure value is string or undefined (use ?? '')
             onChange={handleChange}
             disabled={isSaving}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-deepMedicalBlue focus:border-deepMedicalBlue disabled:bg-gray-100"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4">
        <Button 
          type="button" // Important: type="button" to prevent form submission
          variant="secondary" 
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          variant="primary"
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
};

export default ProfileEditForm;
