import type {
  Chromosome,
  ConstraintWeights,
  FitnessResult,
  GAInputData,
  HardViolation,
  SoftViolation,
} from "../types";
import { SoftConstraintType } from "../types";
import { checkConsecutiveSlots } from "./hard/consecutiveSlots";
import { checkDailyDistribution } from "./hard/dailyDistribution";
import { checkLockedSlots } from "./hard/lockedSlots";
import { checkRoomCapacity } from "./hard/roomCapacity";
import { checkRoomClash } from "./hard/roomClash";
import { checkRoomUnavailability } from "./hard/roomUnavailability";
import { checkSubdivisionClash } from "./hard/subdivisionClash";
import { checkSubdivisionUnavailability } from "./hard/subdivisionUnavailability";
import { checkTeacherClash } from "./hard/teacherClash";
import { checkTeacherUnavailability } from "./hard/teacherUnavailability";
import { checkConsecutivePreference } from "./soft/consecutivePreference";
import { checkDeprioritizedSlots } from "./soft/deprioritizedSlots";
import { checkExcessiveDailyLectures } from "./soft/excessiveDailyLectures";
import { checkExcessivelyEmptyFilledDays } from "./soft/excessivelyEmptyFilledDays";
import { checkIdleTime } from "./soft/idleTime";
import { checkMultiDurationLate } from "./soft/multiDurationLate";
import { checkTeacherDailyLimit } from "./soft/teacherDailyLimit";
import { checkTeacherWeeklyLimit } from "./soft/teacherWeeklyLimit";

export function evaluateChromosome(
  chromosome: Chromosome,
  inputData: GAInputData,
  weights: ConstraintWeights,
): FitnessResult {
  // Check all hard constraints
  const hardViolations: HardViolation[] = [
    ...checkTeacherClash(chromosome, inputData),
    ...checkSubdivisionClash(chromosome, inputData),
    ...checkRoomClash(chromosome, inputData),
    ...checkTeacherUnavailability(chromosome, inputData),
    ...checkSubdivisionUnavailability(chromosome, inputData),
    ...checkRoomUnavailability(chromosome, inputData),
    ...checkRoomCapacity(chromosome, inputData),
    // checkAllowedClassroom REMOVED - classrooms are now immutable per lecture
    ...checkConsecutiveSlots(chromosome, inputData),
    ...checkLockedSlots(chromosome, inputData),
    ...checkDailyDistribution(chromosome, inputData),
  ];

  // Check all soft constraints
  const softViolations: SoftViolation[] = [
    ...checkIdleTime(chromosome, inputData),
    ...checkTeacherDailyLimit(chromosome, inputData),
    ...checkTeacherWeeklyLimit(chromosome, inputData),
    ...checkConsecutivePreference(chromosome, inputData),
    ...checkExcessiveDailyLectures(chromosome, inputData),
    ...checkExcessivelyEmptyFilledDays(chromosome, inputData),
    ...checkMultiDurationLate(chromosome, inputData, weights),
    ...checkDeprioritizedSlots(chromosome, inputData, weights),
  ];

  // Calculate penalties
  const hardPenalty =
    hardViolations.reduce((sum, v) => sum + v.severity, 0) *
    weights.hardConstraintWeight;

  const softPenalty = softViolations.reduce(
    (sum, v) => sum + getSoftPenalty(v, weights),
    0,
  );

  const totalPenalty = hardPenalty + softPenalty;
  const fitnessScore = 1 / (1 + totalPenalty);
  const isFeasible = hardViolations.length === 0;

  return {
    totalPenalty,
    fitnessScore,
    isFeasible,
    hardPenalty,
    softPenalty,
    hardViolations,
    softViolations,
    hardViolationCount: hardViolations.length,
    softViolationCount: softViolations.length,
  };
}

/**
 * Calculates the penalty for a single soft constraint violation based on its type.
 * This allows centralizing the weight application.
 */
function getSoftPenalty(
  violation: SoftViolation,
  weights: ConstraintWeights,
): number {
  switch (violation.type) {
    case SoftConstraintType.IDLE_TIME:
      return violation.penalty * weights.idleTime;
    case SoftConstraintType.TEACHER_DAILY_LIMIT:
      return violation.penalty * weights.teacherDailyLimit;
    case SoftConstraintType.TEACHER_WEEKLY_LIMIT:
      return violation.penalty * weights.teacherWeeklyLimit;
    case SoftConstraintType.CONSECUTIVE_PREFERENCE:
      return violation.penalty * weights.consecutivePreference;
    case SoftConstraintType.EXCESSIVE_DAILY_LECTURES:
      return violation.penalty * weights.excessiveDailyLectures;
    case SoftConstraintType.EXCESSIVELY_EMPTY_DAY:
      return violation.penalty * weights.excessivelyEmptyDay;
    case SoftConstraintType.EXCESSIVELY_FILLED_DAY:
      return violation.penalty * weights.excessivelyFilledDay;
    case SoftConstraintType.MULTI_DURATION_LATE:
      return violation.penalty * weights.multiDurationLate;
    case SoftConstraintType.DEPRIORITIZED_DAY:
      return violation.penalty * weights.deprioritizedDay;
    case SoftConstraintType.DEPRIORITIZED_SLOT:
      return violation.penalty * weights.deprioritizedSlot;
    case SoftConstraintType.DEPRIORITIZED_DAY_SLOT:
      return violation.penalty * weights.deprioritizedDaySlot;
    default:
      return violation.penalty;
  }
}
