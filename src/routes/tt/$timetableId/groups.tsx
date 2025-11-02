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
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import GridOnIcon from "@mui/icons-material/GridOn";
import ListIcon from "@mui/icons-material/List";
import { BatchEditGridBasic } from "./-BatchEditGridBasic";
import type { ColumnConfig } from "./-BatchEditGridBasic";
import type { Group } from "generated/prisma/client";
import { useCollections } from "@/db-collections/providers/useCollections";

export const Route = createFileRoute("/tt/$timetableId/groups")({
  component: RouteComponent,
});

function RouteComponent() {
  const { groupCollection } = useCollections();
  const { timetableId } = Route.useParams();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [batchEditMode, setBatchEditMode] = useState(false);

  const { data: groups } = useLiveQuery(
    (q) => q.from({ groupCollection }),
    [groupCollection],
  );

  const form = useForm({
    defaultValues: {
      name: "",
      allowSimultaneous: false,
    },
    onSubmit: ({ value }) => {
      const newGroup = {
        id: nanoid(4),
        name: value.name,
        allowSimultaneous: value.allowSimultaneous,
        timetableId,
      };
      groupCollection.insert(newGroup);
      form.reset();
    },
  });

  const handleEdit = (group: any) => {
    setEditingId(group.id);
    form.setFieldValue("name", group.name);
    form.setFieldValue("allowSimultaneous", group.allowSimultaneous);
  };

  const handleUpdate = () => {
    if (editingId) {
      groupCollection.update(editingId, (draft) => {
        draft.name = form.state.values.name;
        draft.allowSimultaneous = form.state.values.allowSimultaneous;
      });
      setEditingId(null);
      form.reset();
    }
  };

  const handleDelete = (id: string) => {
    groupCollection.delete(id);
  };

  const cancelEdit = () => {
    setEditingId(null);
    form.reset();
  };

  const groupColumns = [
    { data: "name", type: "text", header: "Name" },
    {
      data: "allowSimultaneous",
      type: "checkbox",
      header: "Allow Simultaneous",
    },
  ] satisfies Array<ColumnConfig<Group>>;

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
          Subject Type Management
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
        <BatchEditGridBasic<Group>
          entityName="Subject Type"
          data={groups}
          columns={groupColumns}
          collection={groupCollection}
          dataSchema={() => ({
            id: nanoid(4),
            name: "",
            allowSimultaneous: false,
            timetableId,
          })}
        />
      ) : (
        <>
          {/* Group Form */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                {editingId ? "Edit Subject Type" : "Add New Subject Type"}
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
                      label="Subject Type"
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
                      placeholder="Enter Subject Type"
                    />
                  )}
                />

                <form.Field
                  name="allowSimultaneous"
                  children={(field) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.state.value}
                          onChange={(e) => field.handleChange(e.target.checked)}
                        />
                      }
                      label="Allow Simultaneous Lectures"
                      sx={{ mt: 1 }}
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
                            : "Add Subject Type"}
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

          {/* Groups List */}
          <SubjectTypeList
            groups={groups}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
          />
        </>
      )}
    </Container>
  );
}

/* ---------------- Group List Component ---------------- */
function SubjectTypeList({
  groups,
  handleEdit,
  handleDelete,
}: {
  groups: Group[];
  handleEdit: (group: Group) => void;
  handleDelete: (id: string) => void;
}) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          Existing Subject Types
        </Typography>

        {groups.length > 0 ? (
          <List>
            {groups.map((group) => (
              <ListItem key={group.id} divider>
                <ListItemText
                  primary={group.name}
                  secondary={`Allow Simultaneous: ${group.allowSimultaneous ? `Yes` : `No`}`}
                  primaryTypographyProps={{ variant: "h6" }}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label="edit"
                    onClick={() => handleEdit(group)}
                    sx={{ mr: 1 }}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleDelete(group.id)}
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
            No groups found. Add your first group above.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
