import { useState } from "react";
import { Button, CircularProgress, Tooltip } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import { useExportTimetable } from "./-useExportTimetable";

/**
 * Button component for exporting timetable to Excel
 * Handles loading states and user feedback
 */
export function ExportButton() {
  const { exportToExcel } = useExportTimetable();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    try {
      const result = exportToExcel();

      if (result.success) {
        console.log("✅ Timetable exported successfully!");
        // TODO: Add snackbar notification when implemented
      } else {
        throw new Error("Export failed");
      }
    } catch (error) {
      console.error("❌ Export error:", error);
      // TODO: Add snackbar notification when implemented
    } finally {
      setIsExporting(false);
    }
  };

  const tooltipTitle = "Export timetable to Excel (.xlsx)";

  return (
    <Tooltip title={tooltipTitle}>
      <span>
        <Button
          onClick={handleExport}
          disabled={isExporting}
          startIcon={
            isExporting ? <CircularProgress size={20} /> : <DownloadIcon />
          }
          variant="outlined"
          size="medium"
        >
          {isExporting ? "Exporting..." : "Export to Excel"}
        </Button>
      </span>
    </Tooltip>
  );
}
