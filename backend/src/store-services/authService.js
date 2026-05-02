import admin from 'firebase-admin';
import { firestore } from '../firestore.js';

const demoAccounts = [
  {
    uid: 'student-demo',
    email: 'student@school.com',
    password: 'studentpass123',
    displayName: 'Juan Dela Cruz',
    role: 'student',
  },
  {
    uid: 'faculty-demo',
    email: 'faculty.test@school.com',
    password: 'facultypass123',
    displayName: 'Maria Santos',
    role: 'faculty',
  },
  {
    uid: 'admin-demo',
    email: 'admin@school.com',
    password: 'adminpass123',
    displayName: 'Admin User',
    role: 'admin',
  },
];

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const getDemoAccount = (email) => demoAccounts.find((account) => account.email === normalizeEmail(email)) || null;

const ensureAuthUser = async (account) => {
  try {
    return await admin.auth().getUser(account.uid);
  } catch (error) {
    if (error?.code !== 'auth/user-not-found') {
      throw error;
    }

    return await admin.auth().createUser({
      uid: account.uid,
      email: account.email,
      password: account.password,
      displayName: account.displayName,
    });
  }
};

export const loginUser = async ({ email, password }) => {
  try {
    const account = getDemoAccount(email);

    if (!account || String(password || '') !== account.password) {
      throw new Error('Invalid email or password');
    }

    const userRecord = await ensureAuthUser(account);
    const token = await admin.auth().createCustomToken(userRecord.uid, {
      role: account.role,
      email: account.email,
    });

    const userRef = firestore.collection('users').doc(account.uid);
    const userSnapshot = await userRef.get();

    if (!userSnapshot.exists) {
      await userRef.set({
        system_id: account.uid,
        name: account.displayName,
        email: account.email,
        password_hash: '',
        role: account.role,
        status: 'active',
        last_login_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    return {
      token,
      user: {
        uid: userRecord.uid,
        email: account.email,
        displayName: account.displayName,
        role: account.role,
      },
    };
  } catch (error) {
    console.error('[authService] loginUser error:', error);
    throw new Error(error.message || 'Failed to authenticate user');
  }
};

/**
 * Create a student user with Firebase Auth and Firestore record
 */
export const createStudentUser = async (studentData) => {
  try {
    const { email, password, name, idNumber, section, year, program, ...otherData } = studentData;

    // Validate required fields
    if (!email || !password || !name) {
      throw new Error('Email, password, and name are required');
    }

    // Create Firebase Auth user
    const userRecord = await admin.auth().createUser({
      email: email.trim().toLowerCase(),
      password: password.trim(),
      displayName: name.trim(),
    });

    const uid = userRecord.uid;

    // Create Firestore document
    const studentDoc = {
      id: uid,
      email: email.trim().toLowerCase(),
      name: name.trim(),
      role: 'student',
      idNumber: idNumber || '',
      section: section || '',
      year: year || '',
      program: program || '',
      ...otherData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await firestore.collection('users').doc(uid).set(studentDoc);

    // Create student profile if needed
    if (idNumber) {
      await firestore.collection('student_profiles').doc(uid).set({
        id: uid,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        idNumber: idNumber,
        section: section || '',
        year: year || '',
        program: program || '',
        createdAt: new Date().toISOString(),
      });
    }

    return {
      uid,
      email: email.trim().toLowerCase(),
      name: name.trim(),
      message: 'Student created successfully',
    };
  } catch (error) {
    console.error('[authService] createStudentUser error:', error);
    throw new Error(error.message || 'Failed to create student user');
  }
};

/**
 * Create an admin user with Firebase Auth and Firestore record
 */
export const createAdminUser = async (adminData) => {
  try {
    const { email, password, name, ...otherData } = adminData;

    // Validate required fields
    if (!email || !password || !name) {
      throw new Error('Email, password, and name are required');
    }

    // Create Firebase Auth user
    const userRecord = await admin.auth().createUser({
      email: email.trim().toLowerCase(),
      password: password.trim(),
      displayName: name.trim(),
    });

    const uid = userRecord.uid;

    // Create Firestore document
    const adminDoc = {
      id: uid,
      email: email.trim().toLowerCase(),
      name: name.trim(),
      role: 'admin',
      ...otherData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await firestore.collection('users').doc(uid).set(adminDoc);

    return {
      uid,
      email: email.trim().toLowerCase(),
      name: name.trim(),
      message: 'Admin user created successfully',
    };
  } catch (error) {
    console.error('[authService] createAdminUser error:', error);
    throw new Error(error.message || 'Failed to create admin user');
  }
};

/**
 * Create a faculty user with Firebase Auth and Firestore record
 */
export const createFacultyUser = async (facultyData) => {
  try {
    const { email, password, name, ...otherData } = facultyData;

    // Validate required fields
    if (!email || !password || !name) {
      throw new Error('Email, password, and name are required');
    }

    // Create Firebase Auth user
    const userRecord = await admin.auth().createUser({
      email: email.trim().toLowerCase(),
      password: password.trim(),
      displayName: name.trim(),
    });

    const uid = userRecord.uid;

    // Create Firestore document
    const facultyDoc = {
      id: uid,
      email: email.trim().toLowerCase(),
      name: name.trim(),
      role: 'faculty',
      ...otherData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await firestore.collection('users').doc(uid).set(facultyDoc);

    return {
      uid,
      email: email.trim().toLowerCase(),
      name: name.trim(),
      message: 'Faculty user created successfully',
    };
  } catch (error) {
    console.error('[authService] createFacultyUser error:', error);
    throw new Error(error.message || 'Failed to create faculty user');
  }
};
