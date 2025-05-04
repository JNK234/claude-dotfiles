import React, { useState } from 'react';
// import styled from 'styled-components'; // Removed styled-components import
import { useNavigate, Link } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../contexts/AuthContext';

// --- Styled Component Definitions Removed ---
// const LoginContainer = styled.div`...`;
// const LogoContainer = styled.div`...`;
// const LogoImage = styled.img`...`;
// const LogoText = styled.div`...`;
// const AuthForm = styled.form`...`;
// const FormTitle = styled.h1`...`;
// const FormGroup = styled.div`...`;
// const Label = styled.label`...`;
// const Input = styled.input`...`;
// const Button = styled.button`...`;
// const GoogleButton = styled(Button)`...`;
// const SecondaryButton = styled(Button)`...`;
// const LinkText = styled.p`...`;
// const ErrorMessage = styled.div`...`;
// --- End of Removed Definitions ---

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, signInWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await signIn(email, password);
      navigate('/app');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
    }
  };

  // --- Define Tailwind classes for buttons ---
  // Base classes for all buttons in this form
  const baseButtonClasses = "w-full py-3 px-4 text-base font-medium rounded cursor-pointer transition duration-150 ease-in-out disabled:bg-neutralGray disabled:text-gray-500 disabled:border-neutralGray disabled:cursor-not-allowed";
  // Primary button specific classes (Dark blue bg, white text, yellow hover)
  const primaryButtonClasses = `${baseButtonClasses} bg-darkBlue text-white hover:bg-yellow`;
  // Secondary button specific classes (White bg, dark blue text/border, light gray hover)
  const secondaryButtonClasses = `${baseButtonClasses} mt-4 bg-white text-darkBlue border border-darkBlue hover:bg-gray-100`;
  // Google button specific classes (White bg, dark blue text, gray border, light gray hover)
  const googleButtonClasses = `${baseButtonClasses} mt-4 bg-white text-darkBlue border border-gray-300 flex items-center justify-center gap-2 hover:bg-gray-100`;
  // --- End of Tailwind class definitions ---

  return (
    // Replaced LoginContainer with div and Tailwind classes
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-[#f5f8fa]">
      {/* Replaced LogoContainer with div and Tailwind classes */}
      <div className="flex flex-col items-center mb-8">
        {/* Replaced LogoImage with img and Tailwind classes */}
        <img src="/favicon/android-chrome-192x192.png" alt="Medhastra Logo" className="w-20 h-20 mb-4" />
        {/* Replaced LogoText with div and Tailwind classes */}
        <div className="text-3xl font-bold text-darkBlue">Medhastra AI</div>
      </div>
      {/* Replaced AuthForm with form and Tailwind classes */}
      <form onSubmit={handleSubmit} className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        {/* Replaced FormTitle with h1 and Tailwind classes */}
        <h1 className="mb-6 text-2xl font-medium text-center text-gray-900">Welcome Back</h1>

        {/* Replaced ErrorMessage with div and Tailwind classes */}
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm text-center">{error}</div>}

        {/* Replaced FormGroup with div and Tailwind classes */}
        <div className="mb-6">
          {/* Replaced Label with label and Tailwind classes */}
          <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-600">Email</label>
          {/* Replaced Input with input and Tailwind classes */}
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} // Added type annotation
            required
            disabled={isLoading}
            className="w-full p-3 border border-gray-300 rounded text-base transition duration-150 ease-in-out focus:outline-none focus:border-deepMedicalBlue focus:ring-3 focus:ring-deepMedicalBlue/20" // Updated focus styles
          />
        </div>

        {/* Replaced FormGroup with div and Tailwind classes */}
        <div className="mb-6">
          {/* Replaced Label with label and Tailwind classes */}
          <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-600">Password</label>
          {/* Replaced Input with input and Tailwind classes */}
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} // Added type annotation
            required
            disabled={isLoading}
            className="w-full p-3 border border-gray-300 rounded text-base transition duration-150 ease-in-out focus:outline-none focus:border-deepMedicalBlue focus:ring-3 focus:ring-deepMedicalBlue/20" // Updated focus styles
          />
        </div>

        {/* Replaced Button with button and Tailwind classes */}
        <button type="submit" disabled={isLoading} className={primaryButtonClasses}>
          {isLoading ? 'Signing in...' : 'Log in'}
        </button>

        {/* Replaced SecondaryButton with button and Tailwind classes */}
        <button type="button" onClick={() => navigate('/signup')} disabled={isLoading} className={secondaryButtonClasses}>
          Create New Account
        </button>

        {/* Replaced GoogleButton with button and Tailwind classes */}
        <button type="button" onClick={handleGoogleLogin} disabled={isLoading} className={googleButtonClasses}>
          <FcGoogle size={20} />
          Continue with Google
        </button>

        {/* Replaced LinkText with p and Tailwind classes */}
        <p className="mt-4 text-sm text-center text-gray-600">
          <Link to="/forgot-password" className="font-medium text-darkBlue hover:underline">Forgot your password?</Link>
        </p>

        {/* Replaced LinkText with p and Tailwind classes */}
        <p className="mt-4 text-sm text-center text-gray-600">
          By continuing, you agree to our{' '}
          <Link to="/terms" className="font-medium text-darkBlue hover:underline">Terms of Service</Link> and{' '}
          <Link to="/privacy" className="font-medium text-darkBlue hover:underline">Privacy Policy</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
