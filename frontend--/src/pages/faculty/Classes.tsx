import React, { useEffect, useState } from 'react';
import { Users, Clock, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL?.trim() || (import.meta.env.DEV ? 'http://localhost:8080' : '');

interface Class {
  id: string;
  courseCode: string;
  courseName: string;
  section: string;
  students: number;
  schedule: string;
  day?: string;
  room?: string;
  materials?: Array<{ id?: string; title?: string; type?: string; uploaded_at?: string }>;
}

interface ClassStudent {
  id: string;
  name: string;
  email?: string;
  yearLevel?: string | number;
  department?: string;
}

interface ClassDetails extends Class {
  studentCount?: number;
  students?: ClassStudent[];
}

export const FacultyClasses: React.FC = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassDetails | null>(null);
  const [classStudents, setClassStudents] = useState<ClassStudent[]>([]);
  const [manageLoading, setManageLoading] = useState(false);
  const [manageError, setManageError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const fetchClasses = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/faculty/${user.id}/classes`);
        if (!response.ok) throw new Error('Failed to fetch classes');
        const data: Class[] = await response.json();
        setClasses(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading classes');
        setClasses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [user?.id]);

  const handleManageClass = async (classId: string) => {
    if (!user?.id) return;

    try {
      setManageLoading(true);
      setManageError(null);

      const [detailsResponse, studentsResponse] = await Promise.all([
        fetch(`${API_BASE}/faculty/${user.id}/classes/${classId}`),
        fetch(`${API_BASE}/faculty/${user.id}/classes/${classId}/students`),
      ]);

      if (!detailsResponse.ok) {
        throw new Error('Failed to load class details.');
      }

      const details = (await detailsResponse.json()) as ClassDetails;
      const students = studentsResponse.ok ? ((await studentsResponse.json()) as ClassStudent[]) : [];

      setSelectedClass(details);
      setClassStudents(students);
    } catch (err) {
      setManageError(err instanceof Error ? err.message : 'Unable to open class management.');
      setSelectedClass(null);
      setClassStudents([]);
    } finally {
      setManageLoading(false);
    }
  };

  const closeManageModal = () => {
    setSelectedClass(null);
    setClassStudents([]);
    setManageError(null);
  };

  if (loading) {
    return <div className="text-center py-10">Loading classes...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">My Classes</h1>

      {error && <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-6">{error}</div>}

      {classes.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-600">No classes assigned yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <div key={cls.id} className="card hover:shadow-lg transition">
              <div className="mb-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{cls.courseCode}</h3>
                    <p className="text-sm text-gray-600">{cls.courseName}</p>
                  </div>
                  <span className="bg-primary text-white text-xs px-2 py-1 rounded">Section {cls.section}</span>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-3 text-gray-600">
                  <Users size={18} />
                  <span className="text-sm">{cls.students} Students</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Clock size={18} />
                  <span className="text-sm">{cls.schedule}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <BookOpen size={18} />
                  <span className="text-sm">View Materials</span>
                </div>
              </div>

              <button
                onClick={() => handleManageClass(cls.id)}
                className="w-full mt-4 bg-primary hover:bg-primary-dark text-white py-2 rounded-lg transition"
              >
                Manage Class
              </button>
            </div>
          ))}
        </div>
      )}

      {manageLoading && (
        <div className="fixed inset-0 z-40 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 shadow-xl w-full max-w-xl text-center">
            <p className="text-gray-700 font-medium">Loading class details...</p>
          </div>
        </div>
      )}

      {selectedClass && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[85vh] overflow-auto">
            <div className="p-6 border-b border-gray-200 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {selectedClass.courseCode} - {selectedClass.courseName}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Section {selectedClass.section || '-'}
                  {selectedClass.day ? ` • ${selectedClass.day}` : ''}
                  {selectedClass.schedule ? ` • ${selectedClass.schedule}` : ''}
                  {selectedClass.room ? ` • ${selectedClass.room}` : ''}
                </p>
              </div>
              <button
                onClick={closeManageModal}
                className="text-gray-500 hover:text-gray-700 px-2 py-1 rounded"
              >
                Close
              </button>
            </div>

            <div className="p-6 space-y-6">
              {manageError && (
                <div className="bg-red-100 text-red-800 p-3 rounded-lg text-sm">{manageError}</div>
              )}

              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Class Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Students</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {selectedClass.studentCount ?? classStudents.length ?? selectedClass.students?.length ?? 0}
                    </p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Schedule</p>
                    <p className="text-sm font-medium text-gray-800">{selectedClass.schedule || '-'}</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Room</p>
                    <p className="text-sm font-medium text-gray-800">{selectedClass.room || '-'}</p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Enrolled Students</h3>
                {classStudents.length === 0 ? (
                  <p className="text-sm text-gray-500">No enrolled students found for this class.</p>
                ) : (
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase">Name</th>
                          <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase">Email</th>
                          <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase">Year</th>
                          <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase">Department</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classStudents.map((student) => (
                          <tr key={student.id} className="border-b border-gray-100 last:border-b-0">
                            <td className="p-3 text-sm text-gray-800">{student.name}</td>
                            <td className="p-3 text-sm text-gray-600">{student.email || '-'}</td>
                            <td className="p-3 text-sm text-gray-600">{student.yearLevel || '-'}</td>
                            <td className="p-3 text-sm text-gray-600">{student.department || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Materials</h3>
                {selectedClass.materials && selectedClass.materials.length > 0 ? (
                  <ul className="space-y-2">
                    {selectedClass.materials.map((material, index) => (
                      <li
                        key={material.id || `${selectedClass.id}-material-${index}`}
                        className="border border-gray-200 rounded-lg p-3"
                      >
                        <p className="font-medium text-gray-800">{material.title || 'Untitled material'}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {material.type || 'resource'}
                          {material.uploaded_at ? ` • uploaded ${new Date(material.uploaded_at).toLocaleString()}` : ''}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No materials uploaded for this class yet.</p>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
