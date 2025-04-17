import React, { useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';

const LoginContainer = styled.div`
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
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  color: #0f172a;
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

const GoogleButton = styled(Button)`
  background-color: white;
  color: #171848;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
  
  &:hover {
    background-color: #f8fafc;
  }
`;

const ErrorMessage = styled.div`
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #fee2e2;
  color: #b91c1c;
  border-radius: 0.25rem;
  font-size: 0.875rem;
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  margin: 1.5rem 0;
  
  &::before,
  &::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid #e2e8f0;
  }
  
  span {
    margin: 0 1rem;
    color: #64748b;
    font-size: 0.875rem;
  }
`;

const SecondaryButton = styled(Button)`
  background-color: white;
  color: #171848;
  border: 1px solid #171848;
  margin-top: 1rem;
  
  &:hover {
    background-color: #f8fafc;
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

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, error, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/app" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/app');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      // Implement Google login logic here using your auth service
      console.log('Google login clicked');
    } catch (error) {
      console.error('Google login failed:', error);
    }
  };

  return (
    <LoginContainer>
      <LogoContainer>
        <LogoImage src="/favicon/android-chrome-192x192.png" alt="Medhastra Logo" />
        <LogoText>MedAstra AI</LogoText>
      </LogoContainer>
      <AuthForm onSubmit={handleSubmit}>
        <FormTitle>Welcome Back</FormTitle>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        <FormGroup>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </FormGroup>
        
        <Button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Log in'}
        </Button>

        <SecondaryButton type="button" onClick={() => navigate('/register')}>
          Create New Account
        </SecondaryButton>

        <GoogleButton type="button" onClick={handleGoogleLogin}>
          <FcGoogle size={20} />
          Continue with Google
        </GoogleButton>

        <LinkText>
          <a href="/forgot-password">Forgot your password?</a>
        </LinkText>

        <LinkText>
          By continuing, you agree to our{' '}
          <a href="/terms">Terms of Service</a> and{' '}
          <a href="/privacy">Privacy Policy</a>
        </LinkText>
      </AuthForm>
    </LoginContainer>
  );
};

export default Login;