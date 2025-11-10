import React, { useCallback, useEffect, useRef, useState } from "react";
import { nanoid } from "nanoid";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import { HotTable } from "@handsontable/react-wrapper";
import { registerAllModules } from "handsontable/registry";
import "handsontable/styles/handsontable.min.css";
import "handsontable/styles/ht-theme-main.min.css";
import type { HotTableRef } from "@handsontable/react-wrapper";
import type { Lecture } from "generated/prisma/client";
import Handsontable from "handsontable";

// ============================================================================
// Types
// ============================================================================

export type DropdownOption = {
  label: string;
  value: string;
};

export type LectureColumnConfig = {
  data: (keyof Lecture & string) | "classroomName" | "subdivisionName";
  type: "text" | "numeric" | "checkbox" | "dropdown" | "autocomplete";
  header: string;
  readOnly?: boolean;
  options?: DropdownOption[];
  required?: boolean;
  validate?: (value: unknown) => string | undefined;
};

// Grid row type - represents the transformed lecture for display
export type LectureGridRow = Lecture & {
  classroomName?: string;
  subdivisionName?: string;
  isReadonly?: boolean;
};

export type LectureCollectionEmulator = {
  get: (id: string) => Lecture | undefined;
  update: (id: string, updater: (draft: Lecture) => void) => void;
  insert: (item: Lecture) => void;
  delete: (id: string) => void;
};

export interface BatchEditGridProps {
  data: Lecture[];
  dataSchema: () => Lecture;
  columns: LectureColumnConfig[];
  collection: LectureCollectionEmulator;
  lectureClassrooms?: Array<{ lectureId: string; classroomId: string; classroomName: string }>;
  lectureSubdivisions?: Array<{ lectureId: string; subdivisionId: string; subdivisionName: string }>;
  onInsertLecture?: (params: {
    id: string;
    teacherId: string;
    subjectId: string;
    timetableId: string;
    count: number;
    duration: number;
    classroomIds: string[];
    subdivisionIds: string[];
  }) => void;
  onUpdateLecture?: (params: {
    id: string;
    teacherId: string;
    subjectId: string;
    count: number;
    duration: number;
    classroomIds: string[];
    subdivisionIds: string[];
  }) => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

export function convertEntityToGridRow(
  row: Lecture,
  columns: LectureColumnConfig[],
  lectureClassrooms?: Array<{ lectureId: string; classroomId: string; classroomName: string }>,
  lectureSubdivisions?: Array<{ lectureId: string; subdivisionId: string; subdivisionName: string }>,
): LectureGridRow {
  const clone = structuredClone(row) as LectureGridRow;

  // Transform subjectId: ID -> Label
  const subjectColumn = columns.find((col) => col.data === "subjectId");
  if (subjectColumn?.options) {
    const match = subjectColumn.options.find(
      (option) => option.value === clone.subjectId,
    );
    if (match) {
      clone.subjectId = match.label;
    }
  }

  // Transform teacherId: ID -> Label
  const teacherColumn = columns.find((col) => col.data === "teacherId");
  if (teacherColumn?.options) {
    const match = teacherColumn.options.find(
      (option) => option.value === clone.teacherId,
    );
    if (match) {
      clone.teacherId = match.label;
    }
  }

  // Handle classroom relationships
  const lectureClassroomsForRow = lectureClassrooms?.filter(lc => lc.lectureId === row.id) || [];
  if (lectureClassroomsForRow.length > 1) {
    clone.classroomName = lectureClassroomsForRow.map(lc => lc.classroomName).join(", ");
    clone.isReadonly = true;
  } else if (lectureClassroomsForRow.length === 1) {
    clone.classroomName = lectureClassroomsForRow[0]?.classroomName;
  }

  // Handle subdivision relationships
  const lectureSubdivisionsForRow = lectureSubdivisions?.filter(ls => ls.lectureId === row.id) || [];
  if (lectureSubdivisionsForRow.length > 1) {
    clone.subdivisionName = lectureSubdivisionsForRow.map(ls => ls.subdivisionName).join(", ");
    clone.isReadonly = true;
  } else if (lectureSubdivisionsForRow.length === 1) {
    clone.subdivisionName = lectureSubdivisionsForRow[0]?.subdivisionName;
  }

  return clone;
}

export const convertGridRowToEntity = (
  row: LectureGridRow,
  columns: LectureColumnConfig[],
): Lecture => {
  const clone = structuredClone(row);

  // Transform subjectId: Label -> ID
  const subjectColumn = columns.find((col) => col.data === "subjectId");
  if (subjectColumn?.options) {
    const match = subjectColumn.options.find(
      (option) => option.label === clone.subjectId,
    );
    clone.subjectId = match?.value ?? "";
  }

  // Transform teacherId: Label -> ID
  const teacherColumn = columns.find((col) => col.data === "teacherId");
  if (teacherColumn?.options) {
    const match = teacherColumn.options.find(
      (option) => option.label === clone.teacherId,
    );
    clone.teacherId = match?.value ?? "";
  }

  return clone;
};

function assignProperty<T extends keyof Lecture>(
  target: Lecture,
  source: Lecture,
  key: T,
): void {
  target[key] = source[key];
}

// ============================================================================
// Batch Edit Grid Component
// ============================================================================

export function BatchEditGrid({
  columns,
  data,
  dataSchema,
  collection,
  lectureClassrooms,
  lectureSubdivisions,
  onInsertLecture,
  onUpdateLecture,
}: BatchEditGridProps) {
  const modulesRegisteredRef = useRef(false);
  if (!modulesRegisteredRef.current) {
    registerAllModules();
    modulesRegisteredRef.current = true;
  }

  const theme = useTheme();

  const hotTableComponent = useRef<HotTableRef>(null);
  const [validationMessages, setValidationMessages] = useState<string[]>([]);

  const tableDataRef = useRef<LectureGridRow[]>([]);

  useEffect(() => {
    const formatted = data.map((d) => convertEntityToGridRow(d, columns, lectureClassrooms, lectureSubdivisions));
    tableDataRef.current = formatted;
    const hotInstance = hotTableComponent.current?.hotInstance;
    if (hotInstance) {
      hotInstance.loadData(formatted);
    }
  }, [data, columns, lectureClassrooms, lectureSubdivisions]);

  const tableDataSchema = useCallback((): LectureGridRow => {
    const schema = dataSchema();
    return convertEntityToGridRow(schema, columns, lectureClassrooms, lectureSubdivisions);
  }, [dataSchema, columns, lectureClassrooms, lectureSubdivisions]);

  const handleAddRow = () => {
    if (hotTableComponent.current?.hotInstance) {
      const hotInstance = hotTableComponent.current.hotInstance;
      hotInstance.alter("insert_row_below", hotInstance.countRows(), 1);
      hotInstance.scrollViewportTo(hotInstance.countRows() - 1);
    }
  };

  const handleSaveBatch = () => {
    const hotInstance = hotTableComponent.current?.hotInstance;
    if (!hotInstance) {
      return;
    }

    const currentRows = hotInstance.getSourceData() as LectureGridRow[];
    const normalizedRows = currentRows.map((row) => {
      console.log("Raw Row: ", row);
      const normalized = convertGridRowToEntity(row, columns);
      console.log("Normalized Row: ", normalized);
      return normalized;
    });

    const errors: string[] = [];

    normalizedRows.forEach((row, index) => {
      const entity = { ...row };
      if (!entity.id) {
        entity.id = nanoid(4);
      }

      const isEmptyRow = columns
        .filter((col) => col.data !== "id" && col.data !== "classroomName" && col.data !== "subdivisionName")
        .every((col) => !(entity as any)[col.data]);

      if (isEmptyRow && !collection.get(entity.id)) {
        return;
      }

      columns.forEach((col) => {
        // Skip validation for special relationship fields
        if (col.data === "classroomName" || col.data === "subdivisionName") {
          return;
        }
        const value = entity[col.data];
        if (col.required && !value) {
          errors.push(`Row ${index + 1}: ${col.header} is required.`);
        }
        if (col.validate) {
          const message = col.validate(value);
          if (message) {
            errors.push(`Row ${index + 1}: ${message}`);
          }
        }
      });
    });

    if (errors.length) {
      setValidationMessages(errors);
      return;
    }

    setValidationMessages([]);

    normalizedRows.forEach((row) => {
      const gridRow = currentRows.find(r => r.id === row.id);
      const entity = { ...row };
      if (!entity.id) {
        entity.id = nanoid(4);
      }

      const isEmptyRow = columns
        .filter((col) => col.data !== "id" && col.data !== "classroomName" && col.data !== "subdivisionName")
        .every((col) => !entity[col.data as keyof Lecture]);

      if (isEmptyRow && !collection.get(entity.id)) {
        return;
      }

      const original = collection.get(entity.id);
      if (!original) {
        // Handle new lecture insertion with relationships
        if (onInsertLecture && gridRow) {
          // Convert classroomName and subdivisionName to IDs
          const classroomIds: string[] = [];
          const subdivisionIds: string[] = [];

          if (gridRow.classroomName) {
            const classroomOption = columns.find(col => col.data === "classroomName")?.options?.find(opt => opt.label === gridRow.classroomName);
            if (classroomOption) {
              classroomIds.push(classroomOption.value);
            }
          }

          if (gridRow.subdivisionName) {
            const subdivisionOption = columns.find(col => col.data === "subdivisionName")?.options?.find(opt => opt.label === gridRow.subdivisionName);
            if (subdivisionOption) {
              subdivisionIds.push(subdivisionOption.value);
            }
          }

          onInsertLecture({
            id: entity.id,
            teacherId: entity.teacherId,
            subjectId: entity.subjectId,
            timetableId: entity.timetableId,
            count: entity.count,
            duration: entity.duration,
            classroomIds,
            subdivisionIds,
          });
        } else {
          collection.insert(entity);
        }
        return;
      }

      const hasChanges = columns.some((col) => {
        if (col.data === "classroomName" || col.data === "subdivisionName") {
          return false; // Skip relationship fields for change detection
        }
        return original[col.data] !== entity[col.data];
      });

      if (hasChanges) {
        // For updates, skip relationship handling for now (hacky solution)
        collection.update(entity.id, (draft) => {
          for (const col of columns) {
            if (col.data !== "classroomName" && col.data !== "subdivisionName") {
              assignProperty(draft, entity, col.data);
            }
          }
        });
      }
    });
  };

  const handleCancelBatch = () => {
    if (hotTableComponent.current?.hotInstance) {
      const hotInstance = hotTableComponent.current.hotInstance;
      const formatted = data.map((d) => convertEntityToGridRow(d, columns, lectureClassrooms, lectureSubdivisions));
      tableDataRef.current = formatted;
      hotInstance.loadData(formatted);
    }
    setValidationMessages([]);
  };

  const hotColumns = columns.map((col) => {
    if (col.type === "dropdown") {
      return {
        data: col.data,
        type: col.type,
        source: col.options?.map((option) => option.label) ?? [],
        readOnly: col.readOnly ?? false,
        allowInvalid: true,
        strict: true,
        trimDropdown: false,
      } satisfies Handsontable.ColumnSettings;
    }
    return {
      data: col.data,
      type: col.type,
    };
  });

  const hotColHeaders = columns.map((col) => col.header);

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          Batch Edit Lectures
        </Typography>
        {validationMessages.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {validationMessages.map((message, index) => (
              <Box key={`${message}-${index}`}>{message}</Box>
            ))}
          </Alert>
        )}
        <Box sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddRow}
            sx={{ mr: 2 }}
          >
            Add Row
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveBatch}
            sx={{ mr: 2 }}
          >
            Save All Changes
          </Button>
          <Button
            variant="outlined"
            startIcon={<CancelIcon />}
            onClick={handleCancelBatch}
          >
            Cancel
          </Button>
        </Box>
        <Box>
          <HotTable
            ref={hotTableComponent}
            filters={true}
            dropdownMenu={true}
            themeName={
              theme.palette.mode === "light"
                ? "ht-theme-main"
                : "ht-theme-main-dark"
            }
            data={tableDataRef.current}
            dataSchema={tableDataSchema}
            colHeaders={hotColHeaders}
            columns={hotColumns}
            manualColumnResize={true}
            rowHeaders={true}
            contextMenu={true}
            multiColumnSorting={true}
            sortByRelevance={true}
            allowInsertRow={true}
            height={500}
            licenseKey="non-commercial-and-evaluation"
            renderAllRows={true}
            renderAllColumns={true}
          />
        </Box>
      </CardContent>
    </Card>
  );
}
