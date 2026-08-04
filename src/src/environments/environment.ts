export const environment = {
  production: true,
  /**
   * Relative by default so the SPA works behind any reverse proxy. A native
   * mobile or TV shell overrides this by providing API_BASE_URL with the
   * absolute gateway URL.
   */
  apiBaseUrl: '/api/v1',
  /** Default polling interval for live telemetry, in milliseconds. */
  defaultRefreshIntervalMs: 5000,
};
