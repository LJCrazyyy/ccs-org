import React from 'react';
import { RoleBasedLogin } from './RoleBasedLogin';

export const StudentLogin: React.FC = () => {
  return <RoleBasedLogin role="student" roleLabel="Student" />;
};
