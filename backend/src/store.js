import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFilePath);
const dataDirectory = path.resolve(currentDirectory, '../data');
const dataFilePath = path.join(dataDirectory, 'db.json');

const defaultDb = {
  users: [],
  subjects: [],
  students: [],
  faculties: [],
  courses: [],
  grades: [],
  schedules: [],
  events: [],
  research: [],
  announcements: [],
  disciplineRecords: [],
  messages: [],
  activityLogs: [],
};

let writeQueue = Promise.resolve();

const clone = (value) => JSON.parse(JSON.stringify(value));

const ensureDbFile = async () => {
  await mkdir(dataDirectory, { recursive: true });
  try {
    await readFile(dataFilePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      await writeFile(dataFilePath, `${JSON.stringify(defaultDb, null, 2)}\n`, 'utf8');
      return;
    }
    throw error;
  }
};

const loadDb = async () => {
  await ensureDbFile();
  const raw = await readFile(dataFilePath, 'utf8');
  const parsed = JSON.parse(raw);
  return {
    ...clone(defaultDb),
    ...parsed,
  };
};

const saveDb = async (db) => {
  await mkdir(dataDirectory, { recursive: true });
  await writeFile(dataFilePath, `${JSON.stringify(db, null, 2)}\n`, 'utf8');
};

const withWriteLock = (operation) => {
  const next = writeQueue.then(operation, operation);
  writeQueue = next.then(() => undefined, () => undefined);
  return next;
};

const nowIso = () => new Date().toISOString();

const normalizeRecord = (record) => ({
  ...record,
  created_at: record.created_at ?? record.createdAt ?? null,
  updated_at: record.updated_at ?? record.updatedAt ?? null,
  createdAt: record.createdAt ?? record.created_at ?? null,
  updatedAt: record.updatedAt ?? record.updated_at ?? null,
});

const normalizeString = (value) => String(value ?? '').trim().toLowerCase();

const matchesDepartment = (student, department) => {
  if (!department) return true;
  const normalizedDepartment = normalizeString(department);
  const program = normalizeString(student.program);

  if (!program) return false;
  if (normalizedDepartment === program) return true;
  if (normalizedDepartment.includes('computer science') && program === 'bscs') return true;
  if (normalizedDepartment.includes('information technology') && program === 'bsit') return true;
  if (normalizedDepartment.includes('engineering') && program.startsWith('bs')) return true;
  return false;
};

const assignSubjectToRegularStudents = (db, subject) => {
  if (!subject || !subject.yearLevel) return;
  const students = db.students ?? [];
  db.students = students.map((student) => {
    if (normalizeString(student.status) !== 'regular') return student;

    const yearValue = normalizeString(student.year || student.yearLevel);
    const subjectYear = normalizeString(subject.yearLevel);
    const matchesYear = subjectYear ? yearValue === subjectYear : true;
    const matchesDept = matchesDepartment(student, subject.department);

    if (!matchesYear || !matchesDept) return student;

    const existingSubjects = Array.isArray(student.assigned_subjects)
      ? student.assigned_subjects.map(String)
      : [];

    const assignedSubjectId = String(subject.id);
    if (existingSubjects.includes(assignedSubjectId)) return student;

    return {
      ...student,
      assigned_subjects: [...existingSubjects, assignedSubjectId],
    };
  });
};

const assignSubjectToFaculty = (db, subject) => {
  if (!subject || !subject.facultyId) return;
  const faculties = db.faculties ?? [];
  const faculty = faculties.find((item) => String(item.id) === String(subject.facultyId));
  if (!faculty) return;

  const assignedSubjectLabel = subject.name || subject.code || String(subject.id);
  faculty.assigned_subject = assignedSubjectLabel;
};

const toCollectionKey = (collectionName) => {
  if (collectionName === 'discipline-records') return 'disciplineRecords';
  return collectionName;
};

const isCollectionAllowed = (collectionName) =>
  ['users', 'subjects', 'students', 'faculties', 'courses', 'grades', 'schedules', 'events', 'research', 'announcements', 'activityLogs'].includes(collectionName);

const addActivityLog = (db, { targetUserId, targetEmail, action, performedBy }) => {
  const timestamp = nowIso();
  const logEntry = normalizeRecord({
    id: randomUUID(),
    targetUserId,
    targetEmail,
    action,
    performedBy,
    created_at: timestamp,
    updated_at: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  db.activityLogs = [...(db.activityLogs ?? []), logEntry];
};

export const getAll = async (collectionName) => {
  const db = await loadDb();
  const key = toCollectionKey(collectionName);
  if (!isCollectionAllowed(key)) {
    return null;
  }
  return (db[key] ?? []).map(normalizeRecord);
};

export const getById = async (collectionName, id) => {
  const records = await getAll(collectionName);
  if (!records) return null;
  return records.find((record) => String(record.id) === String(id)) ?? null;
};

export const query = async (collectionName, filters) => {
  const records = await getAll(collectionName);
  if (!records) return null;
  return records.filter((record) =>
    Object.entries(filters).every(([field, value]) => String(record[field] ?? '') === String(value))
  );
};

export const createRecord = async (collectionName, data) =>
  withWriteLock(async () => {
    const db = await loadDb();
    const key = toCollectionKey(collectionName);
    if (!isCollectionAllowed(key)) {
      return null;
    }

    const timestamp = nowIso();
    const recordData = { ...data };
  delete recordData.autoAssignRegular;

  const record = normalizeRecord({
      id: randomUUID(),
      ...recordData,
      created_at: timestamp,
      updated_at: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    db[key] = [...(db[key] ?? []), record];
    if (key === 'users') {
      addActivityLog(db, {
        targetUserId: record.id,
        targetEmail: record.email,
        action: 'created',
        performedBy: 'Admin Console',
      });
    }
    if (key === 'subjects') {
      assignSubjectToRegularStudents(db, record);
      assignSubjectToFaculty(db, record);
    }
    await saveDb(db);
    return record;
  });

export const updateRecord = async (collectionName, id, data) =>
  withWriteLock(async () => {
    const db = await loadDb();
    const key = toCollectionKey(collectionName);
    if (!isCollectionAllowed(key)) {
      return null;
    }

    const records = db[key] ?? [];
    const index = records.findIndex((record) => String(record.id) === String(id));

    const timestamp = nowIso();
    if (index === -1) {
      const createdData = { ...data };
      delete createdData.autoAssignRegular;

      const created = normalizeRecord({
        id,
        ...createdData,
        created_at: timestamp,
        createdAt: timestamp,
        updated_at: timestamp,
        updatedAt: timestamp,
      });

      db[key] = [...records, created];
      await saveDb(db);
      return created;
    }

    const existing = records[index];
    const updatedData = { ...data };
    delete updatedData.autoAssignRegular;

    const updated = normalizeRecord({
      ...existing,
      ...updatedData,
      id: existing.id,
      created_at: existing.created_at ?? existing.createdAt ?? timestamp,
      createdAt: existing.createdAt ?? existing.created_at ?? timestamp,
      updated_at: timestamp,
      updatedAt: timestamp,
    });

    records[index] = updated;
    db[key] = records;
    if (key === 'users') {
      addActivityLog(db, {
        targetUserId: updated.id,
        targetEmail: updated.email,
        action: 'updated',
        performedBy: 'Admin Console',
      });
    }
    if (key === 'subjects') {
      assignSubjectToRegularStudents(db, updated);
      assignSubjectToFaculty(db, updated);
    }
    await saveDb(db);
    return updated;
  });

export const deleteRecord = async (collectionName, id) =>
  withWriteLock(async () => {
    const db = await loadDb();
    const key = toCollectionKey(collectionName);
    if (!isCollectionAllowed(key)) {
      return false;
    }

    const records = db[key] ?? [];
    const nextRecords = records.filter((record) => String(record.id) !== String(id));
    if (nextRecords.length === records.length) return false;

    if (key === 'users') {
      const deletedRecord = records.find((record) => String(record.id) === String(id));
      if (deletedRecord) {
        addActivityLog(db, {
          targetUserId: deletedRecord.id,
          targetEmail: deletedRecord.email,
          action: 'deleted',
          performedBy: 'Admin Console',
        });
      }
    }

    db[key] = nextRecords;
    await saveDb(db);
    return true;
  });

export const listAdmins = async () => {
  const users = await getAll('users');
  return (users ?? []).filter((user) => String(user.role).toLowerCase() === 'admin');
};

export const assignFacultySubject = async (facultyId, subject) =>
  updateRecord('faculties', facultyId, { subject, assigned_subject: subject });

export const assignFacultyEvent = async (facultyId, eventId) =>
  updateRecord('faculties', facultyId, { event_id: eventId, eventId });

export const messageStudent = async (payload) =>
  withWriteLock(async () => {
    const db = await loadDb();
    const timestamp = nowIso();
    const message = normalizeRecord({
      id: randomUUID(),
      ...payload,
      created_at: timestamp,
      updated_at: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    db.messages = [...(db.messages ?? []), message];
    await saveDb(db);
    return message;
  });

export const reassignScheduleFaculty = async (scheduleId, facultyId) =>
  updateRecord('schedules', scheduleId, { faculty_id: facultyId, facultyId });

export const getDisciplineRecords = async ({ studentId, email }) => {
  const db = await loadDb();
  const records = (db.disciplineRecords ?? []).map(normalizeRecord);
  return records.filter((record) => {
    const matchesStudent = studentId ? String(record.studentId ?? '') === String(studentId) : true;
    const matchesEmail = email ? String(record.email ?? '') === String(email) : true;
    return matchesStudent && matchesEmail;
  });
};
