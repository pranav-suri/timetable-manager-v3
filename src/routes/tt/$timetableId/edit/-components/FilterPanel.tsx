import { useLiveQuery } from "@tanstack/react-db";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import { useCollections } from "@/db-collections/providers/useCollections";
import { useLectureSlotFiltersStore } from "@/zustand/lectureSlotFiltersStore";

interface FilterPanelProps {
  /** Optional: CSS class for styling */
  className?: string;
}

export function FilterPanel({ className }: FilterPanelProps) {
  // Get collections for rendering options
  const {
    teacherCollection,
    subjectCollection,
    subdivisionCollection,
    classroomCollection,
  } = useCollections();

  // Get current filter values and actions from store
  const {
    teacherIds,
    subjectIds,
    subdivisionIds,
    classroomIds,
    clearAllFilters,
    hasActiveFilters,
  } = useLectureSlotFiltersStore();

  // Fetch all teachers
  const { data: allTeachers } = useLiveQuery(
    (q) => q.from({ teacher: teacherCollection }),
    [teacherCollection],
  );

  // Fetch all subjects
  const { data: allSubjects } = useLiveQuery(
    (q) =>
      q.from({ subject: subjectCollection }).select(({ subject }) => ({
        id: subject.id,
        name: subject.name,
      })),
    [subjectCollection],
  );

  // Fetch all subdivisions
  const { data: allSubdivisions } = useLiveQuery(
    (q) =>
      q
        .from({ subdivision: subdivisionCollection })
        .select(({ subdivision }) => ({
          id: subdivision.id,
          name: subdivision.name,
        })),
    [subdivisionCollection],
  );

  // Fetch all classrooms
  const { data: allClassrooms } = useLiveQuery(
    (q) =>
      q.from({ classroom: classroomCollection }).select(({ classroom }) => ({
        id: classroom.id,
        name: classroom.name,
      })),
    [classroomCollection],
  );

  return (
    <Paper
      className={className}
      sx={{
        p: 2,
        height: "100%",
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Filters
        </Typography>
        {hasActiveFilters() && (
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<ClearIcon />}
            onClick={() => clearAllFilters()}
          >
            Clear
          </Button>
        )}
      </Box>

      <Stack spacing={2} sx={{ flex: 1 }}>
        {/* Teacher Filter */}
        {allTeachers.length > 0 && (
          <>
            <Autocomplete
              multiple
              options={allTeachers}
              getOptionLabel={(option) => option.name}
              value={allTeachers.filter((t) => teacherIds.includes(t.id))}
              onChange={(_, newValue) => {
                const newIds = newValue.map((item) => item.id);
                useLectureSlotFiltersStore.setState({ teacherIds: newIds });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Teachers"
                  size="small"
                  placeholder="Search teachers..."
                />
              )}
              sx={{ width: "100%" }}
            />
            <Divider />
          </>
        )}

        {/* Subject Filter */}
        {allSubjects.length > 0 && (
          <>
            <Autocomplete
              multiple
              options={allSubjects}
              getOptionLabel={(option) => option.name}
              value={allSubjects.filter((s) => subjectIds.includes(s.id))}
              onChange={(_, newValue) => {
                const newIds = newValue.map((item) => item.id);
                useLectureSlotFiltersStore.setState({ subjectIds: newIds });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Subjects"
                  size="small"
                  placeholder="Search subjects..."
                />
              )}
              sx={{ width: "100%" }}
            />
            <Divider />
          </>
        )}

        {/* Subdivision Filter */}
        {allSubdivisions.length > 0 && (
          <>
            <Autocomplete
              multiple
              options={allSubdivisions}
              getOptionLabel={(option) => option.name}
              value={allSubdivisions.filter((s) =>
                subdivisionIds.includes(s.id),
              )}
              onChange={(_, newValue) => {
                const newIds = newValue.map((item) => item.id);
                useLectureSlotFiltersStore.setState({ subdivisionIds: newIds });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Subdivisions"
                  size="small"
                  placeholder="Search subdivisions..."
                />
              )}
              sx={{ width: "100%" }}
            />
            <Divider />
          </>
        )}

        {/* Classroom Filter */}
        {allClassrooms.length > 0 && (
          <Autocomplete
            multiple
            options={allClassrooms}
            getOptionLabel={(option) => option.name}
            value={allClassrooms.filter((c) => classroomIds.includes(c.id))}
            onChange={(_, newValue) => {
              const newIds = newValue.map((item) => item.id);
              useLectureSlotFiltersStore.setState({ classroomIds: newIds });
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Classrooms"
                size="small"
                placeholder="Search classrooms..."
              />
            )}
            sx={{ width: "100%" }}
          />
        )}
      </Stack>

      {/* Filter Summary */}
      {hasActiveFilters() && (
        <Box
          sx={{ mt: 2, pt: 2, borderTop: "1px solid", borderColor: "divider" }}
        >
          <Alert severity="info" sx={{ py: 1 }}>
            <Typography variant="caption">
              <strong>Filters Active:</strong>
              {teacherIds.length > 0 && ` Teachers (${teacherIds.length})`}
              {teacherIds.length > 0 &&
                (subjectIds.length > 0 ||
                  subdivisionIds.length > 0 ||
                  classroomIds.length > 0) &&
                " •"}
              {subjectIds.length > 0 && ` Subjects (${subjectIds.length})`}
              {subjectIds.length > 0 &&
                (subdivisionIds.length > 0 || classroomIds.length > 0) &&
                " •"}
              {subdivisionIds.length > 0 &&
                ` Subdivisions (${subdivisionIds.length})`}
              {subdivisionIds.length > 0 && classroomIds.length > 0 && " •"}
              {classroomIds.length > 0 &&
                ` Classrooms (${classroomIds.length})`}
            </Typography>
          </Alert>
        </Box>
      )}
    </Paper>
  );
}
