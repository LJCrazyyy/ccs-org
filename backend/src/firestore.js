import 'dotenv/config';
import admin from 'firebase-admin';

const hasServiceAccountEnv = Boolean(process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);
const shouldUseEmulator = String(process.env.FIREBASE_USE_EMULATOR ?? '').toLowerCase() === 'true';
const hasEmulatorHost = shouldUseEmulator && Boolean(process.env.FIRESTORE_EMULATOR_HOST);
const projectId = process.env.FIREBASE_PROJECT_ID;

if (!shouldUseEmulator && process.env.FIRESTORE_EMULATOR_HOST) {
  console.warn('[firestore] Ignoring FIRESTORE_EMULATOR_HOST because FIREBASE_USE_EMULATOR is not true.');
}

if (shouldUseEmulator && !process.env.FIRESTORE_EMULATOR_HOST) {
  throw new Error('FIREBASE_USE_EMULATOR is true but FIRESTORE_EMULATOR_HOST is missing');
}

if (!projectId) {
  throw new Error('Missing Firebase Admin environment variable: FIREBASE_PROJECT_ID');
}

if (!admin.apps.length) {
  const appOptions = {
    projectId,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  };

  if (hasEmulatorHost) {
    admin.initializeApp(appOptions);
  } else {
    admin.initializeApp({
      ...appOptions,
      credential: hasServiceAccountEnv
        ? admin.credential.cert({
            projectId,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\n/g, '\n'),
          })
        : admin.credential.applicationDefault(),
    });
  }
}

export const firestore = admin.firestore();
