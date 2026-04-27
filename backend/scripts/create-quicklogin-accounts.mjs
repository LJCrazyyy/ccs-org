/**
 * Create QuickLogin Accounts
 * Adds the quickLogin shortcut accounts to the database
 * 
 * Run with: node scripts/create-quicklogin-accounts.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');

// Load database
function loadDb() {
  const data = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(data);
}

// Save database
function saveDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  console.log('✅ Database saved');
}

// Generate UUID
function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Get current timestamp
function now() {
  return new Date().toISOString();
}

async function createQuickLoginAccounts() {
  console.log('🚀 Creating QuickLogin accounts...\n');
  
  const db = loadDb();
  
  // QuickLogin accounts to create
  const quickLoginAccounts = [
    {
      email: 'admin@example.com',
      password: 'admin123',
      name: 'Admin User',
      role: 'admin',
    },
    {
      email: 'student@example.com',
      password: 'student123',
      name: 'Test Student',
      role: 'student',
    },
    {
      email: 'faculty@example.com',
      password: 'faculty123',
      name: 'Test Faculty',
      role: 'faculty',
    },
  ];
  
  for (const account of quickLoginAccounts) {
    // Check if already exists
    const existingUser = db.users.find(u => u.email === account.email);
    
    if (existingUser) {
      console.log(`   ⚠️ Account already exists: ${account.email}`);
      continue;
    }
    
    const userId = generateId();
    const timestamp = now();
    
    // Create user
    const newUser = {
      id: userId,
      name: account.name,
      email: account.email,
      password: account.password,
      role: account.role,
      createdAt: timestamp,
      updatedAt: timestamp,
      created_at: timestamp,
      updated_at: timestamp,
    };
    
    db.users.push(newUser);
    
    // Create role-specific profile
    if (account.role === 'student') {
      if (!db.students) db.students = [];
      db.students.push({
        id: userId,
        name: account.name,
        email: account.email,
        idNumber: '20269999',
        section: '1CS-A',
        year: '1st',
        program: 'BSCS',
        status: 'Regular',
        role: 'student',
        enrolled_classes: [],
        registered_events: [],
        createdAt: timestamp,
        updatedAt: timestamp,
        created_at: timestamp,
        updated_at: timestamp,
      });
      console.log(`   ✅ Created student account: ${account.email}`);
    }
    else if (account.role === 'faculty') {
      if (!db.faculties) db.faculties = [];
      db.faculties.push({
        id: userId,
        name: account.name,
        email: account.email,
        department: 'Computer Science',
        specialization: 'Test Specialization',
        phone: '09999999999',
        office: 'Test Office',
        qualifications: 'Test Qualifications',
        role: 'faculty',
        facultyId: userId,
        createdAt: timestamp,
        updatedAt: timestamp,
        created_at: timestamp,
        updated_at: timestamp,
      });
      console.log(`   ✅ Created faculty account: ${account.email}`);
    }
    else if (account.role === 'admin') {
      console.log(`   ✅ Created admin account: ${account.email}`);
    }
  }
  
  saveDb(db);
  
  console.log('\n✅ QuickLogin accounts created!');
  console.log('\nYou can now login with:');
  console.log('  - admin@example.com / admin123');
  console.log('  - student@example.com / student123');
  console.log('  - faculty@example.com / faculty123');
}

createQuickLoginAccounts().catch(console.error);