import { writeFile } from 'node:fs/promises';

const API_KEY = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_WEB_API_KEY;
const BACKEND_BASE = process.env.BACKEND_BASE_URL || 'http://127.0.0.1:8080';
const TOTAL = Number.parseInt(process.env.SEED_STUDENTS_TOTAL ?? '1000', 10);
const START_AT = Number.parseInt(process.env.SEED_STUDENTS_START_AT ?? '1', 10);
const PASSWORD = process.env.SEED_STUDENTS_PASSWORD || 'Student@123';
const EMAIL_DOMAIN = process.env.SEED_STUDENTS_EMAIL_DOMAIN || 'students.local';
const USE_AUTH_EMULATOR = String(process.env.SEED_USE_AUTH_EMULATOR ?? '').toLowerCase() === 'true';
const AUTH_EMULATOR_HOST = process.env.SEED_AUTH_EMULATOR_HOST || '127.0.0.1';
const AUTH_EMULATOR_PORT = process.env.SEED_AUTH_EMULATOR_PORT || '9099';

if (!API_KEY) {
  throw new Error('Missing API key. Set VITE_FIREBASE_API_KEY or FIREBASE_WEB_API_KEY in environment.');
}

const authBase = USE_AUTH_EMULATOR
  ? `http://${AUTH_EMULATOR_HOST}:${AUTH_EMULATOR_PORT}/identitytoolkit.googleapis.com/v1`
  : 'https://identitytoolkit.googleapis.com/v1';

const signUpEndpoint = `${authBase}/accounts:signUp?key=${API_KEY}`;
const signInEndpoint = `${authBase}/accounts:signInWithPassword?key=${API_KEY}`;

const firstNames = [
  'Liam', 'Noah', 'Oliver', 'Elijah', 'James', 'William', 'Benjamin', 'Lucas', 'Henry', 'Alexander',
  'Mason', 'Michael', 'Ethan', 'Daniel', 'Jacob', 'Logan', 'Jackson', 'Levi', 'Sebastian', 'Mateo',
  'Jack', 'Owen', 'Theodore', 'Aiden', 'Samuel', 'Joseph', 'John', 'David', 'Wyatt', 'Matthew',
  'Luke', 'Asher', 'Carter', 'Julian', 'Grayson', 'Leo', 'Jayden', 'Gabriel', 'Isaac', 'Lincoln',
  'Anthony', 'Hudson', 'Dylan', 'Ezra', 'Thomas', 'Charles', 'Christopher', 'Jaxon', 'Maverick', 'Josiah',
  'Ava', 'Emma', 'Sophia', 'Isabella', 'Mia', 'Evelyn', 'Harper', 'Luna', 'Camila', 'Gianna',
  'Elizabeth', 'Eleanor', 'Ella', 'Abigail', 'Sofia', 'Avery', 'Scarlett', 'Emily', 'Aria', 'Penelope',
  'Chloe', 'Layla', 'Mila', 'Nora', 'Hazel', 'Madison', 'Ellie', 'Lily', 'Nova', 'Isla',
  'Grace', 'Violet', 'Aurora', 'Riley', 'Zoey', 'Willow', 'Emilia', 'Stella', 'Zoe', 'Victoria',
  'Hannah', 'Addison', 'Leah', 'Lucy', 'Eliana', 'Ivy', 'Everly', 'Lillian', 'Paisley', 'Natalie'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
  'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes',
  'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper',
  'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson',
  'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes',
  'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers', 'Long', 'Ross', 'Foster', 'Jimenez'
];

const buildRealisticName = (index) => {
  const firstName = firstNames[(index - 1) % firstNames.length];
  const lastName = lastNames[Math.floor((index - 1) / firstNames.length) % lastNames.length];
  return `${firstName} ${lastName}`;
};

const nowIso = () => new Date().toISOString();

const formatIndex = (index) => String(index).padStart(4, '0');

const createAuthAccount = async (email, password) => {
  const signUpResponse = await fetch(signUpEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });

  const signUpJson = await signUpResponse.json();

  if (signUpResponse.ok && signUpJson.localId) {
    return { uid: signUpJson.localId, created: true };
  }

  const errorMessage = String(signUpJson?.error?.message ?? '');
  if (errorMessage !== 'EMAIL_EXISTS') {
    throw new Error(`Auth signup failed for ${email}: ${errorMessage || signUpResponse.status}`);
  }

  const signInResponse = await fetch(signInEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });

  const signInJson = await signInResponse.json();
  if (!signInResponse.ok || !signInJson.localId) {
    const signInError = String(signInJson?.error?.message ?? signInResponse.status);
    throw new Error(`Auth sign-in failed for existing email ${email}: ${signInError}`);
  }

  return { uid: signInJson.localId, created: false };
};

const upsertBackendStudent = async (uid, profile) => {
  const response = await fetch(`${BACKEND_BASE}/admin/students/${uid}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Backend upsert failed for UID ${uid}: ${response.status} ${text}`);
  }

  return response.json().catch(() => null);
};

const main = async () => {
  const startedAt = Date.now();
  let createdCount = 0;
  let existingCount = 0;
  const credentialsRows = ['index,name,email,password,uid,idNumber'];

  for (let i = START_AT; i <= TOTAL; i += 1) {
    const suffix = formatIndex(i);
    const email = `student${suffix}@${EMAIL_DOMAIN}`;
    const idNumber = `2026${suffix}`;
    const fullName = buildRealisticName(i);

    const authResult = await createAuthAccount(email, PASSWORD);
    if (authResult.created) {
      createdCount += 1;
    } else {
      existingCount += 1;
    }

    const timestamp = nowIso();
    const payload = {
      id: authResult.uid,
      name: fullName,
      email,
      idNumber,
      role: 'student',
      year: ['1st', '2nd', '3rd', '4th'][(i - 1) % 4],
      program: i % 2 === 0 ? 'BSIT' : 'BSCS',
      status: 'Regular',
      phone: `09${String(100000000 + i).slice(-9)}`,
      address: `Block ${((i - 1) % 50) + 1}, Student Village`,
      dateOfBirth: '2005-01-01',
      skills: 'communication, teamwork',
      organizations: 'Student Council',
      enrolled_classes: [],
      enrolledClasses: [],
      registered_events: [],
      registeredEvents: [],
      createdAt: timestamp,
      updatedAt: timestamp,
      created_at: timestamp,
      updated_at: timestamp,
    };

    await upsertBackendStudent(authResult.uid, payload);
    credentialsRows.push(`${i},${fullName},${email},${PASSWORD},${authResult.uid},${idNumber}`);

    if (i % 100 === 0) {
      console.log(`[seed-students] Processed ${i}/${TOTAL} students`);
    }
  }

  const outputPath = new URL('../data/seeded-student-accounts.csv', import.meta.url);
  await writeFile(outputPath, `${credentialsRows.join('\n')}\n`, 'utf8');

  const durationSec = Math.round((Date.now() - startedAt) / 1000);
  console.log('[seed-students] Completed');
  console.log(`[seed-students] Created auth accounts: ${createdCount}`);
  console.log(`[seed-students] Existing auth accounts reused: ${existingCount}`);
  console.log(`[seed-students] Credentials file: backend/data/seeded-student-accounts.csv`);
  console.log(`[seed-students] Duration: ${durationSec}s`);
  console.log(`[seed-students] Auth mode: ${USE_AUTH_EMULATOR ? 'emulator' : 'live'}`);
};

main().catch((error) => {
  console.error('[seed-students] Failed', error);
  process.exit(1);
});
