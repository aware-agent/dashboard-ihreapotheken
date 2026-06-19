/// <reference types="vite/client" />

import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { PageTracker } from "react-page-tracker";
import type { AppCookieManager } from "@/lib/cookies";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { AppLayout } from "@/components/AppLayout";
import {
  queryClient,
  persister,
  PersistQueryClientProvider,
} from "@/lib/queryClient";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { QueryClient } from "@tanstack/react-query";
import { env } from "@/config/urls";
import { ReactNode } from "react";
import appCss from "@/index.css?url";

export type RouterContext = {
  cookies: AppCookieManager;
  queryClient: QueryClient;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Aware - Health & Lab Results Tracker",
        description:
          "Track and visualize your health markers and lab results with Aware",
        author: "Aware",
        keywords: "Aware, Health, Lab Results, Tracker",
        robots: "index, follow",
        "og:title": "Aware - Health & Lab Results Tracker",
        "og:description":
          "Track and visualize your health markers and lab results with Aware",
        "og:type": "website",
        "og:url": "https://aware.app",
      },
      {
        links: [{ rel: "stylesheet", href: appCss }],
      },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      <PageTracker />
      <LocaleProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppLayout>
            <Outlet />
          </AppLayout>
          {env.VITE_NODE_ENV === "dev" && (
            // <TanStackRouterDevtools position="bottom-right" />
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </TooltipProvider>
      </LocaleProvider>
    </PersistQueryClientProvider>
  );
}
