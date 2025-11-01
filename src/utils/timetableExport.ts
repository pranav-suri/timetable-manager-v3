import * as XLSX from "xlsx-js-style";
import { prisma } from "@/server/prisma";
import { getInitials } from "src/routes/tt/$timetableId/edit/-components/utils";
import getColor from "@/utils/getColor";

// Day names mapping
const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export interface LectureExportData {
  subjectName: string;
  teacherName: string;
  subdivisions: string[];
  classrooms: string[];
}

export interface SlotExportData {
  day: number;
  slotNumber: number;
  lectures: LectureExportData[];
}

/**
 * Formats a lecture for export as: SubjectName-TeacherName-Subdivisions-Classrooms
 */
function formatLectureForExport(lecture: LectureExportData): string {
  const { subjectName, teacherName, subdivisions, classrooms } = lecture;

  const subdivisionsStr = subdivisions.length > 0 ? subdivisions.join(",") : "";
  const classroomsStr = classrooms.length > 0 ? classrooms.join(",") : "";

  return `${getInitials(subjectName)} : ${getInitials(teacherName)}\n${subdivisionsStr}\n${classroomsStr}`;
  // return `${subjectName}\n${teacherName}\n${subdivisionsStr}\n${classroomsStr}`;
}

/**
 * Aggregates timetable data for export
 */
export async function aggregateTimetableData(
  timetableId: string,
): Promise<SlotExportData[]> {
  // Get all slots for the timetable with their lectures
  const slotsWithLectures = await prisma.slot.findMany({
    where: { timetableId },
    include: {
      lectureSlots: {
        include: {
          lecture: {
            include: {
              teacher: true,
              subject: true,
              lectureSubdivisions: {
                include: {
                  subdivision: true,
                },
              },
              lectureClassrooms: {
                include: {
                  classroom: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: [{ day: "asc" }, { number: "asc" }],
  });

  // Transform data into export format
  const exportData: SlotExportData[] = [];

  for (const slot of slotsWithLectures) {
    const lectures: LectureExportData[] = slot.lectureSlots.map((ls) => ({
      subjectName: ls.lecture.subject.name,
      teacherName: ls.lecture.teacher.name,
      subdivisions: ls.lecture.lectureSubdivisions.map(
        (lsd) => lsd.subdivision.name,
      ),
      classrooms: ls.lecture.lectureClassrooms.map((lc) => lc.classroom.name),
    }));

    exportData.push({
      day: slot.day,
      slotNumber: slot.number,
      lectures,
    });
  }

  return exportData;
}

/**
 * Creates Excel worksheet data from aggregated timetable data
 */
export function createExcelData(
  aggregatedData: SlotExportData[],
): (string | number)[][] {
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

  const rows: (string | number)[][] = [headerRow];

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
    const rowData: (string | number)[] = [dayName];

    // For each slot number, add the first lecture (or empty if no lectures)
    for (const slotNum of allSlotNumbers) {
      const slotData = slotsByNumber.get(slotNum);
      if (slotData && slotData.lectures.length > 0) {
        // Put the first lecture in this row
        const firstLecture = slotData.lectures[0];
        if (firstLecture) {
          rowData.push(formatLectureForExport(firstLecture));
        } else {
          rowData.push("");
        }
      } else {
        rowData.push(""); // Empty slot
      }
    }

    rows.push(rowData);

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
        const extraRow: (string | number)[] = [""]; // Empty day column

        for (const slotNum of allSlotNumbers) {
          const slotData = slotsByNumber.get(slotNum);
          const lecture = slotData?.lectures[lectureIndex];
          if (lecture) {
            extraRow.push(formatLectureForExport(lecture));
          } else {
            extraRow.push("");
          }
        }

        rows.push(extraRow);
      }
    }
  }

  return rows;
}

/**
 * Exports timetable to Excel file
 */
export async function exportTimetableToExcel(
  timetableId: string,
  filename?: string,
): Promise<void> {
  // Aggregate data
  const aggregatedData = await aggregateTimetableData(timetableId);

  // Create Excel data
  const excelData = createExcelData(aggregatedData);

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(excelData);

  // Set column widths for better readability
  const colWidths = [{ wch: 12 }]; // Day column
  const maxSlots = Math.max(...aggregatedData.map((d) => d.slotNumber));
  for (let i = 0; i < maxSlots; i++) {
    colWidths.push({ wch: 30 }); // Slot columns
  }
  ws["!cols"] = colWidths;

  // Apply text wrapping to all cells, this render the new line characters correctly
  for (let R = 0; R < excelData.length; R++) {
    for (let C = 0; C < excelData[R]!.length; C++) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cellAddress]) continue;

      // Set wrap text property
      if (!ws[cellAddress].s) {
        ws[cellAddress].s = {};
      }
      ws[cellAddress].s.alignment = {
        wrapText: true,
        vertical: "top",
        horizontal: "left",
      };
    }
  }

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, "Timetable");

  // Generate filename
  const finalFilename =
    filename ||
    `timetable_${timetableId}_${new Date().toISOString()}`
      .replaceAll(":", "-")
      .split(".")[0] + ".xlsx";
  console.log(`Exporting timetable to Excel file: ${finalFilename}`);
  // Write file
  XLSX.writeFile(wb, finalFilename);
}

/**
 * For testing: returns the Excel data as a 2D array without creating file
 */
export async function getTimetableExcelData(
  timetableId: string,
): Promise<(string | number)[][]> {
  const aggregatedData = await aggregateTimetableData(timetableId);
  return createExcelData(aggregatedData);
}
