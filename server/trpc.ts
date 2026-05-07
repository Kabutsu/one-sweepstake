import { initTRPC, TRPCError } from "@trpc/server";
import type { CreateNextContextOptions } from "@trpc/server/adapters/next";
import superjson from "superjson";
import { db } from "@/db";
import { getAuthUser, type AuthUser } from "@/lib/auth";

export async function createContext(opts?: CreateNextContextOptions) {
  const token = opts?.req.cookies["auth-token"];
  const user = await getAuthUser(token);

  return {
    db,
    user,
    req: opts?.req,
    res: opts?.res,
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
