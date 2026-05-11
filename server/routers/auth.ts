import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createToken, getAuthCookieOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { TRPCError } from "@trpc/server";

function getOriginFromRequest(req?: any): string {
  if (!req) {
    return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  }

  const protocol = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers.host;

  if (host) {
    return `${protocol}://${host}`;
  }

  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export const authRouter = router({
  sendMagicLink: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input, ctx }) => {
      const baseUrl = getOriginFromRequest(ctx.req);

      const { error } = await supabaseAdmin.auth.signInWithOtp({
        email: input.email.toLowerCase(),
        options: {
          emailRedirectTo: `${baseUrl}/auth/verify`,
        },
      });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to send magic link: ${error.message}`,
        });
      }

      return { success: true };
    }),

  verifyMagicLink: publicProcedure
    .input(z.object({ token: z.string(), email: z.string().email() }))
    .mutation(async ({ input, ctx }) => {
      // Verify the access token with Supabase
      const { data: userData, error: verifyError } = await supabaseAdmin.auth.getUser(input.token);

      if (verifyError || !userData.user) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired token",
        });
      }

      // Verify the email matches
      if (userData.user.email?.toLowerCase() !== input.email.toLowerCase()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Email mismatch",
        });
      }

      const email = input.email.toLowerCase();

      // Check if user exists in our database
      let [user] = await db.select().from(users).where(eq(users.email, email));

      const isNewUser = !user;

      if (!user) {
        // Create new user in our database
        const userId = crypto.randomUUID();
        [user] = await db
          .insert(users)
          .values({
            id: userId,
            email,
            displayName: null,
          })
          .returning();
      }

      // Create our own JWT token
      const authToken = await createToken(user.id);

      // Set cookie via Next.js res object
      ctx.res?.setHeader(
        "Set-Cookie",
        `auth-token=${authToken}; ${Object.entries(getAuthCookieOptions())
          .map(([key, value]) => {
            if (key === "maxAge") return `Max-Age=${value}`;
            if (key === "httpOnly") return value ? "HttpOnly" : "";
            if (key === "secure") return value ? "Secure" : "";
            if (key === "sameSite") return `SameSite=${value}`;
            if (key === "path") return `Path=${value}`;
            return "";
          })
          .filter(Boolean)
          .join("; ")}`
      );

      return {
        success: true,
        isNewUser,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
        },
      };
    }),

  setupProfile: protectedProcedure
    .input(z.object({ displayName: z.string().min(1).max(50).trim() }))
    .mutation(async ({ ctx, input }) => {
      // Check if display name is already taken
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.displayName, input.displayName))
        .then((rows) => rows[0]);

      if (existingUser && existingUser.id !== ctx.user.id) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This display name is already taken. Please choose another one.",
        });
      }

      const [updatedUser] = await db
        .update(users)
        .set({ displayName: input.displayName })
        .where(eq(users.id, ctx.user.id))
        .returning();

      return { success: true, user: updatedUser };
    }),

  me: publicProcedure.query(async ({ ctx }) => {
    return ctx.user;
  }),

  isDisplayNameAvailable: publicProcedure
    .input(z.object({ displayName: z.string().min(1).max(50) }))
    .query(async ({ input }) => {
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.displayName, input.displayName))
        .then((rows) => rows[0]);

      return { available: !existingUser };
    }),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    // Clear cookie via Next.js res object
    ctx.res?.setHeader("Set-Cookie", `auth-token=; Path=/; HttpOnly; SameSite=lax; Max-Age=0`);
    return { success: true };
  }),
});
