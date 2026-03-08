/**
 * @siderust/tempoch — Astronomical time primitives for Node.js.
 *
 * Public entrypoint.  Exposes JS-level façade classes (`JulianDate`,
 * `ModifiedJulianDate`, `Period`) and free functions from the native backend.
 *
 * @module @siderust/tempoch
 */

'use strict';

const { JulianDate } = require('./lib/JulianDate.js');
const { ModifiedJulianDate } = require('./lib/ModifiedJulianDate.js');
const { Period } = require('./lib/Period.js');

// Free functions — pass through from the native backend.
const backend = require('./lib/backend.js');

module.exports.JulianDate = JulianDate;
module.exports.ModifiedJulianDate = ModifiedJulianDate;
module.exports.Period = Period;
module.exports.jdToMjd = backend.jdToMjd;
module.exports.mjdToJd = backend.mjdToJd;
module.exports.julianCenturies = backend.julianCenturies;
module.exports.julianYears = backend.julianYears;
module.exports.jdFromDate = backend.jdFromDate;
module.exports.mjdFromDate = backend.mjdFromDate;
module.exports.jdToDate = backend.jdToDate;
module.exports.mjdToDate = backend.mjdToDate;
module.exports.jdDifference = backend.jdDifference;
module.exports.mjdDifference = backend.mjdDifference;
module.exports.version = backend.version;
