import { initTRPC, TRPCError } from "@trpc/server";
import { type FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import superjson from "superjson";
import { db } from "@/db";
import { getAuthUser, type AuthUser } from "@/lib/auth";

export async function createContext(opts?: FetchCreateContextFnOptions) {
  const user = await getAuthUser();

  return {
    db,
    user,
    req: opts?.req,
    resHeaders: opts?.resHeaders,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      user: ctx.user as AuthUser,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);
