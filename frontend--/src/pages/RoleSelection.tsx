import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, Shield } from 'lucide-react';

type Role = 'student' | 'faculty' | 'admin';

interface RoleOption {
  id: Role;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const roles: RoleOption[] = [
  {
    id: 'student',
    title: 'Student',
    description: 'View your courses, grades, and academic progress',
    icon: <BookOpen size={48} />,
  },
  {
    id: 'faculty',
    title: 'Faculty',
    description: 'Manage courses, grades, and student performance',
    icon: <Users size={48} />,
  },
  {
    id: 'admin',
    title: 'Administrator',
    description: 'Manage users, courses, and system settings',
    icon: <Shield size={48} />,
  },
];

export const RoleSelection: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const navigate = useNavigate();

  const handleContinue = () => {
    if (selectedRole) {
      navigate(`/${selectedRole}-login`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-orange-50 to-orange-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-orange-900 mb-2">
            Academic Management System
          </h1>
          <p className="text-lg text-orange-700">
            Select your role to access the dashboard
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              className={`relative p-8 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
                selectedRole === role.id
                  ? 'border-orange-500 bg-white shadow-2xl scale-105'
                  : 'border-orange-200 bg-white/80 shadow-lg hover:shadow-xl hover:border-orange-400'
              }`}
            >
              {/* Selection Indicator */}
              {selectedRole === role.id && (
                <div className="absolute top-4 right-4 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}

              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className={`p-4 rounded-full transition-all ${
                  selectedRole === role.id
                    ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white'
                    : 'bg-orange-100 text-orange-500 group-hover:bg-orange-200'
                }`}>
                  {role.icon}
                </div>
              </div>

              {/* Title */}
              <h3 className={`text-2xl font-bold mb-3 transition-colors ${
                selectedRole === role.id
                  ? 'text-orange-900'
                  : 'text-gray-800'
              }`}>
                {role.title}
              </h3>

              {/* Description */}
              <p className={`text-sm transition-colors ${
                selectedRole === role.id
                  ? 'text-orange-700'
                  : 'text-gray-600'
              }`}>
                {role.description}
              </p>
            </button>
          ))}
        </div>

        {/* Continue Button */}
        <div className="flex justify-center">
          <button
            onClick={handleContinue}
            disabled={!selectedRole}
            className={`px-12 py-3 rounded-xl font-semibold text-lg transition-all duration-300 ${
              selectedRole
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Continue as {selectedRole ? selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1) : 'Role'}
          </button>
        </div>

        {/* Footer Info */}
        <div className="mt-16 text-center text-orange-700 text-sm">
          <p>Pamantasan ng Cabuyao • Academic Management System</p>
        </div>
      </div>
    </div>
  );
};
