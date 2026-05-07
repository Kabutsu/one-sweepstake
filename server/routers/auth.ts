import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./trpc";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { createToken, setAuthCookie, clearAuthCookie } from "@/lib/auth";
import nodemailer from "nodemailer";

const magicLinkTokens = new Map<
  string,
  { email: string; createdAt: number }
>();

const TOKEN_EXPIRY = 30 * 60 * 1000; // 30 minutes

async function sendMagicLinkEmail(email: string, token: string) {
  const transporter = nodemailer.createTransport({
    host: "mail.smtp2go.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const magicLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/verify?token=${token}`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || "noreply@onesweepstake.com",
    to: email,
    subject: "Sign in to One Sweepstake",
    html: `
      <h1>Sign in to One Sweepstake</h1>
      <p>Click the link below to sign in:</p>
      <a href="${magicLink}">${magicLink}</a>
      <p>This link will expire in 30 minutes.</p>
    `,
  });
}

export const authRouter = router({
  sendMagicLink: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const token = randomBytes(32).toString("hex");

      magicLinkTokens.set(token, {
        email: input.email.toLowerCase(),
        createdAt: Date.now(),
      });

      // Clean up expired tokens
      for (const [key, value] of magicLinkTokens.entries()) {
        if (Date.now() - value.createdAt > TOKEN_EXPIRY) {
          magicLinkTokens.delete(key);
        }
      }

      await sendMagicLinkEmail(input.email, token);

      return { success: true };
    }),

  verifyMagicLink: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const tokenData = magicLinkTokens.get(input.token);

      if (!tokenData) {
        throw new Error("Invalid or expired token");
      }

      if (Date.now() - tokenData.createdAt > TOKEN_EXPIRY) {
        magicLinkTokens.delete(input.token);
        throw new Error("Token expired");
      }

      magicLinkTokens.delete(input.token);

      let [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, tokenData.email));

      const isNewUser = !user;

      if (!user) {
        const userId = crypto.randomUUID();
        [user] = await db
          .insert(users)
          .values({
            id: userId,
            email: tokenData.email,
            displayName: null,
          })
          .returning();
      }

      const authToken = await createToken(user.id);
      await setAuthCookie(authToken);

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
    .input(z.object({ displayName: z.string().min(1).max(50) }))
    .mutation(async ({ ctx, input }) => {
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

  logout: protectedProcedure.mutation(async () => {
    await clearAuthCookie();
    return { success: true };
  }),
});
