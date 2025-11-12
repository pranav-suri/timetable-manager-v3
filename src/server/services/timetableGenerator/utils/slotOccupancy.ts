/**
 * @file slotOccupancy.ts
 * @description Optimized data structure for tracking slot occupancy during GA operations.
 *
 * This class provides O(1) lookups for checking conflicts when placing genes,
 * replacing the O(n²) brute-force approach used in the original heuristic initialization
 * and repair mechanisms.
 *
 * Key optimization: Instead of iterating through all genes to check for conflicts,
 * we maintain real-time maps of which teachers and subdivisions occupy which slots.
 *
 * NOTE: This is different from the SlotOccupancyMap type alias used in constraint evaluation.
 * This class is used during initialization for O(1) conflict checking, while the type alias
 * is a simpler Map<string, Gene[]> used for constraint violation detection.
 */

import type { Chromosome, GAInputData, Gene, GALecture } from "../types";
import type { ConsecutiveSlotBlock } from "./slotUtils";

/**
 * Tracks which teachers, subdivisions, and classrooms occupy each slot.
 * Provides O(1) conflict checking for initialization and repair operations.
 *
 * This is distinct from the SlotOccupancyMap type (Map<string, Gene[]>) used in
 * constraint evaluation - this class maintains separate maps per entity type for
 * efficient conflict detection during population initialization.
 */
export class SlotOccupancyTracker {
  // slotId -> Set of teacherIds occupying this slot
  private teachersBySlot: Map<string, Set<string>>;

  // slotId -> Set of subdivisionIds occupying this slot
  private subdivisionsBySlot: Map<string, Set<string>>;

  // slotId -> Set of classroomIds occupying this slot
  private classroomsBySlot: Map<string, Set<string>>;

  // teacherId -> Set of slotIds where this teacher is scheduled
  private slotsByTeacher: Map<string, Set<string>>;

  // subdivisionId -> Set of slotIds where this subdivision is scheduled
  private slotsBySubdivision: Map<string, Set<string>>;

  private inputData: GAInputData;

  constructor(inputData: GAInputData) {
    this.teachersBySlot = new Map();
    this.subdivisionsBySlot = new Map();
    this.classroomsBySlot = new Map();
    this.slotsByTeacher = new Map();
    this.slotsBySubdivision = new Map();
    this.inputData = inputData;

    // Initialize empty sets for all slots
    for (const slot of inputData.slots) {
      this.teachersBySlot.set(slot.id, new Set());
      this.subdivisionsBySlot.set(slot.id, new Set());
      this.classroomsBySlot.set(slot.id, new Set());
    }
  }

  /**
   * Build the occupancy map from an existing chromosome.
   * This is used when initializing the map from a partially-built chromosome.
   *
   * @param chromosome - The chromosome to build from
   */
  buildFromChromosome(chromosome: Chromosome): void {
    this.clear();

    for (const gene of chromosome) {
      this.addGene(gene);
    }
  }

  /**
   * Clear all occupancy data.
   */
  clear(): void {
    for (const set of this.teachersBySlot.values()) {
      set.clear();
    }
    for (const set of this.subdivisionsBySlot.values()) {
      set.clear();
    }
    for (const set of this.classroomsBySlot.values()) {
      set.clear();
    }
    this.slotsByTeacher.clear();
    this.slotsBySubdivision.clear();
  }

  /**
   * Add a gene to the occupancy map.
   * For multi-duration lectures, this does NOT add all slots in the block -
   * it only adds the starting slot. The caller is responsible for adding
   * the full block if needed.
   *
   * @param gene - The gene to add
   */
  addGene(gene: Gene): void {
    const lecture = this.inputData.lookupMaps.eventToLecture.get(
      gene.lectureEventId,
    );
    if (!lecture) return;

    const slotId = gene.timeslotId;
    const teacherId = lecture.teacherId;
    const subdivisionIds =
      this.inputData.lookupMaps.eventToSubdivisions.get(gene.lectureEventId) ||
      [];
    const classroomIds =
      this.inputData.lookupMaps.lectureToCombinedClassrooms.get(lecture.id) ||
      [];

    // Add teacher to slot
    this.teachersBySlot.get(slotId)?.add(teacherId);

    // Add slot to teacher's schedule
    if (!this.slotsByTeacher.has(teacherId)) {
      this.slotsByTeacher.set(teacherId, new Set());
    }
    this.slotsByTeacher.get(teacherId)!.add(slotId);

    // Add subdivisions to slot
    for (const subdivisionId of subdivisionIds) {
      this.subdivisionsBySlot.get(slotId)?.add(subdivisionId);

      if (!this.slotsBySubdivision.has(subdivisionId)) {
        this.slotsBySubdivision.set(subdivisionId, new Set());
      }
      this.slotsBySubdivision.get(subdivisionId)!.add(slotId);
    }

    // Add classrooms to slot
    for (const classroomId of classroomIds) {
      this.classroomsBySlot.get(slotId)?.add(classroomId);
    }
  }

  /**
   * Add a consecutive block of slots for a multi-duration lecture.
   *
   * @param gene - The gene representing the lecture
   * @param block - The consecutive slot block
   */
  addBlock(gene: Gene, block: ConsecutiveSlotBlock): void {
    const lecture = this.inputData.lookupMaps.eventToLecture.get(
      gene.lectureEventId,
    );
    if (!lecture) return;

    const teacherId = lecture.teacherId;
    const subdivisionIds =
      this.inputData.lookupMaps.eventToSubdivisions.get(gene.lectureEventId) ||
      [];
    const classroomIds =
      this.inputData.lookupMaps.lectureToCombinedClassrooms.get(lecture.id) ||
      [];

    // Add occupancy for all slots in the block
    for (const slotId of block.slotIds) {
      this.teachersBySlot.get(slotId)?.add(teacherId);

      if (!this.slotsByTeacher.has(teacherId)) {
        this.slotsByTeacher.set(teacherId, new Set());
      }
      this.slotsByTeacher.get(teacherId)!.add(slotId);

      for (const subdivisionId of subdivisionIds) {
        this.subdivisionsBySlot.get(slotId)?.add(subdivisionId);

        if (!this.slotsBySubdivision.has(subdivisionId)) {
          this.slotsBySubdivision.set(subdivisionId, new Set());
        }
        this.slotsBySubdivision.get(subdivisionId)!.add(slotId);
      }

      for (const classroomId of classroomIds) {
        this.classroomsBySlot.get(slotId)?.add(classroomId);
      }
    }
  }

  /**
   * Remove a gene from the occupancy map.
   *
   * @param gene - The gene to remove
   */
  removeGene(gene: Gene): void {
    const lecture = this.inputData.lookupMaps.eventToLecture.get(
      gene.lectureEventId,
    );
    if (!lecture) return;

    const slotId = gene.timeslotId;
    const teacherId = lecture.teacherId;
    const subdivisionIds =
      this.inputData.lookupMaps.eventToSubdivisions.get(gene.lectureEventId) ||
      [];
    const classroomIds =
      this.inputData.lookupMaps.lectureToCombinedClassrooms.get(lecture.id) ||
      [];

    // Remove teacher from slot
    this.teachersBySlot.get(slotId)?.delete(teacherId);
    this.slotsByTeacher.get(teacherId)?.delete(slotId);

    // Remove subdivisions from slot
    for (const subdivisionId of subdivisionIds) {
      this.subdivisionsBySlot.get(slotId)?.delete(subdivisionId);
      this.slotsBySubdivision.get(subdivisionId)?.delete(slotId);
    }

    // Remove classrooms from slot
    for (const classroomId of classroomIds) {
      this.classroomsBySlot.get(slotId)?.delete(classroomId);
    }
  }

  /**
   * Remove a consecutive block from the occupancy map.
   *
   * @param gene - The gene representing the lecture
   * @param block - The consecutive slot block
   */
  removeBlock(gene: Gene, block: ConsecutiveSlotBlock): void {
    const lecture = this.inputData.lookupMaps.eventToLecture.get(
      gene.lectureEventId,
    );
    if (!lecture) return;

    const teacherId = lecture.teacherId;
    const subdivisionIds =
      this.inputData.lookupMaps.eventToSubdivisions.get(gene.lectureEventId) ||
      [];
    const classroomIds =
      this.inputData.lookupMaps.lectureToCombinedClassrooms.get(lecture.id) ||
      [];

    // Remove occupancy for all slots in the block
    for (const slotId of block.slotIds) {
      this.teachersBySlot.get(slotId)?.delete(teacherId);
      this.slotsByTeacher.get(teacherId)?.delete(slotId);

      for (const subdivisionId of subdivisionIds) {
        this.subdivisionsBySlot.get(slotId)?.delete(subdivisionId);
        this.slotsBySubdivision.get(subdivisionId)?.delete(slotId);
      }

      for (const classroomId of classroomIds) {
        this.classroomsBySlot.get(slotId)?.delete(classroomId);
      }
    }
  }

  /**
   * Check if placing a lecture at a given slot block would create conflicts.
   * This is the key optimization: O(1) conflict checking instead of O(n).
   *
   * @param lecture - The lecture to place
   * @param block - The consecutive slot block to check
   * @param eventId - The event ID (for subdivision lookup)
   * @returns Object with conflict information
   */
  checkBlockConflicts(
    lecture: GALecture,
    block: ConsecutiveSlotBlock,
    eventId: string,
  ): {
    hasTeacherConflict: boolean;
    hasSubdivisionConflict: boolean;
    hasRoomConflict: boolean;
    hasUnavailability: boolean;
    conflictCount: number;
  } {
    const teacherId = lecture.teacherId;
    const subdivisionIds =
      this.inputData.lookupMaps.eventToSubdivisions.get(eventId) || [];
    const classroomIds =
      this.inputData.lookupMaps.lectureToCombinedClassrooms.get(lecture.id) ||
      [];

    let hasTeacherConflict = false;
    let hasSubdivisionConflict = false;
    let hasRoomConflict = false;
    let hasUnavailability = false;
    let conflictCount = 0;

    // Check all slots in the block
    for (const slotId of block.slotIds) {
      // Check teacher conflict
      const teachersInSlot = this.teachersBySlot.get(slotId);
      if (teachersInSlot?.has(teacherId)) {
        hasTeacherConflict = true;
        conflictCount += 10;
      }

      // Check teacher unavailability
      const teacherUnavailable =
        this.inputData.lookupMaps.teacherUnavailable.get(teacherId);
      if (teacherUnavailable?.has(slotId)) {
        hasUnavailability = true;
        conflictCount += 10;
      }

      // Check subdivision conflict
      const subdivisionsInSlot = this.subdivisionsBySlot.get(slotId);
      for (const subdivisionId of subdivisionIds) {
        if (subdivisionsInSlot?.has(subdivisionId)) {
          // Check if this is an allowed overlap (electives from same group)
          const currentAllowSimultaneous =
            lecture.subject.group.allowSimultaneous;
          const currentGroupId = lecture.subject.groupId;

          // If not an elective, it's a conflict
          if (!currentAllowSimultaneous) {
            hasSubdivisionConflict = true;
            conflictCount += 10;
          }
        }

        // Check subdivision unavailability
        const subdivisionUnavailable =
          this.inputData.lookupMaps.subdivisionUnavailable.get(subdivisionId);
        if (subdivisionUnavailable?.has(slotId)) {
          hasUnavailability = true;
          conflictCount += 10;
        }
      }

      // Check room conflict
      const classroomsInSlot = this.classroomsBySlot.get(slotId);
      for (const classroomId of classroomIds) {
        if (classroomsInSlot?.has(classroomId)) {
          hasRoomConflict = true;
          conflictCount += 5;
        }

        // Check classroom unavailability
        const classroomUnavailable =
          this.inputData.lookupMaps.classroomUnavailable.get(classroomId);
        if (classroomUnavailable?.has(slotId)) {
          hasUnavailability = true;
          conflictCount += 5;
        }
      }
    }

    return {
      hasTeacherConflict,
      hasSubdivisionConflict,
      hasRoomConflict,
      hasUnavailability,
      conflictCount,
    };
  }

  /**
   * Find all valid blocks for a lecture (blocks with no conflicts).
   * This is used for targeted slot search in heuristic initialization and repair.
   *
   * @param lecture - The lecture to place
   * @param eventId - The event ID
   * @param allBlocks - All possible consecutive blocks (from findAllConsecutiveSlots)
   * @returns Array of valid blocks sorted by conflict count (fewest conflicts first)
   */
  findValidBlocks(
    lecture: GALecture,
    eventId: string,
    allBlocks: ConsecutiveSlotBlock[],
  ): ConsecutiveSlotBlock[] {
    const validBlocks: Array<{
      block: ConsecutiveSlotBlock;
      conflicts: number;
    }> = [];

    for (const block of allBlocks) {
      const conflicts = this.checkBlockConflicts(lecture, block, eventId);

      // Only consider blocks with no hard conflicts
      if (
        !conflicts.hasTeacherConflict &&
        !conflicts.hasSubdivisionConflict &&
        !conflicts.hasUnavailability
      ) {
        validBlocks.push({ block, conflicts: conflicts.conflictCount });
      }
    }

    // Sort by conflict count (fewest first)
    validBlocks.sort((a, b) => a.conflicts - b.conflicts);

    return validBlocks.map((v) => v.block);
  }

  /**
   * Get all slots where a specific teacher is free.
   * Used for targeted repair: when a teacher has a clash, find slots where they're available.
   *
   * @param teacherId - The teacher ID
   * @returns Set of slot IDs where the teacher is not scheduled and not unavailable
   */
  getTeacherFreeSlots(teacherId: string): Set<string> {
    const occupiedSlots = this.slotsByTeacher.get(teacherId) || new Set();
    const unavailableSlots =
      this.inputData.lookupMaps.teacherUnavailable.get(teacherId) || new Set();
    const freeSlots = new Set<string>();

    for (const slot of this.inputData.slots) {
      if (!occupiedSlots.has(slot.id) && !unavailableSlots.has(slot.id)) {
        freeSlots.add(slot.id);
      }
    }

    return freeSlots;
  }

  /**
   * Get all slots where a specific subdivision is free.
   *
   * @param subdivisionId - The subdivision ID
   * @returns Set of slot IDs where the subdivision is not scheduled and not unavailable
   */
  getSubdivisionFreeSlots(subdivisionId: string): Set<string> {
    const occupiedSlots =
      this.slotsBySubdivision.get(subdivisionId) || new Set();
    const unavailableSlots =
      this.inputData.lookupMaps.subdivisionUnavailable.get(subdivisionId) ||
      new Set();
    const freeSlots = new Set<string>();

    for (const slot of this.inputData.slots) {
      if (!occupiedSlots.has(slot.id) && !unavailableSlots.has(slot.id)) {
        freeSlots.add(slot.id);
      }
    }

    return freeSlots;
  }
}
