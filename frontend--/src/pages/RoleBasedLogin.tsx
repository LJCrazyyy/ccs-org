import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, ArrowLeft } from 'lucide-react';

const getErrorMessage = (errorCode: string): string => {
  const errorMap: Record<string, string> = {
    'auth/invalid-email': 'Please enter a valid email address',
    'auth/user-disabled': 'This account has been disabled. Contact support.',
    'auth/user-not-found': 'No account exists with this email. Check the email address or create an account first.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid email or password. Please check both and try again.',
    'auth/too-many-requests': 'Too many failed login attempts. Please try again later.',
    'auth/operation-not-allowed': 'Login is currently unavailable. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your internet connection.',
    'auth/internal-error': 'An error occurred. Please try again later.',
  };
  return errorMap[errorCode] || 'Login failed. Please check your email and password.';
};

interface StudentLoginProps {
  role: 'student' | 'faculty' | 'admin';
  roleLabel: string;
}

export const RoleBasedLogin: React.FC<StudentLoginProps> = ({ role, roleLabel }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  
  const { login, isLoading: authLoading, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user && !authLoading) {
      const nextPath = role === 'admin' ? '/dashboard/admin/subjects' : `/dashboard/${role}`;
      navigate(nextPath, { replace: true });
    }
  }, [isAuthenticated, user, authLoading, navigate, role]);

  const validateEmail = (value: string): string => {
    if (!value.trim()) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Please enter a valid email address';
    return '';
  };

  const validatePassword = (value: string): string => {
    if (!value) return 'Password is required';
    if (value.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setGeneralError('');
    setEmailError('');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    setGeneralError('');
    setPasswordError('');
  };

  const handleEmailBlur = () => {
    setEmailError(validateEmail(email));
  };

  const handlePasswordBlur = () => {
    setPasswordError(validatePassword(password));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');

    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);

    if (emailErr || passwordErr) {
      setEmailError(emailErr);
      setPasswordError(passwordErr);
      return;
    }

    try {
      console.log('[LOGIN] Submitting login form for:', email);
      await login(email.trim(), password);
    } catch (err: any) {
      const errorCode = err?.code || '';
      const errorMsg = err?.message || 'Login failed. Please check your email and password.';
      const resolvedMessage = errorCode ? getErrorMessage(errorCode) : errorMsg;

      console.error('[LOGIN] Form login error:', { code: errorCode, message: errorMsg });
      setGeneralError(resolvedMessage);
    }
  };

  const quickLogin = async (credentials: { email: string; password: string }) => {
    setGeneralError('');
    setEmailError('');
    setPasswordError('');
    try {
      console.log('[LOGIN] Quick login attempt for:', credentials.email);
      await login(credentials.email.trim(), credentials.password);
    } catch (err: any) {
      const errorCode = err?.code || '';
      const errorMsg = err?.message || 'Login failed. Please check your email and password.';
      const resolvedMessage = errorCode ? getErrorMessage(errorCode) : errorMsg;

      console.error('[LOGIN] Quick login error:', { code: errorCode, message: errorMsg, email: credentials.email });
      setGeneralError(resolvedMessage);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-orange-50 to-orange-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-orange-700 font-medium">Signing in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-orange-50 to-orange-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate('/role-selection')}
          className="mb-6 flex items-center gap-2 text-orange-700 hover:text-orange-900 font-medium transition"
        >
          <ArrowLeft size={20} />
          Back to Roles
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-orange-900 mb-2">{roleLabel} Login</h1>
          <p className="text-orange-700">Sign in to your {roleLabel.toLowerCase()} account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6 border border-orange-100">
          {generalError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-red-700 text-sm font-medium">Unable to sign in</p>
                <p className="text-red-600 text-sm mt-1">{generalError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-orange-900 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                onBlur={handleEmailBlur}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 outline-none transition ${
                  emailError ? 'border-red-300 focus:ring-red-200 bg-red-50' : 'border-orange-200 focus:ring-orange-300 focus:border-orange-400'
                }`}
                placeholder="your.email@example.com"
              />
              {emailError && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={14} /> {emailError}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-orange-900 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={handlePasswordChange}
                onBlur={handlePasswordBlur}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 outline-none transition ${
                  passwordError ? 'border-red-300 focus:ring-red-200 bg-red-50' : 'border-orange-200 focus:ring-orange-300 focus:border-orange-400'
                }`}
                placeholder="••••••••"
              />
              {passwordError && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={14} /> {passwordError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold py-3 rounded-lg transition-colors mt-4 disabled:opacity-50"
            >
              Sign In
            </button>
          </form>
        </div>

        {/* Demo Accounts Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-orange-100">
          <h3 className="text-sm font-semibold text-orange-900 mb-4 text-center uppercase tracking-wider">Demo {roleLabel} Account</h3>
          <button
            onClick={() =>
              quickLogin({
                email: role === 'student' ? 'student@example.com' : role === 'faculty' ? 'faculty@example.com' : 'admin@example.com',
                password: role === 'student' ? 'student123' : role === 'faculty' ? 'faculty123' : 'admin123',
              })
            }
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-2.5 rounded-lg text-sm font-medium transition shadow-md hover:shadow-lg transform hover:scale-105"
          >
            Quick {roleLabel} Login
          </button>
        </div>
      </div>
    </div>
  );
};
