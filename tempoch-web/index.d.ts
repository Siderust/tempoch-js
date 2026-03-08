/* tslint:disable */
/* eslint-disable */

import { Quantity } from '@siderust/qtty-web'

// ── Initialization ──────────────────────────────────────────────────
/**
 * Initialise the WASM module.  Must be awaited before calling any other
 * function in this package.
 *
 * ```ts
 * import { init } from '@siderust/tempoch-web';
 * await init();  // or init(wasmUrl)
 * ```
 */
export declare function init(
  module_or_path?: RequestInfo | URL | Response | BufferSource | WebAssembly.Module
): Promise<void>

// ── Interfaces ──────────────────────────────────────────────────────

export interface UtcBounds {
  startMs: number
  endMs: number
}

// ── Free functions ──────────────────────────────────────────────────

export declare function jdToMjd(jd: number): number
export declare function mjdToJd(mjd: number): number
export declare function julianCenturies(jd: number): number
export declare function julianYears(jd: number): number
export declare function jdFromDate(date: Date): number
export declare function mjdFromDate(date: Date): number
export declare function jdToDate(jd: number): Date
export declare function mjdToDate(mjd: number): Date
export declare function jdDifference(jd1: number, jd2: number): number
export declare function mjdDifference(mjd1: number, mjd2: number): number
export declare function version(): string

// ── JulianDate ──────────────────────────────────────────────────────

export declare class JulianDate {
  constructor(value: number)
  static fromDate(date: Date): JulianDate
  static fromUtc(year: number, month: number, day: number, hour: number, minute: number, second: number): JulianDate
  static j2000(): JulianDate
  get value(): number
  get days(): Quantity
  toMjd(): ModifiedJulianDate
  toDate(): Date
  julianCenturies(): Quantity
  julianYears(): Quantity
  add(duration: Quantity | number): JulianDate
  sub(duration: Quantity | number): JulianDate
  /** @deprecated Use `add()` instead. */
  addDays(days: number): JulianDate
  difference(other: JulianDate): Quantity
  format(): string
}

// ── ModifiedJulianDate ──────────────────────────────────────────────

export declare class ModifiedJulianDate {
  constructor(value: number)
  static fromDate(date: Date): ModifiedJulianDate
  static fromUtc(year: number, month: number, day: number, hour: number, minute: number, second: number): ModifiedJulianDate
  get value(): number
  get days(): Quantity
  toJd(): JulianDate
  toDate(): Date
  add(duration: Quantity | number): ModifiedJulianDate
  sub(duration: Quantity | number): ModifiedJulianDate
  /** @deprecated Use `add()` instead. */
  addDays(days: number): ModifiedJulianDate
  difference(other: ModifiedJulianDate): Quantity
  format(): string
}

// ── Period ───────────────────────────────────────────────────────────

export declare class Period {
  constructor(start: number | ModifiedJulianDate, end: number | ModifiedJulianDate)
  static fromDates(start: Date, end: Date): Period
  get startMjd(): number
  get endMjd(): number
  get start(): ModifiedJulianDate
  get end(): ModifiedJulianDate
  duration(): Quantity
  durationDays(): number
  intersection(other: Period): Period | null
  contains(mjd: number | ModifiedJulianDate): boolean
  toUtc(): UtcBounds
  format(): string
}
