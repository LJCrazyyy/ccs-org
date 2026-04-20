export type DocumentData = Record<string, any>;

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const buildQueryString = (params?: Record<string, any>) => {
  if (!params || Object.keys(params).length === 0) return '';
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).length > 0) {
      search.append(key, String(value));
    }
  });
  const query = search.toString();
  return query ? `?${query}` : '';
};

const apiRequest = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
};

const normalizeCollection = (collectionName: string) => {
  if (collectionName === 'disciplineRecords') return 'discipline-records';
  return collectionName;
};

export const getDocument = async <T extends DocumentData>(
  collectionName: string,
  docId: string
): Promise<T | null> => {
  try {
    return await apiRequest<T>(`/admin/${normalizeCollection(collectionName)}/${docId}`);
  } catch {
    return null;
  }
};

export const getCollection = async <T extends DocumentData>(
  collectionName: string
): Promise<T[]> => {
  return apiRequest<T[]>(`/admin/${normalizeCollection(collectionName)}`);
};

export const addDocument = async <T extends DocumentData>(
  collectionName: string,
  data: T
): Promise<string> => {
  const created = await apiRequest<{ id: string }>(`/admin/${normalizeCollection(collectionName)}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return String(created.id);
};

export const updateDocument = async <T extends DocumentData>(
  collectionName: string,
  docId: string,
  data: Partial<T>
): Promise<void> => {
  await apiRequest(`/admin/${normalizeCollection(collectionName)}/${docId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteDocument = async (
  collectionName: string,
  docId: string
): Promise<void> => {
  await apiRequest(`/admin/${normalizeCollection(collectionName)}/${docId}`, {
    method: 'DELETE',
  });
};

export const queryCollection = async <T extends DocumentData>(
  collectionName: string,
  conditions: Array<[string, string, any]>
): Promise<T[]> => {
  const filters: Record<string, any> = {};
  conditions.forEach(([field, operator, value]) => {
    if (operator === '==') {
      filters[field] = value;
    }
  });

  const queryString = buildQueryString(filters);
  return apiRequest<T[]>(`/admin/${normalizeCollection(collectionName)}${queryString}`);
};

export const setDocument = async <T extends DocumentData>(
  collectionName: string,
  docId: string,
  data: T
): Promise<void> => {
  await updateDocument(collectionName, docId, data);
};

export const updateDocumentFields = async <T extends Partial<DocumentData>>(
  collectionName: string,
  docId: string,
  data: T
): Promise<void> => {
  await updateDocument(collectionName, docId, data);
};

export const deleteDocumentOld = async (
  collectionName: string,
  docId: string
): Promise<void> => deleteDocument(collectionName, docId);

export const addDocumentOld = async <T extends DocumentData>(
  collectionName: string,
  data: T
): Promise<string> => addDocument(collectionName, data);

export const batchWrite = async (
  operations: Array<{
    type: 'set' | 'update' | 'delete';
    collection: string;
    docId: string;
    data?: DocumentData;
  }>
): Promise<void> => {
  for (const operation of operations) {
    if (operation.type === 'delete') {
      await deleteDocument(operation.collection, operation.docId);
    } else {
      await updateDocument(operation.collection, operation.docId, operation.data || {});
    }
  }
};

export const studentDB = {
  getStudent: (studentId: string) => getDocument('students', studentId),
  getAllStudents: () => getCollection('students'),
  addStudent: async (data: any) => {
    if (data?.id) {
      await updateDocument('students', String(data.id), data);
      return String(data.id);
    }
    return addDocument('students', data);
  },
  updateStudent: (studentId: string, data: any) => updateDocument('students', studentId, data),
  deleteStudent: (studentId: string) => deleteDocument('students', studentId),
};

export const facultyDB = {
  getFaculty: (facultyId: string) => getDocument('faculties', facultyId),
  getAllFaculty: () => getCollection('faculties'),
  addFaculty: async (data: any) => {
    if (data?.id) {
      await updateDocument('faculties', String(data.id), data);
      return String(data.id);
    }
    return addDocument('faculties', data);
  },
  updateFaculty: (facultyId: string, data: any) => updateDocument('faculties', facultyId, data),
  deleteFaculty: (facultyId: string) => deleteDocument('faculties', facultyId),
  assignSubject: async (facultyId: string, subject: string) =>
    apiRequest(`/admin/faculty/${facultyId}/assign-subject`, {
      method: 'PUT',
      body: JSON.stringify({ subject }),
    }),
  assignEvent: async (facultyId: string, eventId: string) =>
    apiRequest(`/admin/faculty/${facultyId}/assign-event`, {
      method: 'PUT',
      body: JSON.stringify({ event_id: eventId }),
    }),
  messageStudent: async (payload: any) =>
    apiRequest(`/admin/faculty/message-student`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

export const adminDB = {
  getAdmin: (adminId: string) => getDocument('users', adminId),
  getAllAdmins: () => apiRequest('/admin/users/admins'),
  updateAdmin: (adminId: string, data: any) => updateDocument('users', adminId, data),
  deleteAdmin: (adminId: string) => deleteDocument('users', adminId),
};

export const coursesDB = {
  getCourse: async (courseId: string) => {
    const subject = await getDocument('subjects', courseId);
    if (subject) return subject;
    return getDocument('courses', courseId);
  },
  getAllCourses: async () => {
    const [subjects, courses] = await Promise.all([
      getCollection('subjects').catch(() => []),
      getCollection('courses').catch(() => []),
    ]);

    if (subjects.length > 0) return subjects;
    return courses;
  },
  addCourse: (data: any) => addDocument('courses', data),
  updateCourse: (courseId: string, data: any) => updateDocument('courses', courseId, data),
  deleteCourse: (courseId: string) => deleteDocument('courses', courseId),
};

export const gradesDB = {
  getGrade: (gradeId: string) => getDocument('grades', gradeId),
  getStudentGrades: (studentId: string) => queryCollection('grades', [['studentId', '==', studentId]]),
  getAllGrades: () => getCollection('grades'),
  updateGrade: (gradeId: string, data: any) => updateDocument('grades', gradeId, data),
  deleteGrade: (gradeId: string) => deleteDocument('grades', gradeId),
};

export const schedulesDB = {
  getSchedule: (scheduleId: string) => getDocument('schedules', scheduleId),
  getAllSchedules: () => getCollection('schedules'),
  addSchedule: (data: any) => addDocument('schedules', data),
  updateSchedule: (scheduleId: string, data: any) => updateDocument('schedules', scheduleId, data),
  deleteSchedule: (scheduleId: string) => deleteDocument('schedules', scheduleId),
  reassignFaculty: (scheduleId: string, facultyId: string) =>
    apiRequest(`/admin/schedules/${scheduleId}/reassign`, {
      method: 'PUT',
      body: JSON.stringify({ faculty_id: facultyId }),
    }),
  getStudentSchedule: (studentId: string) => apiRequest(`/student/${studentId}/schedule`),
  getStudentScheduleDetails: (studentId: string, classId: string) =>
    apiRequest(`/student/${studentId}/schedule/${classId}`),
  enrollStudentCourse: (studentId: string, classId: string) =>
    apiRequest(`/student/${studentId}/schedule/enroll/${classId}`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),
};

export const eventsDB = {
  getEvent: (eventId: string) => getDocument('events', eventId),
  getAllEvents: () => getCollection('events'),
  addEvent: (data: any) => addDocument('events', data),
  updateEvent: (eventId: string, data: any) => updateDocument('events', eventId, data),
  deleteEvent: (eventId: string) => deleteDocument('events', eventId),
};

export const researchDB = {
  getResearch: (researchId: string) => getDocument('research', researchId),
  getAllResearch: () => getCollection('research'),
  addResearch: (data: any) => addDocument('research', data),
  updateResearch: (researchId: string, data: any) => updateDocument('research', researchId, data),
  deleteResearch: (researchId: string) => deleteDocument('research', researchId),
};

export const announcementsDB = {
  getAnnouncement: (announcementId: string) => getDocument('announcements', announcementId),
  getAllAnnouncements: () => getCollection('announcements'),
  addAnnouncement: (data: any) => addDocument('announcements', data),
  updateAnnouncement: (announcementId: string, data: any) =>
    updateDocument('announcements', announcementId, data),
  deleteAnnouncement: (announcementId: string) => deleteDocument('announcements', announcementId),
};

export const guidanceDB = {
  getStudentDisciplineRecords: (studentId?: string, email?: string) => {
    const queryString = buildQueryString({ studentId, email });
    return apiRequest(`/student/discipline-records${queryString}`);
  },
};
