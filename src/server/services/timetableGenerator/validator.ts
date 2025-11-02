import { evaluateChromosome } from "./constraints";
import type {
  Chromosome,
  FitnessResult,
  GAInputData,
  QualityMetrics,
} from "./types";

/**
 * Performs a final validation of the solution by re-evaluating its fitness.
 * @param chromosome The chromosome to validate.
 * @param inputData The GA input data.
 * @returns The detailed fitness result.
 */
export function validateSolution(
  chromosome: Chromosome,
  inputData: GAInputData,
): FitnessResult {
  // For now, we can just use the default weights. In the future, this could
  // use a stricter set of weights if needed.
  const weights = {
    hardConstraintWeight: 1000,
    idleTime: 5,
    consecutivePreference: 8,
    teacherDailyLimit: 10,
    teacherWeeklyLimit: 15,
    excessiveDailyLectures: 6,
    excessivelyEmptyDay: 4,
    excessivelyFilledDay: 4,
    multiDurationLate: 5,
    deprioritizedDay: 3,
    deprioritizedSlot: 2,
    deprioritizedDaySlot: 5,
    dailyDistribution: 5,
  };
  return evaluateChromosome(chromosome, inputData, weights);
}

/**
 * Calculates the classroom utilization percentage.
 *
 * NOTE: With immutable combined classrooms, room utilization is calculated
 * by counting how many (slot, classroom) pairs are occupied. A lecture with
 * combined classrooms occupies all of its classrooms simultaneously.
 *
 * @param chromosome The solution chromosome.
 * @param inputData The GA input data.
 * @returns A utilization percentage.
 */
export function calculateRoomUtilization(
  chromosome: Chromosome,
  inputData: GAInputData,
): number {
  const totalPossibleSlots =
    inputData.slots.length * inputData.classrooms.length;
  if (totalPossibleSlots === 0) return 0;

  // Build set of occupied (slot, classroom) pairs
  const occupiedSlotClassrooms = new Set<string>();

  for (const gene of chromosome) {
    // Get combined classrooms for this lecture
    const combinedClassrooms =
      inputData.lookupMaps.lectureToCombinedClassrooms.get(gene.lectureId) ||
      [];

    // Each combined classroom is occupied in this slot
    for (const classroomId of combinedClassrooms) {
      occupiedSlotClassrooms.add(`${gene.timeslotId}:${classroomId}`);
    }
  }

  return (occupiedSlotClassrooms.size / totalPossibleSlots) * 100;
}

/**
 * Calculates the balance of workload among teachers.
 * @param chromosome The solution chromosome.
 * @param inputData The GA input data.
 * @returns A standard deviation of the hours taught per teacher.
 */
export function calculateTeacherLoadBalance(
  chromosome: Chromosome,
  inputData: GAInputData,
): number {
  const teacherHours = new Map<string, number>();

  for (const teacher of inputData.teachers) {
    teacherHours.set(teacher.id, 0);
  }

  for (const gene of chromosome) {
    const lecture = inputData.lookupMaps.eventToLecture.get(
      gene.lectureEventId,
    );
    if (lecture) {
      const currentHours = teacherHours.get(lecture.teacherId) || 0;
      teacherHours.set(lecture.teacherId, currentHours + lecture.duration);
    }
  }

  const hours = Array.from(teacherHours.values());
  if (hours.length < 2) return 0;

  const mean = hours.reduce((a, b) => a + b, 0) / hours.length;
  const variance =
    hours.reduce((sum, h) => sum + Math.pow(h - mean, 2), 0) / hours.length;
  return Math.sqrt(variance);
}

/**
 * Generates a comprehensive quality report for a given solution.
 * @param chromosome The solution chromosome.
 * @param inputData The GA input data.
 * @returns A QualityMetrics object.
 */
export function generateQualityReport(
  chromosome: Chromosome,
  inputData: GAInputData,
): QualityMetrics {
  const fitnessResult = validateSolution(chromosome, inputData);

  // For now, student compactness and cognitive load are represented by soft violations.
  // More detailed metrics can be added here later.
  const idleTimeViolation = fitnessResult.softViolations.find(
    (v) => v.type === "IDLE_TIME",
  );

  return {
    feasibilityScore: fitnessResult.isFeasible ? 1.0 : 0.0,
    teacherUtilization: 0, // Placeholder
    classroomUtilization: calculateRoomUtilization(chromosome, inputData),
    averageIdleTime: idleTimeViolation?.penalty || 0,
    teacherLoadBalance: calculateTeacherLoadBalance(chromosome, inputData),
  };
}
