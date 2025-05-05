import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate, Link } from 'react-router-dom';
import { AuthService } from '../services/AuthService';

const ForgotPasswordContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background-color: #f5f8fa;
`;

const LogoContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2rem;
`;

const LogoImage = styled.img`
  width: 80px;
  height: 80px;
  margin-bottom: 1rem;
`;

const LogoText = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #171848;
`;

const AuthForm = styled.form`
  width: 100%;
  max-width: 400px;
  padding: 2rem;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const FormTitle = styled.h1`
  margin-bottom: 1rem;
  font-size: 1.5rem;
  color: #0f172a;
  text-align: center;
`;

const FormDescription = styled.p`
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
  color: #64748b;
  text-align: center;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.25rem;
  font-size: 1rem;
  transition: border-color 0.15s ease-in-out;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 0.75rem;
  background-color: #171848;
  color: white;
  font-size: 1rem;
  font-weight: 500;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: background-color 0.15s ease-in-out;
  
  &:hover {
    background-color: #232661;
  }
  
  &:disabled {
    background-color: #94a3b8;
    cursor: not-allowed;
  }
`;

const LinkText = styled.p`
  text-align: center;
  margin-top: 1rem;
  font-size: 0.875rem;
  color: #64748b;
  
  a {
    color: #171848;
    text-decoration: none;
    font-weight: 500;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const SuccessMessage = styled.div`
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #dcfce7;
  color: #166534;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  text-align: center;
`;

const ErrorMessage = styled.div`
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #fee2e2;
  color: #b91c1c;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  text-align: center;
`;

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    setIsSubmitted(false); // Reset submitted state on new attempt

    try {
      // Call the correct service method which uses Supabase
      await AuthService.resetPassword(email);
      // Supabase handles sending the email. Show success message.
      setIsSubmitted(true);
    } catch (err: any) {
      // Use the error message from Supabase or a generic one
      setError(err.message || 'Failed to send reset instructions. Please check the email address and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ForgotPasswordContainer>
      <LogoContainer>
        <LogoImage src="/favicon/android-chrome-192x192.png" alt="Medhastra Logo" />
        <LogoText>Medhastra AI</LogoText>
      </LogoContainer>
      <AuthForm onSubmit={handleSubmit}>
        <FormTitle>Reset Password</FormTitle>
        <FormDescription>
          Enter your email address and we'll send you instructions to reset your password.
        </FormDescription>

        {error && <ErrorMessage>{error}</ErrorMessage>}
        {isSubmitted && (
          <SuccessMessage>
            If an account exists with this email, you will receive password reset instructions shortly.
          </SuccessMessage>
        )}
        
        <FormGroup>
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isSubmitted || isLoading}
          />
        </FormGroup>
        
        <Button type="submit" disabled={isSubmitted || isLoading}>
          {isLoading ? 'Sending...' : isSubmitted ? 'Instructions Sent' : 'Send Reset Instructions'}
        </Button>

        <LinkText>
          Remember your password? <Link to="/login">Log in</Link>
        </LinkText>
      </AuthForm>
    </ForgotPasswordContainer>
  );
};

export default ForgotPassword;
