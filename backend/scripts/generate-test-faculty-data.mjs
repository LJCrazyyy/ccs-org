import { randomUUID } from 'node:crypto';

import '../src/firestore.js';
import admin from 'firebase-admin';

import { loadDbFromFirestore, saveDbToFirestore } from './firestore-seed-utils.mjs';

const TARGET_FACULTY = 30;
const PASSWORD = 'Faculty@123';
const seededEmailPattern = /^faculty\d{3}@faculty\.local$/i;

const names = [
  ['Adrian', 'Reyes'],
  ['Beatriz', 'Cruz'],
  ['Carlo', 'Santos'],
  ['Daniela', 'Garcia'],
  ['Elias', 'Mendoza'],
  ['Frances', 'Flores'],
  ['Gabriel', 'Bautista'],
  ['Hannah', 'Ramos'],
  ['Ian', 'Torres'],
  ['Janine', 'Dela Cruz'],
  ['Kevin', 'Villanueva'],
  ['Laila', 'Fernandez'],
  ['Mateo', 'Morales'],
  ['Nina', 'Rivera'],
  ['Oliver', 'Castillo'],
  ['Patricia', 'Pascual'],
  ['Quentin', 'Navarro'],
  ['Rhea', 'Domingo'],
  ['Samuel', 'Velasco'],
  ['Teresa', 'Salazar'],
  ['Ulysses', 'Padilla'],
  ['Valerie', 'Aquino'],
  ['Wesley', 'Ferrer'],
  ['Ximena', 'Luna'],
  ['Yara', 'Sison'],
  ['Zane', 'Mercado'],
  ['Althea', 'Gonzales'],
  ['Bruno', 'Marquez'],
  ['Celine', 'Soriano'],
  ['Diego', 'Valdez'],
];

const departments = [
  'Computer Science',
  'Information Technology',

];

const specializations = [
  'Web Development',
  'Artificial Intelligence',
  'Data Science',
  'Cybersecurity',
  'Software Engineering',
  'Database Systems',
  'Mobile Development',
  'UI/UX Design',
  'Networking',
  'Research Methods',
];

const qualifications = [
  'Master of Science in Computer Science',
  'Master of Information Technology',
];

const nowIso = () => new Date().toISOString();

const ensureAuthUser = async ({ uid, email, password, displayName }) => {
  try {
    await admin.auth().getUser(uid);
    return;
  } catch (error) {
    if (error?.code !== 'auth/user-not-found') {
      throw error;
    }
  }

  await admin.auth().createUser({
    uid,
    email,
    password,
    displayName,
  });
};

const buildFacultyRecord = (index) => {
  const [firstName, lastName] = names[(index - 1) % names.length];
  const department = departments[(index - 1) % departments.length];
  const specialization = specializations[(index - 1) % specializations.length];
  const qualification = qualifications[(index - 1) % qualifications.length];
  const timestamp = nowIso();
  const facultyNumber = String(index).padStart(3, '0');
  const id = randomUUID();

  return {
    faculty: {
      id,
      name: `${firstName} ${lastName}`,
      email: `faculty${facultyNumber}@faculty.local`,
      department,
      specialization,
      phone: `09${String(800000000 + index).padStart(9, '0')}`,
      office: `BCH ${200 + ((index - 1) % 20)}`,
      qualifications: qualification,
      role: 'faculty',
      facultyId: id,
      createdAt: timestamp,
      created_at: timestamp,
      updatedAt: timestamp,
      updated_at: timestamp,
    },
    user: {
      id,
      name: `${firstName} ${lastName}`,
      email: `faculty${facultyNumber}@faculty.local`,
      department,
      specialization,
      phone: `09${String(800000000 + index).padStart(9, '0')}`,
      office: `BCH ${200 + ((index - 1) % 20)}`,
      qualifications: qualification,
      role: 'faculty',
      facultyId: id,
      createdAt: timestamp,
      created_at: timestamp,
      updatedAt: timestamp,
      updated_at: timestamp,
    },
  };
};

const main = async () => {
  const db = await loadDbFromFirestore();
  const existingFaculties = Array.isArray(db.faculties) ? db.faculties : [];
  const existingUsers = Array.isArray(db.users) ? db.users : [];

  const preservedFaculties = existingFaculties.filter(
    (faculty) => !seededEmailPattern.test(String(faculty?.email ?? '').trim())
  );
  const preservedUsers = existingUsers.filter(
    (user) => String(user?.role ?? '').toLowerCase() !== 'faculty' || !seededEmailPattern.test(String(user?.email ?? '').trim())
  );

  const neededFacultyCount = Math.max(0, TARGET_FACULTY - preservedFaculties.length);
  const generated = Array.from({ length: neededFacultyCount }, (_, offset) => buildFacultyRecord(offset + 1));

  db.faculties = [...preservedFaculties, ...generated.map((entry) => entry.faculty)];
  db.users = [...preservedUsers, ...generated.map((entry) => entry.user)];

  await saveDbToFirestore(db);

  for (const facultyRecord of db.faculties) {
    await ensureAuthUser({
      uid: String(facultyRecord.id),
      email: String(facultyRecord.email).trim().toLowerCase(),
      password: PASSWORD,
      displayName: String(facultyRecord.name),
    });
  }

  console.log(`[seed] Preserved ${preservedFaculties.length} existing faculty records.`);
  console.log(`[seed] Added ${generated.length} seeded faculty accounts.`);
  console.log(`[seed] Total faculty accounts in Firestore: ${db.faculties.length}`);
  console.log(`[seed] Faculty password for generated accounts: ${PASSWORD}`);
};

main().catch((error) => {
  console.error('[seed] Failed to generate faculty data');
  console.error(error);
  process.exit(1);
});