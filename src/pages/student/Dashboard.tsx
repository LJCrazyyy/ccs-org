import React from 'react';
import { Award, Calendar, BookOpen, FileText } from 'lucide-react';
import { mockGrades, mockSchedule, mockEvents } from '../../lib/constants';

export const StudentDashboard: React.FC = () => {
  const recentGrades = mockGrades.slice(0, 2);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Student Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome! Here's your academic overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">GPA</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">3.85</p>
            </div>
            <Award className="text-purple-500" size={32} />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Completed Courses</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">12</p>
            </div>
            <BookOpen className="text-blue-500" size={32} />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Current Classes</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">5</p>
            </div>
            <Calendar className="text-green-500" size={32} />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Research Papers</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">3</p>
            </div>
            <FileText className="text-orange-500" size={32} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Grades</h2>
            <div className="space-y-3">
              {recentGrades.map((grade) => (
                <div key={grade.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-800">{grade.courseCode}</p>
                    <p className="text-xs text-gray-600">{grade.semester}</p>
                  </div>
                  <span className="bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded">{grade.grade}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Upcoming Events</h2>
          <div className="space-y-3">
            {mockEvents.slice(0, 3).map((event) => (
              <div key={event.id} className="border-l-4 border-primary pl-3 py-2">
                <p className="text-sm font-semibold text-gray-800">{event.title}</p>
                <p className="text-xs text-gray-600">{event.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
