export const environment = {
  production: true,
  /**
   * Gateway URL. Injected at build time by scripts/write-env.mjs
   * from the API_BASE_URL environment variable.
   */
  apiBaseUrl: '/api/v1',
  /** Default polling interval for live telemetry, in milliseconds. */
  defaultRefreshIntervalMs: 5000,
};
