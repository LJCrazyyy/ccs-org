/**
 * Test Data Seeder
 * Adds schedules, grades, and faculty-subject assignments for all accounts
 * 
 * Run with: node scripts/seed-test-data.mjs
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

// Days of week
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Time slots
const TIME_SLOTS = [
  { start: '07:30', end: '08:30' },
  { start: '08:30', end: '09:30' },
  { start: '09:30', end: '10:30' },
  { start: '10:30', end: '11:30' },
  { start: '11:30', end: '12:30' },
  { start: '13:00', end: '14:00' },
  { start: '14:00', end: '15:00' },
  { start: '15:00', end: '16:00' },
  { start: '16:00', end: '17:00' },
  { start: '17:00', end: '18:00' },
];

// Rooms
const ROOMS = ['Room 101', 'Room 102', 'Room 103', 'Lab 201', 'Lab 202', 'Lab 203', 'Room 301', 'Room 302'];

// Sample subjects per department
const SUBJECTS_BY_DEPT = {
  'Computer Science': [
    { code: 'CS101', name: 'Introduction to Programming', units: 3, type: 'lecture-lab' },
    { code: 'CS201', name: 'Data Structures', units: 3, type: 'lecture-lab' },
    { code: 'CS301', name: 'Database Management', units: 3, type: 'lecture-lab' },
    { code: 'CS401', name: 'Software Engineering', units: 3, type: 'lecture-lab' },
  ],
  'Information Technology': [
    { code: 'IT101', name: 'IT Fundamentals', units: 3, type: 'lecture-lab' },
    { code: 'IT201', name: 'Web Development', units: 3, type: 'lecture-lab' },
    { code: 'IT301', name: 'Network Administration', units: 3, type: 'lecture-lab' },
    { code: 'IT401', name: 'Cybersecurity', units: 3, type: 'lecture-lab' },
  ],
};

// Sections by year
const SECTIONS = {
  '1st': ['A', 'B', 'C', 'D', 'E'],
  '2nd': ['A', 'B', 'C', 'D', 'E'],
  '3rd': ['A', 'B', 'C', 'D'],
  '4th': ['A', 'B', 'C'],
};

// Main seeding function
async function seedTestData() {
  console.log('🚀 Starting test data seeding...\n');
  
  const db = loadDb();
  const initialCount = {
    subjects: db.subjects?.length || 0,
    schedules: db.schedules?.length || 0,
    grades: db.grades?.length || 0,
  };
  
  console.log('Initial state:', initialCount);

  // Get all faculty
  const faculty = (db.users || []).filter(u => u.role === 'faculty');
  const facultyProfiles = db.faculties || [];
  console.log(`\n📚 Found ${faculty.length} faculty accounts`);

  // Get all students
  const students = (db.users || []).filter(u => u.role === 'student');
  const studentProfiles = db.students || [];
  console.log(`\n👨‍🎓 Found ${students.length} student accounts`);

  // ============================================
  // STEP 1: Create subjects with sections for faculty
  // ============================================
  console.log('\n📖 Step 1: Creating subjects with sections...');
  
  let subjectCounter = 1;
  const newSubjects = [];
  
  for (const fac of faculty) {
    const facProfile = facultyProfiles.find(f => f.email === fac.email) || {};
    const dept = facProfile.department || 'Computer Science';
    const subjects = SUBJECTS_BY_DEPT[dept] || SUBJECTS_BY_DEPT['Computer Science'];
    
    // Get year levels for this faculty (based on their specialization or default)
    const yearLevels = ['1st', '2nd', '3rd'];
    
    for (let i = 0; i < Math.min(3, subjects.length); i++) {
      const subj = subjects[i];
      const yearLevel = yearLevels[i];
      const sections = SECTIONS[yearLevel].slice(0, 2); // Assign 2 sections per subject
      
      const newSubject = {
        id: generateId(),
        code: `${subj.code}-${subjectCounter}`,
        name: subj.name,
        description: `${subj.name} for ${dept}`,
        credits: subj.units,
        department: dept,
        yearLevel: yearLevel,
        type: subj.type === 'lecture-lab' ? 'Both' : 'Lecture',
        lectureUnits: 2,
        labUnits: 1,
        facultyId: fac.id,
        sections: sections,
        autoAssignRegular: true,
        created_at: now(),
        updated_at: now(),
        createdAt: now(),
        updatedAt: now(),
      };
      
      newSubjects.push(newSubject);
      subjectCounter++;
    }
  }
  
  // Add new subjects to db
  db.subjects = [...(db.subjects || []), ...newSubjects];
  console.log(`   ✅ Created ${newSubjects.length} subjects`);

  // ============================================
  // STEP 2: Create schedules (class assignments) for faculty
  // ============================================
  console.log('\n📅 Step 2: Creating schedules (class assignments)...');
  
  const newSchedules = [];
  let scheduleCounter = 1;
  
  for (const fac of faculty) {
    const facSubjects = db.subjects.filter(s => s.facultyId === fac.id);
    
    for (const subj of facSubjects) {
      const sections = subj.sections || [];
      
      for (const section of sections) {
        const day = DAYS[Math.floor(Math.random() * DAYS.length)];
        const timeSlot = TIME_SLOTS[Math.floor(Math.random() * TIME_SLOTS.length)];
        const room = ROOMS[Math.floor(Math.random() * ROOMS.length)];
        
        // Extract year from section (e.g., "2IT-A" -> "2nd")
        let yearLevel = subj.yearLevel;
        if (section.match(/^1/)) yearLevel = '1st';
        else if (section.match(/^2/)) yearLevel = '2nd';
        else if (section.match(/^3/)) yearLevel = '3rd';
        else if (section.match(/^4/)) yearLevel = '4th';
        
        const newSchedule = {
          id: generateId(),
          faculty_id: fac.id,
          facultyId: fac.id,
          subject_id: subj.id,
          subjectId: subj.id,
          course_id: subj.id,
          courseId: subj.id,
          courseCode: subj.code,
          courseName: subj.name,
          subjectCode: subj.code,
          subjectName: subj.name,
          section: section,
          yearLevel: yearLevel,
          day: day,
          start_time: timeSlot.start,
          end_time: timeSlot.end,
          time: `${day} ${timeSlot.start} - ${timeSlot.end}`,
          room: room,
          semester: 'Spring 2026',
          students: Math.floor(Math.random() * 15) + 10, // 10-25 students
          department: subj.department,
          type: subj.type === 'Both' ? 'lecture-lab' : 'lecture-only',
          created_at: now(),
          updated_at: now(),
          createdAt: now(),
          updatedAt: now(),
        };
        
        newSchedules.push(newSchedule);
        scheduleCounter++;
      }
    }
  }
  
  // Add new schedules to db
  db.schedules = [...(db.schedules || []), ...newSchedules];
  console.log(`   ✅ Created ${newSchedules.length} schedules`);

  // ============================================
  // STEP 3: Enroll students in schedules
  // ============================================
  console.log('\n🎓 Step 3: Enrolling students in schedules...');
  
  let enrollmentCount = 0;
  
  for (const student of students) {
    const studentProfile = studentProfiles.find(s => s.email === student.email) || {};
    const studentSection = studentProfile.section || '1CS-A';
    const studentYear = studentProfile.year || '1st';
    const studentProgram = studentProfile.program || 'BSCS';
    
    // Determine department from program
    let dept = 'Computer Science';
    if (studentProgram.includes('IT') || studentProgram.includes('Information Technology')) {
      dept = 'Information Technology';
    }
    
    // Find matching schedules for this student
    const matchingSchedules = db.schedules.filter(s => 
      s.department === dept && 
      s.yearLevel === studentYear
    );
    
    // Enroll in 3-5 random schedules
    const numEnrollments = Math.min(5, matchingSchedules.length);
    const selectedSchedules = matchingSchedules
      .sort(() => Math.random() - 0.5)
      .slice(0, numEnrollments);
    
    for (const schedule of selectedSchedules) {
      // Add student to schedule's student list
      if (!schedule.student_ids) {
        schedule.student_ids = [];
      }
      if (!schedule.student_ids.includes(student.id)) {
        schedule.student_ids.push(student.id);
        schedule.students = (schedule.student_ids || []).length;
        enrollmentCount++;
      }
      
      // Add schedule to student's enrolled_classes
      if (!studentProfile.enrolled_classes) {
        studentProfile.enrolled_classes = [];
      }
      if (!studentProfile.enrolled_classes.includes(schedule.id)) {
        studentProfile.enrolled_classes.push(schedule.id);
      }
    }
  }
  
  console.log(`   ✅ Created ${enrollmentCount} student enrollments`);

  // ============================================
  // STEP 4: Create grades for students
  // ============================================
  console.log('\n📊 Step 4: Creating grades for students...');
  
  const newGrades = [];
  let gradeCounter = 0;
  
  for (const student of students) {
    const studentProfile = studentProfiles.find(s => s.email === student.email) || {};
    const enrolledClassIds = studentProfile.enrolled_classes || [];
    
    for (const classId of enrolledClassIds) {
      const schedule = db.schedules.find(s => s.id === classId);
      if (!schedule) continue;
      
      // Check if grade already exists
      const existingGrade = (db.grades || []).find(g => 
        g.student_id === student.id && g.class_id === classId
      );
      
      if (!existingGrade) {
        // Generate random grades
        const attendance = Math.floor(Math.random() * 30) + 70; // 70-100
        const activity = Math.floor(Math.random() * 30) + 70;   // 70-100
        const exam = Math.floor(Math.random() * 30) + 70;        // 70-100
        
        // Calculate total grade
        const totalGrade = Math.round((attendance * 0.1) + (activity * 0.4) + (exam * 0.5));
        
        const newGrade = {
          id: generateId(),
          student_id: student.id,
          studentId: student.id,
          class_id: classId,
          classId: classId,
          schedule_id: classId,
          scheduleId: classId,
          course_code: schedule.courseCode,
          courseName: schedule.courseName,
          section: schedule.section,
          yearLevel: schedule.yearLevel,
          department: schedule.department,
          attendance: attendance,
          activity: activity,
          exam: exam,
          totalGrade: totalGrade,
          term: 'Spring 2026',
          created_at: now(),
          updated_at: now(),
          createdAt: now(),
          updatedAt: now(),
        };
        
        newGrades.push(newGrade);
        gradeCounter++;
      }
    }
  }
  
  // Add new grades to db
  db.grades = [...(db.grades || []), ...newGrades];
  console.log(`   ✅ Created ${newGrades.length} grade records`);

  // ============================================
  // STEP 5: Update quickLogin accounts with test data
  // ============================================
  console.log('\n🔑 Step 5: Updating quickLogin accounts...');
  
  // QuickLogin accounts: admin@example.com, student@example.com, faculty@example.com
  const quickLoginAccounts = [
    { email: 'admin@example.com', role: 'admin' },
    { email: 'student@example.com', role: 'student' },
    { email: 'faculty@example.com', role: 'faculty' },
  ];
  
  for (const ql of quickLoginAccounts) {
    const user = db.users.find(u => u.email === ql.email);
    if (!user) {
      console.log(`   ⚠️ QuickLogin account not found: ${ql.email}`);
      continue;
    }
    
    if (ql.role === 'faculty') {
      // Assign subjects and schedules to faculty quickLogin
      const facSubjects = db.subjects.filter(s => s.facultyId === user.id);
      const facSchedules = db.schedules.filter(s => s.faculty_id === user.id);
      
      console.log(`   ✅ ${ql.email}: ${facSubjects.length} subjects, ${facSchedules.length} schedules`);
    } 
    else if (ql.role === 'student') {
      // Assign enrollments and grades to student quickLogin
      const studentProfile = studentProfiles.find(s => s.email === ql.email) || db.students.find(s => s.email === ql.email);
      if (studentProfile) {
        const enrolled = (studentProfile.enrolled_classes || []).length;
        const studentGrades = (db.grades || []).filter(g => g.student_id === user.id).length;
        console.log(`   ✅ ${ql.email}: ${enrolled} enrollments, ${studentGrades} grades`);
      }
    }
    else if (ql.role === 'admin') {
      console.log(`   ✅ ${ql.email}: admin access`);
    }
  }

  // ============================================
  // Save and summarize
  // ============================================
  saveDb(db);
  
  console.log('\n' + '='.repeat(50));
  console.log('📈 SUMMARY');
  console.log('='.repeat(50));
  console.log(`Subjects: ${initialCount.subjects} → ${db.subjects?.length || 0} (+${(db.subjects?.length || 0) - initialCount.subjects})`);
  console.log(`Schedules: ${initialCount.schedules} → ${db.schedules?.length || 0} (+${(db.schedules?.length || 0) - initialCount.schedules})`);
  console.log(`Grades: ${initialCount.grades} → ${db.grades?.length || 0} (+${(db.grades?.length || 0) - initialCount.grades})`);
  console.log('='.repeat(50));
  console.log('\n✅ Test data seeding complete!');
  console.log('\nQuickLogin accounts now have:');
  console.log('  - admin@example.com / admin123: Full admin access');
  console.log('  - student@example.com / student123: Enrolled in classes with grades');
  console.log('  - faculty@example.com / faculty123: Teaching subjects and schedules');
}

// Run the seeder
seedTestData().catch(console.error);