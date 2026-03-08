/**
 * @siderust/tempoch — ModifiedJulianDate façade class.
 *
 * A Modified Julian Date — `JD − 2 400 000.5`.
 *
 * @module @siderust/tempoch/lib/ModifiedJulianDate
 */

'use strict';

const { Quantity } = require('@siderust/qtty');
const backend = require('./backend.js');

class ModifiedJulianDate {
  /**
   * Create a Modified Julian Date from a raw scalar.
   * @param {number} value
   */
  constructor(value) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new Error('MJD value must be finite (not NaN or ±infinity)');
    }
    this._value = value;
  }

  /**
   * Create a Modified Julian Date from a JavaScript `Date` object.
   * @param {Date} date
   * @returns {ModifiedJulianDate}
   */
  static fromDate(date) {
    const raw = backend.mjdFromDate(date);
    return new ModifiedJulianDate(raw);
  }

  /**
   * Create a Modified Julian Date from explicit UTC components.
   * @param {number} year
   * @param {number} month
   * @param {number} day
   * @param {number} hour
   * @param {number} minute
   * @param {number} second
   * @returns {ModifiedJulianDate}
   */
  static fromUtc(year, month, day, hour, minute, second) {
    const nativeMjd = backend.NativeModifiedJulianDate.fromUtc(
      year,
      month,
      day,
      hour,
      minute,
      second,
    );
    return new ModifiedJulianDate(nativeMjd.value);
  }

  /** Raw MJD value. */
  get value() {
    return this._value;
  }

  /** The MJD value as a `Quantity` in Days. */
  get days() {
    return new Quantity(this._value, 'Day');
  }

  /**
   * Convert to a `JulianDate`.
   * @returns {import('./JulianDate.js').JulianDate}
   */
  toJd() {
    const { JulianDate } = require('./JulianDate.js');
    return new JulianDate(backend.mjdToJd(this._value));
  }

  /**
   * Convert to a JavaScript `Date` (UTC).
   * @returns {Date}
   */
  toDate() {
    return backend.mjdToDate(this._value);
  }

  /**
   * Add a time duration (Quantity or number of days).
   * @param {Quantity | number} duration
   * @returns {ModifiedJulianDate}
   */
  add(duration) {
    const days = _toDays(duration);
    return new ModifiedJulianDate(this._value + days);
  }

  /**
   * Subtract a time duration.
   * @param {Quantity | number} duration
   * @returns {ModifiedJulianDate}
   */
  sub(duration) {
    const days = _toDays(duration);
    return new ModifiedJulianDate(this._value - days);
  }

  /**
   * Add a duration in days, returning a new `ModifiedJulianDate`.
   * @param {number} days
   * @returns {ModifiedJulianDate}
   * @deprecated Use `add(Days(n))` instead.
   */
  addDays(days) {
    if (!Number.isFinite(days)) {
      throw new Error('days must be finite');
    }
    return new ModifiedJulianDate(this._value + days);
  }

  /**
   * Signed difference `self − other` in days as a `Quantity`.
   * @param {ModifiedJulianDate} other
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
    return `MJD ${this._value} d`;
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
    if (d.dimension !== 'Time') {
      throw new Error(`Expected a time Quantity, got ${d.dimension}`);
    }
    const { convert } = require('@siderust/qtty');
    return convert(d.value, d.unit, 'Day');
  }
  throw new Error('Expected a Quantity or number');
}

module.exports = { ModifiedJulianDate };
