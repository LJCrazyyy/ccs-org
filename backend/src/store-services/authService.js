import admin from 'firebase-admin';
import { firestore } from '../firestore.js';

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
