import { create } from "zustand";

interface LectureSlotFiltersState {
  // Filter arrays
  teacherIds: string[];
  subdivisionIds: string[];
  classroomIds: string[];
  subjectIds: string[];

  // Actions to set filters
  setTeacherIds: (teacherIds: string[]) => void;
  setSubdivisionIds: (subdivisionIds: string[]) => void;
  setClassroomIds: (classroomIds: string[]) => void;
  setSubjectIds: (subjectIds: string[]) => void;

  // Actions to add/remove individual items from filters
  addTeacherId: (teacherId: string) => void;
  removeTeacherId: (teacherId: string) => void;
  toggleTeacherId: (teacherId: string) => void;

  addSubdivisionId: (subdivisionId: string) => void;
  removeSubdivisionId: (subdivisionId: string) => void;
  toggleSubdivisionId: (subdivisionId: string) => void;

  addClassroomId: (classroomId: string) => void;
  removeClassroomId: (classroomId: string) => void;
  toggleClassroomId: (classroomId: string) => void;

  addSubjectId: (subjectId: string) => void;
  removeSubjectId: (subjectId: string) => void;
  toggleSubjectId: (subjectId: string) => void;

  // Action to clear all filters
  clearAllFilters: () => void;

  // Action to check if any filters are applied
  hasActiveFilters: () => boolean;
}
// TODO: Persist in URL for UX, Do not use localStorage as it may cause issues with multiple tabs
export const useLectureSlotFiltersStore = create<LectureSlotFiltersState>(
  (set, get) => ({
    // Initial state - all empty
    teacherIds: [],
    subdivisionIds: [],
    classroomIds: [],
    subjectIds: [],

    // Set filter arrays
    setTeacherIds: (teacherIds) => set({ teacherIds }),
    setSubdivisionIds: (subdivisionIds) => set({ subdivisionIds }),
    setClassroomIds: (classroomIds) => set({ classroomIds }),
    setSubjectIds: (subjectIds) => set({ subjectIds }),

    // Add/Remove Teacher Ids
    addTeacherId: (teacherId) =>
      set((state) => ({
        teacherIds: [...new Set([...state.teacherIds, teacherId])],
      })),
    removeTeacherId: (teacherId) =>
      set((state) => ({
        teacherIds: state.teacherIds.filter((id) => id !== teacherId),
      })),
    toggleTeacherId: (teacherId) =>
      set((state) => ({
        teacherIds: state.teacherIds.includes(teacherId)
          ? state.teacherIds.filter((id) => id !== teacherId)
          : [...state.teacherIds, teacherId],
      })),

    // Add/Remove Subdivision Ids
    addSubdivisionId: (subdivisionId) =>
      set((state) => ({
        subdivisionIds: [...new Set([...state.subdivisionIds, subdivisionId])],
      })),
    removeSubdivisionId: (subdivisionId) =>
      set((state) => ({
        subdivisionIds: state.subdivisionIds.filter(
          (id) => id !== subdivisionId,
        ),
      })),
    toggleSubdivisionId: (subdivisionId) =>
      set((state) => ({
        subdivisionIds: state.subdivisionIds.includes(subdivisionId)
          ? state.subdivisionIds.filter((id) => id !== subdivisionId)
          : [...state.subdivisionIds, subdivisionId],
      })),

    // Add/Remove Classroom Ids
    addClassroomId: (classroomId) =>
      set((state) => ({
        classroomIds: [...new Set([...state.classroomIds, classroomId])],
      })),
    removeClassroomId: (classroomId) =>
      set((state) => ({
        classroomIds: state.classroomIds.filter((id) => id !== classroomId),
      })),
    toggleClassroomId: (classroomId) =>
      set((state) => ({
        classroomIds: state.classroomIds.includes(classroomId)
          ? state.classroomIds.filter((id) => id !== classroomId)
          : [...state.classroomIds, classroomId],
      })),

    // Add/Remove Subject Ids
    addSubjectId: (subjectId) =>
      set((state) => ({
        subjectIds: [...new Set([...state.subjectIds, subjectId])],
      })),
    removeSubjectId: (subjectId) =>
      set((state) => ({
        subjectIds: state.subjectIds.filter((id) => id !== subjectId),
      })),
    toggleSubjectId: (subjectId) =>
      set((state) => ({
        subjectIds: state.subjectIds.includes(subjectId)
          ? state.subjectIds.filter((id) => id !== subjectId)
          : [...state.subjectIds, subjectId],
      })),

    // Clear all filters
    clearAllFilters: () =>
      set({
        teacherIds: [],
        subdivisionIds: [],
        classroomIds: [],
        subjectIds: [],
      }),

    // Check if any filters are active
    hasActiveFilters: () => {
      const state = get();
      return (
        state.teacherIds.length > 0 ||
        state.subdivisionIds.length > 0 ||
        state.classroomIds.length > 0 ||
        state.subjectIds.length > 0
      );
    },
  }),
);
