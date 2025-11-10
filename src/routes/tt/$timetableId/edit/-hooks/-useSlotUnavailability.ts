/**
 * Hook to check if a slot has unavailability constraints
 * Returns information about hard and soft (preferred) unavailability
 */

import { useMemo } from "react";
import { useLiveQuery } from "@tanstack/react-db";
import { useCollections } from "@/db-collections/providers/useCollections";

export interface SlotUnavailability {
  hasHardUnavailability: boolean;
  hasPreferredUnavailability: boolean;
  unavailabilityDetails: {
    teachers: Array<{ id: string; name: string; isPreferred: boolean }>;
    classrooms: Array<{ id: string; name: string; isPreferred: boolean }>;
    subdivisions: Array<{ id: string; name: string; isPreferred: boolean }>;
  };
}

export function useSlotUnavailability(slotId: string): SlotUnavailability {
  const {
    teacherUnavailableCollection,
    classroomUnavailableCollection,
    subdivisionUnavailableCollection,
    teacherCollection,
    classroomCollection,
    subdivisionCollection,
  } = useCollections();

  // Fetch all unavailability records
  const { data: teacherUnavailables } = useLiveQuery(
    (q) => q.from({ teacherUnavailableCollection }),
    [teacherUnavailableCollection],
  );

  const { data: classroomUnavailables } = useLiveQuery(
    (q) => q.from({ classroomUnavailableCollection }),
    [classroomUnavailableCollection],
  );

  const { data: subdivisionUnavailables } = useLiveQuery(
    (q) => q.from({ subdivisionUnavailableCollection }),
    [subdivisionUnavailableCollection],
  );

  // Fetch entity collections for names
  const { data: teachers } = useLiveQuery(
    (q) => q.from({ teacherCollection }),
    [teacherCollection],
  );

  const { data: classrooms } = useLiveQuery(
    (q) => q.from({ classroomCollection }),
    [classroomCollection],
  );

  const { data: subdivisions } = useLiveQuery(
    (q) => q.from({ subdivisionCollection }),
    [subdivisionCollection],
  );

  const unavailability = useMemo(() => {
    if (
      !teacherUnavailables ||
      !classroomUnavailables ||
      !subdivisionUnavailables ||
      !teachers ||
      !classrooms ||
      !subdivisions
    ) {
      return {
        hasHardUnavailability: false,
        hasPreferredUnavailability: false,
        unavailabilityDetails: {
          teachers: [],
          classrooms: [],
          subdivisions: [],
        },
      };
    }

    // Filter for this slot
    const slotTeacherUnavailables = teacherUnavailables.filter(
      (tu) => tu.slotId === slotId,
    );
    const slotClassroomUnavailables = classroomUnavailables.filter(
      (cu) => cu.slotId === slotId,
    );
    const slotSubdivisionUnavailables = subdivisionUnavailables.filter(
      (su) => su.slotId === slotId,
    );

    // Check for hard and preferred unavailability
    const hasHardUnavailability =
      slotTeacherUnavailables.some((tu) => !tu.isPreferred) ||
      slotClassroomUnavailables.some((cu) => !cu.isPreferred) ||
      slotSubdivisionUnavailables.some((su) => !su.isPreferred);

    const hasPreferredUnavailability =
      slotTeacherUnavailables.some((tu) => tu.isPreferred) ||
      slotClassroomUnavailables.some((cu) => cu.isPreferred) ||
      slotSubdivisionUnavailables.some((su) => su.isPreferred);

    // Build details with names
    const teachersMap = new Map(teachers.map((t) => [t.id, t.name]));
    const classroomsMap = new Map(classrooms.map((c) => [c.id, c.name]));
    const subdivisionsMap = new Map(subdivisions.map((s) => [s.id, s.name]));

    const unavailabilityDetails = {
      teachers: slotTeacherUnavailables.map((tu) => ({
        id: tu.teacherId,
        name: teachersMap.get(tu.teacherId) ?? "Unknown",
        isPreferred: tu.isPreferred,
      })),
      classrooms: slotClassroomUnavailables.map((cu) => ({
        id: cu.classroomId,
        name: classroomsMap.get(cu.classroomId) ?? "Unknown",
        isPreferred: cu.isPreferred,
      })),
      subdivisions: slotSubdivisionUnavailables.map((su) => ({
        id: su.subdivisionId,
        name: subdivisionsMap.get(su.subdivisionId) ?? "Unknown",
        isPreferred: su.isPreferred,
      })),
    };

    return {
      hasHardUnavailability,
      hasPreferredUnavailability,
      unavailabilityDetails,
    };
  }, [
    slotId,
    teacherUnavailables,
    classroomUnavailables,
    subdivisionUnavailables,
    teachers,
    classrooms,
    subdivisions,
  ]);

  return unavailability;
}
