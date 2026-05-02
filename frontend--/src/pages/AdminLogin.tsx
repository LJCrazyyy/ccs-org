import React from 'react';
import { RoleBasedLogin } from './RoleBasedLogin';

export const AdminLogin: React.FC = () => {
  return <RoleBasedLogin role="admin" roleLabel="Administrator" />;
};
