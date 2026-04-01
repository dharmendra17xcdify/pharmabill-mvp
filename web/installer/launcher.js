/**
 * PharmaBill Launcher
 * Reads .env from install root, sets environment variables, then starts the Next.js server.
 */
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  content.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.substring(0, eqIdx).trim();
      const val = trimmed.substring(eqIdx + 1);
      process.env[key] = val;
    }
  });
}

process.env.PORT = process.env.PORT || '3000';
process.env.HOSTNAME = '0.0.0.0';

// Locate server.js — handle two possible standalone layouts:
//   app/server.js        (outputFileTracingRoot set to web/)
//   app/web/server.js    (outputFileTracingRoot defaulted to repo root)
const candidates = [
  path.join(__dirname, 'app', 'server.js'),
  path.join(__dirname, 'app', 'web', 'server.js'),
];

const serverJs = candidates.find(p => fs.existsSync(p));
if (!serverJs) {
  console.error('ERROR: Cannot find server.js. Tried:\n' + candidates.join('\n'));
  process.exit(1);
}

process.chdir(path.dirname(serverJs));
require(serverJs);
