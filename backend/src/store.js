export {
  createRecord,
  deleteRecord,
  getAll,
  getById,
  query,
  updateRecord,
} from './store-services/core.js';

export {
  assignFacultyEvent,
  assignFacultySubject,
  listAdmins,
  messageStudent,
  reassignScheduleFaculty,
} from './store-services/adminService.js';

export {
  addClassAssessment,
  deleteSyllabus,
  getAllEvents,
  getClassDetails,
  getClassStudents,
  getFacultyClasses,
  getFacultyDashboard,
  getFacultyResearch,
  getFacultySyllabi,
  getGradeEntry,
  getResearchDetails,
  getTeachingLoad,
  inviteStudentsToEvent,
  joinEvent,
  saveClassGrades,
  uploadClassMaterial,
  uploadSyllabus,
} from './store-services/facultyService.js';

export {
  enrollStudentCourse,
  getDisciplineRecords,
  getScheduleDetails,
  getStudentEvents,
  getStudentGrades,
  getStudentProfile,
  getStudentResearch,
  getStudentSchedule,
  registerStudentEvent,
  updateStudentProfile,
  updateStudentResearchStatus,
} from './store-services/studentService.js';
