/**
 * @file slotUtils.ts
 * @description Utility functions for working with consecutive time slots in multi-duration lectures.
 *
 * This module provides the core logic for finding and validating consecutive slot blocks
 * required by multi-duration lectures (duration > 1).
 */

import type { GASlot, GAInputData } from "../types";

/**
 * Represents a valid block of consecutive slots for a multi-duration lecture.
 */
export interface ConsecutiveSlotBlock {
  startSlotId: string;
  slotIds: string[]; // All slot IDs in the block [startSlot, startSlot+1, ..., startSlot+duration-1]
  day: number; // Which day this block is on
  startPeriod: number; // Starting period number
}

/**
 * Find all valid consecutive slot blocks that can accommodate a lecture with the given duration.
 *
 * @param duration - Number of consecutive slots required
 * @param inputData - The GA input data containing all slots and lookup maps
 * @returns Array of valid consecutive slot blocks
 *
 * @example
 * // For a lecture with duration=2, find all valid blocks
 * const blocks = findAllConsecutiveSlots(2, inputData);
 * // Returns: [{ startSlotId: "slot1", slotIds: ["slot1", "slot2"], day: 1, startPeriod: 1 }, ...]
 */
export function findAllConsecutiveSlots(
  duration: number,
  inputData: GAInputData,
): ConsecutiveSlotBlock[] {
  if (duration <= 1) {
    // Single-slot lectures can use any slot
    return inputData.slots.map((slot) => ({
      startSlotId: slot.id,
      slotIds: [slot.id],
      day: slot.day,
      startPeriod: slot.number,
    }));
  }

  const blocks: ConsecutiveSlotBlock[] = [];
  const { slots, lookupMaps } = inputData;

  // Group slots by day for efficient consecutive checking
  const slotsByDay = new Map<number, GASlot[]>();
  for (const slot of slots) {
    if (!slotsByDay.has(slot.day)) {
      slotsByDay.set(slot.day, []);
    }
    slotsByDay.get(slot.day)!.push(slot);
  }

  // Sort slots within each day by period number
  for (const daySlots of slotsByDay.values()) {
    daySlots.sort((a, b) => a.number - b.number);
  }

  // For each day, find all consecutive blocks
  for (const [day, daySlots] of slotsByDay) {
    for (let i = 0; i <= daySlots.length - duration; i++) {
      const startSlot = daySlots[i]!;
      const block: string[] = [startSlot.id];
      let isConsecutive = true;

      // Try to build a consecutive block starting from this slot
      for (let j = 1; j < duration; j++) {
        const nextSlot = daySlots[i + j];
        if (!nextSlot || nextSlot.number !== startSlot.number + j) {
          isConsecutive = false;
          break;
        }
        block.push(nextSlot.id);
      }

      if (isConsecutive) {
        blocks.push({
          startSlotId: startSlot.id,
          slotIds: block,
          day,
          startPeriod: startSlot.number,
        });
      }
    }
  }

  return blocks;
}

/**
 * Check if a given starting slot can accommodate a consecutive block of the specified duration.
 *
 * @param startSlotId - The ID of the starting slot
 * @param duration - Number of consecutive slots required
 * @param inputData - The GA input data
 * @returns The consecutive block if valid, null otherwise
 */
export function getConsecutiveBlockFromStart(
  startSlotId: string,
  duration: number,
  inputData: GAInputData,
): ConsecutiveSlotBlock | null {
  const { lookupMaps } = inputData;
  const startSlot = lookupMaps.slotIdToSlot.get(startSlotId);

  if (!startSlot) return null;

  if (duration <= 1) {
    return {
      startSlotId,
      slotIds: [startSlotId],
      day: startSlot.day,
      startPeriod: startSlot.number,
    };
  }

  const slotIds: string[] = [startSlotId];
  const day = startSlot.day;

  // Try to find the next consecutive slots
  for (let i = 1; i < duration; i++) {
    const nextSlot = findSlotByDayAndPeriod(
      day,
      startSlot.number + i,
      inputData,
    );

    if (!nextSlot) {
      return null; // Not enough consecutive slots available
    }

    slotIds.push(nextSlot.id);
  }

  return {
    startSlotId,
    slotIds,
    day,
    startPeriod: startSlot.number,
  };
}

/**
 * Find a slot by day and period number.
 *
 * @param day - Day number
 * @param period - Period number
 * @param inputData - The GA input data
 * @returns The slot if found, null otherwise
 */
export function findSlotByDayAndPeriod(
  day: number,
  period: number,
  inputData: GAInputData,
): GASlot | null {
  for (const slot of inputData.slots) {
    if (slot.day === day && slot.number === period) {
      return slot;
    }
  }
  return null;
}

/**
 * Verify that a gene's assigned slot is the START of a valid consecutive block.
 * This is used for validation - ensuring that multi-duration lectures are
 * properly placed at the beginning of their consecutive block.
 *
 * @param slotId - The slot ID to verify
 * @param duration - Expected duration
 * @param inputData - The GA input data
 * @returns true if this is a valid start of a consecutive block
 */
export function isValidBlockStart(
  slotId: string,
  duration: number,
  inputData: GAInputData,
): boolean {
  const block = getConsecutiveBlockFromStart(slotId, duration, inputData);
  return block !== null;
}

/**
 * Get the next slot in sequence (same day, next period).
 *
 * @param currentSlotId - Current slot ID
 * @param inputData - The GA input data
 * @returns Next slot if it exists, null otherwise
 */
export function getNextSlotInDay(
  currentSlotId: string,
  inputData: GAInputData,
): GASlot | null {
  const { lookupMaps } = inputData;
  const currentSlot = lookupMaps.slotIdToSlot.get(currentSlotId);

  if (!currentSlot) return null;

  return findSlotByDayAndPeriod(
    currentSlot.day,
    currentSlot.number + 1,
    inputData,
  );
}

/**
 * Calculate how late in the day a slot block starts (0.0 = first period, 1.0 = last period).
 * Used for soft constraint checking (preferring early slots for multi-duration lectures).
 *
 * @param startSlotId - Starting slot ID
 * @param inputData - The GA input data
 * @returns Fraction of day (0.0 to 1.0) or null if slot not found
 */
export function getSlotPositionInDay(
  startSlotId: string,
  inputData: GAInputData,
): number | null {
  const { lookupMaps } = inputData;
  const startSlot = lookupMaps.slotIdToSlot.get(startSlotId);

  if (!startSlot) return null;

  // Find all slots on the same day
  const slotsOnDay = inputData.slots.filter((s) => s.day === startSlot.day);
  if (slotsOnDay.length === 0) return null;

  // Sort by period number
  slotsOnDay.sort((a, b) => a.number - b.number);

  const minPeriod = slotsOnDay[0]!.number;
  const maxPeriod = slotsOnDay[slotsOnDay.length - 1]!.number;
  const range = maxPeriod - minPeriod;

  if (range === 0) return 0.0;

  const position = (startSlot.number - minPeriod) / range;
  return position;
}
