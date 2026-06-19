import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "@/routeTree.gen";
import { setBffTokenGetter } from "@/api/bffClient";
import { setTokenGetter } from "@/api/client";
import { setFileUploadTokenGetter } from "@/api/files";
import { cookieManager } from "@/lib/cookies";
import "./index.css";
import { queryClient } from "./lib/queryClient";
import * as Sentry from "@sentry/react";
import packageJson from "../package.json";

// Install mock interceptor in local dev mode (VITE_LOCAL=true)
// Imported statically so it's synchronous before first render
import { maybeInstallMocks } from '@/mocks/index';
maybeInstallMocks();

export function getRouter() {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent", // Preload on hover for instant navigation
    context: {
      cookies: cookieManager,
      queryClient: queryClient,
    },
    // defaultErrorComponent: DefaultCatchBoundary,
    // defaultNotFoundComponent: () => <NotFound />,
  });
  return router;
}

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [Sentry.tanstackRouterBrowserTracingIntegration(getRouter())],
  environment: import.meta.env.VITE_NODE_ENV,
  tracesSampleRate: 0.25,
  release: packageJson.version,
});

const getAccessToken = () => {
  return cookieManager.getAuthTokens().accessToken;
};

setTokenGetter(getAccessToken);
setBffTokenGetter(getAccessToken);
setFileUploadTokenGetter(getAccessToken);

// Register router for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}

// Render the app
const rootElement = document.getElementById("app")!;
if (!rootElement.innerHTML) {
  const root = createRoot(rootElement as HTMLElement);
  root.render(
    <StrictMode>
      <RouterProvider router={getRouter()} />
    </StrictMode>,
  );
}
