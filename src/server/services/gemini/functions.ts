import { Type } from "@google/genai";

// Import Phase 1 implementations
import {
  checkConflicts,
  findAvailableSlots,
  getScheduleForEntity,
  getTeachersList,
  getTimetableStatistics,
} from "./implementations/information";

// Import Phase 3 implementations
import {
  analyzeTeacherWorkload,
  findSubstituteTeacher,
  recommendClassroom,
  suggestLecturePlacement,
  suggestOptimization,
} from "./implementations/insights";
import type { prisma } from "@/server/prisma";

type PrismaClient = typeof prisma;

/**
 * Function Definitions for Gemini Function Calling
 * These define the available functions that the AI can call
 */

export const helloWorldFunction = {
  name: "hello_world",
  description:
    "Returns a friendly greeting message. Use this to test the function calling system or to greet users.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: {
        type: Type.STRING,
        description:
          "The name of the person to greet. If not provided, uses a generic greeting.",
      },
    },
  },
};

// ===== PHASE 1: INFORMATION RETRIEVAL FUNCTIONS =====

export const getTeachersListFunction = {
  name: "get_teachers_list",
  description:
    "Retrieve all teachers in the timetable with optional filtering by subject or available hours. Returns detailed information about each teacher including their subjects, workload, and availability.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      subjectName: {
        type: Type.STRING,
        description:
          "Optional: Filter teachers by subject they teach (partial match supported)",
      },
      minAvailableHours: {
        type: Type.NUMBER,
        description:
          "Optional: Filter teachers with at least this many available hours remaining",
      },
    },
  },
};

export const getScheduleForEntityFunction = {
  name: "get_schedule_for_entity",
  description:
    "Get the complete weekly schedule for a teacher, classroom, or subdivision. Shows all lectures and free slots with detailed information. Useful for answering 'What is X's schedule?' or 'When does X have classes?'",
  parameters: {
    type: Type.OBJECT,
    properties: {
      entityType: {
        type: Type.STRING,
        description:
          "The type of entity: 'teacher', 'classroom', or 'subdivision'",
      },
      entityId: {
        type: Type.STRING,
        description:
          "Optional: The specific ID of the entity. Use this if you know the exact ID.",
      },
      entityName: {
        type: Type.STRING,
        description:
          "Optional: The name of the entity to search for. Alternative to entityId when you have the name.",
      },
      day: {
        type: Type.NUMBER,
        description:
          "Optional: Filter by specific day (0=Monday, 1=Tuesday, ..., 6=Sunday)",
      },
    },
    required: ["entityType"],
  },
};

export const findAvailableSlotsFunction = {
  name: "find_available_slots",
  description:
    "Find free time slots for a teacher, classroom, or subdivision. Can also find consecutive free slots. Useful for questions like 'When is X available?' or 'Find 3 consecutive free slots for Y'.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      entityType: {
        type: Type.STRING,
        description:
          "The type of entity: 'teacher', 'classroom', or 'subdivision'",
      },
      entityId: {
        type: Type.STRING,
        description: "Optional: The specific ID of the entity",
      },
      entityName: {
        type: Type.STRING,
        description:
          "Optional: The name of the entity. Alternative to entityId.",
      },
      day: {
        type: Type.NUMBER,
        description:
          "Optional: Filter by specific day (0=Monday, 1=Tuesday, ..., 6=Sunday)",
      },
      consecutiveSlots: {
        type: Type.NUMBER,
        description:
          "Optional: Find blocks of N consecutive free slots. Minimum 2.",
      },
    },
    required: ["entityType"],
  },
};

export const checkConflictsFunction = {
  name: "check_conflicts",
  description:
    "Detect scheduling conflicts in the timetable such as double-bookings, unavailability violations, and resource conflicts. Provides detailed conflict information with recommendations for resolution.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      scope: {
        type: Type.STRING,
        description:
          "Optional: Limit scope to 'all', 'teachers', 'classrooms', or 'subdivisions'. Default is 'all'.",
      },
      entityId: {
        type: Type.STRING,
        description:
          "Optional: Check conflicts for a specific entity only (teacher/classroom/subdivision ID)",
      },
    },
  },
};

export const getTimetableStatisticsFunction = {
  name: "get_timetable_statistics",
  description:
    "Get comprehensive statistics about the timetable including utilization metrics, workload distribution, resource usage, and overall health indicators. Useful for getting an overview or answering 'How is the timetable doing?'",
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

// ===== PHASE 3: AI-POWERED INSIGHT FUNCTIONS =====

export const suggestLecturePlacementFunction = {
  name: "suggest_lecture_placement",
  description:
    "Get AI-powered recommendations for the best time slots to place a lecture. Considers teacher workload, availability, student experience, and schedule balance. Returns scored recommendations with pros/cons for each option.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      lectureId: {
        type: Type.STRING,
        description: "The ID of the lecture to place",
      },
      preferredDays: {
        type: Type.ARRAY,
        description:
          "Optional: Array of preferred days (0-6). Only suggest slots on these days.",
        items: {
          type: Type.NUMBER,
        },
      },
      avoidConsecutive: {
        type: Type.BOOLEAN,
        description:
          "Optional: If true, avoid placing lectures back-to-back with existing ones for the same teacher",
      },
    },
    required: ["lectureId"],
  },
};

export const findSubstituteTeacherFunction = {
  name: "find_substitute_teacher",
  description:
    "Find suitable substitute teachers for a subject and time slot when the primary teacher is unavailable. Returns scored recommendations based on subject expertise, availability, and capacity.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      subjectName: {
        type: Type.STRING,
        description: "The subject that needs coverage",
      },
      slotId: {
        type: Type.STRING,
        description: "The specific time slot ID that needs a substitute",
      },
      primaryTeacherId: {
        type: Type.STRING,
        description:
          "Optional: The ID of the primary teacher to exclude from results",
      },
    },
    required: ["subjectName", "slotId"],
  },
};

export const recommendClassroomFunction = {
  name: "recommend_classroom",
  description:
    "Get AI-powered classroom recommendations for a lecture. Considers availability, subject compatibility, and utilization balance. Returns scored options with reasoning.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      lectureId: {
        type: Type.STRING,
        description: "The ID of the lecture needing a classroom",
      },
      slotId: {
        type: Type.STRING,
        description:
          "Optional: Specific time slot ID if the lecture is already scheduled",
      },
    },
    required: ["lectureId"],
  },
};

export const analyzeTeacherWorkloadFunction = {
  name: "analyze_teacher_workload",
  description:
    "Perform deep analysis of teacher workload distribution. Identifies overloaded and underutilized teachers, consecutive lecture patterns, gaps, and provides recommendations for better balance.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      teacherId: {
        type: Type.STRING,
        description:
          "Optional: Analyze a specific teacher. If omitted, analyzes all teachers.",
      },
    },
  },
};

export const suggestOptimizationFunction = {
  name: "suggest_optimization",
  description:
    "Get comprehensive timetable optimization recommendations. Analyzes conflicts, workload balance, resource utilization, and provides prioritized actionable suggestions for improvement. Returns a health score and detailed recommendations.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      optimizationGoal: {
        type: Type.STRING,
        description:
          "Optional: Focus optimization on 'balance_workload', 'minimize_gaps', 'maximize_utilization', or 'reduce_conflicts'",
      },
    },
  },
};

/**
 * All available functions for the chatbot
 */
export const availableFunctions = [
  helloWorldFunction,
  getTeachersListFunction,
  getScheduleForEntityFunction,
  findAvailableSlotsFunction,
  checkConflictsFunction,
  getTimetableStatisticsFunction,
  suggestLecturePlacementFunction,
  findSubstituteTeacherFunction,
  recommendClassroomFunction,
  analyzeTeacherWorkloadFunction,
  suggestOptimizationFunction,
];

/**
 * Context required for function execution
 */
export interface FunctionContext {
  prisma: PrismaClient;
  timetableId: string;
  organizationId: string;
}

/**
 * Function implementations
 * Maps function names to their actual implementations
 */
export const functionImplementations: Record<
  string,
  (
    args: Record<string, any>,
    context: FunctionContext,
  ) => Promise<string> | string
> = {
  hello_world: (args: { name?: string }) => {
    const name = args.name || "there";
    console.log(`hello_world function called with name: ${name}`);
    return `Hello, ${name}! 👋 This is a response from the hello_world function. The function calling system is working correctly!`;
  },

  // Phase 1: Information Retrieval
  get_teachers_list: async (args, context) => {
    const result = await getTeachersList(context.prisma, {
      timetableId: context.timetableId,
      organizationId: context.organizationId,
      subjectName: args.subjectName,
      minAvailableHours: args.minAvailableHours,
    });
    return JSON.stringify(result, null, 2);
  },

  get_schedule_for_entity: async (args, context) => {
    const result = await getScheduleForEntity(context.prisma, {
      timetableId: context.timetableId,
      organizationId: context.organizationId,
      entityType: args.entityType,
      entityId: args.entityId,
      entityName: args.entityName,
      day: args.day,
    });
    return JSON.stringify(result, null, 2);
  },

  find_available_slots: async (args, context) => {
    const result = await findAvailableSlots(context.prisma, {
      timetableId: context.timetableId,
      organizationId: context.organizationId,
      entityType: args.entityType,
      entityId: args.entityId,
      entityName: args.entityName,
      day: args.day,
      consecutiveSlots: args.consecutiveSlots,
    });
    return JSON.stringify(result, null, 2);
  },

  check_conflicts: async (args, context) => {
    const result = await checkConflicts(context.prisma, {
      timetableId: context.timetableId,
      organizationId: context.organizationId,
      scope: args.scope,
      entityId: args.entityId,
    });
    return JSON.stringify(result, null, 2);
  },

  // @ts-expect-error args is unused for now
  get_timetable_statistics: async (args, context) => {
    const result = await getTimetableStatistics(context.prisma, {
      timetableId: context.timetableId,
      organizationId: context.organizationId,
    });
    return JSON.stringify(result, null, 2);
  },

  // Phase 3: AI-Powered Insights
  suggest_lecture_placement: async (args, context) => {
    const result = await suggestLecturePlacement(context.prisma, {
      timetableId: context.timetableId,
      organizationId: context.organizationId,
      lectureId: args.lectureId,
      preferredDays: args.preferredDays,
      avoidConsecutive: args.avoidConsecutive,
    });
    return JSON.stringify(result, null, 2);
  },

  find_substitute_teacher: async (args, context) => {
    const result = await findSubstituteTeacher(context.prisma, {
      timetableId: context.timetableId,
      organizationId: context.organizationId,
      subjectName: args.subjectName,
      slotId: args.slotId,
      primaryTeacherId: args.primaryTeacherId,
    });
    return JSON.stringify(result, null, 2);
  },

  recommend_classroom: async (args, context) => {
    const result = await recommendClassroom(context.prisma, {
      timetableId: context.timetableId,
      organizationId: context.organizationId,
      lectureId: args.lectureId,
      slotId: args.slotId,
    });
    return JSON.stringify(result, null, 2);
  },

  analyze_teacher_workload: async (args, context) => {
    const result = await analyzeTeacherWorkload(context.prisma, {
      timetableId: context.timetableId,
      organizationId: context.organizationId,
      teacherId: args.teacherId,
    });
    return JSON.stringify(result, null, 2);
  },

  suggest_optimization: async (args, context) => {
    const result = await suggestOptimization(context.prisma, {
      timetableId: context.timetableId,
      organizationId: context.organizationId,
      optimizationGoal: args.optimizationGoal,
    });
    return JSON.stringify(result, null, 2);
  },
};

/**
 * Execute a function call from Gemini
 */
export async function executeFunction(
  functionName: string,
  args: Record<string, any> | undefined,
  context: FunctionContext,
): Promise<string> {
  console.log(`⚙️ [Functions] Executing function: ${functionName}`);
  console.log(`📝 [Functions] Arguments:`, args);

  const implementation = functionImplementations[functionName];

  if (!implementation) {
    console.error(`❌ [Functions] Function not found: ${functionName}`);
    throw new Error(`Function ${functionName} not found`);
  }

  try {
    const result = await implementation(args || {}, context);
    console.log(
      `✅ [Functions] Function executed successfully:`,
      result.substring(0, 100),
    );
    return result;
  } catch (error) {
    console.error(`❌ [Functions] Error executing ${functionName}:`, error);
    throw new Error(
      `Failed to execute function: ${functionName}. ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
