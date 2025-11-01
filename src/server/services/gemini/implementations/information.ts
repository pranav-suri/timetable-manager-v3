import {
  calculateFairnessScore,
  calculateStandardDeviation,
  findConsecutiveSlots,
  findEntityByIdOrName,
  getDayName,
  verifyTimetableAccess,
} from "./utils";
import type { prisma } from "@/server/prisma";

type PrismaClient = typeof prisma;

/**
 * Phase 1: Information Retrieval Functions
 * Read-only functions for querying timetable data
 */

/**
 * 1. Get Teachers List
 */
export async function getTeachersList(
  prisma: PrismaClient,
  args: {
    timetableId: string;
    organizationId: string;
    subjectName?: string;
    minAvailableHours?: number;
  },
) {
  await verifyTimetableAccess(prisma, args.timetableId, args.organizationId);

  // Get all teachers with related data
  const teachers = await prisma.teacher.findMany({
    where: {
      timetableId: args.timetableId,
    },
    include: {
      subjectTeachers: {
        include: {
          subject: true,
        },
      },
      lectures: {
        include: {
          lectureSlots: true,
        },
      },
      slots: true, // unavailable slots
    },
  });

  // Process and filter teachers
  const processedTeachers = teachers
    .map((teacher) => {
      const subjects = Array.from(
        new Set(teacher.subjectTeachers.map((st) => st.subject.name)),
      );

      // Calculate total assigned hours
      const totalAssignedHours = teacher.lectures.reduce((sum, lecture) => {
        return sum + lecture.lectureSlots.length * lecture.duration;
      }, 0);

      const availableHours = teacher.weeklyMaxHours - totalAssignedHours;

      return {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        dailyMaxHours: teacher.dailyMaxHours,
        weeklyMaxHours: teacher.weeklyMaxHours,
        subjects,
        totalAssignedHours,
        availableHours,
        unavailableSlots: teacher.slots.length,
      };
    })
    .filter((teacher) => {
      // Filter by subject if provided
      if (args.subjectName) {
        const normalized = args.subjectName.toLowerCase().trim();
        if (
          !teacher.subjects.some((s) => s.toLowerCase().includes(normalized))
        ) {
          return false;
        }
      }

      // Filter by minimum available hours
      if (
        args.minAvailableHours !== undefined &&
        teacher.availableHours < args.minAvailableHours
      ) {
        return false;
      }

      return true;
    });

  return {
    teachers: processedTeachers,
    totalCount: processedTeachers.length,
  };
}

/**
 * 2. Get Schedule for Entity (Teacher, Classroom, or Subdivision)
 */
export async function getScheduleForEntity(
  prisma: PrismaClient,
  args: {
    timetableId: string;
    organizationId: string;
    entityType: "teacher" | "classroom" | "subdivision";
    entityId?: string;
    entityName?: string;
    day?: number;
  },
) {
  await verifyTimetableAccess(prisma, args.timetableId, args.organizationId);

  if (!args.entityId && !args.entityName) {
    throw new Error("Either entityId or entityName must be provided");
  }

  // Get all slots for the timetable
  const slots = await prisma.slot.findMany({
    where: {
      timetableId: args.timetableId,
      ...(args.day !== undefined ? { day: args.day } : {}),
    },
    include: {
      lectureSlots: {
        include: {
          lecture: {
            include: {
              teacher: true,
              subject: true,
              lectureClassrooms: {
                include: {
                  classroom: true,
                },
              },
              lectureSubdivisions: {
                include: {
                  subdivision: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: [{ day: "asc" }, { number: "asc" }],
  });

  // Find the entity
  let entityInfo: { id: string; name: string; type: string } | null = null;

  if (args.entityType === "teacher") {
    const teachers = await prisma.teacher.findMany({
      where: { timetableId: args.timetableId },
    });
    const teacher = findEntityByIdOrName(
      teachers,
      args.entityId,
      args.entityName,
    );
    if (teacher) {
      entityInfo = { id: teacher.id, name: teacher.name, type: "teacher" };
    }
  } else if (args.entityType === "classroom") {
    const classrooms = await prisma.classroom.findMany({
      where: { timetableId: args.timetableId },
    });
    const classroom = findEntityByIdOrName(
      classrooms,
      args.entityId,
      args.entityName,
    );
    if (classroom) {
      entityInfo = {
        id: classroom.id,
        name: classroom.name,
        type: "classroom",
      };
    }
  } else {
    // subdivision
    const subdivisions = await prisma.subdivision.findMany({
      where: { timetableId: args.timetableId },
    });
    const subdivision = findEntityByIdOrName(
      subdivisions,
      args.entityId,
      args.entityName,
    );
    if (subdivision) {
      entityInfo = {
        id: subdivision.id,
        name: subdivision.name,
        type: "subdivision",
      };
    }
  }

  if (!entityInfo) {
    throw new Error(`${args.entityType} not found with provided id or name`);
  }

  // Filter slots based on entity
  const schedule = slots.map((slot) => {
    let relevantLecture = null;

    for (const lectureSlot of slot.lectureSlots) {
      const lecture = lectureSlot.lecture;
      let isRelevant = false;

      if (
        args.entityType === "teacher" &&
        lecture.teacherId === entityInfo.id
      ) {
        isRelevant = true;
      } else if (args.entityType === "classroom") {
        isRelevant = lecture.lectureClassrooms.some(
          (lc) => lc.classroomId === entityInfo.id,
        );
      } else if (args.entityType === "subdivision") {
        isRelevant = lecture.lectureSubdivisions.some(
          (ls) => ls.subdivisionId === entityInfo.id,
        );
      }

      if (isRelevant) {
        relevantLecture = {
          id: lecture.id,
          subject: lecture.subject.name,
          teacher: lecture.teacher.name,
          classrooms: lecture.lectureClassrooms.map((lc) => lc.classroom.name),
          subdivisions: lecture.lectureSubdivisions.map(
            (ls) => ls.subdivision.name,
          ),
          duration: lecture.duration,
          isLocked: lectureSlot.isLocked,
        };
        break;
      }
    }

    return {
      slotId: slot.id,
      day: slot.day,
      dayName: getDayName(slot.day),
      slotNumber: slot.number,
      lecture: relevantLecture,
    };
  });

  const occupiedSlots = schedule.filter((s) => s.lecture !== null).length;
  const totalSlots = schedule.length;

  return {
    entityInfo,
    schedule,
    statistics: {
      totalOccupiedSlots: occupiedSlots,
      totalAvailableSlots: totalSlots,
      utilizationPercentage:
        totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0,
    },
  };
}

/**
 * 3. Find Available Slots
 */
export async function findAvailableSlots(
  prisma: PrismaClient,
  args: {
    timetableId: string;
    organizationId: string;
    entityType: "teacher" | "classroom" | "subdivision";
    entityId?: string;
    entityName?: string;
    day?: number;
    consecutiveSlots?: number;
  },
) {
  await verifyTimetableAccess(prisma, args.timetableId, args.organizationId);

  // Get the entity's schedule first
  const scheduleData = await getScheduleForEntity(prisma, {
    timetableId: args.timetableId,
    organizationId: args.organizationId,
    entityType: args.entityType,
    entityId: args.entityId,
    entityName: args.entityName,
    day: args.day,
  });

  // Get unavailability data
  let unavailableSlotIds: string[] = [];

  if (args.entityType === "teacher") {
    const unavailable = await prisma.teacherUnavailable.findMany({
      where: { teacherId: scheduleData.entityInfo.id },
      include: { slot: true },
    });
    unavailableSlotIds = unavailable.map((u) => u.slotId);
  } else if (args.entityType === "classroom") {
    const unavailable = await prisma.classroomUnavailable.findMany({
      where: { classroomId: scheduleData.entityInfo.id },
      include: { slot: true },
    });
    unavailableSlotIds = unavailable.map((u) => u.slotId);
  } else {
    // subdivision
    const unavailable = await prisma.subdivisionUnavailable.findMany({
      where: { subdivisionId: scheduleData.entityInfo.id },
      include: { slot: true },
    });
    unavailableSlotIds = unavailable.map((u) => u.slotId);
  }

  // Filter available slots
  const availableSlots = scheduleData.schedule
    .filter(
      (slot) => !slot.lecture && !unavailableSlotIds.includes(slot.slotId),
    )
    .map((slot) => ({
      slotId: slot.slotId,
      day: slot.day,
      dayName: slot.dayName,
      slotNumber: slot.slotNumber,
    }));

  // Find consecutive slot groups if requested
  let consecutiveGroups: any[] = [];
  if (args.consecutiveSlots && args.consecutiveSlots > 1) {
    // Map to the format expected by findConsecutiveSlots
    const slotsForConsecutive = availableSlots.map((s) => ({
      day: s.day,
      number: s.slotNumber,
    }));
    consecutiveGroups = findConsecutiveSlots(
      slotsForConsecutive,
      args.consecutiveSlots,
    );
  }

  // Mark slots that are part of consecutive groups
  const slotsWithConsecutive = availableSlots.map((slot) => {
    const isInGroup = consecutiveGroups.some(
      (group) =>
        group.slotNumbers.includes(slot.slotNumber) && group.day === slot.day,
    );
    const group = consecutiveGroups.find(
      (g) => g.slotNumbers.includes(slot.slotNumber) && g.day === slot.day,
    );

    return {
      ...slot,
      isConsecutive: isInGroup,
      consecutiveCount: group ? group.count : 1,
    };
  });

  // Group by day
  const groupedByDay = slotsWithConsecutive.reduce(
    (acc, slot) => {
      acc[slot.day] = (acc[slot.day] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>,
  );

  return {
    availableSlots: slotsWithConsecutive,
    totalAvailable: slotsWithConsecutive.length,
    groupedByDay,
    consecutiveGroups: args.consecutiveSlots ? consecutiveGroups : undefined,
  };
}

/**
 * 4. Check Conflicts
 */
export async function checkConflicts(
  prisma: PrismaClient,
  args: {
    timetableId: string;
    organizationId: string;
    scope?: "all" | "teachers" | "classrooms" | "subdivisions";
    entityId?: string;
  },
) {
  await verifyTimetableAccess(prisma, args.timetableId, args.organizationId);

  const scope = args.scope || "all";
  const conflicts: any[] = [];

  // Get all lecture slots with related data
  const lectureSlots = await prisma.lectureSlot.findMany({
    where: {
      lecture: {
        timetableId: args.timetableId,
      },
    },
    include: {
      slot: true,
      lecture: {
        include: {
          teacher: true,
          subject: true,
          lectureClassrooms: {
            include: {
              classroom: true,
            },
          },
          lectureSubdivisions: {
            include: {
              subdivision: true,
            },
          },
        },
      },
    },
  });

  // Group by slot to find conflicts
  const slotGroups = lectureSlots.reduce(
    (acc, ls) => {
      if (!acc[ls.slotId]) acc[ls.slotId] = [];
      acc[ls.slotId]!.push(ls);
      return acc;
    },
    {} as Record<string, typeof lectureSlots>,
  );

  // Check for double bookings
  for (const [slotId, lectures] of Object.entries(slotGroups)) {
    if (lectures.length < 2) continue;

    const slot = lectures[0]!.slot;

    // Teacher double booking
    if (scope === "all" || scope === "teachers") {
      const teacherMap = new Map<string, typeof lectures>();
      lectures.forEach((ls) => {
        const teacherId = ls.lecture.teacherId;
        if (!teacherMap.has(teacherId)) {
          teacherMap.set(teacherId, []);
        }
        teacherMap.get(teacherId)!.push(ls);
      });

      teacherMap.forEach((conflictingLectures, teacherId) => {
        if (conflictingLectures.length > 1) {
          conflicts.push({
            type: "teacher_double_booking",
            severity: "high",
            slotId,
            day: slot.day,
            dayName: getDayName(slot.day),
            slotNumber: slot.number,
            affectedEntity: {
              id: teacherId,
              name: conflictingLectures[0]!.lecture.teacher.name,
              type: "teacher",
            },
            conflictingLectures: conflictingLectures.map((ls) => ({
              lectureId: ls.lecture.id,
              subject: ls.lecture.subject.name,
              teacher: ls.lecture.teacher.name,
            })),
            recommendation: `Reassign one of the lectures to a different time slot or find a substitute teacher.`,
          });
        }
      });
    }

    // Classroom double booking
    if (scope === "all" || scope === "classrooms") {
      const classroomMap = new Map<string, typeof lectures>();
      lectures.forEach((ls) => {
        ls.lecture.lectureClassrooms.forEach((lc) => {
          if (!classroomMap.has(lc.classroomId)) {
            classroomMap.set(lc.classroomId, []);
          }
          classroomMap.get(lc.classroomId)!.push(ls);
        });
      });

      classroomMap.forEach((conflictingLectures, classroomId) => {
        if (conflictingLectures.length > 1) {
          const classroom =
            conflictingLectures[0]!.lecture.lectureClassrooms.find(
              (lc) => lc.classroomId === classroomId,
            );
          conflicts.push({
            type: "classroom_double_booking",
            severity: "high",
            slotId,
            day: slot.day,
            dayName: getDayName(slot.day),
            slotNumber: slot.number,
            affectedEntity: {
              id: classroomId,
              name: classroom?.classroom.name || "Unknown",
              type: "classroom",
            },
            conflictingLectures: conflictingLectures.map((ls) => ({
              lectureId: ls.lecture.id,
              subject: ls.lecture.subject.name,
              teacher: ls.lecture.teacher.name,
            })),
            recommendation: `Assign one of the lectures to a different classroom or time slot.`,
          });
        }
      });
    }

    // Subdivision double booking
    if (scope === "all" || scope === "subdivisions") {
      const subdivisionMap = new Map<string, typeof lectures>();
      lectures.forEach((ls) => {
        ls.lecture.lectureSubdivisions.forEach((lsub) => {
          if (!subdivisionMap.has(lsub.subdivisionId)) {
            subdivisionMap.set(lsub.subdivisionId, []);
          }
          subdivisionMap.get(lsub.subdivisionId)!.push(ls);
        });
      });

      subdivisionMap.forEach((conflictingLectures, subdivisionId) => {
        if (conflictingLectures.length > 1) {
          const subdivision =
            conflictingLectures[0]!.lecture.lectureSubdivisions.find(
              (ls) => ls.subdivisionId === subdivisionId,
            );
          conflicts.push({
            type: "subdivision_double_booking",
            severity: "high",
            slotId,
            day: slot.day,
            dayName: getDayName(slot.day),
            slotNumber: slot.number,
            affectedEntity: {
              id: subdivisionId,
              name: subdivision?.subdivision.name || "Unknown",
              type: "subdivision",
            },
            conflictingLectures: conflictingLectures.map((ls) => ({
              lectureId: ls.lecture.id,
              subject: ls.lecture.subject.name,
              teacher: ls.lecture.teacher.name,
            })),
            recommendation: `Reschedule one of the lectures to a different time slot.`,
          });
        }
      });
    }
  }

  // Check unavailability conflicts (lectures scheduled during unavailable times)
  if (scope === "all" || scope === "teachers") {
    const teacherUnavailable = await prisma.teacherUnavailable.findMany({
      where: {
        teacher: {
          timetableId: args.timetableId,
        },
      },
      include: {
        teacher: true,
        slot: true,
      },
    });

    teacherUnavailable.forEach((unavail) => {
      const conflictingLectures = lectureSlots.filter(
        (ls) =>
          ls.slotId === unavail.slotId &&
          ls.lecture.teacherId === unavail.teacherId,
      );

      if (conflictingLectures.length > 0) {
        conflicts.push({
          type: "teacher_unavailable",
          severity: "medium",
          slotId: unavail.slotId,
          day: unavail.slot.day,
          dayName: getDayName(unavail.slot.day),
          slotNumber: unavail.slot.number,
          affectedEntity: {
            id: unavail.teacherId,
            name: unavail.teacher.name,
            type: "teacher",
          },
          conflictingLectures: conflictingLectures.map((ls) => ({
            lectureId: ls.lecture.id,
            subject: ls.lecture.subject.name,
            teacher: ls.lecture.teacher.name,
          })),
          recommendation: `Remove the unavailability constraint or reschedule the lecture.`,
        });
      }
    });
  }

  // Group conflicts by type
  const conflictsByType = conflicts.reduce(
    (acc, conflict) => {
      acc[conflict.type] = (acc[conflict.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return {
    conflicts,
    totalConflicts: conflicts.length,
    conflictsByType,
  };
}

/**
 * 5. Get Timetable Statistics
 */
export async function getTimetableStatistics(
  prisma: PrismaClient,
  args: {
    timetableId: string;
    organizationId: string;
  },
) {
  await verifyTimetableAccess(prisma, args.timetableId, args.organizationId);

  // Get counts
  const [
    teachers,
    subjects,
    classrooms,
    subdivisions,
    lectures,
    slots,
    assignedSlots,
    conflicts,
  ] = await Promise.all([
    prisma.teacher.count({ where: { timetableId: args.timetableId } }),
    prisma.subject.count({
      where: { group: { timetableId: args.timetableId } },
    }),
    prisma.classroom.count({ where: { timetableId: args.timetableId } }),
    prisma.subdivision.count({ where: { timetableId: args.timetableId } }),
    prisma.lecture.count({ where: { timetableId: args.timetableId } }),
    prisma.slot.count({ where: { timetableId: args.timetableId } }),
    prisma.lectureSlot.count({
      where: { lecture: { timetableId: args.timetableId } },
    }),
    checkConflicts(prisma, {
      timetableId: args.timetableId,
      organizationId: args.organizationId,
    }),
  ]);

  // Get teacher utilization data
  const teachersData = await prisma.teacher.findMany({
    where: { timetableId: args.timetableId },
    include: {
      lectures: {
        include: {
          lectureSlots: true,
        },
      },
    },
  });

  const teacherUtilization = teachersData.map((teacher) => {
    const assignedHours = teacher.lectures.reduce(
      (sum, lecture) => sum + lecture.lectureSlots.length * lecture.duration,
      0,
    );
    const percentage =
      teacher.weeklyMaxHours > 0
        ? (assignedHours / teacher.weeklyMaxHours) * 100
        : 0;
    return {
      name: teacher.name,
      assignedHours,
      maxHours: teacher.weeklyMaxHours,
      percentage,
    };
  });

  const avgTeacherUtilization =
    teacherUtilization.length > 0
      ? teacherUtilization.reduce((sum, t) => sum + t.percentage, 0) /
        teacherUtilization.length
      : 0;

  const topUtilized = [...teacherUtilization]
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5);

  const underUtilized = [...teacherUtilization]
    .filter((t) => t.percentage < 50)
    .sort((a, b) => a.percentage - b.percentage)
    .slice(0, 5)
    .map((t) => ({
      type: "teacher",
      name: t.name,
      percentage: Math.round(t.percentage),
    }));

  // Classroom utilization
  const classroomsData = await prisma.classroom.findMany({
    where: { timetableId: args.timetableId },
    include: {
      lectures: {
        include: {
          lecture: {
            include: {
              lectureSlots: true,
            },
          },
        },
      },
    },
  });

  const classroomUtilization =
    classroomsData.length > 0 && slots > 0
      ? classroomsData.reduce((sum, classroom) => {
          const usedSlots = new Set(
            classroom.lectures.flatMap((lc) =>
              lc.lecture.lectureSlots.map((ls) => ls.slotId),
            ),
          ).size;
          return sum + (usedSlots / slots) * 100;
        }, 0) / classroomsData.length
      : 0;

  // Workload distribution
  const teacherHours = teacherUtilization.map((t) => t.assignedHours);
  const avgHours =
    teacherHours.length > 0
      ? teacherHours.reduce((sum, h) => sum + h, 0) / teacherHours.length
      : 0;
  const maxHours = teacherHours.length > 0 ? Math.max(...teacherHours) : 0;
  const minHours = teacherHours.length > 0 ? Math.min(...teacherHours) : 0;
  const stdDev = calculateStandardDeviation(teacherHours);
  const fairnessScore = calculateFairnessScore(teacherHours);

  return {
    overview: {
      totalTeachers: teachers,
      totalSubjects: subjects,
      totalClassrooms: classrooms,
      totalSubdivisions: subdivisions,
      totalLectures: lectures,
      totalSlots: slots,
      assignedSlots,
    },
    utilization: {
      teacherUtilization: Math.round(avgTeacherUtilization),
      classroomUtilization: Math.round(classroomUtilization),
      timeSlotUtilization:
        slots > 0 ? Math.round((assignedSlots / slots) * 100) : 0,
      topUtilizedTeachers: topUtilized.map((t) => ({
        name: t.name,
        percentage: Math.round(t.percentage),
      })),
      underUtilizedResources: underUtilized,
    },
    workloadDistribution: {
      averageTeacherHours: Math.round(avgHours * 10) / 10,
      maxTeacherHours: maxHours,
      minTeacherHours: minHours,
      standardDeviation: Math.round(stdDev * 10) / 10,
      fairnessScore,
    },
    conflicts: {
      totalConflicts: conflicts.totalConflicts,
      criticalConflicts: conflicts.conflicts.filter(
        (c) => c.severity === "high",
      ).length,
    },
  };
}
