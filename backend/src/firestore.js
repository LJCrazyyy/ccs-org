import 'dotenv/config';
import admin from 'firebase-admin';

console.log('[firestore] Initializing Firebase Admin SDK...');

const hasServiceAccountEnv = Boolean(process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);
const shouldUseEmulator = String(process.env.FIREBASE_USE_EMULATOR ?? '').toLowerCase() === 'true';
const hasEmulatorHost = shouldUseEmulator && Boolean(process.env.FIRESTORE_EMULATOR_HOST);
const projectId = process.env.FIREBASE_PROJECT_ID;

console.log('[firestore] Config:', {
  shouldUseEmulator,
  hasEmulatorHost,
  projectId,
  hasServiceAccountEnv,
  emulatorHost: process.env.FIRESTORE_EMULATOR_HOST,
});

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
  console.log('[firestore] Initializing Firebase Admin app...');
  const appOptions = {
    projectId,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  };

  if (hasEmulatorHost) {
    console.log('[firestore] Using emulator for Firestore');
    admin.initializeApp(appOptions);
    process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST;
  } else {
    console.log('[firestore] Using production Firebase');
    admin.initializeApp({
      ...appOptions,
      credential: hasServiceAccountEnv
        ? admin.credential.cert({
            projectId,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          })
        : admin.credential.applicationDefault(),
    });
  }
  console.log('[firestore] Firebase Admin app initialized');
} else {
  console.log('[firestore] Firebase Admin app already initialized');
}

console.log('[firestore] Getting Firestore instance...');
export const firestore = admin.firestore();
console.log('[firestore] Firestore instance ready');
