/**
 * Seed QuickLogin Account Data (Curriculum Accurate)
 * Overwrites test student data to match curriculum in screenshots
 * Run with: node scripts/seed-quicklogin-curriculum.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');

function loadDb() {
  const data = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(data);
}
function saveDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  console.log('✅ Database saved');
}
function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
function now() { return new Date().toISOString(); }

const curriculum = [
  // 1st Year, 1st Sem
  { code: 'CCS101', name: 'Introduction to Computing', units: 3, year: 1, sem: 1, grade: 1.5, status: 'PASSED' },
  { code: 'CCS102', name: 'Computer Programming 1', units: 3, year: 1, sem: 1, grade: 1.5, status: 'PASSED' },
  { code: 'ETH101', name: 'Ethics', units: 3, year: 1, sem: 1, grade: 1.5, status: 'PASSED' },
  { code: 'MAT101', name: 'Mathematics in the Modern World', units: 3, year: 1, sem: 1, grade: 1.5, status: 'PASSED' },
  { code: 'NSTP1', name: 'National Service Training Program 1', units: 3, year: 1, sem: 1, grade: 'PASSED', status: 'PASSED' },
  { code: 'PED101', name: 'Physical Education 1', units: 2, year: 1, sem: 1, grade: 1.25, status: 'PASSED' },
  { code: 'PSY100', name: 'Understanding the Self', units: 3, year: 1, sem: 1, grade: 1.5, status: 'PASSED' },
  // 2nd Year, 1st Sem
  { code: 'ACT101', name: 'Principles of Accounting', units: 3, year: 2, sem: 1, grade: 2.0, status: 'PASSED' },
  { code: 'CCS107', name: 'Data Structures and Algorithms 1', units: 3, year: 2, sem: 1, grade: 2.75, status: 'PASSED', prereq: 'CCS103' },
  { code: 'CCS108', name: 'Object-Oriented Programming', units: 3, year: 2, sem: 1, grade: 2.75, status: 'PASSED', prereq: 'CCS103' },
  { code: 'CCS109', name: 'System Analysis and Design', units: 3, year: 2, sem: 1, grade: 2.25, status: 'PASSED', prereq: 'CCS101' },
  { code: 'ITEW1', name: 'Electronic Commerce', units: 3, year: 2, sem: 1, grade: 2.0, status: 'PASSED' },
  { code: 'PED103', name: 'Physical Education 3', units: 2, year: 2, sem: 1, grade: 1.25, status: 'PASSED', prereq: 'PED102' },
  { code: 'STS101', name: 'Science, Technology and Society', units: 3, year: 2, sem: 1, grade: 2.75, status: 'PASSED' },
  // 3rd Year, 1st Sem
  { code: 'HIS101', name: 'Readings in Philippine History', units: 3, year: 3, sem: 1 },
  { code: 'ITEW3', name: 'Server Side Scripting', units: 3, year: 3, sem: 1 },
  { code: 'ITP103', name: 'System Integration and Architecture', units: 3, year: 3, sem: 1 },
  { code: 'ITP104', name: 'Information Management 2', units: 3, year: 3, sem: 1 },
  { code: 'ITP105', name: 'Networking and Communication 2', units: 3, year: 3, sem: 1 },
  { code: 'ITP106', name: 'Human Computer Interaction 2', units: 3, year: 3, sem: 1 },
  { code: 'SOC101', name: 'The Contemporary World', units: 3, year: 3, sem: 1 },
  { code: 'TEC101', name: 'Technopreneurship', units: 3, year: 3, sem: 1 },
  // 4th Year, 1st Sem
  { code: 'ENV101', name: 'Environmental Science', units: 3, year: 4, sem: 1 },
  { code: 'ITEW5', name: 'Web Security and Optimization', units: 3, year: 4, sem: 1 },
  { code: 'ITP110', name: 'Web Technologies', units: 3, year: 4, sem: 1 },
  { code: 'ITP111', name: 'System Administration and Maintenance', units: 3, year: 4, sem: 1 },
  { code: 'ITP112', name: 'Capstone Project 2', units: 3, year: 4, sem: 1 },
  { code: 'RIZ101', name: 'Life and Works of Rizal', units: 3, year: 4, sem: 1 },
];

async function seed() {
  const db = loadDb();
  const studentUser = db.users.find(u => u.email === 'student@example.com');
  if (!studentUser) throw new Error('student@example.com not found');
  let studentProfile = db.students.find(s => s.email === 'student@example.com');
  if (!studentProfile) {
    studentProfile = {
      id: studentUser.id,
      name: studentUser.name,
      email: studentUser.email,
      idNumber: '20269999',
      section: '1CS-A',
      year: '1st',
      program: 'BSCS',
      status: 'Regular',
      role: 'student',
      enrolled_classes: [],
      registered_events: [],
      createdAt: now(),
      updatedAt: now(),
      created_at: now(),
      updated_at: now(),
    };
    db.students.push(studentProfile);
  }
  // Remove all previous enrollments/grades for this student
  studentProfile.enrolled_classes = [];
  db.grades = (db.grades || []).filter(g => g.student_id !== studentUser.id);
  // Remove previous schedules for this student
  db.schedules = (db.schedules || []).filter(s => !s.student_ids || !s.student_ids.includes(studentUser.id));
  // Remove previous subjects for this student
  // (We will not remove global subjects, just not assign them)

  // Add curriculum subjects as schedules and enroll student
  const newSchedules = [];
  const newGrades = [];
  for (const subj of curriculum) {
    const scheduleId = generateId();
    // Add to schedules
    const schedule = {
      id: scheduleId,
      faculty_id: 'faculty@example.com',
      facultyId: 'faculty@example.com',
      subject_id: scheduleId,
      subjectId: scheduleId,
      course_id: scheduleId,
      courseId: scheduleId,
      courseCode: subj.code,
      courseName: subj.name,
      subjectCode: subj.code,
      subjectName: subj.name,
      section: '1CS-A',
      yearLevel: `${subj.year}th`,
      semester: `${subj.sem}st`,
      students: 1,
      department: 'BSCS',
      type: 'lecture',
      created_at: now(),
      updated_at: now(),
      createdAt: now(),
      updatedAt: now(),
      student_ids: [studentUser.id],
    };
    newSchedules.push(schedule);
    studentProfile.enrolled_classes.push(scheduleId);
    // Add grade if available
    if (subj.grade) {
      newGrades.push({
        id: generateId(),
        student_id: studentUser.id,
        studentId: studentUser.id,
        class_id: scheduleId,
        classId: scheduleId,
        schedule_id: scheduleId,
        scheduleId: scheduleId,
        course_code: subj.code,
        courseName: subj.name,
        section: '1CS-A',
        yearLevel: `${subj.year}th`,
        department: 'BSCS',
        attendance: 100,
        activity: 100,
        exam: 100,
        totalGrade: subj.grade === 'PASSED' ? 1.0 : subj.grade,
        term: `${subj.year}th Year, ${subj.sem}st Sem`,
        created_at: now(),
        updated_at: now(),
        createdAt: now(),
        updatedAt: now(),
        status: subj.status,
      });
    }
  }
  db.schedules = [...db.schedules, ...newSchedules];
  db.grades = [...db.grades, ...newGrades];
  saveDb(db);
  console.log('✅ Curriculum-based test data seeded for student@example.com');
}
seed().catch(console.error);