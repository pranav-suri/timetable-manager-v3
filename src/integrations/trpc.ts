import { createTRPCContext } from "@trpc/tanstack-react-query";
import type { TRPCRouter } from "@/server/trpc/router";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

export const { TRPCProvider, useTRPC } = createTRPCContext<TRPCRouter>();
export const TIMETABLE_ID = 2;
export type RouterInput = inferRouterInputs<TRPCRouter>;
export type RouterOutput = inferRouterOutputs<TRPCRouter>;
