import { HardConstraintType } from "../../types";
import type {
  Chromosome,
  GAInputData,
  GASlot,
  Gene,
  HardViolation,
} from "../../types";

/**
 * Check for consecutive slots constraint: multi-slot lectures must be in consecutive periods.
 * HC9 from research Section 1.2.1
 *
 * For a lecture with count=2 and duration=3, there are 6 genes (events):
 * - evt0, evt1, evt2 (first occurrence)
 * - evt3, evt4, evt5 (second occurrence)
 *
 * Each occurrence must have all its genes assigned to consecutive slots.
 */
export function checkConsecutiveSlots(
  chromosome: Chromosome,
  inputData: GAInputData,
): HardViolation[] {
  const violations: HardViolation[] = [];
  const { lookupMaps } = inputData;

  // Group genes by lecture ID
  const lectureToGenes = new Map<
    string,
    Array<{ geneIndex: number; gene: Gene }>
  >();
  chromosome.forEach((gene, index) => {
    const lecture = lookupMaps.eventToLecture.get(gene.lectureEventId);
    if (!lecture) return;

    if (!lectureToGenes.has(lecture.id)) {
      lectureToGenes.set(lecture.id, []);
    }
    lectureToGenes.get(lecture.id)!.push({ geneIndex: index, gene });
  });

  // Check each lecture with duration > 1
  for (const [lectureId, geneData] of lectureToGenes) {
    // Get first gene to check lecture properties
    const firstData = geneData[0];
    if (!firstData) continue;
    const lecture = lookupMaps.eventToLecture.get(
      firstData.gene.lectureEventId,
    );
    if (!lecture || lecture.duration <= 1) continue;

    // Group genes by occurrence
    // EventId format: "lectureId-evt{eventIndex}"
    // For count=2, duration=3: evt0-2 is occurrence 0, evt3-5 is occurrence 1
    const occurrenceGroups = new Map<
      number,
      Array<{ geneIndex: number; gene: Gene }>
    >();

    for (const data of geneData) {
      // Extract event index from lectureEventId (e.g., "lec1-evt5" -> 5)
      const eventIdParts = data.gene.lectureEventId.split("-evt");
      const eventIndex = parseInt(eventIdParts[1] || "0", 10);
      const occurrenceIndex = Math.floor(eventIndex / lecture.duration);

      if (!occurrenceGroups.has(occurrenceIndex)) {
        occurrenceGroups.set(occurrenceIndex, []);
      }
      occurrenceGroups.get(occurrenceIndex)!.push(data);
    }

    // Check each occurrence
    for (const [occurrenceIndex, occurrenceGenes] of occurrenceGroups) {
      // Each occurrence should have exactly 'duration' genes
      if (occurrenceGenes.length !== lecture.duration) {
        // This shouldn't happen with proper initialization, but handle it
        const geneIndices = occurrenceGenes.map((d) => d.geneIndex);
        violations.push({
          type: HardConstraintType.CONSECUTIVE_SLOTS,
          geneIndices,
          severity: lecture.duration * 2,
          description: `Lecture ${lectureId} occurrence ${occurrenceIndex} has ${occurrenceGenes.length} genes but needs ${lecture.duration}`,
          entityIds: [lectureId],
        });
        continue;
      }

      // Get all slots for this occurrence
      const slotData = occurrenceGenes
        .map((data) => {
          const slot = lookupMaps.slotIdToSlot.get(data.gene.timeslotId);
          return { ...data, slot };
        })
        .filter((d) => d.slot !== undefined) as Array<{
        geneIndex: number;
        gene: Gene;
        slot: GASlot;
      }>;

      if (slotData.length !== lecture.duration) {
        // Some slots are missing
        const geneIndices = occurrenceGenes.map((d) => d.geneIndex);
        violations.push({
          type: HardConstraintType.CONSECUTIVE_SLOTS,
          geneIndices,
          severity: lecture.duration,
          description: `Lecture ${lectureId} occurrence ${occurrenceIndex} has genes with invalid slots`,
          entityIds: [lectureId],
        });
        continue;
      }

      // Sort slots by day and period number
      slotData.sort((a, b) => {
        if (a.slot.day !== b.slot.day) return a.slot.day - b.slot.day;
        return a.slot.number - b.slot.number;
      });

      // Check if all slots are consecutive (same day, sequential periods)
      let isConsecutive = true;
      const firstSlot = slotData[0]!.slot;

      for (let i = 0; i < slotData.length; i++) {
        const expectedDay = firstSlot.day;
        const expectedPeriod = firstSlot.number + i;
        const actualSlot = slotData[i]!.slot;

        if (
          actualSlot.day !== expectedDay ||
          actualSlot.number !== expectedPeriod
        ) {
          isConsecutive = false;
          break;
        }
      }

      if (!isConsecutive) {
        const geneIndices = slotData.map((d) => d.geneIndex);
        const slotIds = slotData.map((d) => d.gene.timeslotId);
        const slotDescriptions = slotData
          .map((d) => `Day${d.slot.day}P${d.slot.number}`)
          .join(", ");

        violations.push({
          type: HardConstraintType.CONSECUTIVE_SLOTS,
          geneIndices,
          severity: lecture.duration,
          description: `Lecture ${lectureId} occurrence ${occurrenceIndex} requires ${lecture.duration} consecutive slots but genes are assigned to: ${slotDescriptions}`,
          entityIds: [lectureId, ...slotIds],
        });
      }
    }
  }

  return violations;
}
