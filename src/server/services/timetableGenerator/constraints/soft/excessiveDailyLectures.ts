import type { Chromosome, GAInputData, SoftViolation } from "../../types";
import { SoftConstraintType } from "../../types";

/**
 * Check for excessive daily lectures: penalize when more than lecture.duration
 * lectures of the same subject are scheduled on the same day for a subdivision.
 */
export function checkExcessiveDailyLectures(
  chromosome: Chromosome,
  inputData: GAInputData,
): SoftViolation[] {
  const violations: SoftViolation[] = [];
  const { lookupMaps, subdivisions } = inputData;

  // Group genes by subdivision, day, and lecture
  const subdivisionDayLectureToCount = new Map<string, Map<string, number[]>>();

  chromosome.forEach((gene) => {
    const lecture = lookupMaps.eventToLecture.get(gene.lectureEventId);
    if (!lecture) return;

    const slot = lookupMaps.slotIdToSlot.get(gene.timeslotId);
    if (!slot) return;

    const subdivisionIds =
      lookupMaps.eventToSubdivisions.get(gene.lectureEventId) || [];

    for (const subdivisionId of subdivisionIds) {
      const key = `${subdivisionId}::${slot.day}`;
      if (!subdivisionDayLectureToCount.has(key)) {
        subdivisionDayLectureToCount.set(key, new Map());
      }

      const lectureMap = subdivisionDayLectureToCount.get(key)!;
      if (!lectureMap.has(lecture.id)) {
        lectureMap.set(lecture.id, []);
      }

      lectureMap.get(lecture.id)!.push(slot.number);
    }
  });

  // Check for excessive daily lectures for each subdivision-day-lecture combination
  for (const [key, lectureMap] of subdivisionDayLectureToCount) {
    const parts = key.split("::");
    const subdivisionId = parts[0];
    const dayStr = parts[1];
    if (!subdivisionId || !dayStr) continue;
    const day = parseInt(dayStr);

    for (const [lectureId, periods] of lectureMap) {
      const lecture = inputData.lectures.find((l) => l.id === lectureId);
      if (!lecture) continue;

      const totalCount = periods.length;

      // If more lectures than duration are scheduled on the same day, create a violation
      if (totalCount > lecture.duration) {
        const violatingGeneIndices = chromosome
          .map((gene, idx) => {
            const geneLecture = lookupMaps.eventToLecture.get(
              gene.lectureEventId,
            );
            const geneSlot = lookupMaps.slotIdToSlot.get(gene.timeslotId);
            const geneSubdivisions =
              lookupMaps.eventToSubdivisions.get(gene.lectureEventId) || [];

            return geneLecture?.id === lectureId &&
              geneSlot?.day === day &&
              geneSubdivisions.includes(subdivisionId)
              ? idx
              : -1;
          })
          .filter((idx) => idx !== -1);

        const subdivision = subdivisions.find((s) => s.id === subdivisionId);
        violations.push({
          type: SoftConstraintType.EXCESSIVE_DAILY_LECTURES,
          geneIndices: violatingGeneIndices,
          penalty: totalCount - lecture.duration,
          description: `Subdivision ${subdivision?.name || subdivisionId} has ${totalCount} lectures of ${lecture.subject.name} on day ${day}, exceeds recommended ${lecture.duration}`,
          entityIds: [subdivisionId, lectureId, `day-${day}`],
        });
      }
    }
  }

  return violations;
}
