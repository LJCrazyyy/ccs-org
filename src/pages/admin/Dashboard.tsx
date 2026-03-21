import React from 'react';
import { Users, Users2, BookOpen, BarChart3 } from 'lucide-react';
import { mockStudents, mockFaculty, mockClasses } from '../../lib/constants';

export const AdminDashboard: React.FC = () => {
  const stats = [
    { label: 'Total Students', value: mockStudents.length, icon: Users, color: 'bg-blue-500' },
    { label: 'Total Faculty', value: mockFaculty.length, icon: Users2, color: 'bg-green-500' },
    { label: 'Active Classes', value: mockClasses.length, icon: BookOpen, color: 'bg-purple-500' },
    { label: 'Total Programs', value: 4, icon: BarChart3, color: 'bg-orange-500' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to the administration panel</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="text-white" size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Students</h2>
          <div className="space-y-3">
            {mockStudents.slice(0, 3).map((student) => (
              <div key={student.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-800">{student.name}</p>
                  <p className="text-xs text-gray-600">{student.idNumber}</p>
                </div>
                <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">{student.year}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Faculty</h2>
          <div className="space-y-3">
            {mockFaculty.slice(0, 3).map((faculty) => (
              <div key={faculty.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-800">{faculty.name}</p>
                  <p className="text-xs text-gray-600">{faculty.department}</p>
                </div>
                <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full">{faculty.specialization}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
