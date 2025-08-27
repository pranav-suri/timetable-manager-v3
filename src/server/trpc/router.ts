import { createTRPCRouter } from "./init";
import { tableRouter } from "./routers/tableRouter";

import { todosRouter } from "./routers/todosRouter";

export const trpcRouter = createTRPCRouter({
  todos: todosRouter,
  ...tableRouter,
});
export type TRPCRouter = typeof trpcRouter;
