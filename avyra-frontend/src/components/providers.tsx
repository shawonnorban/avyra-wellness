"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { LanguageProvider } from "@/components/language-provider";
import { VisitTracker } from "@/components/visit-tracker";
import { captureAttribution } from "@/lib/attribution";

export function Providers({ children }: { children: React.ReactNode }) {
  // Created in state so each browser session gets exactly one client, and it is
  // never shared across requests during SSR.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  // First touch wins, so this has to run before any navigation happens.
  useEffect(() => {
    captureAttribution();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Inside the provider because it posts through the shared api client, and
          after captureAttribution above so the first view already carries UTMs. */}
      <VisitTracker />
      <LanguageProvider>{children}</LanguageProvider>
      <Toaster position="top-center" richColors closeButton />
    </QueryClientProvider>
  );
}
