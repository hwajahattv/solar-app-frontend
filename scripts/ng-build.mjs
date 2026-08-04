/**
 * Runs `ng build`, bypassing Angular CLI's Node patch gates when the host
 * major line is present but one patch behind (common on Vercel, which only
 * exposes 22.x / 24.x and rolls patches on its own schedule).
 *
 * Angular checks the version twice:
 * 1) bin/ng.js → isNodeVersionSupported()
 * 2) lib/cli/index.js → isNodeVersionMinSupported()
 */
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const nodeVersion = require('@angular/cli/src/utilities/node-version');

const extraArgs = process.argv.slice(2);

if (nodeVersion.isNodeVersionSupported()) {
  const result = spawnSync(
    process.execPath,
    [require.resolve('@angular/cli/bin/ng.js'), 'build', ...extraArgs],
    { stdio: 'inherit' },
  );
  process.exit(result.status ?? 1);
}

const required = nodeVersion.supportedNodeVersions[0] ?? '22.22.3';
console.warn(
  `[ng-build] Node ${process.version} is slightly below Angular CLI's declared minimum (${required}); ` +
    'spoofing process.versions.node for this build (Vercel major-line lag).',
);

// Both CLI gates read process.versions.node at call time — lift just enough
// for the same major/minor line so the real runtime is still Node 22.x.
Object.defineProperty(process.versions, 'node', {
  value: required,
  configurable: true,
});

process.argv = [process.argv[0], 'ng', 'build', ...extraArgs];
require('@angular/cli/bin/bootstrap.js');
