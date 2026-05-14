import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createToken, getAuthCookieOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { TRPCError } from "@trpc/server";

function getOriginFromRequest(req?: any): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;

  // In development, prioritize NEXT_PUBLIC_APP_URL to avoid wrong Vercel URLs
  if (envUrl && (envUrl.includes("localhost") || envUrl.includes("127.0.0.1"))) {
    return envUrl;
  }

  if (!req?.headers) {
    return envUrl || "http://localhost:3000";
  }

  const protocol = req.headers["x-forwarded-proto"] || "https";
  let host = req.headers.host;

  if (host) {
    // Remove port from host if present (only keep domain)
    // This handles cases like "one-sweepstake-2.vercel.app:443" -> "one-sweepstake-2.vercel.app"
    host = host.split(":")[0];
    return `${protocol}://${host}`;
  }

  return envUrl || "http://localhost:3000";
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

      // Set cache-busting headers to prevent stale auth state
      ctx.res?.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, private");
      ctx.res?.setHeader("Pragma", "no-cache");
      ctx.res?.setHeader("Expires", "0");

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

  getUploadUrl: protectedProcedure.mutation(async ({ ctx }) => {
    const fileName = `${ctx.user.id}-${Date.now()}`;
    const filePath = `avatars/${fileName}`;

    // Generate a signed upload URL (valid for 5 minutes)
    const { data, error } = await supabaseAdmin.storage
      .from("profile-images")
      .createSignedUploadUrl(filePath);

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to generate upload URL: ${error.message}`,
      });
    }

    // Return the signed URL and the path for later retrieval
    return {
      uploadUrl: data.signedUrl,
      filePath: data.path,
    };
  }),

  setupProfile: protectedProcedure
    .input(
      z.object({
        displayName: z.string().min(1).max(50).trim(),
        avatarUrl: z.string().url().optional(),
      })
    )
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
        .set({
          displayName: input.displayName,
          ...(input.avatarUrl && { avatarUrl: input.avatarUrl }),
        })
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
