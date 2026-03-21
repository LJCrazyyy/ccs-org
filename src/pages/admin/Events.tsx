import React from 'react';
import { CalendarDays } from 'lucide-react';
import { mockEvents } from '../../lib/constants';

export const AdminEvents: React.FC = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Events Management</h1>
      <p className="text-gray-600 mb-8">Manage academic events and activities</p>

      <div className="card">
        <div className="space-y-4">
          {mockEvents.map((event) => (
            <div key={event.id} className="border-l-4 border-primary pl-4 py-3">
              <h3 className="font-semibold text-gray-800">{event.title}</h3>
              <p className="text-sm text-gray-600">{event.date}</p>
              <p className="text-sm text-gray-700 mt-1">{event.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
