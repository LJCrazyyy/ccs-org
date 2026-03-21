import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    const success = login(email, password);
    if (success) {
      navigate('/dashboard/admin');
    } else {
      setError('Invalid credentials. Try: admin@example.com / student@example.com / faculty@example.com (password: admin123/student123/faculty123)');
    }
  };

  const quickLogin = (cred: { email: string; password: string }) => {
    const success = login(cred.email, cred.password);
    if (success) {
      const role = cred.email.split('@')[0];
      navigate(`/dashboard/${role}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-main flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center gap-4 mb-4">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-rglFWmLitQbBPWPvlaUmQHDHI2YiM8.png"
              alt="University of Cabuyao"
              className="h-16 w-16 rounded-full"
            />
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-JiGNt42HwaPEYoifHlLe8u2pfYzP0m.png"
              alt="College of Computing Studies"
              className="h-16 w-16 rounded-full"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Education Management System
          </h1>
          <p className="text-gray-600">University of Cabuyao</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Login</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              Sign In
            </button>
          </form>
        </div>

        {/* Quick Login Options */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 text-center">
            Quick Login Demo
          </h3>
          <div className="space-y-3">
            <button
              onClick={() => quickLogin({ email: 'admin@example.com', password: 'admin123' })}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-medium transition"
            >
              Admin Login
            </button>
            <button
              onClick={() => quickLogin({ email: 'student@example.com', password: 'student123' })}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-medium transition"
            >
              Student Login
            </button>
            <button
              onClick={() => quickLogin({ email: 'faculty@example.com', password: 'faculty123' })}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg font-medium transition"
            >
              Faculty Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
