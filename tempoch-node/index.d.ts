/* tslint:disable */
/* eslint-disable */

import { Quantity } from '@siderust/qtty'

/**
 * UTC bounds of a [`Period`] expressed as millisecond timestamps.
 *
 * Construct JS `Date` objects with `new Date(bounds.startMs)`.
 */
export interface UtcBounds {
  /** Start instant in milliseconds since Unix epoch. */
  startMs: number
  /** End instant in milliseconds since Unix epoch. */
  endMs: number
}

/* ------------------------------------------------------------------ */
/*  Free functions                                                     */
/* ------------------------------------------------------------------ */

/**
 * Convert a Julian Date to a Modified Julian Date value.
 *
 * `mjd = jd − 2 400 000.5`
 */
export declare function jdToMjd(jd: number): number
/**
 * Convert a Modified Julian Date to a Julian Date value.
 *
 * `jd = mjd + 2 400 000.5`
 */
export declare function mjdToJd(mjd: number): number
/** Compute Julian centuries since J2000.0 for a Julian Date. */
export declare function julianCenturies(jd: number): number
/** Compute Julian years since J2000.0 for a Julian Date. */
export declare function julianYears(jd: number): number
/** Convert a JavaScript `Date` to a Julian Date value. */
export declare function jdFromDate(date: Date): number
/** Convert a JavaScript `Date` to a Modified Julian Date value. */
export declare function mjdFromDate(date: Date): number
/**
 * Convert a Julian Date value to a JavaScript `Date`.
 *
 * Throws if the Julian Date is outside the representable UTC range.
 */
export declare function jdToDate(jd: number): Date
/**
 * Convert a Modified Julian Date value to a JavaScript `Date`.
 *
 * Throws if the MJD is outside the representable UTC range.
 */
export declare function mjdToDate(mjd: number): Date
/** Signed difference `jd1 − jd2` in days. */
export declare function jdDifference(jd1: number, jd2: number): number
/** Signed difference `mjd1 − mjd2` in days. */
export declare function mjdDifference(mjd1: number, mjd2: number): number
/** Return the tempoch-node version string. */
export declare function version(): string

/* ------------------------------------------------------------------ */
/*  JulianDate                                                         */
/* ------------------------------------------------------------------ */

/**
 * A Julian Date — continuous count of days from the Julian Period origin.
 *
 * The Julian Date for J2000.0 is **2 451 545.0** (2000-01-01 12:00:00 TT).
 *
 * ```js
 * const { JulianDate } = require('@siderust/tempoch');
 *
 * // Construct from raw value
 * const jd = new JulianDate(2_451_545.0);
 *
 * // Construct from a JavaScript Date
 * const jd2 = JulianDate.fromDate(new Date('2000-01-01T12:00:00Z'));
 * ```
 */
export declare class JulianDate {
  /**
   * Create a Julian Date from a raw scalar (days since the Julian Period).
   *
   * Throws if `value` is `NaN` or `±Infinity`.
   */
  constructor(value: number)
  /**
   * Create a Julian Date from a JavaScript `Date` object.
   *
   * The UTC timestamp is interpreted as Universal Time and the ΔT
   * correction is applied automatically.
   */
  static fromDate(date: Date): JulianDate
  /**
   * Create a Julian Date from explicit UTC components.
   *
   * `second` may include a fractional part for sub-second precision.
   * All values are in the proleptic Gregorian calendar (UTC).
   */
  static fromUtc(year: number, month: number, day: number, hour: number, minute: number, second: number): JulianDate
  /** The J2000.0 epoch — JD 2 451 545.0 (2000-01-01T12:00:00 TT). */
  static j2000(): JulianDate
  /** Raw Julian Date value (days since the Julian Period origin). */
  get value(): number
  /** The JD value as a `Quantity` in Days. */
  get days(): Quantity
  /** Convert to a `ModifiedJulianDate` (`JD − 2 400 000.5`). */
  toMjd(): ModifiedJulianDate
  /**
   * Convert to a JavaScript `Date` (UTC).
   *
   * Throws if the Julian Date falls outside the range representable by
   * `chrono` (roughly −262 143 to +262 143 CE).
   */
  toDate(): Date
  /**
   * Julian centuries since J2000.0 (T) as a `Quantity`.
   *
   * Used extensively by precession, nutation, and sidereal-time formulae.
   */
  julianCenturies(): Quantity
  /** Julian years since J2000.0 as a `Quantity`. */
  julianYears(): Quantity
  /**
   * Add a time duration, returning a new `JulianDate`.
   *
   * Accepts a `Quantity` (any time unit) or a raw number (days).
   */
  add(duration: Quantity | number): JulianDate
  /**
   * Subtract a time duration, returning a new `JulianDate`.
   *
   * Accepts a `Quantity` (any time unit) or a raw number (days).
   */
  sub(duration: Quantity | number): JulianDate
  /**
   * Add a duration in days, returning a new `JulianDate`.
   * @deprecated Use `add()` instead.
   */
  addDays(days: number): JulianDate
  /** Signed difference `self − other` as a `Quantity` in Days. */
  difference(other: JulianDate): Quantity
  /** Human-readable representation (e.g. `"Julian Day: 2451545 d"`). */
  format(): string
}

/* ------------------------------------------------------------------ */
/*  ModifiedJulianDate                                                 */
/* ------------------------------------------------------------------ */

/**
 * A Modified Julian Date — `JD − 2 400 000.5`.
 *
 * MJD starts at 1858-11-17T00:00:00 UTC (= JD 2 400 000.5).
 * J2000.0 is MJD **51 544.5**.
 *
 * ```js
 * const { ModifiedJulianDate } = require('@siderust/tempoch');
 *
 * const mjd = new ModifiedJulianDate(51_544.5);
 * const mjd2 = ModifiedJulianDate.fromDate(new Date('2000-01-01T12:00:00Z'));
 * ```
 */
export declare class ModifiedJulianDate {
  /**
   * Create a Modified Julian Date from a raw scalar.
   *
   * Throws if `value` is `NaN` or `±Infinity`.
   */
  constructor(value: number)
  /** Create a Modified Julian Date from a JavaScript `Date` object. */
  static fromDate(date: Date): ModifiedJulianDate
  /** Create a Modified Julian Date from explicit UTC components. */
  static fromUtc(year: number, month: number, day: number, hour: number, minute: number, second: number): ModifiedJulianDate
  /** Raw MJD value. */
  get value(): number
  /** The MJD value as a `Quantity` in Days. */
  get days(): Quantity
  /** Convert to a `JulianDate`. */
  toJd(): JulianDate
  /**
   * Convert to a JavaScript `Date` (UTC).
   *
   * Throws if the MJD falls outside the representable UTC range.
   */
  toDate(): Date
  /**
   * Add a time duration, returning a new `ModifiedJulianDate`.
   *
   * Accepts a `Quantity` (any time unit) or a raw number (days).
   */
  add(duration: Quantity | number): ModifiedJulianDate
  /**
   * Subtract a time duration, returning a new `ModifiedJulianDate`.
   *
   * Accepts a `Quantity` (any time unit) or a raw number (days).
   */
  sub(duration: Quantity | number): ModifiedJulianDate
  /**
   * Add a duration in days, returning a new `ModifiedJulianDate`.
   * @deprecated Use `add()` instead.
   */
  addDays(days: number): ModifiedJulianDate
  /** Signed difference `self − other` as a `Quantity` in Days. */
  difference(other: ModifiedJulianDate): Quantity
  /** Human-readable representation (e.g. `"MJD 51544.5 d"`). */
  format(): string
}

/* ------------------------------------------------------------------ */
/*  Period                                                             */
/* ------------------------------------------------------------------ */

/**
 * A time period (interval) defined by two MJD endpoints.
 *
 * Intervals are half-open `[start, end)`: `start` is included, `end` is
 * excluded from containment tests.
 *
 * ```js
 * const { Period } = require('@siderust/tempoch');
 *
 * const p = new Period(51_544.5, 51_545.5);  // one-day period at J2000
 * console.log(p.durationDays());             // 1
 * console.log(p.contains(51_545.0));         // true
 * ```
 */
export declare class Period {
  /**
   * Create a period from two MJD values or `ModifiedJulianDate` objects.
   *
   * Throws if `start > end`.
   */
  constructor(start: number | ModifiedJulianDate, end: number | ModifiedJulianDate)
  /**
   * Create a period from two JavaScript `Date` objects.
   *
   * Throws if `start > end`.
   */
  static fromDates(start: Date, end: Date): Period
  /** Start of the period as a raw MJD value. */
  get startMjd(): number
  /** End of the period as a raw MJD value. */
  get endMjd(): number
  /** Start as a `ModifiedJulianDate` object. */
  get start(): ModifiedJulianDate
  /** End as a `ModifiedJulianDate` object. */
  get end(): ModifiedJulianDate
  /** Duration of the period as a `Quantity` in Days. */
  duration(): Quantity
  /** Duration of the period in days (raw number). */
  durationDays(): number
  /**
   * Return the overlapping sub-period, or `null` if they do not overlap.
   *
   * Periods are half-open `[start, end)`: two periods that share only an
   * endpoint are considered non-overlapping.
   */
  intersection(other: Period): Period | null
  /** Return `true` if the value falls inside `[start, end)`. */
  contains(mjd: number | ModifiedJulianDate): boolean
  /**
   * Return start and end as millisecond timestamps (ms since Unix epoch).
   *
   * Construct JS `Date` objects with:
   * ```js
   * const { startMs, endMs } = period.toUtc();
   * const startDate = new Date(startMs);
   * ```
   *
   * Throws if either endpoint is outside the representable UTC range.
   */
  toUtc(): UtcBounds
  /** Human-readable representation. */
  format(): string
}
