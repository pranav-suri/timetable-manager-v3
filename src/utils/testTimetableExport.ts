import {
  exportTimetableToExcel,
  getTimetableExcelData,
} from "./timetableExport";

/**
 * Test function to verify timetable export logic
 * Run this to see the Excel data structure without creating a file
 */
export async function testTimetableExport(timetableId: string) {
  try {
    console.log(`Testing timetable export for timetable: ${timetableId}`);
    const excelData = await getTimetableExcelData(timetableId);

    console.log("Excel Data Structure:");
    console.log("===================");

    // Print header
    console.log(excelData[0]?.join("\t"));

    // Print first few data rows
    for (let i = 1; i < Math.min(10, excelData.length); i++) {
      console.log(excelData[i]?.join("\t"));
    }

    if (excelData.length > 10) {
      console.log(`... and ${excelData.length - 10} more rows`);
    }

    console.log("\nTest completed successfully!");
    await exportTimetableToExcel(timetableId);
    return excelData;
  } catch (error) {
    console.error("Test failed:", error);
    throw error;
  }
}

// For running directly with bun
if (typeof process !== "undefined" && process.argv.length > 2) {
  const timetableId = process.argv[2];
  if (timetableId) {
    testTimetableExport(timetableId).catch(console.error);
  } else {
    console.error("Please provide a timetable ID as an argument");
    console.log(
      "Usage: bun run src/utils/testTimetableExport.ts <timetableId>",
    );
  }
}
