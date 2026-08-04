# Knox Solar dashboard (frontend)

Angular 22 single-page app using Angular Material with a dark theme, designed so
the same UI concepts carry over to a mobile and TV app later.

## Running

```bash
npm install
npm start        # http://localhost:4200
```

`/api` is proxied to `http://localhost:3000` in development (`proxy.conf.json`),
so run the backend alongside it.

## Structure

```
src/app/
├── core/            Framework-light layer, reusable by any Angular shell
│   ├── api/         One typed service per backend resource
│   ├── models/      Interfaces mirroring the gateway DTOs
│   ├── state/       Signal stores (session, devices, refresh clock, telemetry)
│   ├── platform/    Surface detection and remote-control navigation
│   └── interceptors/
├── shared/ui/       Presentational components with inputs only
├── layout/          Application shell and navigation
└── features/        Route-level screens
```

Feature components hold no ShineMonitor knowledge. They read signals from stores
and render shared UI components.

## Designed for mobile and TV

The app targets four **surfaces**: `handset`, `tablet`, `desktop` and `tv`.
`PlatformService` resolves the current one and puts it on `<html>` as a class.

Three mechanisms make one codebase serve all four:

1. **Root font scaling.** Angular Material's M3 typography tokens are declared in
   `rem`, so `src/theme/_surfaces.scss` rescales the entire component library by
   changing the root font size — 15px on a handset, 22px on a TV. Spacing follows
   through `--knox-space-unit`.
2. **Surface-driven layout.** Navigation is a bottom tab bar on handsets and a
   side rail everywhere else, driven by `platform.navigationMode()`. The energy
   flow diagram reflows on its own container width, not the viewport, so it
   behaves the same in a phone column and a TV panel.
3. **Remote-control navigation.** `SpatialNavDirective` resolves arrow keys to the
   nearest focusable element, because TV browsers do not implement CSS spatial
   navigation reliably. Focus rings widen to 4px and content gets overscan
   padding on the TV surface.

You can preview any surface from **Diagnostics → Preview surface**; the override
is persisted, which is how the TV layout is reviewed on a desktop browser.

### What a native app reuses

`core/api`, `core/models` and `core/state` have no DOM dependencies. A native
shell provides `API_BASE_URL` with the absolute gateway address and reuses them
as-is. The design tokens in `src/theme/_tokens.scss` are the source of truth for
colours and spacing, so a Flutter or React Native client can mirror them exactly.

## Theming

Dark is the only theme — the dashboard is intended for an always-on wall or TV
display. The Material palette is configured in `src/styles.scss`; energy-domain
colours (grid, solar, battery, load) are semantic tokens in
`src/theme/_tokens.scss` and identify a source consistently across the diagram,
the tiles and the status pills.

## Deploy on Vercel

This SPA is an alternate deploy target to the Docker/nginx path. Set the Vercel
project **Root Directory** to `frontend` so it picks up [`vercel.json`](vercel.json).

What `vercel.json` does:

1. Builds with `npm run build` and serves `dist/frontend/browser`.
2. Proxies same-origin `/api/*` to the Nest gateway at
   `https://solar-app-ochre.vercel.app` (update the rewrite destination if the
   backend hostname changes).
3. Falls back to `index.html` for Angular client routes.
4. Applies cache and basic security headers similar to `nginx.conf`.

Backend env (on the `solar-app` Vercel project) that must be set:

| Variable | Purpose |
| --- | --- |
| `ACCESS_PIN` | PIN required to unlock Controls / Diagnostics |
| `ACCESS_TOKEN_SECRET` | HMAC secret for signed access tokens |
| `CORS_ORIGINS` | Include the frontend origin (e.g. `https://….vercel.app`) for Swagger / direct API calls |

Camera streaming still requires ffmpeg and LAN reachability to the camera, so it
will not work on Vercel serverless — the UI already degrades when the camera is
unconfigured.

### Non-goals for this deploy path

Full user accounts, TypeScript `strict` migration, broad automated test/CI
coverage, and on-Vercel camera capture are out of scope.

## Testing

```bash
npm test
```
