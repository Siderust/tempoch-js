/**
 * @siderust/tempoch-web — ModifiedJulianDate façade class (ESM/browser).
 *
 * @module @siderust/tempoch-web/lib/ModifiedJulianDate
 */

import { Quantity, convert } from '@siderust/qtty-web';
import * as backend from './backend.js';

export class ModifiedJulianDate {
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
    return new ModifiedJulianDate(backend.mjdFromDate(date));
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
    return new ModifiedJulianDate(backend.mjdFromUtc(year, month, day, hour, minute, second));
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
    const { JulianDate } = require_jd();
    return new JulianDate(backend.mjdToJd(this._value));
  }

  /** Convert to a JavaScript `Date` (UTC). */
  toDate() {
    return backend.mjdToDate(this._value);
  }

  /**
   * Add a time duration (Quantity or number of days).
   * @param {Quantity | number} duration
   * @returns {ModifiedJulianDate}
   */
  add(duration) {
    return new ModifiedJulianDate(this._value + _toDays(duration));
  }

  /**
   * Subtract a time duration.
   * @param {Quantity | number} duration
   * @returns {ModifiedJulianDate}
   */
  sub(duration) {
    return new ModifiedJulianDate(this._value - _toDays(duration));
  }

  /**
   * Add a duration in days.
   * @param {number} days
   * @returns {ModifiedJulianDate}
   * @deprecated Use `add()` instead.
   */
  addDays(days) {
    if (!Number.isFinite(days)) throw new Error('days must be finite');
    return new ModifiedJulianDate(this._value + days);
  }

  /**
   * Signed difference `self − other` as a Quantity in Days.
   * @param {ModifiedJulianDate} other
   * @returns {Quantity}
   */
  difference(other) {
    return new Quantity(this._value - other._value, 'Day');
  }

  /** Human-readable representation. */
  format() {
    return `MJD ${this._value} d`;
  }
}

// Deferred module reference for breaking circular import
let _jdModule = null;
function require_jd() {
  if (!_jdModule) {
    _jdModule = { JulianDate: null };
    import('./JulianDate.js').then(m => { _jdModule.JulianDate = m.JulianDate; });
  }
  return _jdModule;
}

// Eagerly resolve the deferred import
import('./JulianDate.js').then(m => {
  _jdModule = { JulianDate: m.JulianDate };
});

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
    return convert(d.value, d.unit, 'Day');
  }
  throw new Error('Expected a Quantity or number');
}
