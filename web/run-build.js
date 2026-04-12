/**
 * Build runner: patches fs.readlink in the current process AND propagates
 * the patch to every child process Next.js spawns (webpack worker, page-data
 * collector, etc.) via NODE_OPTIONS, which is inherited by all sub-processes.
 */
const path = require('path');
const fs = require('fs');

// Use forward slashes — backslashes get mangled when passed via NODE_OPTIONS on Windows
const patchPath = path.resolve(__dirname, 'patch-readlink.js').replace(/\\/g, '/');

// 1. Patch the current process immediately
require(patchPath);

// 2. Make every child process also load the patch at startup
const existing = process.env.NODE_OPTIONS || '';
if (!existing.includes('patch-readlink')) {
  process.env.NODE_OPTIONS = `${existing} --require "${patchPath}"`.trim();
}

// 3. Disable telemetry to avoid trace file locks
process.env.NEXT_TELEMETRY_DISABLED = '1';

// 4. Try to remove the trace file if it exists (can be locked by a previous run)
const traceFile = path.join(__dirname, '.next', 'trace');
try {
  if (fs.existsSync(traceFile)) fs.unlinkSync(traceFile);
} catch (e) {
  // File locked by dev server — build will still work, Next.js recreates it
}

// 5. Hand off to Next.js – process.argv[2] should be "build"
require('./node_modules/next/dist/bin/next');
