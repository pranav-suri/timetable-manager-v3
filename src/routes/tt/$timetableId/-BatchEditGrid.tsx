import React, { useState, useEffect, useRef } from "react";
import { nanoid } from "nanoid";
import type { HotTableProps, HotTableRef } from "@handsontable/react-wrapper";
import { HotTable } from "@handsontable/react-wrapper";
import { registerAllModules } from "handsontable/registry";
import "handsontable/styles/handsontable.min.css";
import "handsontable/styles/ht-theme-main.min.css";
import {
  useTheme,
  Box,
  Button,
  Card,
  CardContent,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";

export interface ColumnConfig<T> {
  data: keyof T & string;
  type: "text" | "numeric" | "checkbox";
  header: string;
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
  columns: ColumnConfig<T>[];
  collection: CollectionEmulator<T>;
}

export function BatchEditGrid<T extends Record<string, any> & { id: string }>({
  entityName,
  columns,
  data,
  dataSchema,
  collection,
}: BatchEditGridProps<T>) {
  // Register Handsontable modules
  registerAllModules();
  const theme = useTheme();

  const hotTableComponent = useRef<HotTableRef>(null);
  const gridRows = structuredClone(data);

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
    // Process updates and inserts
    gridRows.forEach((row) => {
      const original = collection.get(row.id);
      if (!original) {
        collection.insert(row);
        return;
      }
      // Check if any field changed
      const hasChanges = columns.some((col) => {
        return original[col.data] !== row[col.data];
      });

      if (hasChanges) {
        collection.update(row.id, (draft) => {
          columns.forEach((col) => {
            draft[col.data] = row[col.data];
          });
        });
      }
    });
  };

  const handleCancelBatch = () => {
    // Reset to original data
    if (hotTableComponent.current?.hotInstance) {
      const hotInstance = hotTableComponent.current.hotInstance;
      hotInstance.updateData(structuredClone(data));
    }
  };

  const hotColumns = columns.map((col) => ({
    data: col.data,
    type: col.type,
  }));

  const hotColHeaders = columns.map((col) => col.header);

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          Batch Edit {entityName}
        </Typography>
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
            data={gridRows}
            dataSchema={dataSchema}
            colHeaders={hotColHeaders}
            columns={hotColumns}
            manualColumnResize={true}
            rowHeaders={true}
            contextMenu={true}
            multiColumnSorting={true}
            sortByRelevance={true}
            allowInsertRow={true}
            nestedRows={true}
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
