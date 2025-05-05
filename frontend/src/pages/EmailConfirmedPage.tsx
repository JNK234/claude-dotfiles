import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Spinner } from '../components/ui/Spinner'; // Assuming you have a Spinner component

/**
 * @component EmailConfirmedPage
 * @description Page displayed after a user clicks the email confirmation link.
 * It waits for the authentication state to be confirmed by AuthContext
 * (which detects the session from the URL fragment provided by Supabase),
 * shows a success message, and then redirects the user to the main app.
 *
 * @example
 * <Route path="/email-confirmed" element={<EmailConfirmedPage />} />
 */
const EmailConfirmedPage: React.FC = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Don't do anything until the AuthContext has finished loading the session info
    if (authLoading) {
      return;
    }

    // Once loading is done, check if authentication was successful
    if (isAuthenticated) {
      console.log('[EmailConfirmedPage] User is authenticated. Redirecting soon...');
      // Wait a moment to show the success message, then redirect
      const timer = setTimeout(() => {
        // Redirect to the main dashboard or appropriate authenticated route
        // TODO: Adjust '/dashboard' if your main authenticated route is different (e.g., '/')
        navigate('/dashboard', { replace: true });
      }, 2500); // 2.5 second delay

      // Cleanup the timer if the component unmounts early
      return () => clearTimeout(timer);
    } else {
      // If authentication failed after loading (e.g., invalid token), show error and redirect to login
      console.error('[EmailConfirmedPage] Authentication failed after email confirmation attempt.');
      const errorTimer = setTimeout(() => {
        navigate('/login', { replace: true }); // Redirect to login page
      }, 4000); // Longer delay for error message

      return () => clearTimeout(errorTimer);
    }
  }, [isAuthenticated, authLoading, navigate]);

  // --- Render Logic ---

  // Show loading spinner while AuthContext is processing the session
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <Spinner size="lg" />
        <p className="mt-4 text-lg text-gray-600">Verifying your email...</p>
      </div>
    );
  }

  // Show success message if authenticated
  if (isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-cyan-50 p-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h1 className="mt-4 text-2xl font-semibold text-gray-800">Email Confirmed Successfully!</h1>
        <p className="mt-2 text-center text-gray-600">
          Your account is now active. Redirecting you to the application...
        </p>
      </div>
    );
  }

  // Show error message if authentication failed
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-yellow-50 p-4">
       <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
         <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
       </svg>
      <h1 className="mt-4 text-2xl font-semibold text-red-700">Verification Failed</h1>
      <p className="mt-2 text-center text-gray-600">
        There was an issue verifying your email. This might be due to an expired or invalid link.
        You will be redirected to the login page shortly. Please try logging in, or request a new confirmation email if needed.
      </p>
    </div>
  );
};

export default EmailConfirmedPage;
