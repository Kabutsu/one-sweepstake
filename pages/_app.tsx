import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, getTRPCClient } from "@/lib/trpc";
import type { AppProps } from "next/app";
import { useState } from "react";
import { Analytics } from "@vercel/analytics/next";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() => getTRPCClient());

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Component {...pageProps} />
        <Analytics />
      </QueryClientProvider>
    </trpc.Provider>
  );
}
