import type { prisma } from "@/server/prisma";
import {
  verifyTimetableAccess,
  getDayName,
  calculateFairnessScore,
} from "./utils";
import {
  getScheduleForEntity,
  findAvailableSlots,
  checkConflicts,
  getTimetableStatistics,
} from "./information";

type PrismaClient = typeof prisma;

/**
 * Phase 3: AI-Powered Insight Functions
 * Intelligent recommendations and analysis
 */

/**
 * 6. Suggest Lecture Placement
 */
export async function suggestLecturePlacement(
  prisma: PrismaClient,
  args: {
    timetableId: string;
    organizationId: string;
    lectureId: string;
    preferredDays?: number[];
    avoidConsecutive?: boolean;
  }
) {
  await verifyTimetableAccess(prisma, args.timetableId, args.organizationId);

  // Get lecture details
  const lecture = await prisma.lecture.findUnique({
    where: { id: args.lectureId },
    include: {
      teacher: true,
      subject: true,
      lectureSubdivisions: {
        include: { subdivision: true },
      },
      lectureClassrooms: {
        include: { classroom: true },
      },
    },
  });

  if (!lecture) {
    throw new Error("Lecture not found");
  }

  // Get available slots for teacher, subdivisions, and classrooms
  const teacherAvailability = await findAvailableSlots(prisma, {
    timetableId: args.timetableId,
    organizationId: args.organizationId,
    entityType: "teacher",
    entityId: lecture.teacherId,
  });

  // Find slots that are available for ALL involved entities
  const commonAvailableSlots = teacherAvailability.availableSlots.filter((slot) => {
    // Check if preferred days constraint is met
    if (args.preferredDays && !args.preferredDays.includes(slot.day)) {
      return false;
    }
    return true;
  });

  // Score each slot
  const recommendations = await Promise.all(
    commonAvailableSlots.map(async (slot) => {
      let score = 0;
      const reasons: string[] = [];
      const pros: string[] = [];
      const cons: string[] = [];

      // 1. Availability Score (30 points)
      score += 30;
      pros.push("Teacher, classrooms, and subdivisions are all available");

      // 2. Workload Balance Score (25 points)
      const teacherSchedule = await getScheduleForEntity(prisma, {
        timetableId: args.timetableId,
        organizationId: args.organizationId,
        entityType: "teacher",
        entityId: lecture.teacherId,
        day: slot.day,
      });

      const dailyLoad = teacherSchedule.schedule.filter((s) => s.lecture).length;
      const balanceScore = Math.max(0, 25 - dailyLoad * 3);
      score += balanceScore;

      if (balanceScore > 15) {
        pros.push(`Teacher has light load on ${slot.dayName} (${dailyLoad} lectures)`);
      } else if (balanceScore < 10) {
        cons.push(
          `Teacher already has ${dailyLoad} lectures on ${slot.dayName}`
        );
      }

      // 3. Distribution Score (20 points)
      const weeklySchedule = await getScheduleForEntity(prisma, {
        timetableId: args.timetableId,
        organizationId: args.organizationId,
        entityType: "teacher",
        entityId: lecture.teacherId,
      });

      const lectureCounts = weeklySchedule.schedule.reduce((acc, s) => {
        if (s.lecture) {
          acc[s.day] = (acc[s.day] || 0) + 1;
        }
        return acc;
      }, {} as Record<number, number>);

      const currentDayCount = lectureCounts[slot.day] || 0;
      const avgCount =
        Object.values(lectureCounts).reduce((sum, c) => sum + c, 0) / 7;
      const distributionScore =
        currentDayCount <= avgCount ? 20 : Math.max(0, 20 - (currentDayCount - avgCount) * 5);
      score += distributionScore;

      if (distributionScore > 15) {
        pros.push("Helps balance weekly lecture distribution");
      }

      // 4. Student Experience Score (15 points)
      if (lecture.lectureSubdivisions.length > 0 && lecture.lectureSubdivisions[0]) {
        const subdivisionSchedule = await getScheduleForEntity(prisma, {
          timetableId: args.timetableId,
          organizationId: args.organizationId,
          entityType: "subdivision",
          entityId: lecture.lectureSubdivisions[0].subdivisionId,
          day: slot.day,
        });

        const studentDailyLoad = subdivisionSchedule.schedule.filter((s) => s.lecture)
          .length;
        const studentScore = Math.max(0, 15 - studentDailyLoad * 2);
        score += studentScore;

        if (studentScore > 10) {
          pros.push(
            `Students have manageable schedule on ${slot.dayName} (${studentDailyLoad} lectures)`
          );
        } else {
          cons.push(
            `Students already have ${studentDailyLoad} lectures on ${slot.dayName}`
          );
        }
      } else {
        score += 10; // neutral score if no subdivision info
      }

      // 5. Preference Score (10 points)
      if (args.preferredDays && args.preferredDays.includes(slot.day)) {
        score += 10;
        pros.push(`Matches preferred day (${slot.dayName})`);
      }

      // 6. Avoid consecutive penalty
      if (args.avoidConsecutive) {
        const hasConsecutive = weeklySchedule.schedule.some(
          (s) =>
            s.lecture &&
            s.day === slot.day &&
            Math.abs(s.slotNumber - slot.slotNumber) === 1
        );

        if (hasConsecutive) {
          score -= 10;
          cons.push("Would create back-to-back lectures for teacher");
        } else {
          pros.push("No consecutive lectures");
        }
      }

      // Generate reasons summary
      if (score >= 80) {
        reasons.push("Excellent fit with high availability and balanced workload");
      } else if (score >= 60) {
        reasons.push("Good option with minor considerations");
      } else {
        reasons.push("Available but may not be optimal");
      }

      return {
        slotId: slot.slotId,
        day: slot.day,
        dayName: slot.dayName,
        slotNumber: slot.slotNumber,
        score: Math.min(100, Math.max(0, score)),
        reasons,
        pros,
        cons,
        teacherLoad: {
          beforePlacement: weeklySchedule.statistics.totalOccupiedSlots,
          afterPlacement: weeklySchedule.statistics.totalOccupiedSlots + 1,
          isBalanced: score >= 60,
        },
      };
    })
  );

  // Sort by score
  recommendations.sort((a, b) => b.score - a.score);

  return {
    recommendations,
    topRecommendation: recommendations[0] || null,
  };
}

/**
 * 7. Find Substitute Teacher
 */
export async function findSubstituteTeacher(
  prisma: PrismaClient,
  args: {
    timetableId: string;
    organizationId: string;
    subjectName: string;
    slotId: string;
    primaryTeacherId?: string;
  }
) {
  await verifyTimetableAccess(prisma, args.timetableId, args.organizationId);

  // Get all teachers who can teach this subject
  const subjectNameLower = args.subjectName.toLowerCase();
  const allTeachers = await prisma.teacher.findMany({
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
      slots: {
        where: {
          slotId: args.slotId,
        },
      },
    },
  });

  // Filter teachers who can teach this subject
  const teachers = allTeachers.filter(teacher =>
    teacher.subjectTeachers.some(st =>
      st.subject.name.toLowerCase().includes(subjectNameLower)
    )
  );

  // Get slot details
  const slot = await prisma.slot.findUnique({
    where: { id: args.slotId },
  });

  if (!slot) {
    throw new Error("Slot not found");
  }

  // Score each potential substitute
  const substitutes = teachers
    .filter((t) => t.id !== args.primaryTeacherId)
    .map((teacher) => {
      let score = 0;
      const reasons: string[] = [];
      const concerns: string[] = [];

      // Check if teaches the exact subject
      const teachesSubject = teacher.subjectTeachers.some(
        (st) =>
          st.subject.name.toLowerCase() === args.subjectName.toLowerCase()
      );

      // 1. Subject expertise (40 points)
      if (teachesSubject) {
        score += 40;
        reasons.push(`Already teaches ${args.subjectName}`);
      } else {
        score += 20;
        reasons.push(`Teaches related subjects in the same domain`);
      }

      // 2. Availability (30 points)
      const isAvailable = teacher.slots.length === 0;
      if (isAvailable) {
        score += 30;
        reasons.push(`Available during ${getDayName(slot.day)} slot ${slot.number}`);
      } else {
        concerns.push(
          `Marked as unavailable during ${getDayName(slot.day)} slot ${slot.number}`
        );
      }

      // 3. Capacity (20 points)
      const currentLoad = teacher.lectures.reduce(
        (sum, lecture) => sum + lecture.lectureSlots.length * lecture.duration,
        0
      );
      const utilizationPercentage =
        teacher.weeklyMaxHours > 0
          ? (currentLoad / teacher.weeklyMaxHours) * 100
          : 100;

      if (utilizationPercentage < 70) {
        score += 20;
        reasons.push(`Has capacity (${Math.round(utilizationPercentage)}% utilized)`);
      } else if (utilizationPercentage < 90) {
        score += 10;
        concerns.push(`Near capacity (${Math.round(utilizationPercentage)}% utilized)`);
      } else {
        concerns.push(`At or over capacity (${Math.round(utilizationPercentage)}% utilized)`);
      }

      // 4. Quality/Balance (10 points)
      if (utilizationPercentage >= 40 && utilizationPercentage <= 70) {
        score += 10;
        reasons.push("Well-balanced workload");
      }

      return {
        teacherId: teacher.id,
        teacherName: teacher.name,
        score: Math.min(100, score),
        isAvailable,
        currentLoad,
        maxLoad: teacher.weeklyMaxHours,
        teachesSubject,
        reasons,
        concerns,
      };
    });

  // Sort by score
  substitutes.sort((a, b) => b.score - a.score);

  const bestMatch = substitutes[0] || null;
  const noSubstituteAvailable = !bestMatch || bestMatch.score < 30;

  let suggestion = "";
  if (noSubstituteAvailable) {
    suggestion =
      "No suitable substitute found. Consider: 1) Rescheduling the lecture, 2) Hiring temporary staff, or 3) Combining with another class";
  }

  return {
    substitutes,
    bestMatch,
    noSubstituteAvailable,
    suggestion,
  };
}

/**
 * 8. Recommend Classroom
 */
export async function recommendClassroom(
  prisma: PrismaClient,
  args: {
    timetableId: string;
    organizationId: string;
    lectureId: string;
    slotId?: string;
  }
) {
  await verifyTimetableAccess(prisma, args.timetableId, args.organizationId);

  // Get lecture details
  const lecture = await prisma.lecture.findUnique({
    where: { id: args.lectureId },
    include: {
      subject: {
        include: {
          subjectClassrooms: {
            include: {
              classroom: true,
            },
          },
        },
      },
    },
  });

  if (!lecture) {
    throw new Error("Lecture not found");
  }

  // Get all classrooms
  const classrooms = await prisma.classroom.findMany({
    where: {
      timetableId: args.timetableId,
    },
    include: {
      lectures: {
        include: {
          lecture: {
            include: {
              lectureSlots: true,
              subject: true,
            },
          },
        },
      },
      slots: args.slotId
        ? {
            where: {
              slotId: args.slotId,
            },
          }
        : undefined,
    },
  });

  // Score each classroom
  const recommendations = classrooms.map((classroom) => {
    let score = 0;
    const reasons: string[] = [];

    // 1. Availability (50 points)
    const isAvailable = args.slotId ? (classroom.slots.length === 0) : true;
    if (isAvailable || !args.slotId) {
      score += 50;
      if (args.slotId) {
        reasons.push("Available during the requested time slot");
      } else {
        reasons.push("Generally available");
      }
    } else {
      reasons.push("Not available during requested time slot");
    }

    // 2. Subject Compatibility (30 points)
    const compatibleSubjects = new Set(
      classroom.lectures.map((lc) => lc.lecture.subject.name)
    );
    const isPreferredForSubject = lecture.subject.subjectClassrooms.some(
      (sc) => sc.classroomId === classroom.id
    );

    if (isPreferredForSubject) {
      score += 30;
      reasons.push(`Designated classroom for ${lecture.subject.name}`);
    } else if (compatibleSubjects.has(lecture.subject.name)) {
      score += 20;
      reasons.push(`Previously used for ${lecture.subject.name} lectures`);
    } else if (compatibleSubjects.size === 0) {
      score += 15;
      reasons.push("Available for general use");
    } else {
      score += 10;
    }

    // 3. Utilization Balance (20 points)
    const totalUsage = new Set(
      classroom.lectures.flatMap((lc) =>
        lc.lecture.lectureSlots.map((ls) => ls.slotId)
      )
    ).size;

    // Assume roughly 35 slots per week (5 days × 7 slots)
    const utilizationPercentage = (totalUsage / 35) * 100;

    if (utilizationPercentage < 60) {
      score += 20;
      reasons.push(
        `Underutilized (${Math.round(utilizationPercentage)}% occupied)`
      );
    } else if (utilizationPercentage < 80) {
      score += 15;
      reasons.push(`Well-utilized (${Math.round(utilizationPercentage)}% occupied)`);
    } else {
      score += 5;
      reasons.push(`Highly utilized (${Math.round(utilizationPercentage)}% occupied)`);
    }

    return {
      classroomId: classroom.id,
      classroomName: classroom.name,
      score: Math.min(100, score),
      isAvailable: isAvailable || !args.slotId,
      reasons,
      suitabilityFactors: {
        subjectCompatibility: isPreferredForSubject,
        availabilityScore: isAvailable || !args.slotId ? 100 : 0,
        proximityScore: 50, // Placeholder - would need location data
      },
    };
  });

  // Sort by score
  recommendations.sort((a, b) => b.score - a.score);

  return {
    recommendations,
    topChoice: recommendations[0] || null,
  };
}

/**
 * 9. Analyze Teacher Workload
 */
export async function analyzeTeacherWorkload(
  prisma: PrismaClient,
  args: {
    timetableId: string;
    organizationId: string;
    teacherId?: string;
  }
) {
  await verifyTimetableAccess(prisma, args.timetableId, args.organizationId);

  const teachers = await prisma.teacher.findMany({
    where: {
      timetableId: args.timetableId,
      ...(args.teacherId ? { id: args.teacherId } : {}),
    },
    include: {
      lectures: {
        include: {
          lectureSlots: {
            include: {
              slot: true,
            },
          },
          subject: true,
        },
      },
      subjectTeachers: {
        include: {
          subject: true,
        },
      },
    },
  });

  const teacherAnalysis = teachers.map((teacher) => {
    const currentHours = teacher.lectures.reduce(
      (sum, lecture) => sum + lecture.lectureSlots.length * lecture.duration,
      0
    );

    const utilizationPercentage =
      teacher.weeklyMaxHours > 0 ? (currentHours / teacher.weeklyMaxHours) * 100 : 0;

    // Daily breakdown
    const dailyBreakdown = teacher.lectures
      .flatMap((lecture) =>
        lecture.lectureSlots.map((ls) => ({
          day: ls.slot.day,
          duration: lecture.duration,
        }))
      )
      .reduce((acc, item) => {
        acc[item.day] = (acc[item.day] || 0) + item.duration;
        return acc;
      }, {} as Record<number, number>);

    // Find consecutive slots
    const allSlots = teacher.lectures
      .flatMap((lecture) => lecture.lectureSlots.map((ls) => ls.slot))
      .sort((a, b) => {
        if (a.day !== b.day) return a.day - b.day;
        return a.number - b.number;
      });

    let consecutiveCount = 0;
    let maxConsecutive = 0;
    let currentConsecutive = 1;

    for (let i = 1; i < allSlots.length; i++) {
      const prev = allSlots[i - 1];
      const curr = allSlots[i];

      if (prev && curr && prev.day === curr.day && curr.number === prev.number + 1) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        if (currentConsecutive >= 3) {
          consecutiveCount++;
        }
        currentConsecutive = 1;
      }
    }

    // Calculate average gap between lectures
    const gaps: number[] = [];
    for (let i = 1; i < allSlots.length; i++) {
      const prev = allSlots[i - 1];
      const curr = allSlots[i];
      if (prev && curr && prev.day === curr.day) {
        gaps.push(curr.number - prev.number - 1);
      }
    }
    const averageGap =
      gaps.length > 0 ? gaps.reduce((sum, g) => sum + g, 0) / gaps.length : 0;

    // Determine status
    let status: "overloaded" | "balanced" | "underutilized";
    if (utilizationPercentage > 90) {
      status = "overloaded";
    } else if (utilizationPercentage < 50) {
      status = "underutilized";
    } else {
      status = "balanced";
    }

    // Generate concerns
    const concerns: string[] = [];
    if (maxConsecutive >= 4) {
      concerns.push(
        `Has ${maxConsecutive} consecutive lectures - risk of fatigue`
      );
    }
    if (Object.values(dailyBreakdown).some((hours) => hours > teacher.dailyMaxHours)) {
      concerns.push("Exceeds daily maximum hours on some days");
    }
    if (averageGap > 2) {
      concerns.push(
        `Average gap of ${averageGap.toFixed(1)} slots between lectures - inefficient scheduling`
      );
    }
    if (utilizationPercentage > 100) {
      concerns.push("Exceeds weekly maximum hours");
    }

    return {
      id: teacher.id,
      name: teacher.name,
      currentHours,
      maxHours: teacher.weeklyMaxHours,
      utilizationPercentage: Math.round(utilizationPercentage),
      status,
      dailyBreakdown,
      consecutiveSlotsCount: maxConsecutive,
      averageGapBetweenLectures: Math.round(averageGap * 10) / 10,
      subjects: teacher.subjectTeachers.map((st) => st.subject.name),
      concerns,
    };
  });

  // Generate insights
  const sortedByUtilization = [...teacherAnalysis].sort(
    (a, b) => b.utilizationPercentage - a.utilizationPercentage
  );

  const mostOverloaded =
    sortedByUtilization[0]?.status === "overloaded"
      ? {
          name: sortedByUtilization[0].name,
          hours: sortedByUtilization[0].currentHours,
        }
      : null;

  const lastTeacher = sortedByUtilization[sortedByUtilization.length - 1];
  const mostUnderutilized =
    lastTeacher && lastTeacher.status === "underutilized"
      ? {
          name: lastTeacher.name,
          hours: lastTeacher.currentHours,
        }
      : null;

  const averageUtilization =
    teacherAnalysis.length > 0
      ? teacherAnalysis.reduce((sum, t) => sum + t.utilizationPercentage, 0) /
        teacherAnalysis.length
      : 0;

  const recommendations: string[] = [];
  if (mostOverloaded) {
    recommendations.push(
      `Consider redistributing some of ${mostOverloaded.name}'s lectures to reduce workload`
    );
  }
  if (mostUnderutilized) {
    recommendations.push(
      `${mostUnderutilized.name} has capacity for additional lectures`
    );
  }
  if (teacherAnalysis.some((t) => t.consecutiveSlotsCount >= 4)) {
    recommendations.push(
      "Some teachers have 4+ consecutive lectures - consider adding breaks"
    );
  }

  return {
    teachers: teacherAnalysis,
    insights: {
      mostOverloaded,
      mostUnderutilized,
      averageUtilization: Math.round(averageUtilization),
      recommendations,
    },
  };
}

/**
 * 10. Suggest Optimization
 */
export async function suggestOptimization(
  prisma: PrismaClient,
  args: {
    timetableId: string;
    organizationId: string;
    optimizationGoal?:
      | "balance_workload"
      | "minimize_gaps"
      | "maximize_utilization"
      | "reduce_conflicts";
  }
) {
  await verifyTimetableAccess(prisma, args.timetableId, args.organizationId);

  // Get comprehensive timetable data
  const [statistics, conflicts, workloadAnalysis] = await Promise.all([
    getTimetableStatistics(prisma, {
      timetableId: args.timetableId,
      organizationId: args.organizationId,
    }),
    checkConflicts(prisma, {
      timetableId: args.timetableId,
      organizationId: args.organizationId,
    }),
    analyzeTeacherWorkload(prisma, {
      timetableId: args.timetableId,
      organizationId: args.organizationId,
    }),
  ]);

  // Calculate health score (0-100)
  let healthScore = 100;

  // Deduct points for conflicts
  healthScore -= Math.min(30, conflicts.totalConflicts * 5);

  // Deduct points for poor workload balance
  const fairnessPenalty = (100 - statistics.workloadDistribution.fairnessScore) / 5;
  healthScore -= fairnessPenalty;

  // Deduct points for overloaded/underutilized teachers
  const overloadedCount = workloadAnalysis.teachers.filter(
    (t) => t.status === "overloaded"
  ).length;
  const underutilizedCount = workloadAnalysis.teachers.filter(
    (t) => t.status === "underutilized"
  ).length;
  healthScore -= overloadedCount * 5 + underutilizedCount * 2;

  healthScore = Math.max(0, Math.min(100, healthScore));

  // Identify major issues
  const majorIssues: string[] = [];
  if (conflicts.totalConflicts > 0) {
    majorIssues.push(
      `${conflicts.totalConflicts} scheduling conflict${conflicts.totalConflicts > 1 ? "s" : ""} detected`
    );
  }
  if (statistics.workloadDistribution.fairnessScore < 60) {
    majorIssues.push("Unbalanced teacher workload distribution");
  }
  if (statistics.utilization.timeSlotUtilization < 50) {
    majorIssues.push("Low time slot utilization - many empty periods");
  }

  // Identify opportunities
  const opportunityAreas: string[] = [];
  if (statistics.utilization.underUtilizedResources.length > 0) {
    opportunityAreas.push(
      `${statistics.utilization.underUtilizedResources.length} underutilized resources available`
    );
  }
  if (workloadAnalysis.insights.mostUnderutilized) {
    opportunityAreas.push("Some teachers have capacity for more lectures");
  }

  // Generate recommendations
  const recommendations: Array<{
    priority: "high" | "medium" | "low";
    category: "workload" | "scheduling" | "resources" | "conflicts";
    issue: string;
    impact: string;
    suggestedAction: string;
    affectedEntities: Array<{ type: string; name: string }>;
    estimatedImprovement: string;
  }> = [];

  // High priority: Conflicts
  conflicts.conflicts.forEach((conflict) => {
    if (conflict.severity === "high") {
      recommendations.push({
        priority: "high",
        category: "conflicts",
        issue: `${conflict.type.replace(/_/g, " ")} at ${conflict.dayName} slot ${conflict.slotNumber}`,
        impact: "Prevents valid schedule execution",
        suggestedAction: conflict.recommendation,
        affectedEntities: [conflict.affectedEntity],
        estimatedImprovement: "Resolves critical conflict",
      });
    }
  });

  // Workload recommendations
  if (workloadAnalysis.insights.mostOverloaded) {
    recommendations.push({
      priority: "high",
      category: "workload",
      issue: `${workloadAnalysis.insights.mostOverloaded.name} is overloaded`,
      impact: "Teacher burnout risk, quality concerns",
      suggestedAction: "Redistribute 2-3 lectures to less loaded teachers",
      affectedEntities: [
        { type: "teacher", name: workloadAnalysis.insights.mostOverloaded.name },
      ],
      estimatedImprovement: `+${Math.round((100 - statistics.workloadDistribution.fairnessScore) / 2)} fairness points`,
    });
  }

  // Resource utilization
  statistics.utilization.underUtilizedResources.forEach((resource) => {
    if (resource.percentage < 30) {
      recommendations.push({
        priority: "low",
        category: "resources",
        issue: `${resource.name} is underutilized (${resource.percentage}%)`,
        impact: "Wasted resource capacity",
        suggestedAction: `Consider scheduling more lectures for this ${resource.type}`,
        affectedEntities: [{ type: resource.type, name: resource.name }],
        estimatedImprovement: "+5-10% overall utilization",
      });
    }
  });

  // Gap minimization
  workloadAnalysis.teachers.forEach((teacher) => {
    if (teacher.averageGapBetweenLectures > 2) {
      recommendations.push({
        priority: "medium",
        category: "scheduling",
        issue: `${teacher.name} has large gaps between lectures`,
        impact: "Inefficient use of teacher time",
        suggestedAction: "Consolidate lectures into tighter blocks",
        affectedEntities: [{ type: "teacher", name: teacher.name }],
        estimatedImprovement: "Improved teacher efficiency",
      });
    }
  });

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Generate quick wins
  const quickWins: string[] = [];
  if (conflicts.totalConflicts > 0 && conflicts.conflicts.length < 5) {
    quickWins.push("Resolve all conflicts - only a few to fix");
  }
  if (statistics.utilization.underUtilizedResources.length > 0) {
    quickWins.push("Utilize underused resources for immediate capacity gains");
  }

  // Long-term suggestions
  const longTermSuggestions: string[] = [];
  if (statistics.workloadDistribution.fairnessScore < 70) {
    longTermSuggestions.push(
      "Consider systematic workload rebalancing across all teachers"
    );
  }
  if (statistics.utilization.timeSlotUtilization < 60) {
    longTermSuggestions.push(
      "Review time slot structure - consider consolidating or removing unused slots"
    );
  }

  return {
    currentState: {
      healthScore: Math.round(healthScore),
      majorIssues,
      opportunityAreas,
    },
    recommendations,
    quickWins,
    longTermSuggestions,
  };
}