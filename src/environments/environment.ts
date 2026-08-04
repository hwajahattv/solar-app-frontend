export const environment = {
  production: true,
  /**
   * Absolute gateway URL. Injected at build time by scripts/write-env.mjs
   * from the API_BASE_URL environment variable.
   */
  apiBaseUrl: "https://solar-app-ochre.vercel.app/api/v1",
  /** Default polling interval for live telemetry, in milliseconds. */
  defaultRefreshIntervalMs: 5000,
};
