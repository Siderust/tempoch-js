/**
 * @siderust/tempoch — Period façade class.
 *
 * A time period (interval) defined by two `ModifiedJulianDate` endpoints.
 * Intervals are half-open `[start, end)`.
 *
 * @module @siderust/tempoch/lib/Period
 */

'use strict';

const { Quantity } = require('./qttyCompat.js');
const { ModifiedJulianDate } = require('./ModifiedJulianDate.js');
const backend = require('./backend.js');

class Period {
  /**
   * Create a period from two `ModifiedJulianDate` objects.
   *
   * @param {ModifiedJulianDate} start
   * @param {ModifiedJulianDate} end
   */
  constructor(start, end) {
    // Accept either ModifiedJulianDate objects or raw numbers (backward compat).
    const startVal = typeof start === 'number' ? start : start._value;
    const endVal = typeof end === 'number' ? end : end._value;

    if (!Number.isFinite(startVal) || !Number.isFinite(endVal)) {
      throw new Error('Period endpoints must be finite');
    }
    if (startVal > endVal) {
      throw new Error('Period start must not be after end');
    }
    this._startMjd = startVal;
    this._endMjd = endVal;
  }

  /**
   * Create a period from two JavaScript `Date` objects.
   * @param {Date} start
   * @param {Date} end
   * @returns {Period}
   */
  static fromDates(start, end) {
    const startMjd = backend.mjdFromDate(start);
    const endMjd = backend.mjdFromDate(end);
    if (startMjd > endMjd) {
      throw new Error('Period start must not be after end');
    }
    return new Period(startMjd, endMjd);
  }

  /** Start of the period as a raw MJD value. */
  get startMjd() {
    return this._startMjd;
  }

  /** End of the period as a raw MJD value. */
  get endMjd() {
    return this._endMjd;
  }

  /** Start as a `ModifiedJulianDate` object. */
  get start() {
    return new ModifiedJulianDate(this._startMjd);
  }

  /** End as a `ModifiedJulianDate` object. */
  get end() {
    return new ModifiedJulianDate(this._endMjd);
  }

  /**
   * Duration of the period as a `Quantity` in Days.
   * @returns {Quantity}
   */
  duration() {
    return new Quantity(this._endMjd - this._startMjd, 'Day');
  }

  /**
   * Duration of the period in days (raw number).
   * @returns {number}
   */
  durationDays() {
    return this._endMjd - this._startMjd;
  }

  /**
   * Return the overlapping sub-period, or `null` if they do not overlap.
   * @param {Period} other
   * @returns {Period | null}
   */
  intersection(other) {
    const s = Math.max(this._startMjd, other._startMjd);
    const e = Math.min(this._endMjd, other._endMjd);
    if (s >= e) return null;
    return new Period(s, e);
  }

  /**
   * Return `true` if the MJD value falls inside `[start, end)`.
   * @param {number | ModifiedJulianDate} mjd
   * @returns {boolean}
   */
  contains(mjd) {
    const val = typeof mjd === 'number' ? mjd : mjd._value;
    return val >= this._startMjd && val < this._endMjd;
  }

  /**
   * Return start and end as millisecond timestamps.
   * @returns {{ startMs: number, endMs: number }}
   */
  toUtc() {
    const startDate = backend.mjdToDate(this._startMjd);
    const endDate = backend.mjdToDate(this._endMjd);
    return {
      startMs: startDate.getTime(),
      endMs: endDate.getTime(),
    };
  }

  /**
   * Human-readable representation.
   * @returns {string}
   */
  format() {
    return `Period(MJD ${this._startMjd.toFixed(6)} to MJD ${this._endMjd.toFixed(6)})`;
  }
}

module.exports = { Period };
