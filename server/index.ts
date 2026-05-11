import { router } from "./trpc";
import { authRouter } from "./routers/auth";
import { sweepstakesRouter } from "./routers/sweepstakes";
import { chatRouter } from "./routers/chat";
import { matchesRouter } from "./routers/matches";

export const appRouter = router({
  auth: authRouter,
  sweepstakes: sweepstakesRouter,
  chat: chatRouter,
  matches: matchesRouter,
});

export type AppRouter = typeof appRouter;
