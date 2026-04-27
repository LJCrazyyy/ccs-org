import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { studentDB } from '../../lib/database';

interface StudentEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: string;
  isRegistered: boolean;
}

export const StudentEvents: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<StudentEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registering, setRegistering] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const fetchEvents = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await studentDB.getStudentEvents(user.id);
        setEvents(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load events');
      } finally {
        setLoading(false);
      }
    };

    void fetchEvents();
  }, [user?.id]);

  const handleRegister = async (eventId: string) => {
    if (!user?.id) return;

    setRegistering(eventId);
    try {
      await studentDB.registerStudentEvent(user.id, eventId);
      setEvents(events.map((e) =>
        e.id === eventId ? { ...e, isRegistered: true } : e
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register');
    } finally {
      setRegistering(null);
    }
  };

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [events]
  );

  if (loading) return <div className="text-center py-8">Loading events...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Events</h1>

      {error && <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-6">{error}</div>}

      {sortedEvents.length === 0 ? (
        <div className="card text-center py-12">
          <CalendarDays className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="text-lg font-semibold text-gray-700">No events available</h3>
          <p className="text-gray-600">Check back later for upcoming events</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedEvents.map((event) => (
            <div key={event.id} className="card border-l-4 border-primary">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-gray-800">{event.title}</h3>
                    {event.isRegistered && (
                      <CheckCircle className="text-green-600" size={20} />
                    )}
                  </div>
                  <p className="text-gray-600">{event.description}</p>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                    <div>📅 {event.date}</div>
                    <div>🕐 {event.time}</div>
                    <div>📍 {event.location}</div>
                  </div>
                </div>
                {!event.isRegistered && (
                  <button
                    onClick={() => handleRegister(event.id)}
                    disabled={registering === event.id}
                    className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-medium whitespace-nowrap disabled:opacity-50"
                  >
                    {registering === event.id ? 'Registering...' : 'Register'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
