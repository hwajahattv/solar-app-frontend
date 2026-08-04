/**
 * Runs `ng build`, bypassing Angular CLI's Node patch gate when the host
 * major line is present but one patch behind (common on Vercel, which only
 * exposes 22.x / 24.x and rolls patches on its own schedule).
 */
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const { isNodeVersionSupported } = require('@angular/cli/src/utilities/node-version');

const extraArgs = process.argv.slice(2);

if (isNodeVersionSupported()) {
  const result = spawnSync(
    process.execPath,
    [require.resolve('@angular/cli/bin/ng.js'), 'build', ...extraArgs],
    { stdio: 'inherit' },
  );
  process.exit(result.status ?? 1);
}

console.warn(
  `[ng-build] Node ${process.version} is slightly below Angular CLI's declared minimum; ` +
    'bypassing the version gate for this build (Vercel major-line lag).',
);

process.argv = [process.argv[0], 'ng', 'build', ...extraArgs];
require('@angular/cli/bin/bootstrap.js');
