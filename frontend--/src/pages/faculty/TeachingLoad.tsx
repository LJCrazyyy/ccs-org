import React, { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { schedulesDB } from '../../lib/database';
import { onSyncEvent } from '../../lib/syncEvents';
import { Briefcase, Users, Clock } from 'lucide-react';
import { LoadingSpinner, EmptyState, ErrorMessage } from '../../components/ui/shared';

interface Schedule {
  id: string;
  faculty_id?: string;
  facultyId?: string;
  day?: string;
  start_time?: string;
  startTime?: string;
  end_time?: string;
  endTime?: string;
  room?: string;
  section?: string;
  students?: number;
  name?: string;
  code?: string;
}

export const FacultyTeachingLoad: React.FC = () => {
  const { user } = useAuth();

  const {
    data: schedules,
    loading: schedulesLoading,
    error: schedulesError,
    execute: fetchSchedules,
  } = useAsync<Schedule[]>(() => schedulesDB.getAllSchedules().then((data: any) => data as Schedule[]));

  const facultySchedules = useMemo(() => {
    if (!schedules || !user) return [];
    return schedules.filter(
      (schedule) => String(schedule.faculty_id || schedule.facultyId || '') === user.id
    );
  }, [schedules, user]);

  const totalHours = useMemo(() => {
    const parseTimeToMinutes = (time?: string) => {
      if (!time) return 0;
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    return facultySchedules.reduce((sum, schedule) => {
      const start = schedule.start_time || schedule.startTime;
      const end = schedule.end_time || schedule.endTime;
      if (!start || !end) return sum;
      const duration = (parseTimeToMinutes(end) - parseTimeToMinutes(start)) / 60;
      return sum + Math.max(duration, 0);
    }, 0);
  }, [facultySchedules]);

  const totalStudents = useMemo(
    () => facultySchedules.reduce((sum, schedule) => sum + (schedule.students || 0), 0),
    [facultySchedules]
  );

  React.useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  React.useEffect(() => {
    const unsubscribe = onSyncEvent(({ detail }) => {
      if (
        detail.type === 'scheduleCreated' ||
        detail.type === 'scheduleUpdated' ||
        detail.type === 'scheduleDeleted'
      ) {
        fetchSchedules();
      }
    });
    return unsubscribe;
  }, [fetchSchedules]);

  if (schedulesLoading) return <LoadingSpinner />;
  if (schedulesError) return <ErrorMessage message={schedulesError} />;

  if (!user) {
    return <EmptyState title="Not signed in" description="Please sign in to view your teaching load." />;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Teaching Load</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Classes</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{facultySchedules.length}</p>
            </div>
            <Briefcase className="text-blue-500" size={32} />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Students</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{totalStudents}</p>
            </div>
            <Users className="text-green-500" size={32} />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Teaching Hours/Week</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{totalHours.toFixed(1)}</p>
            </div>
            <Clock className="text-purple-500" size={32} />
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Weekly Schedule</h2>
        <div className="space-y-3">
          {facultySchedules.length === 0 ? (
            <EmptyState
              title="No schedule assigned"
              description="You currently have no assigned teaching schedule."
            />
          ) : (
            facultySchedules.map((schedule) => {
              const start = schedule.start_time || schedule.startTime || 'TBD';
              const end = schedule.end_time || schedule.endTime || 'TBD';
              return (
                <div key={schedule.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-800">{schedule.code || schedule.name || 'Scheduled Class'}</p>
                    <p className="text-sm text-gray-600">{schedule.day || 'TBD'} • {schedule.section || 'No Section'}</p>
                    <p className="text-sm text-gray-600">{start} - {end}</p>
                  </div>
                  <span className="bg-primary text-white px-4 py-2 rounded-lg font-semibold">{Math.max(((parseInt(end.split(':')[0]) - parseInt(start.split(':')[0])) || 0), 0)} hrs</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
