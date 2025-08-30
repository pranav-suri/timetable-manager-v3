import { createTRPCRouter } from "../init";
import { tableRouter } from "./tableRouter";

import { todosRouter } from "./todosRouter";

export const trpcRouter = createTRPCRouter({
  todos: todosRouter,
  ...tableRouter,
});
export type TRPCRouter = typeof trpcRouter;
