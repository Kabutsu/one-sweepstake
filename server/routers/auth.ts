import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createToken, getAuthCookieOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { TRPCError } from "@trpc/server";
import { generateDisplayNameFromEmail } from "@/utils/user-utils";

export const authRouter = router({
  sendOtpCode: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const { error } = await supabaseAdmin.auth.signInWithOtp({
        email: input.email.toLowerCase(),
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to send verification code: ${error.message}`,
        });
      }

      return { success: true };
    }),

  verifyOtpCode: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        code: z
          .string()
          .length(6)
          .regex(/^\d{6}$/, "Code must be 6 digits"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const email = input.email.toLowerCase();

      // Verify the OTP code with Supabase
      const { data, error: verifyError } = await supabaseAdmin.auth.verifyOtp({
        email,
        token: input.code,
        type: "email",
      });

      if (verifyError || !data.user) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired code",
        });
      }

      // Check if user exists in our database
      let [user] = await db.select().from(users).where(eq(users.email, email));

      const isNewUser = !user;

      if (!user) {
        // Create new user in our database with a generated display name
        const userId = crypto.randomUUID();
        const defaultDisplayName = generateDisplayNameFromEmail(email);
        [user] = await db
          .insert(users)
          .values({
            id: userId,
            email,
            displayName: defaultDisplayName,
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
          profileCustomized: user.profileCustomized,
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
      // Provide helpful error messages
      const errorMessage =
        error.message?.includes("does not exist") || error.message?.includes("not found")
          ? "Profile images bucket not configured. Please create a 'profile-images' bucket in Supabase Storage."
          : `Failed to generate upload URL: ${error.message}`;

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: errorMessage,
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
          profileCustomized: true,
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
