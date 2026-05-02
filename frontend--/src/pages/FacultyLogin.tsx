import React from 'react';
import { RoleBasedLogin } from './RoleBasedLogin';

export const FacultyLogin: React.FC = () => {
  return <RoleBasedLogin role="faculty" roleLabel="Faculty" />;
};
