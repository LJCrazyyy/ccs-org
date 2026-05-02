import dotenv from "dotenv";
import admin from "firebase-admin";

dotenv.config();

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  throw new Error("Missing Firebase Admin credentials. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.");
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId,
    clientEmail,
    privateKey,
  }),
});

const db = admin.firestore();

async function seedDatabase() {

  // USERS
  await db.collection("users").doc("student-demo").set({
    system_id: "STU-2026-0001",
    name: "Juan Dela Cruz",
    email: "student@school.com",
    password_hash: "$2a$10$replace-with-bcrypt-hash",
    role: "student",
    status: "active",
    last_login_at: null,
    created_at: "2026-05-01T00:00:00",
    updated_at: "2026-05-01T00:00:00"
  });

  await db.collection("users").doc("faculty-demo").set({
    system_id: "FAC-2026-0001",
    name: "Maria Santos",
    email: "faculty.test@school.com",
    password_hash: "$2a$10$replace-with-bcrypt-hash",
    role: "faculty",
    status: "active",
    last_login_at: null,
    created_at: "2026-05-01T00:00:00",
    updated_at: "2026-05-01T00:00:00"
  });

  await db.collection("users").doc("admin-demo").set({
    system_id: "ADM-2026-0001",
    name: "Admin User",
    email: "admin@school.com",
    password_hash: "$2a$10$replace-with-bcrypt-hash",
    role: "admin",
    status: "active",
    last_login_at: null,
    created_at: "2026-05-01T00:00:00",
    updated_at: "2026-05-01T00:00:00"
  });

  // STUDENT PROFILES
  await db.collection("student_profiles").doc("student-profile-demo").set({
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
    created_at: "2026-05-01T00:00:00",
    updated_at: "2026-05-01T00:00:00"
  });

  // FACULTY PROFILES
  await db.collection("faculty_profiles").doc("faculty-profile-demo").set({
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
    created_at: "2026-05-01T00:00:00",
    updated_at: "2026-05-01T00:00:00"
  });

  // ADMIN PROFILES
  await db.collection("admin_profiles").doc("admin-profile-demo").set({
    user_id: "admin-demo",
    admin_id: "ADM-2026-0001",
    first_name: "Admin",
    last_name: "User",
    department: "IT Office",
    position: "System Administrator",
    contact_number: "09170000004",
    photo_url: "",
    created_at: "2026-05-01T00:00:00",
    updated_at: "2026-05-01T00:00:00"
  });

  // COURSES
  await db.collection("courses").doc("course-demo-1").set({
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
    created_at: "2026-05-01T00:00:00",
    updated_at: "2026-05-01T00:00:00"
  });

  // ENROLLMENTS
  await db.collection("enrollments").doc("student-demo_course-demo-1_1st").set({
    student_id: "student-demo",
    course_id: "course-demo-1",
    semester: "1st",
    status: "enrolled",
    created_at: "2026-05-01T00:00:00",
    updated_at: "2026-05-01T00:00:00"
  });

  // NOTIFICATIONS
  await db.collection("notifications").doc("student-demo_1714521600000").set({
    recipient_id: "student-demo",
    recipient_role: "student",
    title: "Enrollment confirmed",
    message: "You are now enrolled in IT101.",
    type: "enrollment",
    link: "/student/enrollments",
    is_read: false,
    read_at: null,
    created_by: "admin-demo",
    created_at: "2026-05-01T00:00:00",
    updated_at: "2026-05-01T00:00:00"
  });

  // ACADEMIC HISTORY
  await db.collection("academic_history").doc("ah-demo-1").set({
    student_id: "student-demo",
    course_id: "course-demo-1",
    school_year: "2026-2027",
    semester: "1st",
    subject_code: "IT101",
    subject_name: "Introduction to Computing",
    grade: "",
    remarks: "",
    attempt: 1,
    created_at: "2026-05-01T00:00:00",
    updated_at: "2026-05-01T00:00:00"
  });

  // MEDICAL RECORDS
  await db.collection("medical_records").doc("med-demo-1").set({
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
    created_at: "2026-05-01T00:00:00",
    updated_at: "2026-05-01T00:00:00"
  });

  // COUNSELING RECORDS
  await db.collection("counseling_records").doc("counsel-demo-1").set({
    student_id: "student-demo",
    faculty_id: "faculty-demo",
    topic: "Adjustment",
    summary: "Initial counseling note",
    status: "open",
    follow_up_date: "2026-05-08",
    notes: "",
    attachments: [],
    created_by: "faculty-demo",
    created_at: "2026-05-01T00:00:00",
    updated_at: "2026-05-01T00:00:00"
  });

  // DISCIPLINE RECORDS
  await db.collection("discipline_records").doc("disc-demo-1").set({
    student_id: "student-demo",
    incident_type: "minor",
    incident_date: "2026-05-01",
    description: "Initial discipline note",
    action_taken: "Counseled",
    severity: "low",
    status: "open",
    reported_by: "admin-demo",
    created_at: "2026-05-01T00:00:00",
    updated_at: "2026-05-01T00:00:00"
  });

  // STUDENT DOCUMENTS
  await db.collection("student_documents").doc("doc-demo-1").set({
    student_id: "student-demo",
    document_type: "enrollment-form",
    file_name: "enrollment-form.pdf",
    file_url: "/uploads/enrollment-form.pdf",
    relative_file_url: "/uploads/enrollment-form.pdf",
    mime_type: "application/pdf",
    size: 245000,
    uploaded_by: "admin-demo",
    created_at: "2026-05-01T00:00:00",
    updated_at: "2026-05-01T00:00:00"
  });

  // STUDENT ORGANIZATIONS
  await db.collection("student_organizations").doc("org-demo-1").set({
    student_id: "student-demo",
    organization_name: "IT Society",
    position: "Member",
    role: "member",
    status: "active",
    joined_at: "2026-05-01T00:00:00",
    created_at: "2026-05-01T00:00:00",
    updated_at: "2026-05-01T00:00:00"
  });

  // ATTENDANCE
  await db.collection("attendance").doc("att-demo-1").set({
    student_id: "student-demo",
    course_id: "course-demo-1",
    date: "2026-05-01",
    status: "present",
    remarks: "",
    marked_by: "faculty-demo",
    created_at: "2026-05-01T00:00:00",
    updated_at: "2026-05-01T00:00:00"
  });

  // COURSE ACTIVITIES
  await db.collection("course_activities").doc("activity-demo-1").set({
    course_id: "course-demo-1",
    title: "Welcome activity",
    description: "First week orientation task",
    type: "assignment",
    due_date: "2026-05-08",
    attachments: [],
    posted_by: "faculty-demo",
    status: "published",
    created_at: "2026-05-01T00:00:00",
    updated_at: "2026-05-01T00:00:00"
  });

  // AUDIT LOGS
  await db.collection("audit_logs").doc("audit-demo-1").set({
    actor_id: "admin-demo",
    actor_role: "admin",
    action: "seed_data_created",
    entity_type: "system",
    entity_id: "seed",
    before_data: null,
    after_data: {
      status: "created"
    },
    ip_address: "127.0.0.1",
    user_agent: "seed-script",
    created_at: "2026-05-01T00:00:00"
  });

  // SYSTEM SETTINGS
  await db.collection("system_settings").doc("default-settings").set({
    setting_key: "schoolName",
    setting_value: "Campus Management System",
    description: "Application display name",
    updated_by: "admin-demo",
    created_at: "2026-05-01T00:00:00",
    updated_at: "2026-05-01T00:00:00"
  });

  console.log("FIRESTORE DATABASE SEEDED SUCCESSFULLY");
}

seedDatabase().catch(console.error);
