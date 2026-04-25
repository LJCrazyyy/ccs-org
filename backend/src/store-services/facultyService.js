import { randomUUID } from 'node:crypto';
import {
  loadDb,
  normalizeRecord,
  nowIso,
  saveDb,
  withWriteLock,
} from './core.js';

const toComparable = (value) => String(value ?? '').trim();

const toNonEmptySet = (values) =>
  new Set(
    values
      .map((value) => toComparable(value))
      .filter((value) => value.length > 0)
  );

const facultyCandidateValues = (faculty) => [
  faculty?.id,
  faculty?.facultyId,
  faculty?.faculty_id,
  faculty?.uid,
  faculty?.userId,
  faculty?.user_id,
  faculty?.firebaseUid,
  faculty?.authUid,
  faculty?.email,
];

const resolveFacultyContext = (db, facultyIdentifier) => {
  const requested = toComparable(facultyIdentifier);
  const allFaculties = (db.faculties ?? []).map(normalizeRecord);
  const allUsers = (db.users ?? []).map(normalizeRecord);

  const directFaculty = allFaculties.find((faculty) =>
    toNonEmptySet(facultyCandidateValues(faculty)).has(requested)
  );

  const linkedUser = allUsers.find((user) =>
    toNonEmptySet([user.id, user.uid, user.userId, user.user_id, user.firebaseUid, user.email]).has(requested)
  );

  const emailLinkedFaculty =
    directFaculty ||
    allFaculties.find(
      (faculty) =>
        toComparable(faculty.email).length > 0 &&
        toComparable(faculty.email) === toComparable(linkedUser?.email)
    );

  const resolvedFaculty = directFaculty || emailLinkedFaculty || null;
  const facultyIdentitySet = toNonEmptySet([
    requested,
    ...facultyCandidateValues(resolvedFaculty),
    linkedUser?.id,
    linkedUser?.uid,
    linkedUser?.userId,
    linkedUser?.user_id,
    linkedUser?.firebaseUid,
    linkedUser?.email,
  ]);

  return {
    requested,
    linkedUser,
    resolvedFaculty,
    facultyIdentitySet,
    canonicalFacultyId: toComparable(resolvedFaculty?.id || requested),
  };
};

const matchesFacultyIdentity = (value, identitySet) => identitySet.has(toComparable(value));

const findCourseOrSubjectForSchedule = (schedule, allCourses, allSubjects) => {
  const scheduleCandidates = [
    schedule?.course_id,
    schedule?.courseId,
    schedule?.subject_id,
    schedule?.subjectId,
    schedule?.classId,
    schedule?.courseCode,
    schedule?.courseName,
    schedule?.subjectCode,
    schedule?.subjectName,
  ].map((value) => String(value ?? '').trim());

  const hasMatchingCandidate = (record) => {
    const recordCandidates = [record?.id, record?.code, record?.name].map((value) =>
      String(value ?? '').trim()
    );

    return scheduleCandidates.some((candidate) => {
      if (!candidate) {
        return false;
      }

      return recordCandidates.some((recordCandidate) => recordCandidate === candidate);
    });
  };

  const matchedCourse = allCourses.find(hasMatchingCandidate);
  const matchedSubject = allSubjects.find(hasMatchingCandidate);

  return matchedCourse || matchedSubject || null;
};

export const getFacultyDashboard = async (facultyId) => {
  const db = await loadDb();
  const {
    requested,
    linkedUser,
    resolvedFaculty,
    facultyIdentitySet,
  } = resolveFacultyContext(db, facultyId);

  const allSubjects = (db.subjects ?? []).map(normalizeRecord);
  const allSchedules = (db.schedules ?? []).map(normalizeRecord);

  const assignedSubjects = allSubjects.filter(
    (subject) =>
      matchesFacultyIdentity(subject.facultyId ?? subject.faculty_id ?? '', facultyIdentitySet)
  );

  const facultyClasses = allSchedules.filter(
    (schedule) =>
      matchesFacultyIdentity(schedule.faculty_id ?? schedule.facultyId ?? '', facultyIdentitySet)
  );

  const classesPerSubject = assignedSubjects.map((subject) => ({
    ...subject,
    classes: facultyClasses.filter(
      (cls) => String(cls.subject_id ?? cls.subjectId ?? '') === String(subject.id)
    ).length,
  }));

  return {
    faculty:
      resolvedFaculty ?? {
        id: requested,
        name: linkedUser?.name ?? linkedUser?.displayName ?? 'Faculty',
        email: linkedUser?.email ?? '',
      },
    subjects: classesPerSubject,
    totalClasses: facultyClasses.length,
    totalStudents: facultyClasses.reduce((sum, cls) => sum + Number(cls.students ?? 0), 0),
  };
};

export const getFacultyClasses = async (facultyId) => {
  const db = await loadDb();
  const { facultyIdentitySet } = resolveFacultyContext(db, facultyId);
  const allSchedules = (db.schedules ?? []).map(normalizeRecord);
  const allCourses = (db.courses ?? []).map(normalizeRecord);
  const allSubjects = (db.subjects ?? []).map(normalizeRecord);

  const facultyClasses = allSchedules.filter(
    (schedule) => matchesFacultyIdentity(schedule.faculty_id ?? schedule.facultyId ?? '', facultyIdentitySet)
  );

  return facultyClasses.map((cls) => {
    const matchedCourseOrSubject = findCourseOrSubjectForSchedule(cls, allCourses, allSubjects);

    return {
      ...cls,
      courseName:
        matchedCourseOrSubject?.name ??
        cls.courseName ??
        cls.subjectName ??
        cls.name ??
        'Unknown Course',
      courseCode:
        matchedCourseOrSubject?.code ??
        cls.courseCode ??
        cls.subjectCode ??
        cls.code ??
        'N/A',
    };
  });
};

export const getClassDetails = async (facultyId, classId) => {
  const db = await loadDb();
  const { facultyIdentitySet } = resolveFacultyContext(db, facultyId);
  const allSchedules = (db.schedules ?? []).map(normalizeRecord);
  const allStudents = (db.students ?? []).map(normalizeRecord);
  const allCourses = (db.courses ?? []).map(normalizeRecord);
  const allSubjects = (db.subjects ?? []).map(normalizeRecord);

  const classSchedule = allSchedules.find(
    (schedule) =>
      String(schedule.id) === String(classId) &&
      matchesFacultyIdentity(schedule.faculty_id ?? schedule.facultyId ?? '', facultyIdentitySet)
  );

  if (!classSchedule) return null;

  const classStudents = allStudents.filter((student) => {
    const enrolledClasses = student.enrolled_classes ?? student.enrolledClasses ?? [];
    return enrolledClasses.includes(classId);
  });

  const matchedCourseOrSubject = findCourseOrSubjectForSchedule(
    classSchedule,
    allCourses,
    allSubjects
  );

  return {
    ...classSchedule,
    courseName:
      matchedCourseOrSubject?.name ??
      classSchedule.courseName ??
      classSchedule.subjectName ??
      'Unknown Course',
    courseCode:
      matchedCourseOrSubject?.code ??
      classSchedule.courseCode ??
      classSchedule.subjectCode ??
      'Unknown',
    students: classStudents,
    studentCount: classStudents.length,
    materials: classSchedule.materials ?? [],
  };
};

export const getClassStudents = async (facultyId, classId) => {
  const db = await loadDb();
  const { facultyIdentitySet } = resolveFacultyContext(db, facultyId);
  const allSchedules = (db.schedules ?? []).map(normalizeRecord);
  const allStudents = (db.students ?? []).map(normalizeRecord);

  const classSchedule = allSchedules.find(
    (schedule) =>
      String(schedule.id) === String(classId) &&
      matchesFacultyIdentity(schedule.faculty_id ?? schedule.facultyId ?? '', facultyIdentitySet)
  );

  if (!classSchedule) return null;

  return allStudents
    .filter((student) => {
      const enrolledClasses = student.enrolled_classes ?? student.enrolledClasses ?? [];
      return enrolledClasses.includes(classId);
    })
    .map((student) => ({
      ...student,
      yearLevel: student.year_level ?? student.yearLevel ?? 1,
      department: student.department ?? 'Unknown',
    }));
};

export const getGradeEntry = async (facultyId, classId) => {
  const db = await loadDb();
  const { facultyIdentitySet } = resolveFacultyContext(db, facultyId);
  const allSchedules = (db.schedules ?? []).map(normalizeRecord);
  const allStudents = (db.students ?? []).map(normalizeRecord);
  const allGrades = (db.grades ?? []).map(normalizeRecord);

  const classSchedule = allSchedules.find(
    (schedule) =>
      String(schedule.id) === String(classId) &&
      matchesFacultyIdentity(schedule.faculty_id ?? schedule.facultyId ?? '', facultyIdentitySet)
  );

  if (!classSchedule) return null;

  const classStudents = allStudents.filter((student) => {
    const enrolledClasses = student.enrolled_classes ?? student.enrolledClasses ?? [];
    return enrolledClasses.includes(classId);
  });

  const studentGrades = classStudents.map((student) => {
    const studentGradeRecords = allGrades.filter(
      (grade) =>
        String(grade.student_id ?? grade.studentId ?? '') === String(student.id) &&
        String(grade.class_id ?? grade.classId ?? '') === String(classId)
    );

    const gradeData = studentGradeRecords.reduce((acc, grade) => {
      acc.attendance = acc.attendance || grade.attendance || 0;
      acc.activity = acc.activity || grade.activity || 0;
      acc.exam = acc.exam || grade.exam || 0;
      return acc;
    }, {});

    const totalGrade = gradeData.attendance * 0.1 + gradeData.activity * 0.4 + gradeData.exam * 0.5;

    return {
      studentId: student.id,
      studentName: student.name,
      email: student.email,
      yearLevel: student.year_level ?? student.yearLevel ?? 1,
      department: student.department ?? 'Unknown',
      attendance: gradeData.attendance || 0,
      activity: gradeData.activity || 0,
      exam: gradeData.exam || 0,
      totalGrade: Math.round(totalGrade * 100) / 100,
    };
  });

  return {
    classId,
    classSchedule,
    studentGrades,
  };
};

export const saveClassGrades = async (facultyId, classId, gradesData) =>
  withWriteLock(async () => {
    const db = await loadDb();
    const { facultyIdentitySet } = resolveFacultyContext(db, facultyId);
    const allSchedules = (db.schedules ?? []).map(normalizeRecord);

    const classSchedule = allSchedules.find(
      (schedule) =>
        String(schedule.id) === String(classId) &&
        matchesFacultyIdentity(schedule.faculty_id ?? schedule.facultyId ?? '', facultyIdentitySet)
    );

    if (!classSchedule) return null;

    const timestamp = nowIso();
    const updatedGrades = [];

    for (const gradeEntry of gradesData) {
      const allGrades = (db.grades ?? []).map(normalizeRecord);
      const existingGrade = allGrades.find(
        (g) =>
          String(g.student_id ?? g.studentId ?? '') === String(gradeEntry.studentId) &&
          String(g.class_id ?? g.classId ?? '') === String(classId)
      );

      const gradeRecord = normalizeRecord({
        id: existingGrade?.id ?? randomUUID(),
        student_id: gradeEntry.studentId,
        studentId: gradeEntry.studentId,
        class_id: classId,
        classId,
        attendance: gradeEntry.attendance ?? 0,
        activity: gradeEntry.activity ?? 0,
        exam: gradeEntry.exam ?? 0,
        created_at: existingGrade?.created_at ?? timestamp,
        updated_at: timestamp,
        createdAt: existingGrade?.createdAt ?? timestamp,
        updatedAt: timestamp,
      });

      updatedGrades.push(gradeRecord);
    }

    const existingGradeIds = new Set(updatedGrades.map((g) => String(g.id)));
    db.grades = [
      ...(db.grades ?? []).filter((g) => !existingGradeIds.has(String(g.id))),
      ...updatedGrades,
    ];

    await saveDb(db);
    return updatedGrades;
  });

export const uploadClassMaterial = async (classId, material) =>
  withWriteLock(async () => {
    const db = await loadDb();
    const allSchedules = (db.schedules ?? []).map(normalizeRecord);
    const index = allSchedules.findIndex((schedule) => String(schedule.id) === String(classId));

    if (index === -1) return null;

    const materialRecord = {
      id: randomUUID(),
      ...material,
      uploaded_at: nowIso(),
    };

    allSchedules[index].materials = [...(allSchedules[index].materials ?? []), materialRecord];
    db.schedules = allSchedules;
    await saveDb(db);

    return materialRecord;
  });

export const addClassAssessment = async (facultyId, classId, assessment) =>
  withWriteLock(async () => {
    const db = await loadDb();
    const { facultyIdentitySet } = resolveFacultyContext(db, facultyId);
    const allSchedules = (db.schedules ?? []).map(normalizeRecord);
    const index = allSchedules.findIndex(
      (schedule) =>
        String(schedule.id) === String(classId) &&
        matchesFacultyIdentity(schedule.faculty_id ?? schedule.facultyId ?? '', facultyIdentitySet)
    );

    if (index === -1) return null;

    const normalizedType = String(assessment?.type ?? '').toLowerCase();
    const typeKey =
      normalizedType === 'exam'
        ? 'exams'
        : normalizedType === 'activity'
          ? 'activities'
          : 'quizzes';

    const assessmentRecord = {
      id: randomUUID(),
      title: assessment?.title ?? 'Assessment',
      due_date: assessment?.dueDate ?? assessment?.due_date ?? null,
      date: assessment?.date ?? null,
      time: assessment?.time ?? null,
      status: assessment?.status ?? 'pending',
      created_at: nowIso(),
    };

    allSchedules[index][typeKey] = [...(allSchedules[index][typeKey] ?? []), assessmentRecord];
    allSchedules[index].updated_at = nowIso();
    allSchedules[index].updatedAt = allSchedules[index].updated_at;

    db.schedules = allSchedules;
    await saveDb(db);
    return assessmentRecord;
  });

export const getTeachingLoad = async (facultyId) => {
  const db = await loadDb();
  const { canonicalFacultyId, facultyIdentitySet } = resolveFacultyContext(db, facultyId);
  const allSchedules = (db.schedules ?? []).map(normalizeRecord);
  const allCourses = (db.courses ?? []).map(normalizeRecord);

  const facultyClasses = allSchedules.filter(
    (schedule) => matchesFacultyIdentity(schedule.faculty_id ?? schedule.facultyId ?? '', facultyIdentitySet)
  );

  let totalLectureHours = 0;
  let totalLabHours = 0;
  let totalTeachingHours = 0;
  let totalStudents = 0;

  const classesWithHours = facultyClasses.map((cls) => {
    const course = allCourses.find((c) => String(c.id) === String(cls.course_id ?? cls.courseId));

    let lectureHours = 0;
    let labHours = 0;
    const classType = cls.type ?? course?.type ?? 'lecture';
    const units = Number(cls.units ?? course?.units ?? 3);

    if (classType === 'lecture-only') {
      lectureHours = 3;
    } else if (classType === 'lecture-lab') {
      lectureHours = 2;
      labHours = 3;
    } else if (classType === 'lab-only') {
      labHours = 3;
    } else {
      lectureHours = 3;
    }

    totalLectureHours += lectureHours;
    totalLabHours += labHours;
    totalTeachingHours += lectureHours + labHours;
    totalStudents += Number(cls.students ?? 0);

    return {
      id: cls.id,
      code: course?.code ?? cls.code,
      name: course?.name ?? cls.name,
      section: cls.section,
      type: classType,
      units,
      lectureHours,
      labHours,
      totalHours: lectureHours + labHours,
      students: Number(cls.students ?? 0),
    };
  });

  return {
    facultyId: canonicalFacultyId,
    classes: classesWithHours,
    totalClasses: facultyClasses.length,
    totalStudents,
    totalLectureHours,
    totalLabHours,
    totalTeachingHours,
  };
};

export const getFacultySyllabi = async (facultyId) => {
  const db = await loadDb();
  const { facultyIdentitySet } = resolveFacultyContext(db, facultyId);
  const allSyllabi = (db.syllabi ?? []).map(normalizeRecord);
  const allSubjects = (db.subjects ?? []).map(normalizeRecord);

  const facultySubjects = allSubjects.filter(
    (subject) => matchesFacultyIdentity(subject.facultyId ?? subject.faculty_id ?? '', facultyIdentitySet)
  );

  const facultySyllabi = allSyllabi.filter((syllabus) => {
    const subjectId = syllabus.subject_id ?? syllabus.subjectId;
    return facultySubjects.some((subject) => String(subject.id) === String(subjectId));
  });

  return facultySyllabi.map((syllabus) => {
    const subject = facultySubjects.find(
      (s) => String(s.id) === String(syllabus.subject_id ?? syllabus.subjectId)
    );
    return {
      ...syllabus,
      subjectName: subject?.name ?? 'Unknown',
      subjectCode: subject?.code ?? 'Unknown',
    };
  });
};

export const uploadSyllabus = async (facultyId, syllabusData) =>
  withWriteLock(async () => {
    const db = await loadDb();
    const { canonicalFacultyId, facultyIdentitySet } = resolveFacultyContext(db, facultyId);
    const allSubjects = (db.subjects ?? []).map(normalizeRecord);
    const targetSubjectId = syllabusData.subject_id ?? syllabusData.subjectId ?? syllabusData.courseId;

    const subject = allSubjects.find(
      (s) =>
        String(s.id) === String(targetSubjectId) &&
        matchesFacultyIdentity(s.facultyId ?? s.faculty_id ?? '', facultyIdentitySet)
    );

    if (!subject) return null;

    const timestamp = nowIso();
    const syllabusRecord = normalizeRecord({
      id: randomUUID(),
      subject_id: subject.id,
      subjectId: subject.id,
      faculty_id: canonicalFacultyId,
      facultyId: canonicalFacultyId,
      ...syllabusData,
      created_at: timestamp,
      updated_at: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    db.syllabi = [...(db.syllabi ?? []), syllabusRecord];
    await saveDb(db);
    return syllabusRecord;
  });

export const deleteSyllabus = async (facultyId, syllabusId) =>
  withWriteLock(async () => {
    const db = await loadDb();
    const { facultyIdentitySet } = resolveFacultyContext(db, facultyId);
    const allSyllabi = (db.syllabi ?? []).map(normalizeRecord);

    const syllabus = allSyllabi.find((s) => String(s.id) === String(syllabusId));
    if (
      !syllabus ||
      !matchesFacultyIdentity(syllabus.faculty_id ?? syllabus.facultyId ?? '', facultyIdentitySet)
    ) {
      return false;
    }

    db.syllabi = allSyllabi.filter((s) => String(s.id) !== String(syllabusId));
    await saveDb(db);
    return true;
  });

export const getAllEvents = async () => {
  const db = await loadDb();
  return (db.events ?? []).map(normalizeRecord);
};

export const joinEvent = async (facultyId, eventId) =>
  withWriteLock(async () => {
    const db = await loadDb();
    const allEvents = (db.events ?? []).map(normalizeRecord);
    const index = allEvents.findIndex((e) => String(e.id) === String(eventId));

    if (index === -1) return null;

    const event = allEvents[index];
    const attendees = event.attendees ?? event.faculties ?? [];

    if (attendees.some((a) => String(a) === String(facultyId))) {
      return event;
    }

    const updated = normalizeRecord({
      ...event,
      attendees: [...attendees, facultyId],
      faculties: [...attendees, facultyId],
      updated_at: nowIso(),
      updatedAt: nowIso(),
    });

    allEvents[index] = updated;
    db.events = allEvents;
    await saveDb(db);
    return updated;
  });

export const inviteStudentsToEvent = async (facultyId, eventId, studentIds) =>
  withWriteLock(async () => {
    const db = await loadDb();
    const allEvents = (db.events ?? []).map(normalizeRecord);
    const index = allEvents.findIndex((e) => String(e.id) === String(eventId));

    if (index === -1) return null;

    const event = allEvents[index];
    const invitedStudents = event.invited_students ?? event.invitedStudents ?? [];

    const newInvites = studentIds.filter(
      (id) => !invitedStudents.some((s) => String(s) === String(id))
    );

    const updated = normalizeRecord({
      ...event,
      invited_students: [...invitedStudents, ...newInvites],
      invitedStudents: [...invitedStudents, ...newInvites],
      updated_at: nowIso(),
      updatedAt: nowIso(),
    });

    allEvents[index] = updated;
    db.events = allEvents;
    await saveDb(db);
    return updated;
  });

export const getFacultyResearch = async (facultyId) => {
  const db = await loadDb();
  const allResearch = (db.research ?? []).map(normalizeRecord);
  const allStudents = (db.students ?? []).map(normalizeRecord);

  const facultyResearch = allResearch.filter((research) => {
    const panelMembers = research.panel_members ?? research.panelMembers ?? [];
    const advisers = research.advisers ?? research.advisers ?? [];

    const isPanelMember = panelMembers.some((member) =>
      typeof member === 'string'
        ? String(member) === String(facultyId)
        : String(member.id ?? member) === String(facultyId)
    );

    const isAdviser = advisers.some((adviser) =>
      typeof adviser === 'string'
        ? String(adviser) === String(facultyId)
        : String(adviser.id ?? adviser) === String(facultyId)
    );

    return isPanelMember || isAdviser;
  });

  return facultyResearch.map((research) => {
    const panelMembers = research.panel_members ?? research.panelMembers ?? [];
    const advisers = research.advisers ?? research.advisers ?? [];

    const isPanelMember = panelMembers.some((member) =>
      typeof member === 'string'
        ? String(member) === String(facultyId)
        : String(member.id ?? member) === String(facultyId)
    );

    const studentIds = research.students ?? research.student_ids ?? [];
    const researchStudents = studentIds.map((studentId) => {
      const student = allStudents.find((s) => String(s.id) === String(studentId));
      return student || { id: studentId, name: 'Unknown' };
    });

    return {
      ...research,
      role: isPanelMember ? 'panel_member' : 'adviser',
      category: isPanelMember ? 'Panel' : 'Adviser',
      students: researchStudents,
      studentCount: researchStudents.length,
    };
  });
};

export const getResearchDetails = async (facultyId, researchId) => {
  const db = await loadDb();
  const allResearch = (db.research ?? []).map(normalizeRecord);
  const allStudents = (db.students ?? []).map(normalizeRecord);

  const research = allResearch.find((r) => String(r.id) === String(researchId));
  if (!research) return null;

  const panelMembers = research.panel_members ?? research.panelMembers ?? [];
  const advisers = research.advisers ?? research.advisers ?? [];

  const isFacultyInvolved =
    panelMembers.some((member) =>
      typeof member === 'string'
        ? String(member) === String(facultyId)
        : String(member.id ?? member) === String(facultyId)
    ) ||
    advisers.some((adviser) =>
      typeof adviser === 'string'
        ? String(adviser) === String(facultyId)
        : String(adviser.id ?? adviser) === String(facultyId)
    );

  if (!isFacultyInvolved) return null;

  const studentIds = research.students ?? research.student_ids ?? [];
  const researchStudents = studentIds.map((studentId) => {
    const student = allStudents.find((s) => String(s.id) === String(studentId));
    return student || { id: studentId, name: 'Unknown' };
  });

  return {
    ...research,
    students: researchStudents,
    panel_members: panelMembers,
    advisers,
    details: research.description || research.abstract || '',
  };
};
