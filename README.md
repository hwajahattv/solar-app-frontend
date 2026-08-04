# Knox Solar dashboard (frontend)

Angular 22 single-page app using Angular Material with a dark theme, designed so
the same UI concepts carry over to a mobile and TV app later.

## Running locally

Requires **Node.js 22.22.3+** locally (or 24.15+ / 26+). Vercel only pins the
major line (`22.x`); if its patch lags Angular’s minimum, `npm run build` uses
`scripts/ng-build.mjs` to bypass that gate.

```bash
npm install
npm start        # http://localhost:4200
```

Development uses an absolute API base of `http://localhost:3000/api/v1`
([`src/environments/environment.development.ts`](src/environments/environment.development.ts)).
Run the gateway locally, or change that file to point at a remote gateway.

`proxy.conf.json` still proxies `/api` → `http://localhost:3000` if you switch the
dev base URL back to a relative `/api/v1`.

```bash
npm run lint
npm test
npm run test:pin
npm run build
```

## Deploy on Vercel

1. Import this repo into Vercel (Framework Preset: **Other**).
2. Build settings are in [`vercel.json`](vercel.json):
   - Build command: `npm run build`
   - Output directory: `dist/frontend/browser`
3. Set environment variables (Project → Settings → Environment Variables):

| Variable | Required | Purpose |
|----------|----------|---------|
| `API_BASE_URL` | Yes | Absolute gateway base, e.g. `https://your-gateway.example.com/api/v1` |
| `APP_PIN` | Yes (Production) | Access PIN users type on `/login.html` |
| `PIN_SECRET` | Yes (Production) | Long random string used to sign the `knox_gate` cookie |

4. Deploy. Unauthenticated visitors are redirected to `/login.html`.

Copy [`.env.example`](.env.example) for a local checklist — never commit real secrets.

### How the PIN is set and rotated

1. In the Vercel dashboard, set `APP_PIN` (and `PIN_SECRET` if missing).
2. Redeploy the project (env changes apply on the next deployment).
3. Existing unlocked browsers keep working until their cookie expires (7 days) or
   they use **Lock** in the toolbar / clear site data.
4. To force everyone to re-enter the PIN immediately, change `PIN_SECRET` and redeploy
   (invalidates all signed cookies).

There is **no user database**. This is a soft access gate for a private dashboard.
The absolute API origin is still reachable if someone knows the URL; gateway
credentials remain on the backend.

### Testing the PIN gate locally

`ng serve` does not run Vercel Edge middleware. To exercise the PIN wall:

```bash
npx vercel dev
```

with `APP_PIN` and `PIN_SECRET` in a local `.env` (gitignored).

## Structure

```
src/app/
├── core/            Framework-light layer, reusable by any Angular shell
│   ├── api/         One typed service per backend resource
│   ├── models/      Interfaces mirroring the gateway DTOs
│   ├── state/       Signal stores (session, devices, refresh clock, telemetry)
│   ├── platform/    Surface detection and remote-control navigation
│   ├── errors/      Global ErrorHandler → snackbar
│   └── interceptors/
├── shared/ui/       Presentational components with inputs only
├── layout/          Application shell and navigation
└── features/        Route-level screens

api/pin/             Vercel Edge unlock/lock routes
lib/pin-gate.ts      Shared PIN cookie crypto (Edge + tests)
middleware.ts        Vercel Edge PIN gate
public/login.html    Standalone unlock page (outside the Angular bundle)
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

## Docker (optional)

[`Dockerfile`](Dockerfile) + [`nginx.conf`](nginx.conf) remain available for
container deploys. Production builds embed an absolute `API_BASE_URL`, so the
nginx `/api/` reverse proxy is optional when the SPA talks to the gateway
directly. For Docker builds, pass the URL at build time:

```bash
docker build --build-arg API_BASE_URL=https://your-gateway.example.com/api/v1 .
```

(Wire `ARG`/`ENV` into the Dockerfile if you use that path regularly.)

## Testing

```bash
npm test           # Angular unit tests (Vitest)
npm run test:pin   # Edge PIN helper tests
```
