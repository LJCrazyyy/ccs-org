import '../src/firestore.js';
import admin from 'firebase-admin';

async function createUsers() {
  const users = [
    {
      uid: 'student-demo',
      email: 'student@school.com',
      password: 'studentpass123',
      displayName: 'Juan Dela Cruz',
    },
    {
      uid: 'faculty-demo',
      email: 'faculty.test@school.com',
      password: 'facultypass123',
      displayName: 'Maria Santos',
    },
    {
      uid: 'admin-demo',
      email: 'admin@school.com',
      password: 'adminpass123',
      displayName: 'Admin User',
    },
  ];

  for (const u of users) {
    try {
      // If user already exists by UID, skip
      try {
        const existing = await admin.auth().getUser(u.uid);
        console.log('[create-auth-users] User exists, skipping:', u.uid);
        continue;
      } catch (e) {
        // not found -> create
      }

      const created = await admin.auth().createUser({
        uid: u.uid,
        email: u.email,
        password: u.password,
        displayName: u.displayName,
      });
      console.log('[create-auth-users] Created user:', created.uid, created.email);
    } catch (err) {
      console.error('[create-auth-users] Error creating user', u.uid, err);
    }
  }
}

createUsers()
  .then(() => console.log('[create-auth-users] Done'))
  .catch((err) => {
    console.error('[create-auth-users] Fatal error', err);
    process.exit(1);
  });
