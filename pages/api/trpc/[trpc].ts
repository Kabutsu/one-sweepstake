import { createNextApiHandler } from "@trpc/server/adapters/next";
import { appRouter } from "@/server";
import { createContext } from "@/server/trpc";

export default createNextApiHandler({
  router: appRouter,
  createContext,
  onError({ error, path }) {
    console.error(`tRPC Error on '${path}':`, error);
  },
});
