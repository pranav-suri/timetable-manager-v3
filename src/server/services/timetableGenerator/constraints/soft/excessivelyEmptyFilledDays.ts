import type { Chromosome, GAInputData, SoftViolation } from "../../types";
import { SoftConstraintType } from "../../types";
import { groupEventsBySubdivisionAndDay } from "../../utils/grouping";

/**
 * Penalize days that are excessively empty or excessively filled for subdivisions.
 *
 * Excessively Empty: Days with lectures < minLecturesPerDay (from config)
 * Excessively Filled: Days with lectures > maxLecturesPerDay (from config)
 *
 * Uses weights.excessivelyEmptyDay and weights.excessivelyFilledDay for penalties.
 */
export function checkExcessivelyEmptyFilledDays(
  chromosome: Chromosome,
  input: GAInputData,
): SoftViolation[] {
  const violations: SoftViolation[] = [];
  const {
    excessivelyEmptyDay: emptyWeight,
    excessivelyFilledDay: filledWeight,
    minLecturesPerDay = 2, // Default: 2 lectures minimum
    maxLecturesPerDay, // Default: undefined (no limit)
  } = input.config.constraintWeights;

  // Skip if both weights are zero
  if (!emptyWeight && !filledWeight) {
    return violations;
  }

  const eventsBySubdivisionDay = groupEventsBySubdivisionAndDay(
    chromosome,
    input,
  );

  for (const [subdivisionId, days] of eventsBySubdivisionDay.entries()) {
    const subdivision = input.subdivisions.find((s) => s.id === subdivisionId);
    const subdivisionName = subdivision?.name || subdivisionId;

    for (const [day, dayEvents] of days.entries()) {
      const lectureCount = dayEvents.length;

      // Check for excessively empty days
      if (emptyWeight && lectureCount > 0 && lectureCount < minLecturesPerDay) {
        const penalty = minLecturesPerDay - lectureCount;
        violations.push({
          type: SoftConstraintType.EXCESSIVELY_EMPTY_DAY,
          description: `Subdivision '${subdivisionName}' has only ${lectureCount} lecture(s) on day ${day}, below minimum of ${minLecturesPerDay}`,
          penalty,
          geneIndices: dayEvents.map((ge) => ge.geneIndex),
          entityIds: [subdivisionId, `day-${day}`],
        });
      }

      // Check for excessively filled days
      if (
        filledWeight &&
        maxLecturesPerDay &&
        lectureCount > maxLecturesPerDay
      ) {
        const penalty = lectureCount - maxLecturesPerDay;
        violations.push({
          type: SoftConstraintType.EXCESSIVELY_FILLED_DAY,
          description: `Subdivision '${subdivisionName}' has ${lectureCount} lectures on day ${day}, exceeding maximum of ${maxLecturesPerDay}`,
          penalty,
          geneIndices: dayEvents.map((ge) => ge.geneIndex),
          entityIds: [subdivisionId, `day-${day}`],
        });
      }
    }
  }

  return violations;
}
