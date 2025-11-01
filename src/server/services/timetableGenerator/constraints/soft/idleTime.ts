import { SoftConstraintType } from "../../types";
import type { Chromosome, GAInputData, SoftViolation } from "../../types";

/**
 * Check for idle time: gaps between first and last class for subdivisions.
 * SC1 from research Section 1.2.2
 */
export function checkIdleTime(
  chromosome: Chromosome,
  inputData: GAInputData,
): SoftViolation[] {
  const violations: SoftViolation[] = [];
  const { lookupMaps, subdivisions } = inputData;

  // Group genes by subdivision and day
  const subdivisionDayToGenes = new Map<string, number[]>();

  chromosome.forEach((gene, index) => {
    const subdivisionIds =
      lookupMaps.eventToSubdivisions.get(gene.lectureEventId) || [];
    const slot = lookupMaps.slotIdToSlot.get(gene.timeslotId);
    if (!slot) return;

    for (const subdivisionId of subdivisionIds) {
      const key = `${subdivisionId}::${slot.day}`;
      if (!subdivisionDayToGenes.has(key)) {
        subdivisionDayToGenes.set(key, []);
      }
      subdivisionDayToGenes.get(key)!.push(index);
    }
  });

  // Calculate idle time for each subdivision-day pair
  for (const [key, geneIndices] of subdivisionDayToGenes) {
    const parts = key.split("::");
    const subdivisionId = parts[0];
    const dayStr = parts[1];
    if (!subdivisionId || !dayStr) continue;
    const day = parseInt(dayStr);

    // Get all slot periods for this day
    const periods = geneIndices
      .map((idx) => {
        const gene = chromosome[idx];
        if (!gene) return undefined;
        const slot = lookupMaps.slotIdToSlot.get(gene.timeslotId);
        return slot?.number;
      })
      .filter((p): p is number => p !== undefined)
      .sort((a, b) => a - b);

    if (periods.length <= 1) continue;

    const firstPeriod = periods[0];
    const lastPeriod = periods[periods.length - 1];
    if (firstPeriod === undefined || lastPeriod === undefined) continue;

    const totalSpan = lastPeriod - firstPeriod + 1;
    const idleSlots = totalSpan - periods.length;

    if (idleSlots > 0) {
      const subdivision = subdivisions.find((s) => s.id === subdivisionId);
      violations.push({
        type: SoftConstraintType.IDLE_TIME,
        geneIndices,
        penalty: idleSlots, // 1 penalty per idle slot
        description: `Subdivision ${subdivision?.name || subdivisionId} has ${idleSlots} idle slots on day ${day}`,
        entityIds: [subdivisionId, `day-${day}`],
      });
    }
  }

  return violations;
}
