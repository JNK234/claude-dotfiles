import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button'; // Assuming Button component exists

/**
 * @component EmailConfirmedLoginPage
 * @description Page displayed after a user clicks the email confirmation link
 * when the desired flow is to require a manual login afterwards.
 * It simply informs the user their email is confirmed and prompts them to log in.
 *
 * @example
 * <Route path="/email-confirmed-login" element={<EmailConfirmedLoginPage />} />
 */
const EmailConfirmedLoginPage: React.FC = () => {
  // Note: This component intentionally does NOT use useAuth or useEffect
  // to check authentication state or auto-redirect. Its sole purpose is
  // to inform the user and provide a path to login.

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h1 className="mt-4 text-2xl font-semibold text-gray-800">Email Confirmed!</h1>
      <p className="mt-2 text-center text-gray-600 max-w-md">
        Your email address has been successfully verified. Please log in to access your account.
      </p>
      <div className="mt-6">
        <Link to="/login">
          {/* Removed size="lg", added Tailwind classes for larger size */}
          <Button variant="primary" className="px-8 py-3 text-lg"> 
            Go to Login
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default EmailConfirmedLoginPage;
