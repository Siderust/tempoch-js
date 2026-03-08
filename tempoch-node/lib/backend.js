/**
 * @siderust/tempoch — Internal native backend abstraction.
 *
 * Loads the NAPI-RS addon and re-exports only the primitive-level helpers
 * that the JS façade classes need.  Consumer code should never import this
 * module directly.
 *
 * @module @siderust/tempoch/lib/backend
 * @private
 */

'use strict';

const native = require('../native.cjs');

// The native classes are used internally for operations that are cheaper
// to do in Rust (e.g. fromUtc with ΔT correction, Date↔JD/MJD conversion).
// The JS façade wraps the results.

module.exports = {
  // Native classes — used internally, never exposed directly
  NativeJulianDate: native.JulianDate,
  NativeModifiedJulianDate: native.ModifiedJulianDate,
  NativePeriod: native.Period,

  // Free functions
  jdToMjd: native.jdToMjd,
  mjdToJd: native.mjdToJd,
  julianCenturies: native.julianCenturies,
  julianYears: native.julianYears,
  jdFromDate: native.jdFromDate,
  mjdFromDate: native.mjdFromDate,
  jdToDate: native.jdToDate,
  mjdToDate: native.mjdToDate,
  jdDifference: native.jdDifference,
  mjdDifference: native.mjdDifference,
  version: native.version,
};
