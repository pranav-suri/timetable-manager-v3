import React, { useCallback, useEffect, useRef, useState } from "react";
import { nanoid } from "nanoid";
import { HotTable } from "@handsontable/react-wrapper";
import { registerAllModules } from "handsontable/registry";
import "handsontable/styles/handsontable.min.css";
import "handsontable/styles/ht-theme-main.min.css";
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
import type { HotTableRef } from "@handsontable/react-wrapper";

// TODO: Critical bug when any columns of type "dropdown" have options with duplicate labels.

type DropdownOption = {
  label: string;
  value: string;
};

export interface ColumnConfig<T> {
  data: keyof T & string;
  type: "text" | "numeric" | "checkbox" | "dropdown";
  header: string;
  options?: DropdownOption[];
  required?: boolean;
  validate?: (value: unknown, row: Record<string, any>) => string | undefined;
}

export type CollectionEmulator<T> = {
  get: (id: string) => T | undefined;
  update: (id: string, updater: (draft: T) => void) => void;
  insert: (item: T) => void;
  delete: (id: string) => void;
};

export interface BatchEditGridProps<
  T extends Record<string, any> & { id: string },
> {
  entityName: string;
  data: T[];
  dataSchema: () => T;
  columns: Array<ColumnConfig<T>>;
  collection: CollectionEmulator<T>;
}

export function BatchEditGrid<T extends Record<string, any> & { id: string }>({
  entityName,
  columns,
  data,
  dataSchema,
  collection,
}: BatchEditGridProps<T>) {
  const modulesRegisteredRef = useRef(false);
  if (!modulesRegisteredRef.current) {
    registerAllModules();
    modulesRegisteredRef.current = true;
  }

  const theme = useTheme();

  const hotTableComponent = useRef<HotTableRef>(null);
  const [validationMessages, setValidationMessages] = useState<string[]>([]);

  const convertEntityToGridRow = useCallback(
    (row: T) => {
      const clone: Record<string, any> = structuredClone(row);
      columns.forEach((col) => {
        if (col.type === "dropdown") {
          const match = col.options?.find(
            (option) => option.value === clone[col.data],
          );
          clone[col.data] = match?.label ?? clone[col.data] ?? "";
        }
      });
      return clone;
    },
    [columns],
  );

  const convertGridRowToEntity = (row: Record<string, any>) => {
    const clone: Record<string, any> = structuredClone(row);
    columns.forEach((col) => {
      if (col.type === "dropdown") {
        const match = col.options?.find(
          (option) => option.label === clone[col.data],
        );
        clone[col.data] = match?.value ?? "";
      }
      if (col.type === "numeric") {
        const value = clone[col.data];
        if (value === "" || value === null || value === undefined) {
          clone[col.data] = undefined;
        } else if (typeof value === "string") {
          const parsed = Number(value);
          clone[col.data] = Number.isFinite(parsed) ? parsed : value;
        }
      }
      if (col.type === "checkbox") {
        clone[col.data] = Boolean(clone[col.data]);
      }
    });
    return clone as T;
  };

  const tableDataRef = useRef<Array<Record<string, any>>>([]);

  useEffect(() => {
    const formatted = data.map(convertEntityToGridRow);
    tableDataRef.current = formatted;
    const hotInstance = hotTableComponent.current?.hotInstance;
    if (hotInstance) {
      hotInstance.loadData(formatted);
    }
  }, [convertEntityToGridRow, data]);

  const tableDataSchema = useCallback(() => {
    const schema = dataSchema();
    return convertEntityToGridRow(schema);
  }, [convertEntityToGridRow, dataSchema]);

  const handleAddRow = () => {
    if (hotTableComponent.current?.hotInstance) {
      const hotInstance = hotTableComponent.current.hotInstance;
      // 'insert_row_below' inserts a row below the specified index.
      // The second argument (1) indicates the number of rows to insert.
      // The third argument (hotInstance.countRows()) specifies the index
      // after which to insert the new row (effectively at the bottom).
      hotInstance.alter("insert_row_below", hotInstance.countRows(), 1);
      hotInstance.scrollViewportTo(hotInstance.countRows() - 1);
    }
  };

  const handleSaveBatch = () => {
    const hotInstance = hotTableComponent.current?.hotInstance;
    if (!hotInstance) {
      return;
    }

    const currentRows = hotInstance.getSourceData() as Array<
      Record<string, any>
    >;
    const normalizedRows = currentRows.map((row) => {
      console.log("Raw Row: ", row);
      const normalized = convertGridRowToEntity(row);
      console.log("Normalized Row: ", normalized);
      return normalized;
    });

    const errors: string[] = [];

    normalizedRows.forEach((row, index) => {
      const entity = { ...row };
      if (!entity.id) {
        entity.id = nanoid(4);
      }

      const rowRecord: Record<string, any> = entity;

      const isEmptyRow = columns
        .filter((col) => col.data !== "id")
        .every((col) => {
          const value = rowRecord[col.data];
          return value === "" || value === null || value === undefined;
        });

      if (isEmptyRow && !collection.get(entity.id)) {
        return;
      }

      columns.forEach((col) => {
        const value = rowRecord[col.data];
        if (
          col.required &&
          (value === "" || value === null || value === undefined)
        ) {
          errors.push(`Row ${index + 1}: ${col.header} is required.`);
        }
        if (col.validate) {
          const message = col.validate(value, rowRecord);
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
      const entity = { ...row };
      if (!entity.id) {
        entity.id = nanoid(4);
      }

      const rowRecord = entity as Record<string, any>;

      const isEmptyRow = columns
        .filter((col) => col.data !== "id")
        .every((col) => {
          const value = rowRecord[col.data];
          return value === "" || value === null || value === undefined;
        });

      if (isEmptyRow && !collection.get(entity.id)) {
        return;
      }

      const original = collection.get(entity.id);
      if (!original) {
        collection.insert(entity);
        return;
      }

      const hasChanges = columns.some((col) => {
        return original[col.data] !== rowRecord[col.data];
      });

      if (hasChanges) {
        collection.update(entity.id, (draft) => {
          columns.forEach((col) => {
            draft[col.data] = rowRecord[col.data];
          });
        });
      }
    });
  };

  const handleCancelBatch = () => {
    if (hotTableComponent.current?.hotInstance) {
      const hotInstance = hotTableComponent.current.hotInstance;
      const formatted = data.map(convertEntityToGridRow);
      tableDataRef.current = formatted;
      hotInstance.loadData(formatted);
    }
    setValidationMessages([]);
  };

  const hotColumns = columns.map((col) => {
    if (col.type === "dropdown") {
      return {
        data: col.data,
        type: "dropdown" as const,
        source: col.options?.map((option) => option.label) ?? [],
        allowInvalid: false,
        strict: true,
        trimDropdown: false,
      };
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
          Batch Edit {entityName}
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
            // readOnly={true}
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
