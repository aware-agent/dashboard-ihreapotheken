
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_LETTERS_CODE: z.enum(["local", "dev", "stg", "prod"]).default("local"),
    VITE_NODE_ENV: z.enum(["dev", "prod"]),
    VITE_API_BASE_URL: z.string().url(),
    VITE_COMPANION_API_URL: z.string().url(),
    VITE_BFF_BASE_URL: z.string().url(),
    VITE_SHOP: z.string().url(),
    VITE_SUPPORT: z.string().url(),
    VITE_STRIPE_MEMBERSHIP_URL: z.string().url(),
    VITE_WEARABLES_ENABLED: z
      .string()
      // only allow "true" or "false"
      .refine((s) => s === "true" || s === "false")
      // transform to boolean
      .transform((s) => s === "true"),
    VITE_COMPANION_ENABLED: z
      .string()
      // only allow "true" or "false"
      .refine((s) => s === "true" || s === "false")
      // transform to boolean
      .transform((s) => s === "true"),
  },
  runtimeEnv: import.meta.env,
  emptyStringAsUndefined: true,
});

// Export with cleaner names for easier usage
export const API_BASE_URL = env.VITE_API_BASE_URL;
export const COMPANION_API_URL = env.VITE_COMPANION_API_URL;
export const BFF_BASE_URL = env.VITE_BFF_BASE_URL;

export const EXTERNAL_URLS = {
  SHOP: env.VITE_SHOP,
  SUPPORT: env.VITE_SUPPORT,
} as const;