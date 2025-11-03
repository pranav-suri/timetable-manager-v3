import type {
  SlotExportData,
  LectureExportData,
} from "@/utils/timetableExport";
import type { useCollections } from "@/db-collections/providers/useCollections";
import { DAY_NAMES } from "src/utils/constants";

type Collections = ReturnType<typeof useCollections>;

/**
 * Aggregates timetable data from collections for export
 * Uses collection.toArray property to access current state
 * Supports filtering by teacher, subject, subdivision, and classroom IDs
 */
export function aggregateTimetableData(
  collections: Collections,
  filters?: {
    teacherIds?: string[];
    subjectIds?: string[];
    subdivisionIds?: string[];
    classroomIds?: string[];
  },
): SlotExportData[] {
  // Access collections using .toArray property (not a function!)
  const slots = collections.slotCollection.toArray;
  const lectureSlots = collections.lectureSlotCollection.toArray;
  const lectures = collections.lectureCollection.toArray;
  const teachers = collections.teacherCollection.toArray;
  const subjects = collections.subjectCollection.toArray;
  const subdivisions = collections.subdivisionCollection.toArray;
  const classrooms = collections.classroomCollection.toArray;
  const lectureSubdivisions = collections.lectureSubdivisionCollection.toArray;
  const lectureClassrooms = collections.lectureClassroomCollection.toArray;

  // Create lookup maps for O(1) access - efficient joins
  const lectureMap = new Map(lectures.map((l) => [l.id, l]));
  const teacherMap = new Map(teachers.map((t) => [t.id, t]));
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const subdivisionMap = new Map(subdivisions.map((s) => [s.id, s]));
  const classroomMap = new Map(classrooms.map((c) => [c.id, c]));

  // Group lecture subdivisions by lectureId
  const lectureSubdivisionsMap = new Map<string, string[]>();
  for (const ls of lectureSubdivisions) {
    if (!lectureSubdivisionsMap.has(ls.lectureId)) {
      lectureSubdivisionsMap.set(ls.lectureId, []);
    }
    const subdivision = subdivisionMap.get(ls.subdivisionId);
    if (subdivision) {
      lectureSubdivisionsMap.get(ls.lectureId)!.push(subdivision.name);
    }
  }

  // Group lecture classrooms by lectureId
  const lectureClassroomsMap = new Map<string, string[]>();
  for (const lc of lectureClassrooms) {
    if (!lectureClassroomsMap.has(lc.lectureId)) {
      lectureClassroomsMap.set(lc.lectureId, []);
    }
    const classroom = classroomMap.get(lc.classroomId);
    if (classroom) {
      lectureClassroomsMap.get(lc.lectureId)!.push(classroom.name);
    }
  }

  // Apply filters to lectures if provided
  let filteredLectures = lectures;
  if (filters) {
    filteredLectures = lectures.filter((lecture) => {
      const teacher = teacherMap.get(lecture.teacherId);
      const subject = subjectMap.get(lecture.subjectId);
      const lectureSubdivisionsList = lectureSubdivisionsMap.get(lecture.id) || [];
      const lectureClassroomsList = lectureClassroomsMap.get(lecture.id) || [];

      // Check teacher filter
      if (filters.teacherIds && filters.teacherIds.length > 0) {
        if (!teacher || !filters.teacherIds.includes(teacher.id)) {
          return false;
        }
      }

      // Check subject filter
      if (filters.subjectIds && filters.subjectIds.length > 0) {
        if (!subject || !filters.subjectIds.includes(subject.id)) {
          return false;
        }
      }

      // Check subdivision filter (lecture must have at least one matching subdivision)
      if (filters.subdivisionIds && filters.subdivisionIds.length > 0) {
        const lectureSubdivisionIds = lectureSubdivisions
          .filter((ls) => ls.lectureId === lecture.id)
          .map((ls) => ls.subdivisionId);
        const hasMatchingSubdivision = lectureSubdivisionIds.some((id) =>
          filters.subdivisionIds!.includes(id)
        );
        if (!hasMatchingSubdivision) {
          return false;
        }
      }

      // Check classroom filter (lecture must have at least one matching classroom)
      if (filters.classroomIds && filters.classroomIds.length > 0) {
        const lectureClassroomIds = lectureClassrooms
          .filter((lc) => lc.lectureId === lecture.id)
          .map((lc) => lc.classroomId);
        const hasMatchingClassroom = lectureClassroomIds.some((id) =>
          filters.classroomIds!.includes(id)
        );
        if (!hasMatchingClassroom) {
          return false;
        }
      }

      return true;
    });
  }

  // Create filtered lecture map
  const filteredLectureMap = new Map(filteredLectures.map((l) => [l.id, l]));

  // Build export data by joining all collections
  const exportData: SlotExportData[] = [];

  for (const slot of slots) {
    const slotLectures: LectureExportData[] = lectureSlots
      .filter((ls) => ls.slotId === slot.id)
      .map((ls) => {
        const lecture = filteredLectureMap.get(ls.lectureId);
        if (!lecture) return null;

        const teacher = teacherMap.get(lecture.teacherId);
        const subject = subjectMap.get(lecture.subjectId);

        return {
          subjectName: subject?.name ?? "Unknown Subject",
          teacherName: teacher?.name ?? "Unknown Teacher",
          subdivisions: lectureSubdivisionsMap.get(lecture.id) ?? [],
          classrooms: lectureClassroomsMap.get(lecture.id) ?? [],
        };
      })
      .filter((l) => l !== null);

    exportData.push({
      day: slot.day,
      slotNumber: slot.number,
      lectures: slotLectures,
    });
  }

  // Sort by day and slot number for consistent output
  return exportData.sort((a, b) => {
    if (a.day !== b.day) return a.day - b.day;
    return a.slotNumber - b.slotNumber;
  });
} /**
 * Creates Excel worksheet data from aggregated timetable data
 * Returns both the data and subject names for each cell (for coloring)
 */

export function createExcelData(aggregatedData: SlotExportData[]): {
  data: Array<Array<string | number>>;
  subjectNames: Array<Array<string | null>>;
} {
  // Group data by day
  const dataByDay = new Map<number, SlotExportData[]>();
  for (const slotData of aggregatedData) {
    if (!dataByDay.has(slotData.day)) {
      dataByDay.set(slotData.day, []);
    }
    dataByDay.get(slotData.day)!.push(slotData);
  }

  // Get all unique slot numbers across all days
  const allSlotNumbers = [
    ...new Set(aggregatedData.map((d) => d.slotNumber)),
  ].sort((a, b) => a - b);

  // Create header row
  const headerRow = ["Day", ...allSlotNumbers.map((n) => `Slot ${n}`)];

  /**
   * 2D array of rows for the Excel sheet
   */
  const rows: Array<Array<string | number>> = [headerRow];
  /**
   * 2D array of subject names for each cell (for coloring purposes)
   */
  const subjectNames: Array<Array<string | null>> = [
    new Array(headerRow.length).fill(null),
  ];

  // Create data rows for each day
  for (let day = 1; day <= 7; day++) {
    const daySlots = dataByDay.get(day) || [];
    const dayName = DAY_NAMES[day - 1] || `Day ${day}`;

    // Group slots by slot number for this day
    const slotsByNumber = new Map<number, SlotExportData>();
    for (const slotData of daySlots) {
      slotsByNumber.set(slotData.slotNumber, slotData);
    }

    // Create row data
    const rowData: Array<string | number> = [dayName];
    const rowSubjects: Array<string | null> = [null];

    // For each slot number, add the first lecture (or empty if no lectures)
    for (const slotNum of allSlotNumbers) {
      const slotData = slotsByNumber.get(slotNum);
      if (slotData && slotData.lectures.length > 0) {
        // Put the first lecture in this row
        const firstLecture = slotData.lectures[0];
        if (firstLecture) {
          rowData.push(formatLectureForExport(firstLecture));
          rowSubjects.push(firstLecture.subjectName);
        } else {
          rowData.push("");
          rowSubjects.push(null);
        }
      } else {
        rowData.push(""); // Empty slot
        rowSubjects.push(null);
      }
    }

    rows.push(rowData);
    subjectNames.push(rowSubjects);

    // Handle multiple lectures per slot by creating additional rows
    const maxLecturesInAnySlot = Math.max(
      ...daySlots.map((s) => s.lectures.length),
    );
    if (maxLecturesInAnySlot > 1) {
      // Create additional rows for extra lectures
      for (
        let lectureIndex = 1;
        lectureIndex < maxLecturesInAnySlot;
        lectureIndex++
      ) {
        const extraRow: Array<string | number> = [""]; // Empty day column
        const extraSubjects: Array<string | null> = [null];

        for (const slotNum of allSlotNumbers) {
          const slotData = slotsByNumber.get(slotNum);
          const lecture = slotData?.lectures[lectureIndex];
          if (lecture) {
            extraRow.push(formatLectureForExport(lecture));
            extraSubjects.push(lecture.subjectName);
          } else {
            extraRow.push("");
            extraSubjects.push(null);
          }
        }

        rows.push(extraRow);
        subjectNames.push(extraSubjects);
      }
    }
  }

  return { data: rows, subjectNames };
}

/**
 * Formats a lecture for export as: SubjectName-TeacherName-Subdivisions-Classrooms
 */
export function formatLectureForExport(lecture: LectureExportData): string {
  const { subjectName, teacherName, subdivisions, classrooms } = lecture;

  const subdivisionsStr = subdivisions.length > 0 ? subdivisions.join(",") : "";
  const classroomsStr = classrooms.length > 0 ? classrooms.join(",") : "";

  // return `${getInitials(subjectName)} : ${getInitials(teacherName)}\n${subdivisionsStr}\n${classroomsStr}`;
  return `${subjectName}\n${teacherName}\n${subdivisionsStr}\n${classroomsStr}`;
}
