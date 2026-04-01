/**
 * Windows EISDIR workaround for fs.readlink.
 * On some Windows filesystems (cloud-sync placeholders, certain NTFS reparse
 * points) fs.readlink() returns EISDIR instead of EINVAL on regular files.
 * Webpack / enhanced-resolve treat EINVAL as "not a symlink" (safe) but
 * propagate EISDIR as a fatal build error.
 *
 * Load this file with `node -r ./patch-readlink.js` before running Next.js.
 */
const fs = require('fs');

function makeEINVAL(path) {
  const e = new Error("EINVAL: invalid argument, readlink '" + path + "'");
  e.code = 'EINVAL';
  e.syscall = 'readlink';
  e.path = String(path);
  return e;
}

// ── fs.readlink (callback) ────────────────────────────────────────────────────
const _readlink = fs.readlink;
fs.readlink = function (path, options, callback) {
  if (typeof options === 'function') { callback = options; options = undefined; }
  function done(err, result) {
    if (err && err.code === 'EISDIR') callback(makeEINVAL(path));
    else callback(err, result);
  }
  options !== undefined ? _readlink(path, options, done) : _readlink(path, done);
};

// ── fs.readlinkSync ───────────────────────────────────────────────────────────
const _readlinkSync = fs.readlinkSync;
fs.readlinkSync = function (path, options) {
  try { return _readlinkSync(path, options); }
  catch (err) {
    if (err && err.code === 'EISDIR') throw makeEINVAL(path);
    throw err;
  }
};

// ── fs.promises.readlink ─────────────────────────────────────────────────────
// Next.js collect-build-traces.js uses `fs.promises.readlink` (not the callback
// form), so we must patch the Promise API too.
const _promisesReadlink = fs.promises.readlink;
fs.promises.readlink = function (path, options) {
  return _promisesReadlink(path, options).catch(function (err) {
    if (err && err.code === 'EISDIR') throw makeEINVAL(path);
    throw err;
  });
};
