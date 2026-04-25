import { UserRole } from '../context/AuthContext';

export interface MenuItem {
  label: string;
  path: string;
  icon: string;
}

export const menuItems: Record<UserRole, MenuItem[]> = {
  admin: [
    { label: 'Dashboard', path: '/dashboard/admin', icon: 'LayoutDashboard' },
    { label: 'Students', path: '/dashboard/admin/students', icon: 'Users' },
    { label: 'Faculty', path: '/dashboard/admin/faculty', icon: 'Users2' },
    { label: 'Scheduling', path: '/dashboard/admin/scheduling', icon: 'Calendar' },
    { label: 'Subjects & Curriculum', path: '/dashboard/admin/subjects', icon: 'BookOpen' },
    { label: 'Guidance', path: '/dashboard/admin/guidance', icon: 'ShieldAlert' },
    { label: 'Events', path: '/dashboard/admin/events', icon: 'CalendarDays' },
    { label: 'Announcements', path: '/dashboard/admin/announcements', icon: 'Bell' },
    { label: 'Research', path: '/dashboard/admin/research', icon: 'FileText' },
    { label: 'Users', path: '/dashboard/admin/users', icon: 'Settings' },
  ],
  student: [
    { label: 'Dashboard', path: '/dashboard/student', icon: 'LayoutDashboard' },
    { label: 'My Profile', path: '/dashboard/student/profile', icon: 'User' },
    { label: 'My Grades', path: '/dashboard/student/grades', icon: 'BookMarked' },
    { label: 'Schedule', path: '/dashboard/student/schedule', icon: 'Calendar' },
    { label: 'Events', path: '/dashboard/student/events', icon: 'CalendarDays' },
    { label: 'Research', path: '/dashboard/student/research', icon: 'FileText' },
    { label: 'Lessons', path: '/dashboard/student/lessons', icon: 'BookOpen' },
    { label: 'Guidance Counseling', path: '/dashboard/student/guidance-counseling', icon: 'ShieldAlert' },
  ],
  faculty: [
    { label: 'Dashboard', path: '/dashboard/faculty', icon: 'LayoutDashboard' },
    { label: 'My Classes', path: '/dashboard/faculty/classes', icon: 'Users' },
    { label: 'Grade Entry', path: '/dashboard/faculty/grades', icon: 'BookMarked' },
    { label: 'Teaching Load', path: '/dashboard/faculty/teaching-load', icon: 'Briefcase' },
    { label: 'Syllabus & Lessons', path: '/dashboard/faculty/syllabus', icon: 'BookOpen' },
    { label: 'Events', path: '/dashboard/faculty/events', icon: 'CalendarDays' },
    { label: 'Research', path: '/dashboard/faculty/research', icon: 'FileText' },
  ],
};
