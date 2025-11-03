import { createFileRoute, useParams } from "@tanstack/react-router";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import { useCollections } from "@/db-collections/providers/useCollections";
import {
  aggregateTimetableData,
  createExcelData,
  TimetableExportFilters,
} from "./-utils/aggregateData";
import * as XLSX from "xlsx-js-style";
import JSZip from "jszip";
import getColor from "@/utils/getColor";

export const Route = createFileRoute("/tt/$timetableId/export/")({
  component: ExportPage,
});

function ExportPage() {
  const { timetableId } = useParams({ from: "/tt/$timetableId/export/" });
  const collections = useCollections();

  const handleExportFull = () => {
    exportTimetable("Full Timetable", {});
  };

  const handleExportTeachers = async () => {
    // Get all unique teachers
    const teachers = collections.teacherCollection.toArray;
    const exportItems = teachers.map((teacher) => ({
      fileName: `Teacher - ${teacher.name}`,
      filters: { teacherIds: [teacher.id] } satisfies TimetableExportFilters,
    }));
    await exportBulkAsZip(exportItems, "teacher_timetables");
  };

  const handleExportClassrooms = async () => {
    // Get all unique classrooms
    const classrooms = collections.classroomCollection.toArray;
    const exportItems = classrooms.map((classroom) => ({
      fileName: `Classroom - ${classroom.name}`,
      filters: {
        classroomIds: [classroom.id],
      } satisfies TimetableExportFilters,
    }));
    await exportBulkAsZip(exportItems, "classroom_timetables");
  };

  const handleExportSubdivisions = async () => {
    // Get all unique subdivisions
    const subdivisions = collections.subdivisionCollection.toArray;
    const exportItems = subdivisions.map((subdivision) => ({
      fileName: `Subdivision - ${subdivision.name}`,
      filters: {
        subdivisionIds: [subdivision.id],
      } satisfies TimetableExportFilters,
    }));
    await exportBulkAsZip(exportItems, "subdivision_timetables");
  };

  const downloadBlobAsFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const createExcelBuffer = (
    title: string,
    filters: TimetableExportFilters,
  ): Uint8Array | null => {
    try {
      const aggregatedData = aggregateTimetableData(collections, filters);

      if (aggregatedData.length === 0) {
        // NOTE: Length is never zero, aggregatedData always has all slots even if no lectures
        console.warn(`No data found for ${title}`);
        return null;
      }

      const { data: excelData, subjectNames } = createExcelData(aggregatedData);

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(excelData);

      // Set column widths
      const colWidths: XLSX.ColInfo[] = [{ wch: 12 }];
      const maxSlots = Math.max(
        ...aggregatedData.map((d: { slotNumber: number }) => d.slotNumber),
      );
      for (let i = 0; i < maxSlots; i++) {
        colWidths.push({ wch: 40 });
      }
      ws["!cols"] = colWidths;

      // Apply styling
      for (let R = 0; R < excelData.length; R++) {
        for (let C = 0; C < excelData[R]!.length; C++) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[cellAddress]) continue;

          if (!ws[cellAddress].s) {
            ws[cellAddress].s = {};
          }

          ws[cellAddress].s.alignment = {
            wrapText: true,
            vertical: "center",
            horizontal: "center",
          };

          const subjectName = subjectNames[R]?.[C];
          if (subjectName) {
            const bgColor = getColor(subjectName, "light");
            const hexColor = bgColor.replace("#", "");
            ws[cellAddress].s.fill = {
              fgColor: { rgb: hexColor },
            };
          }

          // Border logic (simplified)
          ws[cellAddress].s.border = {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          };
        }
      }

      XLSX.utils.book_append_sheet(wb, ws, "Timetable");

      // Return buffer instead of writing file
      return XLSX.write(wb, { type: "array", bookType: "xlsx" });
    } catch (error) {
      console.error(`❌ Failed to create Excel for ${title}:`, error);
      return null;
    }
  };

  const exportTimetable = (title: string, filters: any) => {
    const buffer = createExcelBuffer(title, filters);
    if (!buffer) return;

    const filename = `${title.replace(/[^a-zA-Z0-9]/g, `_`)}_${timetableId}.xlsx`;
    const blob = new Blob([buffer as BlobPart], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    downloadBlobAsFile(blob, filename);

    console.log(`✅ Exported: ${filename}`);
  };

  const exportBulkAsZip = async (
    items: Array<{ fileName: string; filters: TimetableExportFilters }>,
    zipFileName: string,
  ) => {
    const zip = new JSZip();
    let hasFiles = false;

    for (const item of items) {
      const buffer = createExcelBuffer(item.fileName, item.filters);

      if (buffer) {
        const filename = `${item.fileName.replace(/[^a-zA-Z0-9]/g, `_`)}.xlsx`;
        zip.file(filename, buffer);
        hasFiles = true;
      }
    }

    if (!hasFiles) {
      console.warn(`No data found to export`);
      return;
    }

    try {
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const filename = `${zipFileName}_${timetableId}.zip`;

      downloadBlobAsFile(zipBlob, filename);
      console.log(`✅ Exported ZIP: ${filename}`);
    } catch (error) {
      console.error(`❌ Failed to create ZIP file:`, error);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      <Typography variant="h4" gutterBottom>
        Export Options
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Choose from the following export options for timetable {timetableId}
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 3,
        }}
      >
        <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <CardContent sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              Full Timetable
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Export the complete timetable with all lectures, teachers, and
              classrooms.
            </Typography>
          </CardContent>
          <CardActions>
            <Button
              startIcon={<DownloadIcon />}
              variant="contained"
              onClick={handleExportFull}
              fullWidth
            >
              Export Full Timetable
            </Button>
          </CardActions>
        </Card>

        <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <CardContent sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              Teacher Timetables
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Download a ZIP file containing individual timetable files for each
              teacher showing only their lectures.
            </Typography>
          </CardContent>
          <CardActions>
            <Button
              startIcon={<DownloadIcon />}
              variant="contained"
              onClick={handleExportTeachers}
              fullWidth
            >
              Download Teacher Timetables (ZIP)
            </Button>
          </CardActions>
        </Card>

        <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <CardContent sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              Classroom Timetables
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Download a ZIP file containing individual timetable files for each
              classroom showing scheduled lectures.
            </Typography>
          </CardContent>
          <CardActions>
            <Button
              startIcon={<DownloadIcon />}
              variant="contained"
              onClick={handleExportClassrooms}
              fullWidth
            >
              Download Classroom Timetables (ZIP)
            </Button>
          </CardActions>
        </Card>

        <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <CardContent sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              Subdivision Timetables
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Download a ZIP file containing individual timetable files for each
              subdivision showing their lectures.
            </Typography>
          </CardContent>
          <CardActions>
            <Button
              startIcon={<DownloadIcon />}
              variant="contained"
              onClick={handleExportSubdivisions}
              fullWidth
            >
              Download Subdivision Timetables (ZIP)
            </Button>
          </CardActions>
        </Card>
      </Box>
    </Box>
  );
}
