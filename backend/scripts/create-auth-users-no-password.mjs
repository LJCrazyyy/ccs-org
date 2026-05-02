import '../src/firestore.js';
import admin from 'firebase-admin';

async function createUsers() {
  const users = [
    { uid: 'faculty-demo', email: 'faculty.test@school.com', displayName: 'Maria Santos' },
  ];

  for (const u of users) {
    try {
      try {
        const existing = await admin.auth().getUser(u.uid);
        console.log('[create-auth-users-no-password] User exists, skipping:', u.uid);
        continue;
      } catch (e) {
        // not found -> create
      }

      const created = await admin.auth().createUser({ uid: u.uid, email: u.email, displayName: u.displayName });
      console.log('[create-auth-users-no-password] Created user:', created.uid, created.email);
    } catch (err) {
      console.error('[create-auth-users-no-password] Error creating user', u.uid, err);
    }
  }
}

createUsers().then(()=>console.log('done')).catch((e)=>{console.error(e);process.exit(1)});
