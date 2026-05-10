import { router } from "./trpc";
import { authRouter } from "./routers/auth";
import { sweepstakesRouter } from "./routers/sweepstakes";
import { chatRouter } from "./routers/chat";

export const appRouter = router({
  auth: authRouter,
  sweepstakes: sweepstakesRouter,
  chat: chatRouter,
});

export type AppRouter = typeof appRouter;
