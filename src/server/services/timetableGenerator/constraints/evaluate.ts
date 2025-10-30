import type {
  Chromosome,
  GAInputData,
  HardViolation,
  SoftViolation,
  FitnessResult,
  ConstraintWeights,
} from "../types";
import { SoftConstraintType } from "../types";

import { checkTeacherClash } from "./hard/teacherClash";
import { checkSubdivisionClash } from "./hard/subdivisionClash";
import { checkRoomClash } from "./hard/roomClash";
import { checkTeacherUnavailability } from "./hard/teacherUnavailability";
import { checkSubdivisionUnavailability } from "./hard/subdivisionUnavailability";
import { checkRoomUnavailability } from "./hard/roomUnavailability";
import { checkRoomCapacity } from "./hard/roomCapacity";
import { checkConsecutiveSlots } from "./hard/consecutiveSlots";
import { checkLockedSlots } from "./hard/lockedSlots";
import { checkDailyDistribution } from "./hard/dailyDistribution";

import { checkIdleTime } from "./soft/idleTime";
import { checkTeacherDailyLimit } from "./soft/teacherDailyLimit";
import { checkTeacherWeeklyLimit } from "./soft/teacherWeeklyLimit";
import { checkConsecutivePreference } from "./soft/consecutivePreference";
import { checkExcessiveDailyLectures } from "./soft/excessiveDailyLectures";

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
  ];

  // Calculate penalties
  const hardPenalty =
    hardViolations.reduce((sum, v) => sum + v.severity, 0) *
    weights.hardConstraintWeight;

  const softPenalty = softViolations.reduce((sum, v) => {
    switch (v.type) {
      case SoftConstraintType.IDLE_TIME:
        return sum + v.penalty * weights.idleTime;
      case SoftConstraintType.CONSECUTIVE_PREFERENCE:
        return sum + v.penalty * weights.consecutivePreference;
      case SoftConstraintType.TEACHER_DAILY_LIMIT:
        return sum + v.penalty * weights.teacherDailyLimit;
      case SoftConstraintType.TEACHER_WEEKLY_LIMIT:
        return sum + v.penalty * weights.teacherWeeklyLimit;
      case SoftConstraintType.COGNITIVE_LOAD:
        return sum + v.penalty * weights.cognitiveLoad;
      case SoftConstraintType.EXCESSIVE_DAILY_LECTURES:
        return sum + v.penalty * weights.excessiveDailyLectures;
      default:
        return sum + v.penalty;
    }
  }, 0);

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
