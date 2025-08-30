import { createTRPCRouter } from "../init";
import { todosRouter } from "./demo/todosRouter";
import { teachersRouter } from "./teachersRouter";
import { subjectsRouter } from "./subjectsRouter";
import { groupsRouter } from "./groupsRouter";
import { subdivisionsRouter } from "./subdivisionsRouter";
import { timetableRouter } from "./timetableRouter";

export const trpcRouter = createTRPCRouter({
  todos: todosRouter,
  teachers: teachersRouter,
  subjects: subjectsRouter,
  groups: groupsRouter,
  subdivisions: subdivisionsRouter,
  timetable: timetableRouter,
});
export type TRPCRouter = typeof trpcRouter;
