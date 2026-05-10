import { router, protectedProcedure } from "../trpc";
import { db } from "@/db";
import { chatMessages, participants, users } from "@/db/schema";
import { eq, and, desc, lt } from "drizzle-orm";
import { z } from "zod";

export const chatRouter = router({
  getMessages: protectedProcedure
    .input(
      z.object({
        sweepstakeId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { sweepstakeId, limit, cursor } = input;

      // Verify user is a participant
      const [participant] = await db
        .select()
        .from(participants)
        .where(
          and(eq(participants.sweepstakeId, sweepstakeId), eq(participants.userId, ctx.user.id))
        );

      if (!participant) {
        throw new Error("You are not a participant in this sweepstake");
      }

      // Fetch messages with pagination
      const messages = await db
        .select({
          id: chatMessages.id,
          message: chatMessages.message,
          createdAt: chatMessages.createdAt,
          userId: chatMessages.userId,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
        })
        .from(chatMessages)
        .innerJoin(users, eq(chatMessages.userId, users.id))
        .where(
          cursor
            ? and(eq(chatMessages.sweepstakeId, sweepstakeId), lt(chatMessages.id, cursor))
            : eq(chatMessages.sweepstakeId, sweepstakeId)
        )
        .orderBy(desc(chatMessages.createdAt))
        .limit(limit + 1);

      let nextCursor: string | undefined = undefined;
      if (messages.length > limit) {
        const nextItem = messages.pop();
        nextCursor = nextItem!.id;
      }

      return {
        messages: messages.reverse(),
        nextCursor,
      };
    }),

  sendMessage: protectedProcedure
    .input(
      z.object({
        sweepstakeId: z.string().uuid(),
        message: z.string().min(1).max(1000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { sweepstakeId, message } = input;

      // Verify user is a participant
      const [participant] = await db
        .select()
        .from(participants)
        .where(
          and(eq(participants.sweepstakeId, sweepstakeId), eq(participants.userId, ctx.user.id))
        );

      if (!participant) {
        throw new Error("You are not a participant in this sweepstake");
      }

      // Insert message
      const [newMessage] = await db
        .insert(chatMessages)
        .values({
          sweepstakeId,
          userId: ctx.user.id,
          message,
        })
        .returning();

      // Fetch user details for response
      const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id));

      return {
        id: newMessage.id,
        message: newMessage.message,
        createdAt: newMessage.createdAt,
        userId: newMessage.userId,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      };
    }),
});
