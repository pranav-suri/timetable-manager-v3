import { useCallback } from "react";
import { useParams } from "@tanstack/react-router";
import { useCollections } from "@/db-collections/providers/useCollections";
import { useLectureSlotFiltersStore } from "@/zustand/lectureSlotFiltersStore";
import {
  aggregateTimetableData,
  createExcelData,
} from "./-utils/aggregateData";
import * as XLSX from "xlsx-js-style";
import getColor from "@/utils/getColor";

/**
 * Hook for exporting timetable data to Excel
 * Fetches data from collections and generates styled Excel file
 */
export function useExportTimetable() {
  const { timetableId } = useParams({ from: "/tt/$timetableId" });
  const collections = useCollections();
  const { teacherIds, subjectIds, subdivisionIds, classroomIds } =
    useLectureSlotFiltersStore();

  const exportToExcel = useCallback(
    (filename?: string) => {
      try {
        // Step 1: Get current filters and aggregate data from collections
        const currentFilters = {
          teacherIds: teacherIds.length > 0 ? teacherIds : undefined,
          subjectIds: subjectIds.length > 0 ? subjectIds : undefined,
          subdivisionIds:
            subdivisionIds.length > 0 ? subdivisionIds : undefined,
          classroomIds: classroomIds.length > 0 ? classroomIds : undefined,
        };

        const aggregatedData = aggregateTimetableData(
          collections,
          currentFilters,
        );

        if (aggregatedData.length === 0) {
          throw new Error("No timetable data to export");
        }

        // Step 2: Create Excel data structure (2D array)
        const { data: excelData, subjectNames } =
          createExcelData(aggregatedData);

        // Step 3: Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(excelData);

        // Step 4: Set column widths for better readability
        const colWidths: XLSX.ColInfo[] = [{ wch: 12 }]; // Day column
        const maxSlots = Math.max(...aggregatedData.map((d) => d.slotNumber));
        for (let i = 0; i < maxSlots; i++) {
          colWidths.push({ wch: 40 }); // Slot columns
        }
        ws["!cols"] = colWidths;

        // Step 5: Apply styling (text wrapping, colors, borders)
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
              const hexColor = bgColor.replace("#", "");
              ws[cellAddress].s.fill = {
                fgColor: { rgb: hexColor },
              };
            }

            // Determine border styles
            const isHeaderRow = R === 0;
            const isDayColumn = C === 0;
            const isLastRow = R === excelData.length - 1;

            // Check if next row starts a new day
            const isNewDayBelow =
              R < excelData.length - 1 &&
              excelData[R + 1]?.[0] !== "" &&
              excelData[R + 1]?.[0] !== undefined;

            // Check if current row starts a day
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

            // Apply borders with thick borders for day/slot boundaries
            ws[cellAddress].s.border = {
              top: isHeaderRow || isStartOfDay ? thickBorder : thinBorder,
              bottom: isLastRow || isNewDayBelow ? thickBorder : thinBorder,
              left: isDayColumn || C > 0 ? thickBorder : thinBorder,
              right: thickBorder,
            };
          }
        }

        // Step 6: Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, "Timetable");

        // Step 7: Generate filename with timestamp
        const finalFilename =
          filename ||
          `timetable_${timetableId}_${new Date().toISOString()}`
            .replaceAll(":", "-")
            .split(".")[0] + ".xlsx";

        console.log(`Exporting timetable to Excel file: ${finalFilename}`);

        // Step 8: Write file to user's downloads
        XLSX.writeFile(wb, finalFilename);

        return { success: true };
      } catch (error) {
        console.error("Export failed:", error);
        return { success: false, error };
      }
    },
    [
      collections,
      timetableId,
      teacherIds,
      subjectIds,
      subdivisionIds,
      classroomIds,
    ],
  );

  return { exportToExcel };
}
