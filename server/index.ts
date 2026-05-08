import { router } from "./trpc";
import { authRouter } from "./routers/auth";
import { sweepstakesRouter } from "./routers/sweepstakes";

export const appRouter = router({
  auth: authRouter,
  sweepstakes: sweepstakesRouter,
});

export type AppRouter = typeof appRouter;
