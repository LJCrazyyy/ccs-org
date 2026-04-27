/**
 * Seed QuickLogin Account Test Data
 * Adds schedules, grades, and faculty assignments specifically for quickLogin accounts
 * 
 * Run with: node scripts/seed-quicklogin-data.mjs
 */

import { loadDbFromFirestore, saveDbToFirestore } from './firestore-seed-utils.mjs';

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

async function seedQuickLoginData() {
  console.log('🚀 Seeding test data for QuickLogin accounts...\n');
  
  const db = await loadDbFromFirestore();
  
  // Find quickLogin users
  const adminUser = db.users.find(u => u.email === 'admin@example.com');
  const studentUser = db.users.find(u => u.email === 'student@example.com');
  const facultyUser = db.users.find(u => u.email === 'faculty@example.com');
  
  if (!adminUser || !studentUser || !facultyUser) {
    console.log('❌ QuickLogin accounts not found. Run create-quicklogin-accounts.mjs first.');
    return;
  }
  
  console.log('Found quickLogin users:');
  console.log(`  - Admin: ${adminUser.email} (${adminUser.id})`);
  console.log(`  - Student: ${studentUser.email} (${studentUser.id})`);
  console.log(`  - Faculty: ${facultyUser.email} (${facultyUser.id})`);
  
  // ============================================
  // For Faculty quickLogin: Assign subjects and schedules
  // ============================================
  console.log('\n📚 Assigning subjects to faculty quickLogin...');
  
  // Create subjects for faculty quickLogin
  const facultySubjects = [
    {
      id: generateId(),
      code: 'CS100',
      name: 'Introduction to Computing',
      description: 'Introduction to Computing for quickLogin test',
      credits: 3,
      department: 'Computer Science',
      yearLevel: '1st',
      type: 'Both',
      lectureUnits: 2,
      labUnits: 1,
      facultyId: facultyUser.id,
      sections: ['1CS-A', '1CS-B'],
      autoAssignRegular: true,
      created_at: now(),
      updated_at: now(),
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: generateId(),
      code: 'CS200',
      name: 'Data Structures and Algorithms',
      description: 'Data Structures for quickLogin test',
      credits: 3,
      department: 'Computer Science',
      yearLevel: '2nd',
      type: 'Both',
      lectureUnits: 2,
      labUnits: 1,
      facultyId: facultyUser.id,
      sections: ['2CS-A', '2CS-B'],
      autoAssignRegular: true,
      created_at: now(),
      updated_at: now(),
      createdAt: now(),
      updatedAt: now(),
    },
  ];
  
  db.subjects = [...(db.subjects || []), ...facultySubjects];
  console.log(`   ✅ Created ${facultySubjects.length} subjects for faculty`);
  
  // Create schedules for faculty quickLogin
  console.log('\n📅 Creating schedules for faculty quickLogin...');
  
  const facultySchedules = [];
  const days = ['Monday', 'Wednesday', 'Friday'];
  const times = [
    { start: '07:30', end: '08:30' },
    { start: '08:30', end: '09:30' },
    { start: '09:30', end: '10:30' },
  ];
  const rooms = ['Room 101', 'Lab 201', 'Room 301'];
  
  for (let i = 0; i < facultySubjects.length; i++) {
    const subj = facultySubjects[i];
    const sections = subj.sections || [];
    
    for (let j = 0; j < sections.length; j++) {
      const section = sections[j];
      const day = days[j % days.length];
      const timeSlot = times[j % times.length];
      const room = rooms[j % rooms.length];
      
      // Extract year from section
      let yearLevel = '1st';
      if (section.startsWith('2')) yearLevel = '2nd';
      else if (section.startsWith('3')) yearLevel = '3rd';
      else if (section.startsWith('4')) yearLevel = '4th';
      
      const schedule = {
        id: generateId(),
        faculty_id: facultyUser.id,
        facultyId: facultyUser.id,
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
        students: 15,
        department: subj.department,
        type: 'lecture-lab',
        created_at: now(),
        updated_at: now(),
        createdAt: now(),
        updatedAt: now(),
      };
      
      facultySchedules.push(schedule);
    }
  }
  
  db.schedules = [...(db.schedules || []), ...facultySchedules];
  console.log(`   ✅ Created ${facultySchedules.length} schedules for faculty`);
  
  // ============================================
  // For Student quickLogin: Enroll in classes and add grades
  // ============================================
  console.log('\n🎓 Enrolling student quickLogin in classes...');
  
  // Find or create student profile
  let studentProfile = db.students.find(s => s.email === 'student@example.com');
  if (!studentProfile) {
    studentProfile = {
      id: studentUser.id,
      name: 'Test Student',
      email: 'student@example.com',
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
  
  // Get available schedules for 1st year CS
  const availableSchedules = db.schedules.filter(s => 
    s.yearLevel === '1st' && 
    s.department === 'Computer Science'
  );
  
  // Enroll in 4 random schedules
  const selectedSchedules = availableSchedules
    .sort(() => Math.random() - 0.5)
    .slice(0, 4);
  
  const enrolledClassIds = [];
  
  for (const schedule of selectedSchedules) {
    // Add to student's enrolled_classes
    if (!studentProfile.enrolled_classes) {
      studentProfile.enrolled_classes = [];
    }
    if (!studentProfile.enrolled_classes.includes(schedule.id)) {
      studentProfile.enrolled_classes.push(schedule.id);
      enrolledClassIds.push(schedule.id);
    }
    
    // Add student to schedule's student_ids
    if (!schedule.student_ids) {
      schedule.student_ids = [];
    }
    if (!schedule.student_ids.includes(studentUser.id)) {
      schedule.student_ids.push(studentUser.id);
      schedule.students = schedule.student_ids.length;
    }
  }
  
  console.log(`   ✅ Enrolled in ${enrolledClassIds.length} classes`);
  
  // ============================================
  // Add grades for student quickLogin
  // ============================================
  console.log('\n📊 Creating grades for student quickLogin...');
  
  const studentGrades = [];
  
  for (const classId of enrolledClassIds) {
    const schedule = db.schedules.find(s => s.id === classId);
    if (!schedule) continue;
    
    // Check if grade already exists
    const existingGrade = (db.grades || []).find(g => 
      g.student_id === studentUser.id && g.class_id === classId
    );
    
    if (!existingGrade) {
      // Generate grades
      const attendance = Math.floor(Math.random() * 30) + 70;
      const activity = Math.floor(Math.random() * 30) + 70;
      const exam = Math.floor(Math.random() * 30) + 70;
      const totalGrade = Math.round((attendance * 0.1) + (activity * 0.4) + (exam * 0.5));
      
      const grade = {
        id: generateId(),
        student_id: studentUser.id,
        studentId: studentUser.id,
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
      
      studentGrades.push(grade);
    }
  }
  
  db.grades = [...(db.grades || []), ...studentGrades];
  console.log(`   ✅ Created ${studentGrades.length} grade records`);
  
  // ============================================
  // Save and summarize
  // ============================================
  await saveDbToFirestore(db);
  
  console.log('\n' + '='.repeat(50));
  console.log('📋 QUICKLOGIN ACCOUNTS TEST DATA');
  console.log('='.repeat(50));
  
  console.log('\n👤 admin@example.com / admin123');
  console.log('   → Full admin access to all admin features');
  
  console.log('\n👨‍🎓 student@example.com / student123');
  console.log(`   → Enrolled in ${enrolledClassIds.length} classes`);
  console.log(`   → Has ${studentGrades.length} grade records`);
  console.log('   → Can view: Schedule, Grades, Events, Research');
  
  console.log('\n👨‍🏫 faculty@example.com / faculty123');
  console.log(`   → Teaching ${facultySubjects.length} subjects`);
  console.log(`   → Handling ${facultySchedules.length} class schedules`);
  console.log('   → Can view: Dashboard, Classes, Grades, Teaching Load, Syllabus');
  
  console.log('\n' + '='.repeat(50));
  console.log('\n✅ QuickLogin test data seeding complete!');
}

seedQuickLoginData().catch(console.error);