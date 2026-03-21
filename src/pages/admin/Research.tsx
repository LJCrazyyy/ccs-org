import React from 'react';
import { FileText } from 'lucide-react';
import { mockResearch } from '../../lib/constants';

export const AdminResearch: React.FC = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Research Management</h1>
      <p className="text-gray-600 mb-8">Manage research projects and publications</p>

      <div className="card">
        <div className="space-y-4">
          {mockResearch.map((research) => (
            <div key={research.id} className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800">{research.title}</h3>
              <p className="text-sm text-gray-600">By: {research.author}</p>
              <div className="flex gap-4 mt-2 text-sm">
                <span className="text-gray-700">Year: {research.year}</span>
                <span className={`px-2 py-1 rounded ${research.status === 'Published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {research.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
