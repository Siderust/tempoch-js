// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Vallés Puig, Ramon

#![deny(clippy::all)]

use chrono::{DateTime, NaiveDate, Utc};
use napi::bindgen_prelude::*;
use napi_derive::napi;
use qtty::Days;
use tempoch::{
    Interval, JulianDate as RustJD, ModifiedJulianDate as RustMJD, TimeInstant, JD, MJD,
};

// ═══════════════════════════════════════════════════════════════════════════
// Conversion helpers
// ═══════════════════════════════════════════════════════════════════════════

/// Convert a JavaScript Date (f64 milliseconds since Unix epoch) to
/// `chrono::DateTime<Utc>`.
fn date_to_chrono(date: Date) -> napi::Result<DateTime<Utc>> {
    let ms = date.value_of()? as i64;
    DateTime::from_timestamp_millis(ms)
        .ok_or_else(|| napi::Error::from_reason("Date value is outside representable UTC range"))
}

/// Convert a `chrono::DateTime<Utc>` to a JavaScript Date.
fn chrono_to_date(env: &Env, dt: DateTime<Utc>) -> napi::Result<Date> {
    env.create_date(dt.timestamp_millis() as f64)
}

// ═══════════════════════════════════════════════════════════════════════════
// UtcBounds — plain object returned by Period.toUtc()
// ═══════════════════════════════════════════════════════════════════════════

/// UTC bounds of a [`Period`] expressed as millisecond timestamps.
///
/// Construct JS `Date` objects with `new Date(bounds.startMs)`.
#[napi(object)]
pub struct UtcBounds {
    /// Start instant in milliseconds since Unix epoch.
    pub start_ms: f64,
    /// End instant in milliseconds since Unix epoch.
    pub end_ms: f64,
}

// ═══════════════════════════════════════════════════════════════════════════
// JulianDate
// ═══════════════════════════════════════════════════════════════════════════

/// A Julian Date — continuous count of days from the Julian Period origin.
///
/// The Julian Date for J2000.0 is **2 451 545.0** (2000-01-01 12:00:00 TT).
///
/// ```js
/// const { JulianDate } = require('@siderust/tempoch');
///
/// // Construct from raw value
/// const jd = new JulianDate(2_451_545.0);
///
/// // Construct from a JavaScript Date
/// const jd2 = JulianDate.fromDate(new Date('2000-01-01T12:00:00Z'));
/// ```
#[napi(js_name = "JulianDate")]
pub struct JsJulianDate {
    pub(crate) inner: RustJD,
}

#[napi]
impl JsJulianDate {
    // ── constructors ─────────────────────────────────────────────────

    /// Create a Julian Date from a raw scalar (days since the Julian Period).
    ///
    /// Throws if `value` is `NaN` or `±Infinity`.
    #[napi(constructor)]
    pub fn new(value: f64) -> napi::Result<Self> {
        if !value.is_finite() {
            return Err(napi::Error::from_reason(
                "Julian date value must be finite (not NaN or ±infinity)",
            ));
        }
        Ok(Self {
            inner: RustJD::new(value),
        })
    }

    /// Create a Julian Date from a JavaScript `Date` object.
    ///
    /// The UTC timestamp is interpreted as Universal Time and the ΔT
    /// correction is applied automatically.
    #[napi(factory)]
    pub fn from_date(date: Date) -> napi::Result<Self> {
        let dt = date_to_chrono(date)?;
        Ok(Self {
            inner: RustJD::from_utc(dt),
        })
    }

    /// Create a Julian Date from explicit UTC components.
    ///
    /// `second` may include a fractional part for sub-second precision.
    /// All values are in the proleptic Gregorian calendar (UTC).
    #[napi(factory)]
    pub fn from_utc(
        year: i32,
        month: u8,
        day: u8,
        hour: u8,
        minute: u8,
        second: f64,
    ) -> napi::Result<Self> {
        let whole_sec = second.floor() as u32;
        let nanos = (second.fract() * 1_000_000_000.0) as u32;
        let naive = NaiveDate::from_ymd_opt(year, month as u32, day as u32)
            .and_then(|d| d.and_hms_nano_opt(hour as u32, minute as u32, whole_sec, nanos))
            .ok_or_else(|| napi::Error::from_reason("Invalid UTC date/time components"))?;
        let dt = DateTime::<Utc>::from_naive_utc_and_offset(naive, Utc);
        Ok(Self {
            inner: RustJD::from_utc(dt),
        })
    }

    /// The J2000.0 epoch — JD 2 451 545.0 (2000-01-01T12:00:00 TT).
    #[napi(factory)]
    pub fn j2000() -> Self {
        Self {
            inner: RustJD::J2000,
        }
    }

    // ── accessors ────────────────────────────────────────────────────

    /// Raw Julian Date value (days since the Julian Period origin).
    #[napi(getter)]
    pub fn value(&self) -> f64 {
        self.inner.value()
    }

    // ── conversions ──────────────────────────────────────────────────

    /// Convert to a [`ModifiedJulianDate`] (`JD − 2 400 000.5`).
    #[napi(js_name = "toMjd")]
    pub fn to_mjd(&self) -> JsModifiedJulianDate {
        JsModifiedJulianDate {
            inner: self.inner.to::<MJD>(),
        }
    }

    /// Convert to a JavaScript `Date` (UTC).
    ///
    /// Throws if the Julian Date falls outside the range representable by
    /// `chrono` (roughly −262 143 to +262 143 CE).
    #[napi(js_name = "toDate")]
    pub fn to_date(&self, env: Env) -> napi::Result<Date> {
        let dt = self.inner.to_utc().ok_or_else(|| {
            napi::Error::from_reason("Julian date is outside the representable UTC range")
        })?;
        chrono_to_date(&env, dt)
    }

    // ── epoch-based quantities ────────────────────────────────────────

    /// Julian centuries since J2000.0 (T).
    ///
    /// Used extensively by precession, nutation, and sidereal-time formulae.
    #[napi(js_name = "julianCenturies")]
    pub fn julian_centuries(&self) -> f64 {
        self.inner.julian_centuries().value()
    }

    /// Julian years since J2000.0.
    #[napi(js_name = "julianYears")]
    pub fn julian_years(&self) -> f64 {
        self.inner.julian_years().value()
    }

    // ── arithmetic ───────────────────────────────────────────────────

    /// Add a duration in days, returning a new `JulianDate`.
    #[napi(js_name = "addDays")]
    pub fn add_days(&self, days: f64) -> napi::Result<JsJulianDate> {
        if !days.is_finite() {
            return Err(napi::Error::from_reason("days must be finite"));
        }
        Ok(Self {
            inner: self.inner.add_duration(Days::new(days)),
        })
    }

    /// Signed difference `self − other` in days.
    #[napi]
    pub fn difference(&self, other: &JsJulianDate) -> f64 {
        self.inner.difference(&other.inner).value()
    }

    // ── formatting ───────────────────────────────────────────────────

    /// Human-readable representation (e.g. `"Julian Day: 2451545 d"`).
    #[napi]
    pub fn format(&self) -> String {
        format!("{}", self.inner)
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// ModifiedJulianDate
// ═══════════════════════════════════════════════════════════════════════════

/// A Modified Julian Date — `JD − 2 400 000.5`.
///
/// MJD starts at 1858-11-17T00:00:00 UTC (= JD 2 400 000.5).
/// J2000.0 is MJD **51 544.5**.
///
/// ```js
/// const { ModifiedJulianDate } = require('@siderust/tempoch');
///
/// const mjd = new ModifiedJulianDate(51_544.5);
/// const mjd2 = ModifiedJulianDate.fromDate(new Date('2000-01-01T12:00:00Z'));
/// ```
#[napi(js_name = "ModifiedJulianDate")]
pub struct JsModifiedJulianDate {
    pub(crate) inner: RustMJD,
}

#[napi]
impl JsModifiedJulianDate {
    // ── constructors ─────────────────────────────────────────────────

    /// Create a Modified Julian Date from a raw scalar.
    ///
    /// Throws if `value` is `NaN` or `±Infinity`.
    #[napi(constructor)]
    pub fn new(value: f64) -> napi::Result<Self> {
        if !value.is_finite() {
            return Err(napi::Error::from_reason(
                "MJD value must be finite (not NaN or ±infinity)",
            ));
        }
        Ok(Self {
            inner: RustMJD::new(value),
        })
    }

    /// Create a Modified Julian Date from a JavaScript `Date` object.
    #[napi(factory)]
    pub fn from_date(date: Date) -> napi::Result<Self> {
        let dt = date_to_chrono(date)?;
        Ok(Self {
            inner: RustMJD::from_utc(dt),
        })
    }

    /// Create a Modified Julian Date from explicit UTC components.
    #[napi(factory)]
    pub fn from_utc(
        year: i32,
        month: u8,
        day: u8,
        hour: u8,
        minute: u8,
        second: f64,
    ) -> napi::Result<Self> {
        let whole_sec = second.floor() as u32;
        let nanos = (second.fract() * 1_000_000_000.0) as u32;
        let naive = NaiveDate::from_ymd_opt(year, month as u32, day as u32)
            .and_then(|d| d.and_hms_nano_opt(hour as u32, minute as u32, whole_sec, nanos))
            .ok_or_else(|| napi::Error::from_reason("Invalid UTC date/time components"))?;
        let dt = DateTime::<Utc>::from_naive_utc_and_offset(naive, Utc);
        Ok(Self {
            inner: RustMJD::from_utc(dt),
        })
    }

    // ── accessors ────────────────────────────────────────────────────

    /// Raw MJD value.
    #[napi(getter)]
    pub fn value(&self) -> f64 {
        self.inner.value()
    }

    // ── conversions ──────────────────────────────────────────────────

    /// Convert to a [`JulianDate`].
    #[napi(js_name = "toJd")]
    pub fn to_jd(&self) -> JsJulianDate {
        JsJulianDate {
            inner: self.inner.to::<JD>(),
        }
    }

    /// Convert to a JavaScript `Date` (UTC).
    ///
    /// Throws if the MJD falls outside the representable UTC range.
    #[napi(js_name = "toDate")]
    pub fn to_date(&self, env: Env) -> napi::Result<Date> {
        let dt = self.inner.to_utc().ok_or_else(|| {
            napi::Error::from_reason("MJD is outside the representable UTC range")
        })?;
        chrono_to_date(&env, dt)
    }

    // ── arithmetic ───────────────────────────────────────────────────

    /// Add a duration in days, returning a new `ModifiedJulianDate`.
    #[napi(js_name = "addDays")]
    pub fn add_days(&self, days: f64) -> napi::Result<JsModifiedJulianDate> {
        if !days.is_finite() {
            return Err(napi::Error::from_reason("days must be finite"));
        }
        Ok(Self {
            inner: self.inner.add_duration(Days::new(days)),
        })
    }

    /// Signed difference `self − other` in days.
    #[napi]
    pub fn difference(&self, other: &JsModifiedJulianDate) -> f64 {
        self.inner.difference(&other.inner).value()
    }

    // ── formatting ───────────────────────────────────────────────────

    /// Human-readable representation (e.g. `"MJD 51544.5 d"`).
    #[napi]
    pub fn format(&self) -> String {
        format!("{}", self.inner)
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// Period
// ═══════════════════════════════════════════════════════════════════════════

/// A time period (interval) defined by two MJD endpoints.
///
/// Intervals are half-open `[start, end)`: `start` is included, `end` is
/// excluded from containment tests.
///
/// ```js
/// const { Period } = require('@siderust/tempoch');
///
/// const p = new Period(51_544.5, 51_545.5);  // one-day period at J2000
/// console.log(p.durationDays());             // 1
/// console.log(p.contains(51_545.0));         // true
/// ```
#[napi(js_name = "Period")]
pub struct JsPeriod {
    pub(crate) inner: Interval<RustMJD>,
}

#[napi]
impl JsPeriod {
    // ── constructors ─────────────────────────────────────────────────

    /// Create a period from two MJD values.
    ///
    /// Throws if `startMjd > endMjd`.
    #[napi(constructor)]
    pub fn new(start_mjd: f64, end_mjd: f64) -> napi::Result<Self> {
        if !start_mjd.is_finite() || !end_mjd.is_finite() {
            return Err(napi::Error::from_reason("Period endpoints must be finite"));
        }
        if start_mjd > end_mjd {
            return Err(napi::Error::from_reason(
                "Period start must not be after end",
            ));
        }
        Ok(Self {
            inner: Interval::new(RustMJD::new(start_mjd), RustMJD::new(end_mjd)),
        })
    }

    /// Create a period from two JavaScript `Date` objects.
    ///
    /// Throws if `start > end`.
    #[napi(factory)]
    pub fn from_dates(start: Date, end: Date) -> napi::Result<Self> {
        let start_dt = date_to_chrono(start)?;
        let end_dt = date_to_chrono(end)?;
        let start_mjd = RustMJD::from_utc(start_dt);
        let end_mjd = RustMJD::from_utc(end_dt);
        if start_mjd > end_mjd {
            return Err(napi::Error::from_reason(
                "Period start must not be after end",
            ));
        }
        Ok(Self {
            inner: Interval::new(start_mjd, end_mjd),
        })
    }

    // ── accessors ────────────────────────────────────────────────────

    /// Start of the period as a raw MJD value.
    #[napi(getter, js_name = "startMjd")]
    pub fn start_mjd(&self) -> f64 {
        self.inner.start.value()
    }

    /// End of the period as a raw MJD value.
    #[napi(getter, js_name = "endMjd")]
    pub fn end_mjd(&self) -> f64 {
        self.inner.end.value()
    }

    /// Start as a [`ModifiedJulianDate`] object.
    #[napi(getter)]
    pub fn start(&self) -> JsModifiedJulianDate {
        JsModifiedJulianDate {
            inner: self.inner.start,
        }
    }

    /// End as a [`ModifiedJulianDate`] object.
    #[napi(getter)]
    pub fn end(&self) -> JsModifiedJulianDate {
        JsModifiedJulianDate {
            inner: self.inner.end,
        }
    }

    // ── duration ─────────────────────────────────────────────────────

    /// Duration of the period in days.
    #[napi(js_name = "durationDays")]
    pub fn duration_days(&self) -> f64 {
        self.inner.duration_days().value()
    }

    // ── set operations ───────────────────────────────────────────────

    /// Return the overlapping sub-period, or `null` if they do not overlap.
    ///
    /// Periods are half-open `[start, end)`: two periods that share only an
    /// endpoint are considered non-overlapping.
    #[napi]
    pub fn intersection(&self, other: &JsPeriod) -> Option<JsPeriod> {
        self.inner
            .intersection(&other.inner)
            .map(|p| JsPeriod { inner: p })
    }

    /// Return `true` if the MJD value falls inside `[start, end)`.
    #[napi]
    pub fn contains(&self, mjd: f64) -> bool {
        let t = RustMJD::new(mjd);
        t >= self.inner.start && t < self.inner.end
    }

    // ── conversions ──────────────────────────────────────────────────

    /// Return start and end as millisecond timestamps (ms since Unix epoch).
    ///
    /// Construct JS `Date` objects with:
    /// ```js
    /// const { startMs, endMs } = period.toUtc();
    /// const startDate = new Date(startMs);
    /// ```
    ///
    /// Throws if either endpoint is outside the representable UTC range.
    #[napi(js_name = "toUtc")]
    pub fn to_utc(&self) -> napi::Result<UtcBounds> {
        let start_dt = self.inner.start.to_utc().ok_or_else(|| {
            napi::Error::from_reason("Period start is outside the representable UTC range")
        })?;
        let end_dt = self.inner.end.to_utc().ok_or_else(|| {
            napi::Error::from_reason("Period end is outside the representable UTC range")
        })?;
        Ok(UtcBounds {
            start_ms: start_dt.timestamp_millis() as f64,
            end_ms: end_dt.timestamp_millis() as f64,
        })
    }

    // ── formatting ───────────────────────────────────────────────────

    /// Human-readable representation.
    #[napi]
    pub fn format(&self) -> String {
        format!(
            "Period(MJD {:.6} to MJD {:.6})",
            self.inner.start.value(),
            self.inner.end.value()
        )
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// Free conversion functions
// ═══════════════════════════════════════════════════════════════════════════

/// Convert a Julian Date to a Modified Julian Date value.
///
/// `mjd = jd − 2 400 000.5`
#[napi(js_name = "jdToMjd")]
pub fn jd_to_mjd(jd: f64) -> f64 {
    RustJD::new(jd).to::<MJD>().value()
}

/// Convert a Modified Julian Date to a Julian Date value.
///
/// `jd = mjd + 2 400 000.5`
#[napi(js_name = "mjdToJd")]
pub fn mjd_to_jd(mjd: f64) -> f64 {
    RustMJD::new(mjd).to::<JD>().value()
}

/// Compute Julian centuries since J2000.0 for a Julian Date.
#[napi(js_name = "julianCenturies")]
pub fn julian_centuries(jd: f64) -> f64 {
    RustJD::new(jd).julian_centuries().value()
}

/// Compute Julian years since J2000.0 for a Julian Date.
#[napi(js_name = "julianYears")]
pub fn julian_years(jd: f64) -> f64 {
    RustJD::new(jd).julian_years().value()
}

/// Convert a JavaScript `Date` to a Julian Date value.
#[napi(js_name = "jdFromDate")]
pub fn jd_from_date(date: Date) -> napi::Result<f64> {
    let dt = date_to_chrono(date)?;
    Ok(RustJD::from_utc(dt).value())
}

/// Convert a JavaScript `Date` to a Modified Julian Date value.
#[napi(js_name = "mjdFromDate")]
pub fn mjd_from_date(date: Date) -> napi::Result<f64> {
    let dt = date_to_chrono(date)?;
    Ok(RustMJD::from_utc(dt).value())
}

/// Convert a Julian Date value to a JavaScript `Date`.
///
/// Throws if the Julian Date is outside the representable UTC range.
#[napi(js_name = "jdToDate")]
pub fn jd_to_date(env: Env, jd: f64) -> napi::Result<Date> {
    let dt = RustJD::new(jd).to_utc().ok_or_else(|| {
        napi::Error::from_reason("Julian date is outside the representable UTC range")
    })?;
    chrono_to_date(&env, dt)
}

/// Convert a Modified Julian Date value to a JavaScript `Date`.
///
/// Throws if the MJD is outside the representable UTC range.
#[napi(js_name = "mjdToDate")]
pub fn mjd_to_date(env: Env, mjd: f64) -> napi::Result<Date> {
    let dt = RustMJD::new(mjd).to_utc().ok_or_else(|| {
        napi::Error::from_reason("MJD is outside the representable UTC range")
    })?;
    chrono_to_date(&env, dt)
}

/// Signed difference `jd1 − jd2` in days.
#[napi(js_name = "jdDifference")]
pub fn jd_difference(jd1: f64, jd2: f64) -> f64 {
    RustJD::new(jd1).difference(&RustJD::new(jd2)).value()
}

/// Signed difference `mjd1 − mjd2` in days.
#[napi(js_name = "mjdDifference")]
pub fn mjd_difference(mjd1: f64, mjd2: f64) -> f64 {
    RustMJD::new(mjd1).difference(&RustMJD::new(mjd2)).value()
}

/// Return the tempoch-node version string.
#[napi(js_name = "version")]
pub fn version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}
