import { tanstackRouter } from '@tanstack/router-plugin/vite'
import path from "node:path";
// import react from "@vitejs/plugin-react-swc";
import viteReact from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from "vite";
import viteTsConfigPaths from 'vite-tsconfig-paths'


// https://vitejs.dev/config/
export default defineConfig({
  // const env = loadEnv(mode, process.cwd(), "");

  // const companionTarget =
  //   env.VITE_COMPANION_API_URL || "https://aware-llm.vercel.app/" || "http://localhost:3000";

  server: {
    host: "0.0.0.0",
    port: 3000,
  },
  /*
  server: {
    host: "0.0.0.0", // Listen on all network interfaces
    port: 3000,
    strictPort: false,
    // Allow all hosts - use true instead of "all" for Vite 5.x
    allowedHosts: true,
    // Proxy API requests to backend to avoid CORS issues
    // When frontend is on HTTPS (ngrok) and backend is on HTTP (localhost)
    // This allows the browser to make same-origin requests, which Vite proxies to the backend
    proxy: {
      "/api": {
        target: companionTarget,
        changeOrigin: true,
        secure: false, // Allow self-signed certificates (for ngrok)
        ws: true, // Enable WebSocket proxying
        // Long timeouts for SSE streams (1 hour) - prevents premature connection closure
        proxyTimeout: 3600000,
        timeout: 3600000,
        // Important: Don't rewrite the path, keep /api as-is
        // The backend expects /api/v1/chat/stream
        configure: (proxy, _options) => {
          // Log which backend the /api proxy is targeting for easier debugging
          console.log(
            `[aware] Vite dev proxy configured: /api -> ${companionTarget} (VITE_COMPANION_API_URL=${env.VITE_COMPANION_API_URL ?? "undefined"
            })`,
          );

          // Override proxy.web to set SSE headers EARLY, before any buffering happens
          const origWeb = proxy.web.bind(proxy);
          proxy.web = (req, res, proxyOptions) => {
            // If request is SSE, set headers immediately on the response
            if (req.url?.includes('/stream') || req.headers.accept === 'text/event-stream') {
              // Set headers BEFORE calling original proxy.web to prevent buffering
              res.setHeader('Content-Type', 'text/event-stream');
              res.setHeader('Connection', 'keep-alive');
              res.setHeader('Cache-Control', 'no-cache');
              res.setHeader('X-Accel-Buffering', 'no');
              // Flush headers immediately
              if (typeof res.flushHeaders === 'function') {
                res.flushHeaders();
              }
            }
            // Call original proxy.web
            return origWeb(req, res, proxyOptions);
          };

          proxy.on("error", (err, _req, res) => {
            console.error("Proxy error:", err);
            if (res && !res.headersSent) {
              res.writeHead(500, {
                "Content-Type": "text/plain",
              });
              res.end(`Proxy error: ${err.message}`);
            }
          });
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            // For SSE streams, set keep-alive headers on the request
            if (req.url?.includes('/stream') || req.headers.accept === 'text/event-stream') {
              proxyReq.setHeader('Cache-Control', 'no-cache');
              proxyReq.setHeader('X-Accel-Buffering', 'no');
              proxyReq.setHeader('Connection', 'keep-alive');
            }
            // Log proxied requests for debugging
            if (env.DEBUG) {
              console.log(`Proxying ${req.method} ${req.url} to ${proxyReq.path}`);
            }
          });
          proxy.on("proxyRes", (proxyRes, req) => {
            // For SSE streams, ensure proper headers and remove compression
            if (req.url?.includes('/stream') || req.headers.accept === 'text/event-stream') {
              // Remove any content-encoding that might cause buffering
              delete proxyRes.headers['content-encoding'];
              // Ensure headers are set (they should already be set from proxy.web override)
              proxyRes.headers['cache-control'] = 'no-cache';
              proxyRes.headers['x-accel-buffering'] = 'no';
              proxyRes.headers.connection = 'keep-alive';
              proxyRes.headers['content-type'] = 'text/event-stream';
            }
          });
        },
      },
    },
  },*/
  plugins: [
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    viteReact(),
  ]
});
