import { DAY_NAMES } from "src/utils/constants";
import type { prisma } from "@/server/prisma";

type PrismaClient = typeof prisma;

/**
 * Shared utility functions for chatbot function implementations
 */

/**
 * Verify timetable access and get timetable info
 */
export async function verifyTimetableAccess(
  prisma: PrismaClient,
  timetableId: string,
  organizationId: string,
) {
  const timetable = await prisma.timetable.findFirst({
    where: {
      id: timetableId,
      organizationId: organizationId,
    },
  });

  if (!timetable) {
    throw new Error("Timetable not found or access denied");
  }

  return timetable;
}

/**
 * Find entity by ID or name
 */
export function findEntityByIdOrName<T extends { id: string; name: string }>(
  items: T[],
  entityId?: string,
  entityName?: string,
): T | null {
  if (entityId) {
    return items.find((item) => item.id === entityId) || null;
  }
  if (entityName) {
    const normalized = entityName.toLowerCase().trim();
    return (
      items.find((item) => item.name.toLowerCase().trim() === normalized) ||
      null
    );
  }
  return null;
}

/**
 * Calculate consecutive slot groups
 */
export function findConsecutiveSlots(
  slots: Array<{ day: number; number: number }>,
  minConsecutive: number = 1,
): Array<{
  day: number;
  startSlot: number;
  count: number;
  slotNumbers: number[];
}> {
  const groupedByDay = slots.reduce(
    (acc, slot) => {
      if (!acc[slot.day]) acc[slot.day] = [];
      acc[slot.day]!.push(slot.number);
      return acc;
    },
    {} as Record<number, number[]>,
  );

  const consecutiveGroups: Array<{
    day: number;
    startSlot: number;
    count: number;
    slotNumbers: number[];
  }> = [];

  for (const [day, slotNumbers] of Object.entries(groupedByDay)) {
    const sorted = slotNumbers.sort((a, b) => a - b);
    if (sorted.length === 0) continue;

    let currentGroup: number[] = [sorted[0]!];

    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i]! === sorted[i - 1]! + 1) {
        currentGroup.push(sorted[i]!);
      } else {
        if (currentGroup.length >= minConsecutive) {
          consecutiveGroups.push({
            day: parseInt(day),
            startSlot: currentGroup[0]!,
            count: currentGroup.length,
            slotNumbers: currentGroup,
          });
        }
        currentGroup = [sorted[i]!];
      }
    }

    if (currentGroup.length >= minConsecutive) {
      consecutiveGroups.push({
        day: parseInt(day),
        startSlot: currentGroup[0]!,
        count: currentGroup.length,
        slotNumbers: currentGroup,
      });
    }
  }

  return consecutiveGroups;
}

/**
 * Format day number to day name
 */
export function getDayName(day: number): string {
  return DAY_NAMES[day] || `Day ${day}`;
}

/**
 * Calculate standard deviation for workload analysis
 */
export function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance =
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    values.length;
  return Math.sqrt(variance);
}

/**
 * Calculate fairness score (0-100) based on standard deviation
 * Lower standard deviation = higher fairness
 */
export function calculateFairnessScore(values: number[]): number {
  if (values.length === 0) return 100;
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  if (mean === 0) return 100;

  const stdDev = calculateStandardDeviation(values);
  const coefficientOfVariation = stdDev / mean;

  // Convert to 0-100 scale (lower CV = higher fairness)
  // CV of 0.5 or more = 0 fairness, CV of 0 = 100 fairness
  const fairness = Math.max(
    0,
    Math.min(100, 100 - coefficientOfVariation * 200),
  );
  return Math.round(fairness);
}
