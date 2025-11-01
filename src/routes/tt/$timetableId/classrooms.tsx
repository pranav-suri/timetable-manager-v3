import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { nanoid } from "nanoid";
import { useLiveQuery } from "@tanstack/react-db";
import { useForm } from "@tanstack/react-form";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import GridOnIcon from "@mui/icons-material/GridOn";
import ListIcon from "@mui/icons-material/List";
import type { Classroom } from "generated/prisma/client";
import type { ColumnConfig } from "./-BatchEditGrid";
import { BatchEditGrid } from "./-BatchEditGrid";
import { useCollections } from "@/db-collections/providers/useCollections";

export const Route = createFileRoute("/tt/$timetableId/classrooms")({
  component: RouteComponent,
});

function RouteComponent() {
  const { classroomCollection } = useCollections();
  const { timetableId } = Route.useParams();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [batchEditMode, setBatchEditMode] = useState(false);

  const { data: classrooms } = useLiveQuery(
    (q) => q.from({ classroomCollection }),
    [classroomCollection],
  );

  const form = useForm({
    defaultValues: { name: "" },
    onSubmit: ({ value }) => {
      const newClassroom = {
        id: nanoid(4),
        name: value.name,
        timetableId,
      };
      classroomCollection.insert(newClassroom);
      form.reset();
    },
  });

  const handleEdit = (classroom: Classroom) => {
    setEditingId(classroom.id);
    form.setFieldValue("name", classroom.name);
  };

  const handleUpdate = () => {
    if (editingId) {
      classroomCollection.update(editingId, (draft) => {
        draft.name = form.state.values.name;
      });
      setEditingId(null);
      form.reset();
    }
  };

  const handleDelete = (id: string) => {
    classroomCollection.delete(id);
  };

  const cancelEdit = () => {
    setEditingId(null);
    form.reset();
  };

  const classroomColumns = [
    { data: "name", type: "text", header: "Name" },
  ] satisfies ColumnConfig<Classroom>[];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h3" component="h1">
          Classrooms Management
        </Typography>
        <Button
          variant="outlined"
          startIcon={batchEditMode ? <ListIcon /> : <GridOnIcon />}
          onClick={() => setBatchEditMode(!batchEditMode)}
        >
          {batchEditMode ? "Individual Edit" : "Batch Edit"}
        </Button>
      </Box>

      {batchEditMode ? (
        <BatchEditGrid<Classroom>
          entityName="Classroom"
          columns={classroomColumns}
          data={classrooms}
          collection={classroomCollection}
          dataSchema={() => ({
            id: nanoid(4),
            name: "",
            timetableId,
          })}
        />
      ) : (
        <>
          {/* Classroom Form Start ----------- */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                {editingId ? "Edit Classroom" : "Add New Classroom"}
              </Typography>

              <Box
                component="form"
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (editingId) {
                    handleUpdate();
                  } else {
                    form.handleSubmit();
                  }
                }}
                sx={{ display: "flex", flexDirection: "column", gap: 2 }}
              >
                <form.Field
                  name="name"
                  validators={{
                    onChange: ({ value }) =>
                      !value ? "Name is required" : undefined,
                  }}
                  children={(field) => (
                    <TextField
                      fullWidth
                      label="Classroom Name"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      error={
                        field.state.meta.isTouched &&
                        field.state.meta.errors.length > 0
                      }
                      helperText={
                        field.state.meta.isTouched &&
                        field.state.meta.errors.length
                          ? field.state.meta.errors.join(", ")
                          : ""
                      }
                      placeholder="Enter classroom name"
                    />
                  )}
                />

                <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                  <form.Subscribe
                    selector={(state) => [state.canSubmit, state.isSubmitting]}
                    children={([canSubmit, isSubmitting]) => (
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={!canSubmit}
                        startIcon={editingId ? <EditIcon /> : <AddIcon />}
                      >
                        {isSubmitting
                          ? "Saving..."
                          : editingId
                            ? "Update"
                            : "Add Classroom"}
                      </Button>
                    )}
                  />

                  {editingId && (
                    <Button variant="outlined" onClick={cancelEdit}>
                      Cancel
                    </Button>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
          {/* ----------- Classroom Form End  */}
          <ClassroomList
            classrooms={classrooms}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
          />
        </>
      )}
    </Container>
  );
}

/* ---------------- Classroom List Component ---------------- */
function ClassroomList({
  classrooms,
  handleEdit,
  handleDelete,
}: {
  classrooms: Classroom[];
  handleEdit: (classroom: Classroom) => void;
  handleDelete: (id: string) => void;
}) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          Existing Classrooms
        </Typography>

        {classrooms.length > 0 ? (
          <List>
            {classrooms.map((classroom) => (
              <ListItem key={classroom.id} divider>
                <ListItemText
                  primary={classroom.name}
                  primaryTypographyProps={{ variant: "h6" }}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label="edit"
                    onClick={() => handleEdit(classroom)}
                    sx={{ mr: 1 }}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleDelete(classroom.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        ) : (
          <Alert severity="info" sx={{ mt: 2 }}>
            No classrooms found. Add your first classroom above.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
