import React, { useState, useEffect } from 'react';
import { UserX } from 'lucide-react';
import { Card, SectionHeader, LoadingSpinner, ErrorMessage, SuccessMessage } from '../../components/ui/shared';
import { apiUrl } from '../../lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin';
  createdAt?: string;
}

interface UserFormData {
  name: string;
  email: string;
  password: string;
}

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(apiUrl('/api/admin/users/admins'));
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to fetch admin users');
      }

      const adminUsers = await response.json();
      setUsers(Array.isArray(adminUsers) ? adminUsers : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      setError('Name, email, and password are required.');
      return;
    }

    try {
      setError(null);
      const response = await fetch(apiUrl('/api/auth/create-admin'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to create admin user');
      }

      const createdAdmin = await response.json();
      const userData: User = {
        id: createdAdmin.uid,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        role: 'admin',
        createdAt: new Date().toISOString(),
      };
      setSuccess('Admin created successfully. Use these credentials to sign in.');
      setShowForm(false);
      resetForm();
      await fetchUsers();
    } catch (err: any) {
      setError(err?.message || 'Failed to create admin user');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
    });
  };

  const getCreatedDate = (user: User) => {
    if (!user.createdAt) return 'N/A';
    const parsed = new Date(user.createdAt);
    return Number.isNaN(parsed.getTime()) ? 'N/A' : parsed.toLocaleDateString();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <SectionHeader
        title="Admin Accounts"
        subtitle="Create admin login credentials for dashboard access"
        action={{
          label: 'Add Admin',
          onClick: () => {
            resetForm();
            setShowForm(true);
          },
        }}
      />

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
      {success && <SuccessMessage message={success} onDismiss={() => setSuccess(null)} />}

      {showForm && (
        <Card title="Add New Admin" className="mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
              >
                Create Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getCreatedDate(user)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="text-center py-12">
              <UserX size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No admin accounts found</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
