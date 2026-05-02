import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import {
  createRecord,
  deleteRecord,
  getAll,
  getById,
  query,
  updateRecord,
} from './store-services/core.js';
import {
  assignFacultyEvent,
  assignFacultySubject,
  listAdmins,
  messageStudent,
  reassignScheduleFaculty,
} from './store-services/adminService.js';
import {
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
import {
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
import {
  createStudentUser,
  createAdminUser,
  createFacultyUser,
} from './store-services/authService.js';
import { roleFeatures } from './role-features/index.js';

const storeExports = {
  createRecord,
  deleteRecord,
  getAll,
  getById,
  query,
  updateRecord,
  assignFacultyEvent,
  assignFacultySubject,
  listAdmins,
  messageStudent,
  reassignScheduleFaculty,
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
};

const validateRoleFeatureMappings = () => {
  const missingMappings = [];

  for (const featureList of Object.values(roleFeatures)) {
    for (const feature of featureList) {
      const functionNames = String(feature.storeFunction ?? '')
        .split('|')
        .map((name) => name.trim())
        .filter(Boolean);

      for (const functionName of functionNames) {
        if (typeof storeExports[functionName] !== 'function') {
          missingMappings.push({ key: feature.key, functionName });
        }
      }
    }
  }

  if (missingMappings.length > 0) {
    console.warn('[role-features] Missing store function mappings detected:');
    for (const item of missingMappings) {
      console.warn(`- ${item.key}: ${item.functionName}`);
    }
  }
};

validateRoleFeatureMappings();

const featureRouteHandlers = {
  listAdmins: async () => ({ status: 200, body: await storeExports.listAdmins() }),
  messageStudent: async (request) => ({ status: 201, body: await storeExports.messageStudent(request.body) }),
  assignFacultySubject: async (request) => {
    const updated = await storeExports.assignFacultySubject(request.params.facultyId, request.body.subject);
    if (!updated) return { status: 404, body: { message: 'Faculty not found' } };
    return { status: 200, body: updated };
  },
  assignFacultyEvent: async (request) => {
    const updated = await storeExports.assignFacultyEvent(request.params.facultyId, request.body.event_id);
    if (!updated) return { status: 404, body: { message: 'Faculty not found' } };
    return { status: 200, body: updated };
  },
  reassignScheduleFaculty: async (request) => {
    const updated = await storeExports.reassignScheduleFaculty(request.params.scheduleId, request.body.faculty_id);
    if (!updated) return { status: 404, body: { message: 'Schedule not found' } };
    return { status: 200, body: updated };
  },
  adminCollectionList: async (request) => {
    const { collectionName } = request.params;
    const filters = request.query;
    const records = Object.keys(filters).length > 0
      ? await storeExports.query(collectionName, filters)
      : await storeExports.getAll(collectionName);

    if (records === null) return { status: 404, body: { message: 'Collection not found' } };
    return { status: 200, body: records };
  },
  adminCollectionGetById: async (request) => {
    const record = await storeExports.getById(request.params.collectionName, request.params.id);
    if (!record) return { status: 404, body: { message: 'Record not found' } };
    return { status: 200, body: record };
  },
  adminCollectionCreate: async (request) => {
    const record = await storeExports.createRecord(request.params.collectionName, request.body);
    if (!record) return { status: 404, body: { message: 'Collection not found' } };
    return { status: 201, body: { id: record.id, ...record } };
  },
  adminCollectionUpdate: async (request) => {
    const record = await storeExports.updateRecord(request.params.collectionName, request.params.id, request.body);
    if (!record) return { status: 404, body: { message: 'Record not found' } };
    return { status: 200, body: record };
  },
  adminCollectionDelete: async (request) => {
    const deleted = await storeExports.deleteRecord(request.params.collectionName, request.params.id);
    if (!deleted) return { status: 404, body: { message: 'Record not found' } };
    return { status: 204 };
  },
  facultyDashboard: async (request) => {
    const dashboard = await storeExports.getFacultyDashboard(request.params.facultyId);
    if (!dashboard) return { status: 404, body: { message: 'Faculty not found' } };
    return { status: 200, body: dashboard };
  },
  facultyClasses: async (request) => ({ status: 200, body: await storeExports.getFacultyClasses(request.params.facultyId) }),
  facultyClassDetails: async (request) => {
    const classDetails = await storeExports.getClassDetails(request.params.facultyId, request.params.classId);
    if (!classDetails) return { status: 404, body: { message: 'Class not found' } };
    return { status: 200, body: classDetails };
  },
  facultyClassStudents: async (request) => {
    const students = await storeExports.getClassStudents(request.params.facultyId, request.params.classId);
    if (!students) return { status: 404, body: { message: 'Class not found' } };
    return { status: 200, body: students };
  },
  facultyUploadClassMaterial: async (request) => {
    const material = await storeExports.uploadClassMaterial(request.params.classId, request.body);
    if (!material) return { status: 404, body: { message: 'Class not found' } };
    return { status: 201, body: material };
  },
  facultyAddClassAssessment: async (request) => {
    const assessment = await storeExports.addClassAssessment(request.params.facultyId, request.params.classId, request.body);
    if (!assessment) return { status: 404, body: { message: 'Class not found' } };
    return { status: 201, body: assessment };
  },
  facultyGradeEntry: async (request) => {
    const gradeEntry = await storeExports.getGradeEntry(request.params.facultyId, request.params.classId);
    if (!gradeEntry) return { status: 404, body: { message: 'Class not found' } };
    return { status: 200, body: gradeEntry };
  },
  facultySaveGrades: async (request) => {
    const saved = await storeExports.saveClassGrades(request.params.facultyId, request.params.classId, request.body.grades);
    if (!saved) return { status: 404, body: { message: 'Class not found' } };
    return { status: 201, body: { message: 'Grades saved successfully', grades: saved } };
  },
  facultyTeachingLoad: async (request) => ({ status: 200, body: await storeExports.getTeachingLoad(request.params.facultyId) }),
  facultySyllabiList: async (request) => ({ status: 200, body: await storeExports.getFacultySyllabi(request.params.facultyId) }),
  facultySyllabusUpload: async (request) => {
    const syllabus = await storeExports.uploadSyllabus(request.params.facultyId, request.body);
    if (!syllabus) return { status: 404, body: { message: 'Subject not found or not assigned to faculty' } };
    return { status: 201, body: syllabus };
  },
  facultySyllabusDelete: async (request) => {
    const deleted = await storeExports.deleteSyllabus(request.params.facultyId, request.params.syllabusId);
    if (!deleted) return { status: 404, body: { message: 'Syllabus not found' } };
    return { status: 204 };
  },
  facultyEventsList: async () => ({ status: 200, body: await storeExports.getAllEvents() }),
  facultyEventJoin: async (request) => {
    const updated = await storeExports.joinEvent(request.params.facultyId, request.params.eventId);
    if (!updated) return { status: 404, body: { message: 'Event not found' } };
    return { status: 200, body: updated };
  },
  facultyInviteStudentsToEvent: async (request) => {
    const updated = await storeExports.inviteStudentsToEvent(
      request.params.facultyId,
      request.params.eventId,
      request.body.studentIds
    );
    if (!updated) return { status: 404, body: { message: 'Event not found' } };
    return { status: 201, body: updated };
  },
  facultyResearchList: async (request) => ({ status: 200, body: await storeExports.getFacultyResearch(request.params.facultyId) }),
  facultyResearchDetails: async (request) => {
    const research = await storeExports.getResearchDetails(request.params.facultyId, request.params.researchId);
    if (!research) return { status: 404, body: { message: 'Research not found' } };
    return { status: 200, body: research };
  },
  studentDisciplineRecords: async (request) => ({
    status: 200,
    body: await storeExports.getDisciplineRecords({
      studentId: request.query.studentId,
      email: request.query.email,
    }),
  }),
  studentProfile: async (request) => {
    const profile = await storeExports.getStudentProfile(request.params.studentId);
    if (!profile) return { status: 404, body: { message: 'Student not found' } };
    return { status: 200, body: profile };
  },
  studentProfileUpdate: async (request) => {
    const updated = await storeExports.updateStudentProfile(request.params.studentId, request.body);
    if (!updated) return { status: 404, body: { message: 'Student not found' } };
    return { status: 200, body: updated };
  },
  studentGrades: async (request) => {
    const grades = await storeExports.getStudentGrades(request.params.studentId, request.query.term ?? 'all');
    if (!grades) return { status: 404, body: { message: 'Student not found' } };
    return { status: 200, body: grades };
  },
  studentSchedule: async (request) => {
    const schedule = await storeExports.getStudentSchedule(request.params.studentId);
    if (!schedule) return { status: 404, body: { message: 'Student not found' } };
    return { status: 200, body: schedule };
  },
  studentScheduleDetails: async (request) => {
    const details = await storeExports.getScheduleDetails(request.params.studentId, request.params.classId);
    if (!details) return { status: 404, body: { message: 'Class not found or not enrolled' } };
    return { status: 200, body: details };
  },
  studentScheduleEnroll: async (request) => {
    const result = await storeExports.enrollStudentCourse(request.params.studentId, request.params.classId);
    if (!result) return { status: 404, body: { message: 'Student or class not found' } };
    if (result.error) return { status: 409, body: { message: result.error } };
    return { status: 201, body: { message: 'Enrollment pending approval', student: result } };
  },
  studentEvents: async (request) => {
    const events = await storeExports.getStudentEvents(request.params.studentId);
    if (!events) return { status: 404, body: { message: 'Student not found' } };
    return { status: 200, body: events };
  },
  studentEventRegister: async (request) => {
    const updated = await storeExports.registerStudentEvent(request.params.studentId, request.params.eventId);
    if (!updated) return { status: 404, body: { message: 'Student or event not found' } };
    return { status: 201, body: { message: 'Successfully registered for event', student: updated } };
  },
  studentResearch: async (request) => {
    const research = await storeExports.getStudentResearch(request.params.studentId);
    if (!research) return { status: 404, body: { message: 'Student not found' } };
    return { status: 200, body: research };
  },
  studentResearchStatusUpdate: async (request) => {
    const updated = await storeExports.updateStudentResearchStatus(
      request.params.studentId,
      request.params.researchId,
      request.body.status
    );
    if (!updated) return { status: 404, body: { message: 'Research not found or student not involved' } };
    return { status: 200, body: updated };
  },
};

const registerRoleFeatureRoutes = (appInstance) => {
  const missingHandlers = [];

  for (const featureList of Object.values(roleFeatures)) {
    for (const feature of featureList) {
      const method = String(feature.method ?? '').toLowerCase();
      const register = appInstance[method];
      const handler = featureRouteHandlers[feature.key];

      if (typeof register !== 'function') {
        console.warn(`[role-features] Unsupported HTTP method for feature ${feature.key}: ${feature.method}`);
        continue;
      }

      if (typeof handler !== 'function') {
        missingHandlers.push(feature.key);
        continue;
      }

      const paths = [feature.path];
      if (!feature.path.startsWith('/api')) {
        paths.push(`/api${feature.path}`);
      }

      for (const routePath of paths) {
        register.call(appInstance, routePath, async (request, response) => {
          try {
            const result = await handler(request);
            const status = result?.status ?? 200;

            if (status === 204) {
              response.status(204).send();
              return;
            }

            response.status(status).json(result?.body ?? null);
          } catch (error) {
            console.error(`[role-features] Handler failed for ${feature.key}`, error);
            response.status(500).json({ message: 'Internal server error' });
          }
        });
      }
    }
  }

  if (missingHandlers.length > 0) {
    console.warn('[role-features] Missing route handlers detected for feature keys:');
    for (const key of missingHandlers) {
      console.warn(`- ${key}`);
    }
  }
};

const app = express();
const port = Number.parseInt(process.env.PORT ?? '8080', 10);

app.use(cors());
app.use(express.json());

app.get('/health', (_request, response) => {
  response.json({ status: 'ok' });
});

app.get('/faculty/:facultyId/dashboard', async (request, response) => {
  try {
    const dashboard = await getFacultyDashboard(request.params.facultyId);
    if (!dashboard) {
      response.status(404).json({ message: 'Faculty not found' });
      return;
    }

    response.status(200).json(dashboard);
  } catch (error) {
    console.error('[facultyDashboard] Failed to load dashboard', error);
    response.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/faculty/:facultyId/dashboard', async (request, response) => {
  try {
    const dashboard = await getFacultyDashboard(request.params.facultyId);
    if (!dashboard) {
      response.status(404).json({ message: 'Faculty not found' });
      return;
    }

    response.status(200).json(dashboard);
  } catch (error) {
    console.error('[facultyDashboardApi] Failed to load dashboard', error);
    response.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/faculty/:facultyId/classes', async (request, response) => {
  try {
    const classes = await getFacultyClasses(request.params.facultyId);
    response.status(200).json(classes);
  } catch (error) {
    console.error('[facultyClasses] Failed to load classes', error);
    response.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/faculty/:facultyId/classes', async (request, response) => {
  try {
    const classes = await getFacultyClasses(request.params.facultyId);
    response.status(200).json(classes);
  } catch (error) {
    console.error('[facultyClassesApi] Failed to load classes', error);
    response.status(500).json({ message: 'Internal server error' });
  }
});

// User creation endpoints
app.post('/api/auth/create-student', async (request, response) => {
  try {
    const result = await createStudentUser(request.body);
    response.status(201).json(result);
  } catch (error) {
    console.error('[createStudent] Error:', error);
    response.status(400).json({ message: error.message || 'Failed to create student' });
  }
});

app.post('/api/auth/create-admin', async (request, response) => {
  try {
    const result = await createAdminUser(request.body);
    response.status(201).json(result);
  } catch (error) {
    console.error('[createAdmin] Error:', error);
    response.status(400).json({ message: error.message || 'Failed to create admin' });
  }
});

app.post('/api/auth/create-faculty', async (request, response) => {
  try {
    const result = await createFacultyUser(request.body);
    response.status(201).json(result);
  } catch (error) {
    console.error('[createFaculty] Error:', error);
    response.status(400).json({ message: error.message || 'Failed to create faculty' });
  }
});

registerRoleFeatureRoutes(app);

app.use((_request, response) => {
  response.status(404).json({ message: 'Route not found' });
});

// Keep the process alive
process.on('uncaughtException', (error) => {
  console.error('[uncaughtException]', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[unhandledRejection]', reason);
});

// Aggressive keep-alive
const keepAlive = setInterval(() => {
  // This keeps the event loop alive forever
}, 1000);
keepAlive.unref();

// Find an available port if 8080 is busy
const startServer = (tryPort) => {
  try {
    const server = app.listen(tryPort, '0.0.0.0', () => {
      console.log(`Node backend running on http://127.0.0.1:${tryPort}`);
    });

    server.on('close', () => {
      console.log('Server closed');
    });

    server.on('error', (error) => {
      console.error(`[server error on port ${tryPort}]`, error.message);
      if (error.code === 'EADDRINUSE' && tryPort < 8090) {
        console.log(`Port ${tryPort} is busy, trying port ${tryPort + 1}...`);
        startServer(tryPort + 1);
      } else {
        console.error('Failed to start server after trying multiple ports');
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('[startup error]', error);
    if (tryPort < 8090) {
      startServer(tryPort + 1);
    }
  }
};

startServer(port);