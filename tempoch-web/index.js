/**
 * @siderust/tempoch-web — Astronomical time primitives for the browser.
 *
 * Call `init()` before using any other function.
 *
 * @module @siderust/tempoch-web
 */

export { init } from './lib/backend.js';
export { JulianDate } from './lib/JulianDate.js';
export { ModifiedJulianDate } from './lib/ModifiedJulianDate.js';
export { Period } from './lib/Period.js';

// Free functions re-exported from the backend
export {
  jdToMjd,
  mjdToJd,
  julianCenturies,
  julianYears,
  jdFromDate,
  mjdFromDate,
  jdToDate,
  mjdToDate,
  jdDifference,
  mjdDifference,
  version,
} from './lib/backend.js';
