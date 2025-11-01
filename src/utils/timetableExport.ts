import * as XLSX from "xlsx-js-style";
import { getInitials } from "src/routes/tt/$timetableId/edit/-components/utils";
import { DAY_NAMES } from "./constants";
import { prisma } from "@/server/prisma";
import getColor from "@/utils/getColor";


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

  // return `${getInitials(subjectName)} : ${getInitials(teacherName)}\n${subdivisionsStr}\n${classroomsStr}`;
  return `${subjectName}\n${teacherName}\n${subdivisionsStr}\n${classroomsStr}`;
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
 * Exports timetable to Excel file
 */
export async function exportTimetableToExcel(
  timetableId: string,
  filename?: string,
): Promise<void> {
  // Aggregate data
  const aggregatedData = await aggregateTimetableData(timetableId);

  // Create Excel data
  const { data: excelData, subjectNames } = createExcelData(aggregatedData);

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(excelData);

  // Set column widths for better readability
  const colWidths: XLSX.ColInfo[] = [{ wch: 12 }]; // Day column
  const maxSlots = Math.max(...aggregatedData.map((d) => d.slotNumber));
  for (let i = 0; i < maxSlots; i++) {
    colWidths.push({ wch: 40 }); // Slot columns
  }
  ws["!cols"] = colWidths;

  // Apply text wrapping, background colors, and borders to all cells
  for (let R = 0; R < excelData.length; R++) {
    for (let C = 0; C < excelData[R]!.length; C++) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cellAddress]) continue;

      // Initialize cell style
      if (!ws[cellAddress].s) {
        ws[cellAddress].s = {};
      }

      // Set wrap text property
      ws[cellAddress].s.alignment = {
        wrapText: true,
        vertical: "center",
        horizontal: "center",
      };

      // Apply background color based on subject
      const subjectName = subjectNames[R]?.[C];
      if (subjectName) {
        const bgColor = getColor(subjectName, "light");
        // Convert hex color to Excel format (remove # and convert to RGB)
        const hexColor = bgColor.replace("#", "");
        ws[cellAddress].s.fill = {
          fgColor: { rgb: hexColor },
        };
      }

      // Determine border styles
      const isHeaderRow = R === 0;
      const isDayColumn = C === 0;
      const isLastColumn = C === excelData[R]!.length - 1;
      const isLastRow = R === excelData.length - 1;

      // Check if next row has content in Day column (indicates new day/slot group)
      const isNewDayBelow =
        R < excelData.length - 1 &&
        excelData[R + 1]?.[0] !== "" &&
        excelData[R + 1]?.[0] !== undefined;

      // Check if current row has content in Day column (indicates start of day)
      const isStartOfDay =
        excelData[R]?.[0] !== "" &&
        excelData[R]?.[0] !== undefined &&
        !isHeaderRow;

      const thickBorder = {
        style: "medium",
        color: { rgb: "000000" },
      };

      const thinBorder = {
        style: "thin",
        color: { rgb: "000000" },
      };

      // Apply borders with thick borders around complete slots
      ws[cellAddress].s.border = {
        // Top border: thick for header, start of day, or after last row
        top: isHeaderRow || isStartOfDay ? thickBorder : thinBorder,
        // Bottom border: thick for last row or before new day starts
        bottom: isLastRow || isNewDayBelow ? thickBorder : thinBorder,
        // Left border: thick for day column or slot column boundaries (all columns except day)
        left: isDayColumn || C > 0 ? thickBorder : thinBorder,
        // Right border: thick for all columns (creates slot separation)
        right: thickBorder,
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
): Promise<Array<Array<string | number>>> {
  const aggregatedData = await aggregateTimetableData(timetableId);
  const { data } = createExcelData(aggregatedData);
  return data;
}
