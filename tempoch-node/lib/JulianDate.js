/**
 * @siderust/tempoch — JulianDate façade class.
 *
 * A Julian Date — continuous count of days from the Julian Period origin.
 * This is a plain JS class that delegates computation to the native backend.
 *
 * @module @siderust/tempoch/lib/JulianDate
 */

'use strict';

const { Quantity, convert, quantityDimension } = require('./qttyCompat.js');
const backend = require('./backend.js');

class JulianDate {
  /**
   * Create a Julian Date from a raw scalar (days since the Julian Period).
   * @param {number} value
   */
  constructor(value) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new Error('Julian date value must be finite (not NaN or ±infinity)');
    }
    this._value = value;
  }

  /**
   * Create a Julian Date from a JavaScript `Date` object.
   * @param {Date} date
   * @returns {JulianDate}
   */
  static fromDate(date) {
    const raw = backend.jdFromDate(date);
    return new JulianDate(raw);
  }

  /**
   * Create a Julian Date from explicit UTC components.
   * @param {number} year
   * @param {number} month
   * @param {number} day
   * @param {number} hour
   * @param {number} minute
   * @param {number} second
   * @returns {JulianDate}
   */
  static fromUtc(year, month, day, hour, minute, second) {
    // Delegate to the native class for ΔT correction
    const nativeJd = backend.NativeJulianDate.fromUtc(year, month, day, hour, minute, second);
    return new JulianDate(nativeJd.value);
  }

  /**
   * The J2000.0 epoch — JD 2 451 545.0.
   * @returns {JulianDate}
   */
  static j2000() {
    return new JulianDate(2_451_545.0);
  }

  /** Raw Julian Date value. */
  get value() {
    return this._value;
  }

  /** The JD value as a `Quantity` in Days. */
  get days() {
    return new Quantity(this._value, 'Day');
  }

  /**
   * Convert to a `ModifiedJulianDate`.
   * @returns {import('./ModifiedJulianDate.js').ModifiedJulianDate}
   */
  toMjd() {
    // Lazy require to break circular dependency
    const { ModifiedJulianDate } = require('./ModifiedJulianDate.js');
    return new ModifiedJulianDate(backend.jdToMjd(this._value));
  }

  /**
   * Convert to a JavaScript `Date` (UTC).
   * @returns {Date}
   */
  toDate() {
    return backend.jdToDate(this._value);
  }

  /**
   * Julian centuries since J2000.0 (T).
   * @returns {Quantity} Quantity in JulianCentury
   */
  julianCenturies() {
    return new Quantity(backend.julianCenturies(this._value), 'JulianCentury');
  }

  /**
   * Julian years since J2000.0.
   * @returns {Quantity} Quantity in JulianYear
   */
  julianYears() {
    return new Quantity(backend.julianYears(this._value), 'JulianYear');
  }

  /**
   * Add a time duration (Quantity or number of days).
   * @param {Quantity | number} duration  A time `Quantity` or raw days
   * @returns {JulianDate}
   */
  add(duration) {
    const days = _toDays(duration);
    return new JulianDate(this._value + days);
  }

  /**
   * Subtract a time duration.
   * @param {Quantity | number} duration  A time `Quantity` or raw days
   * @returns {JulianDate}
   */
  sub(duration) {
    const days = _toDays(duration);
    return new JulianDate(this._value - days);
  }

  /**
   * Add a duration in days, returning a new `JulianDate`.
   * @param {number} days
   * @returns {JulianDate}
   * @deprecated Use `add(Days(n))` instead.
   */
  addDays(days) {
    if (!Number.isFinite(days)) {
      throw new Error('days must be finite');
    }
    return new JulianDate(this._value + days);
  }

  /**
   * Signed difference `self − other` in days as a `Quantity`.
   * @param {JulianDate} other
   * @returns {Quantity} Quantity in Day
   */
  difference(other) {
    return new Quantity(this._value - other._value, 'Day');
  }

  /**
   * Human-readable representation.
   * @returns {string}
   */
  format() {
    return `Julian Day: ${this._value} d`;
  }
}

/**
 * Convert a duration argument to days (number).
 * @param {Quantity | number} d
 * @returns {number}
 */
function _toDays(d) {
  if (typeof d === 'number') {
    if (!Number.isFinite(d)) throw new Error('Duration must be finite');
    return d;
  }
  if (d && typeof d.value === 'number' && typeof d.unit === 'string') {
    const dimension = quantityDimension(d);
    if (dimension !== 'Time') {
      throw new Error(`Expected a time Quantity, got ${dimension}`);
    }
    return convert(d.value, d.unit, 'Day');
  }
  throw new Error('Expected a Quantity or number');
}

module.exports = { JulianDate };
