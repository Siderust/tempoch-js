/**
 * @siderust/tempoch-web — Internal WASM backend abstraction.
 *
 * Loads the wasm-bindgen generated module and re-exports the primitive
 * free functions that the shared JS façade classes need.
 *
 * @module @siderust/tempoch-web/lib/backend
 * @private
 */

let wasm = null;

/**
 * Initialise the WASM module. Must be called before any other function.
 * @param {RequestInfo | URL | Response | BufferSource | WebAssembly.Module} [module_or_path]
 */
export async function init(module_or_path) {
  const mod = await import('../pkg/tempoch_web.js');
  await mod.default(module_or_path);
  wasm = mod;
}

export function ensureInit() {
  if (!wasm) {
    throw new Error('@siderust/tempoch-web: call init() before using any function');
  }
}

// ── JD / MJD conversion ────────────────────────────────────────────

export function jdToMjd(jd) {
  ensureInit();
  return wasm.jdToMjd(jd);
}

export function mjdToJd(mjd) {
  ensureInit();
  return wasm.mjdToJd(mjd);
}

// ── Epoch-based quantities ─────────────────────────────────────────

export function julianCenturies(jd) {
  ensureInit();
  return wasm.julianCenturies(jd);
}

export function julianYears(jd) {
  ensureInit();
  return wasm.julianYears(jd);
}

// ── Date ↔ JD/MJD ─────────────────────────────────────────────────
// WASM can't access JS Date directly, so we pass millisecond
// timestamps and wrap/unwrap in the JS layer.

export function jdFromDate(date) {
  ensureInit();
  return wasm.jdFromMs(date.getTime());
}

export function mjdFromDate(date) {
  ensureInit();
  return wasm.mjdFromMs(date.getTime());
}

export function jdToDate(jd) {
  ensureInit();
  const ms = wasm.jdToMs(jd);
  return new Date(ms);
}

export function mjdToDate(mjd) {
  ensureInit();
  const ms = wasm.mjdToMs(mjd);
  return new Date(ms);
}

// ── UTC components → JD/MJD ───────────────────────────────────────

export function jdFromUtc(year, month, day, hour, minute, second) {
  ensureInit();
  return wasm.jdFromUtc(year, month, day, hour, minute, second);
}

export function mjdFromUtc(year, month, day, hour, minute, second) {
  ensureInit();
  return wasm.mjdFromUtc(year, month, day, hour, minute, second);
}

// ── Arithmetic ────────────────────────────────────────────────────

export function jdAddDays(jd, days) {
  ensureInit();
  return wasm.jdAddDays(jd, days);
}

export function mjdAddDays(mjd, days) {
  ensureInit();
  return wasm.mjdAddDays(mjd, days);
}

export function jdDifference(jd1, jd2) {
  ensureInit();
  return wasm.jdDifference(jd1, jd2);
}

export function mjdDifference(mjd1, mjd2) {
  ensureInit();
  return wasm.mjdDifference(mjd1, mjd2);
}

// ── Version ───────────────────────────────────────────────────────

export function version() {
  ensureInit();
  return wasm.version();
}
