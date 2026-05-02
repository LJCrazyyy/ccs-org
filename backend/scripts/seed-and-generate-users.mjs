import dotenv from "dotenv";
import fs from "fs";
import admin from "firebase-admin";

dotenv.config();
function initAdmin() {
  if (admin.apps && admin.apps.length) return;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } else {
    admin.initializeApp();
  }
}

initAdmin();
const db = admin.firestore();

const NOW = new Date().toISOString();

const ROLE_ACCOUNTS = [
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

const CLASS_TEMPLATES = [
  {
    courseId: 'course-demo-1',
    subjectId: 'subject-demo-1',
    scheduleId: 'course-demo-1',
    code: 'IT101',
    name: 'Introduction to Computing',
    section: 'A',
    schedule: 'Mon/Wed 9:00 AM - 10:30 AM',
    room: 'Lab 1',
    units: 3,
    semester: '1st',
    yearLevel: '1st',
    type: 'lecture',
  },
  {
    courseId: 'course-demo-2',
    subjectId: 'subject-demo-2',
    scheduleId: 'course-demo-2',
    code: 'CS102',
    name: 'Programming Fundamentals',
    section: 'A',
    schedule: 'Tue/Thu 10:30 AM - 12:00 PM',
    room: 'Lab 2',
    units: 3,
    semester: '1st',
    yearLevel: '1st',
    type: 'lecture',
  },
  {
    courseId: 'course-demo-3',
    subjectId: 'subject-demo-3',
    scheduleId: 'course-demo-3',
    code: 'IS201',
    name: 'Systems Analysis',
    section: 'B',
    schedule: 'Mon/Wed 1:00 PM - 2:30 PM',
    room: 'Room 204',
    units: 3,
    semester: '2nd',
    yearLevel: '2nd',
    type: 'lecture',
  },
  {
    courseId: 'course-demo-4',
    subjectId: 'subject-demo-4',
    scheduleId: 'course-demo-4',
    code: 'IT202',
    name: 'Database Systems',
    section: 'C',
    schedule: 'Tue/Thu 1:00 PM - 2:30 PM',
    room: 'Lab 3',
    units: 3,
    semester: '2nd',
    yearLevel: '2nd',
    type: 'lecture-lab',
  },
  {
    courseId: 'course-demo-5',
    subjectId: 'subject-demo-5',
    scheduleId: 'course-demo-5',
    code: 'CAP301',
    name: 'Capstone Project 1',
    section: 'A',
    schedule: 'Fri 8:00 AM - 11:00 AM',
    room: 'Project Lab',
    units: 4,
    semester: '1st',
    yearLevel: '3rd',
    type: 'project',
  },
];

const normalizeEmailName = (value) =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/\.+/g, '.')
    .replace(/^\.|\.$/g, '');

async function ensureAuthUser({ uid, email, password, displayName }) {
  try {
    await admin.auth().getUser(uid);
    console.log('[auth] User exists, skipping:', uid);
    return;
  } catch (error) {
    if (error?.code !== 'auth/user-not-found') {
      throw error;
    }
  }

  await admin.auth().createUser({
    uid,
    email,
    password,
    displayName,
  });
  console.log('[auth] Created user:', uid, email);
}

async function seedDemoMap() {
  const batches = [];
  let batch = db.batch();
  let ops = 0;

  function addWrite(ref, data) {
    batch.set(ref, data);
    ops++;
    if (ops >= 450) { // keep under 500 limit
      batches.push(batch.commit());
      batch = db.batch();
      ops = 0;
    }
  }

  // USERS (demo)
  addWrite(db.collection("users").doc("student-demo"), {
    system_id: "STU-2026-0001",
    name: "Juan Dela Cruz",
    email: "student@school.com",
    password_hash: "$2a$10$replace-with-bcrypt-hash",
    role: "student",
    status: "active",
    last_login_at: null,
    created_at: NOW,
    updated_at: NOW,
  });

  addWrite(db.collection("users").doc("faculty-demo"), {
    system_id: "FAC-2026-0001",
    name: "Maria Santos",
    email: "faculty.test@school.com",
    password_hash: "$2a$10$replace-with-bcrypt-hash",
    role: "faculty",
    status: "active",
    last_login_at: null,
    created_at: NOW,
    updated_at: NOW,
  });

  addWrite(db.collection("users").doc("admin-demo"), {
    system_id: "ADM-2026-0001",
    name: "Admin User",
    email: "admin@school.com",
    password_hash: "$2a$10$replace-with-bcrypt-hash",
    role: "admin",
    status: "active",
    last_login_at: null,
    created_at: NOW,
    updated_at: NOW,
  });

  // STUDENT PROFILE
  addWrite(db.collection("student_profiles").doc("student-profile-demo"), {
    user_id: "student-demo",
    student_id: "STU-2026-0001",
    first_name: "Juan",
    middle_name: "M",
    last_name: "Dela Cruz",
    course: "BSIT",
    year_level: 1,
    section: "A",
    gender: "Male",
    birthdate: "2005-01-15",
    address: "Sample Street, City",
    contact_number: "09170000001",
    emergency_contact_name: "Maria Dela Cruz",
    emergency_contact_number: "09170000002",
    photo_url: "",
    created_at: NOW,
    updated_at: NOW,
  });

  // FACULTY PROFILE
  addWrite(db.collection("faculty_profiles").doc("faculty-profile-demo"), {
    user_id: "faculty-demo",
    employee_id: "FAC-2026-0001",
    first_name: "Maria",
    middle_name: "L",
    last_name: "Santos",
    department: "Computer Studies",
    position: "Instructor",
    specialization: "Web Development",
    contact_number: "09170000003",
    photo_url: "",
    created_at: NOW,
    updated_at: NOW,
  });

  // ADMIN PROFILE
  addWrite(db.collection("admin_profiles").doc("admin-profile-demo"), {
    user_id: "admin-demo",
    admin_id: "ADM-2026-0001",
    first_name: "Admin",
    last_name: "User",
    department: "IT Office",
    position: "System Administrator",
    contact_number: "09170000004",
    photo_url: "",
    created_at: NOW,
    updated_at: NOW,
  });

  // STUDENTS + FACULTIES
  addWrite(db.collection("students").doc("student-demo"), {
    id: "student-demo",
    user_id: "student-demo",
    system_id: "STU-2026-0001",
    name: "Juan Dela Cruz",
    email: "student@school.com",
    role: "student",
    department: "Computer Studies",
    program: "BSIT",
    year_level: 1,
    yearLevel: 1,
    section: "A",
    enrolled_classes: ["course-demo-1"],
    enrolledClasses: ["course-demo-1"],
    registered_events: ["event-demo-1"],
    created_at: NOW,
    updated_at: NOW,
  });

  addWrite(db.collection("faculties").doc("faculty-demo"), {
    id: "faculty-demo",
    user_id: "faculty-demo",
    system_id: "FAC-2026-0001",
    name: "Maria Santos",
    email: "faculty.test@school.com",
    role: "faculty",
    department: "Computer Studies",
    specialization: "Web Development",
    assigned_classes: ["course-demo-1"],
    created_at: NOW,
    updated_at: NOW,
  });

  // COURSES
  addWrite(db.collection("courses").doc("course-demo-1"), {
    course_code: "IT101",
    course_name: "Introduction to Computing",
    description: "Foundational computing course",
    department: "Computer Studies",
    unit_count: 3,
    semester: "1st",
    school_year: "2026-2027",
    faculty_id: "faculty-demo",
    schedule: "Mon/Wed 9:00 AM - 10:30 AM",
    room: "Lab 1",
    status: "open",
    created_at: NOW,
    updated_at: NOW,
  });

  // ENROLLMENTS
  addWrite(db.collection("enrollments").doc("student-demo_course-demo-1_1st"), {
    student_id: "student-demo",
    course_id: "course-demo-1",
    semester: "1st",
    status: "enrolled",
    created_at: NOW,
    updated_at: NOW,
  });

  // NOTIFICATIONS
  addWrite(db.collection("notifications").doc("student-demo_1714521600000"), {
    recipient_id: "student-demo",
    recipient_role: "student",
    title: "Enrollment confirmed",
    message: "You are now enrolled in IT101.",
    type: "enrollment",
    link: "/student/enrollments",
    is_read: false,
    read_at: null,
    created_by: "admin-demo",
    created_at: NOW,
    updated_at: NOW,
  });

  // ACADEMIC HISTORY
  addWrite(db.collection("academic_history").doc("ah-demo-1"), {
    student_id: "student-demo",
    course_id: "course-demo-1",
    school_year: "2026-2027",
    semester: "1st",
    subject_code: "IT101",
    subject_name: "Introduction to Computing",
    grade: "",
    remarks: "",
    attempt: 1,
    created_at: NOW,
    updated_at: NOW,
  });

  // MEDICAL RECORDS
  addWrite(db.collection("medical_records").doc("med-demo-1"), {
    student_id: "student-demo",
    record_type: "checkup",
    visit_date: "2026-05-01",
    symptoms: "",
    diagnosis: "",
    treatment: "",
    doctor_or_nurse: "School Nurse",
    notes: "Initial record",
    attachments: [],
    created_by: "admin-demo",
    created_at: NOW,
    updated_at: NOW,
  });

  // COUNSELING RECORDS
  addWrite(db.collection("counseling_records").doc("counsel-demo-1"), {
    student_id: "student-demo",
    faculty_id: "faculty-demo",
    topic: "Adjustment",
    summary: "Initial counseling note",
    status: "open",
    follow_up_date: "2026-05-08",
    notes: "",
    attachments: [],
    created_by: "faculty-demo",
    created_at: NOW,
    updated_at: NOW,
  });

  // DISCIPLINE RECORDS
  addWrite(db.collection("discipline_records").doc("disc-demo-1"), {
    student_id: "student-demo",
    incident_type: "minor",
    incident_date: "2026-05-01",
    description: "Initial discipline note",
    action_taken: "Counseled",
    severity: "low",
    status: "open",
    reported_by: "admin-demo",
    created_at: NOW,
    updated_at: NOW,
  });

  // STUDENT DOCUMENTS
  addWrite(db.collection("student_documents").doc("doc-demo-1"), {
    student_id: "student-demo",
    document_type: "enrollment-form",
    file_name: "enrollment-form.pdf",
    file_url: "/uploads/enrollment-form.pdf",
    relative_file_url: "/uploads/enrollment-form.pdf",
    mime_type: "application/pdf",
    size: 245000,
    uploaded_by: "admin-demo",
    created_at: NOW,
    updated_at: NOW,
  });

  // STUDENT ORGANIZATIONS
  addWrite(db.collection("student_organizations").doc("org-demo-1"), {
    student_id: "student-demo",
    organization_name: "IT Society",
    position: "Member",
    role: "member",
    status: "active",
    joined_at: NOW,
    created_at: NOW,
    updated_at: NOW,
  });

  // ATTENDANCE
  addWrite(db.collection("attendance").doc("att-demo-1"), {
    student_id: "student-demo",
    course_id: "course-demo-1",
    date: "2026-05-01",
    status: "present",
    remarks: "",
    marked_by: "faculty-demo",
    created_at: NOW,
    updated_at: NOW,
  });

  // COURSE ACTIVITIES
  addWrite(db.collection("course_activities").doc("activity-demo-1"), {
    course_id: "course-demo-1",
    title: "Welcome activity",
    description: "First week orientation task",
    type: "assignment",
    due_date: "2026-05-08",
    attachments: [],
    posted_by: "faculty-demo",
    status: "published",
    created_at: NOW,
    updated_at: NOW,
  });

  // AUDIT LOGS
  addWrite(db.collection("audit_logs").doc("audit-demo-1"), {
    actor_id: "admin-demo",
    actor_role: "admin",
    action: "seed_data_created",
    entity_type: "system",
    entity_id: "seed",
    before_data: null,
    after_data: { status: "created" },
    ip_address: "127.0.0.1",
    user_agent: "seed-script",
    created_at: NOW,
  });

  // SYSTEM SETTINGS
  addWrite(db.collection("system_settings").doc("default-settings"), {
    setting_key: "schoolName",
    setting_value: "Campus Management System",
    description: "Application display name",
    updated_by: "admin-demo",
    created_at: NOW,
    updated_at: NOW,
  });

  // CLASS DATA
  CLASS_TEMPLATES.forEach((template, index) => {
    addWrite(db.collection("subjects").doc(template.subjectId), {
      code: template.code,
      name: template.name,
      title: template.name,
      facultyId: "faculty-demo",
      faculty_id: "faculty-demo",
      semester: template.semester,
      year_level: template.yearLevel,
      yearLevel: template.yearLevel,
      created_at: NOW,
      updated_at: NOW,
    });

    addWrite(db.collection("schedules").doc(template.scheduleId), {
      id: template.scheduleId,
      courseId: template.courseId,
      course_id: template.courseId,
      courseCode: template.code,
      courseName: template.name,
      section: template.section,
      semester: template.semester,
      yearLevel: template.yearLevel,
      schedule: template.schedule,
      room: template.room,
      units: template.units,
      type: template.type,
      faculty_id: "faculty-demo",
      facultyId: "faculty-demo",
      students: 0,
      student_ids: [],
      created_at: NOW,
      updated_at: NOW,
    });

    addWrite(db.collection("grades").doc(`grade-demo-${index + 1}`), {
      studentId: "student-demo",
      student_id: "student-demo",
      classId: template.scheduleId,
      class_id: template.scheduleId,
      attendance: 95,
      activity: 92,
      exam: 90,
      created_at: NOW,
      updated_at: NOW,
    });

    addWrite(db.collection("research").doc(`research-demo-${index + 1}`), {
      id: `research-demo-${index + 1}`,
      title: `${template.code} Demo Research`,
      students: ["student-demo"],
      student_ids: ["student-demo"],
      advisers: ["faculty-demo"],
      panelMembers: ["faculty-demo"],
      description: `Demo research record for ${template.code}`,
      status: "published",
      created_at: NOW,
      updated_at: NOW,
    });

    addWrite(db.collection("syllabi").doc(`syllabus-demo-${index + 1}`), {
      id: `syllabus-demo-${index + 1}`,
      facultyId: "faculty-demo",
      faculty_id: "faculty-demo",
      title: `${template.code} Syllabus`,
      status: "published",
      created_at: NOW,
      updated_at: NOW,
    });

    addWrite(db.collection("events").doc(`event-demo-${index + 1}`), {
      id: `event-demo-${index + 1}`,
      title: `${template.code} Orientation`,
      date: "2026-05-08",
      time: "9:00 AM",
      location: template.room,
      description: `Demo event for ${template.name}`,
      faculties: ["faculty-demo"],
      attendees: ["faculty-demo"],
      created_at: NOW,
      updated_at: NOW,
    });
  });

  // commit last batch
  batches.push(batch.commit());
  await Promise.all(batches);
}

function pick(list, i) {
  return list[i % list.length];
}

function makeFullName(first, last) {
  return `${first} ${last}`;
}

async function generateUsers(count = 1000, startIndex = 1001) {
  const firstNames = [
    "Juan","Jose","Miguel","Antonio","Carlos","Mark","John","Michael","Daniel","Luis",
    "Maria","Ana","Kristine","Jessa","Rosa","Cecilia","Grace","Liza","Mariel","Patricia"
  ];
  const lastNames = [
    "Dela Cruz","Santos","Reyes","Garcia","Lopez","Cruz","Ramos","Torres","Gonzales","Morales",
    "Diaz","Herrera","Alvarez","Navarro","Vargas","Flores","Perez","Ortiz","Silva","Velasco"
  ];

  const csvRows = ["email,password,system_id,doc_id,role"];
  const authUsers = [...ROLE_ACCOUNTS];
  const classStudentIds = new Map(CLASS_TEMPLATES.map((template) => [template.scheduleId, []]));

  let batch = db.batch();
  const batchCommits = [];
  let ops = 0;

  const addWriteToBatch = (ref, data) => {
    batch.set(ref, data);
    ops += 1;
    if (ops >= 400) {
      batchCommits.push(batch.commit());
      batch = db.batch();
      ops = 0;
    }
  };

  for (let i = 0; i < count; i++) {
    const idx = startIndex + i;
    const first = pick(firstNames, i);
    const last = pick(lastNames, i + 3);
    const name = makeFullName(first, last);
    const classTemplate = CLASS_TEMPLATES[i % CLASS_TEMPLATES.length];
    const systemId = `STU-2026-${String(idx).padStart(4, "0")}`;
    const emailLocal = normalizeEmailName(`${first}.${last}`);
    const email = `${emailLocal}${idx}@example.com`;
    const password = `ChangeMe${idx}!`;
    const docId = `stu-${idx}`;

    const studentClasses = [classTemplate.scheduleId];
    classStudentIds.get(classTemplate.scheduleId)?.push(docId);
    authUsers.push({
      uid: docId,
      email,
      password,
      displayName: name,
      role: "student",
    });

    addWriteToBatch(db.collection("users").doc(docId), {
      system_id: systemId,
      name,
      email,
      password_hash: "",
      role: "student",
      status: "active",
      last_login_at: null,
      created_at: NOW,
      updated_at: NOW,
    });

    addWriteToBatch(db.collection("students").doc(docId), {
      id: docId,
      user_id: docId,
      system_id: systemId,
      name,
      email,
      role: "student",
      department: "Computer Studies",
      program: "BSIT",
      year_level: classTemplate.yearLevel,
      yearLevel: classTemplate.yearLevel,
      section: classTemplate.section,
      enrolled_classes: studentClasses,
      enrolledClasses: studentClasses,
      registered_events: ["event-demo-1"],
      created_at: NOW,
      updated_at: NOW,
    });

    addWriteToBatch(db.collection("student_profiles").doc(`profile-${docId}`), {
      user_id: docId,
      student_id: systemId,
      first_name: first,
      middle_name: "",
      last_name: last,
      course: "BSIT",
      year_level: classTemplate.yearLevel,
      yearLevel: classTemplate.yearLevel,
      section: classTemplate.section,
      gender: "",
      birthdate: null,
      address: "",
      contact_number: "",
      emergency_contact_name: "",
      emergency_contact_number: "",
      photo_url: "",
      created_at: NOW,
      updated_at: NOW,
    });

    addWriteToBatch(db.collection("enrollments").doc(`enrollment-${docId}-${classTemplate.courseId}`), {
      student_id: docId,
      course_id: classTemplate.courseId,
      semester: classTemplate.semester,
      school_year: "2026-2027",
      status: "enrolled",
      created_at: NOW,
      updated_at: NOW,
    });

    addWriteToBatch(db.collection("academic_history").doc(`ah-${docId}`), {
      student_id: docId,
      course_id: classTemplate.courseId,
      school_year: "2026-2027",
      semester: classTemplate.semester,
      subject_code: classTemplate.code,
      subject_name: classTemplate.name,
      grade: "",
      remarks: "",
      attempt: 1,
      created_at: NOW,
      updated_at: NOW,
    });

    const attendanceStatus = i % 7 === 0 ? "absent" : i % 5 === 0 ? "late" : "present";
    const attendanceScore = attendanceStatus === "present" ? 100 : attendanceStatus === "late" ? 75 : 0;
    const activityScore = 80 + (i % 15);
    const examScore = 78 + (i % 17);

    addWriteToBatch(db.collection("grades").doc(`grade-${docId}`), {
      studentId: docId,
      student_id: docId,
      classId: classTemplate.scheduleId,
      class_id: classTemplate.scheduleId,
      attendance: attendanceScore,
      activity: activityScore,
      exam: examScore,
      created_at: NOW,
      updated_at: NOW,
    });

    addWriteToBatch(db.collection("attendance").doc(`att-${docId}`), {
      student_id: docId,
      course_id: classTemplate.courseId,
      date: "2026-05-01",
      status: attendanceStatus,
      remarks: attendanceStatus === "present" ? "" : "Recorded during seed",
      marked_by: "faculty-demo",
      created_at: NOW,
      updated_at: NOW,
    });

    addWriteToBatch(db.collection("notifications").doc(`notif-${docId}`), {
      recipient_id: docId,
      recipient_role: "student",
      title: "Welcome to the portal",
      message: `Your student account for ${name} is ready.`,
      type: "account",
      link: "/dashboard/student",
      is_read: false,
      read_at: null,
      created_by: "admin-demo",
      created_at: NOW,
      updated_at: NOW,
    });

    csvRows.push(`${email},${password},${systemId},${docId},student`);
  }

  for (const template of CLASS_TEMPLATES) {
    const studentIds = classStudentIds.get(template.scheduleId) || [];
    addWriteToBatch(db.collection("schedules").doc(template.scheduleId), {
      id: template.scheduleId,
      courseId: template.courseId,
      course_id: template.courseId,
      courseCode: template.code,
      courseName: template.name,
      section: template.section,
      semester: template.semester,
      yearLevel: template.yearLevel,
      schedule: template.schedule,
      room: template.room,
      units: template.units,
      type: template.type,
      faculty_id: "faculty-demo",
      facultyId: "faculty-demo",
      students: studentIds.length,
      student_ids: studentIds,
      created_at: NOW,
      updated_at: NOW,
    });
  }

  batchCommits.push(batch.commit());
  await Promise.all(batchCommits);

  const authBatchSize = 25;
  for (let index = 0; index < authUsers.length; index += authBatchSize) {
    const authBatch = authUsers.slice(index, index + authBatchSize);
    await Promise.all(authBatch.map((account) => ensureAuthUser(account)));
  }

  const outDir = "./data";
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const csvPath = `${outDir}/generated-users.csv`;
  fs.writeFileSync(csvPath, csvRows.join("\n"), "utf8");
  return csvPath;
}

async function main() {
  console.log("Seeding demo map...");
  await seedDemoMap();
  console.log("Demo map seeded.");

  const COUNT = Number.parseInt(process.env.SEED_COUNT ?? '1000', 10);
  const START = Number.parseInt(process.env.SEED_START ?? '1001', 10);

  console.log(`Generating ${COUNT} student users, linked data, Auth accounts, and CSV credentials (start ${START})...`);
  const csvPath = await generateUsers(COUNT, START);
  console.log(`Generated ${COUNT} students; CSV credentials written to: ${csvPath}`);
  console.log("DONE");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
