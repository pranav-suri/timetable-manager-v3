import { createTRPCRouter } from "../init";
import { classroomsRouter } from "./classroomsRouter";
import { todosRouter } from "./demo/todosRouter";
import { groupsRouter } from "./groupsRouter";
import { lectureSlotsRouter } from "./lectureSlotsRouter";
import { lecturesRouter } from "./lecturesRouter";
import { slotsRouter } from "./slotsRouter";
import { subjectsRouter } from "./subjectsRouter";
import { subdivisionsRouter } from "./subdivisionsRouter";
import { teachersRouter } from "./teachersRouter";
import { timetableRouter } from "./timetableRouter";

export const trpcRouter = createTRPCRouter({
  classrooms: classroomsRouter,
  groups: groupsRouter,
  lectureSlots: lectureSlotsRouter,
  lectures: lecturesRouter,
  slots: slotsRouter,
  subjects: subjectsRouter,
  subdivisions: subdivisionsRouter,
  teachers: teachersRouter,
  timetable: timetableRouter,
  todos: todosRouter,
});
export type TRPCRouter = typeof trpcRouter;
