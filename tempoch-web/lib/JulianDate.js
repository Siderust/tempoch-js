/**
 * @siderust/tempoch-web — JulianDate façade class (ESM/browser).
 *
 * @module @siderust/tempoch-web/lib/JulianDate
 */

import { Quantity, convert } from '@siderust/qtty-web';
import * as backend from './backend.js';

export class JulianDate {
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
    return new JulianDate(backend.jdFromDate(date));
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
    return new JulianDate(backend.jdFromUtc(year, month, day, hour, minute, second));
  }

  /** The J2000.0 epoch — JD 2 451 545.0. */
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
    // Lazy import to break circular dependency (ESM live bindings
    // are resolved by the time this method is actually called).
    const { ModifiedJulianDate } = require_mjd();
    return new ModifiedJulianDate(backend.jdToMjd(this._value));
  }

  /** Convert to a JavaScript `Date` (UTC). */
  toDate() {
    return backend.jdToDate(this._value);
  }

  /**
   * Julian centuries since J2000.0 (T).
   * @returns {Quantity}
   */
  julianCenturies() {
    return new Quantity(backend.julianCenturies(this._value), 'JulianCentury');
  }

  /**
   * Julian years since J2000.0.
   * @returns {Quantity}
   */
  julianYears() {
    return new Quantity(backend.julianYears(this._value), 'JulianYear');
  }

  /**
   * Add a time duration (Quantity or number of days).
   * @param {Quantity | number} duration
   * @returns {JulianDate}
   */
  add(duration) {
    return new JulianDate(this._value + _toDays(duration));
  }

  /**
   * Subtract a time duration.
   * @param {Quantity | number} duration
   * @returns {JulianDate}
   */
  sub(duration) {
    return new JulianDate(this._value - _toDays(duration));
  }

  /**
   * Add a duration in days.
   * @param {number} days
   * @returns {JulianDate}
   * @deprecated Use `add()` instead.
   */
  addDays(days) {
    if (!Number.isFinite(days)) throw new Error('days must be finite');
    return new JulianDate(this._value + days);
  }

  /**
   * Signed difference `self − other` as a Quantity in Days.
   * @param {JulianDate} other
   * @returns {Quantity}
   */
  difference(other) {
    return new Quantity(this._value - other._value, 'Day');
  }

  /** Human-readable representation. */
  format() {
    return `Julian Day: ${this._value} d`;
  }
}

// Deferred module reference for breaking circular import
let _mjdModule = null;
function require_mjd() {
  if (!_mjdModule) {
    // By the time toMjd() is called both modules are fully loaded,
    // so the circular reference is already resolved.
    _mjdModule = { ModifiedJulianDate: null };
    import('./ModifiedJulianDate.js').then(m => { _mjdModule.ModifiedJulianDate = m.ModifiedJulianDate; });
  }
  return _mjdModule;
}

// Eagerly resolve the deferred import (runs after this module's body)
import('./ModifiedJulianDate.js').then(m => {
  _mjdModule = { ModifiedJulianDate: m.ModifiedJulianDate };
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
