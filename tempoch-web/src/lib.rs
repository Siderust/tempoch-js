//! Browser/WASM bindings for `tempoch` astronomical time primitives — free-function backend.
//!
//! This crate provides the same set of primitive free functions as the Node
//! backend (`tempoch-node`) but using `wasm-bindgen` instead of `napi-rs`.
//! The public JS façade classes (`JulianDate`, `ModifiedJulianDate`, `Period`)
//! are shared across both backends.

use chrono::{DateTime, NaiveDate, Utc};
use qtty::Days;
use tempoch::{Interval, JulianDate as RustJD, ModifiedJulianDate as RustMJD, TimeInstant, JD, MJD};
use wasm_bindgen::prelude::*;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/// Convert a JS timestamp (milliseconds since Unix epoch) to `chrono`.
fn ms_to_chrono(ms: f64) -> Result<DateTime<Utc>, JsValue> {
    DateTime::from_timestamp_millis(ms as i64)
        .ok_or_else(|| JsValue::from_str("Date value is outside representable UTC range"))
}

/// Convert `chrono::DateTime<Utc>` to a JS timestamp (milliseconds).
fn chrono_to_ms(dt: DateTime<Utc>) -> f64 {
    dt.timestamp_millis() as f64
}

// ─────────────────────────────────────────────────────────────────────────────
// JD / MJD conversion
// ─────────────────────────────────────────────────────────────────────────────

/// Convert a Julian Date to a Modified Julian Date value.
///
/// `mjd = jd − 2 400 000.5`
#[wasm_bindgen(js_name = "jdToMjd")]
pub fn jd_to_mjd(jd: f64) -> f64 {
    RustJD::new(jd).to::<MJD>().value()
}

/// Convert a Modified Julian Date to a Julian Date value.
///
/// `jd = mjd + 2 400 000.5`
#[wasm_bindgen(js_name = "mjdToJd")]
pub fn mjd_to_jd(mjd: f64) -> f64 {
    RustMJD::new(mjd).to::<JD>().value()
}

// ─────────────────────────────────────────────────────────────────────────────
// Epoch-based quantities
// ─────────────────────────────────────────────────────────────────────────────

/// Compute Julian centuries since J2000.0 for a Julian Date.
#[wasm_bindgen(js_name = "julianCenturies")]
pub fn julian_centuries(jd: f64) -> f64 {
    RustJD::new(jd).julian_centuries().value()
}

/// Compute Julian years since J2000.0 for a Julian Date.
#[wasm_bindgen(js_name = "julianYears")]
pub fn julian_years(jd: f64) -> f64 {
    RustJD::new(jd).julian_years().value()
}

// ─────────────────────────────────────────────────────────────────────────────
// Date ↔ JD/MJD (using ms timestamps in WASM)
// ─────────────────────────────────────────────────────────────────────────────

/// Convert a millisecond timestamp (from `Date.getTime()`) to a Julian Date.
#[wasm_bindgen(js_name = "jdFromMs")]
pub fn jd_from_ms(ms: f64) -> Result<f64, JsValue> {
    let dt = ms_to_chrono(ms)?;
    Ok(RustJD::from_utc(dt).value())
}

/// Convert a millisecond timestamp (from `Date.getTime()`) to a MJD.
#[wasm_bindgen(js_name = "mjdFromMs")]
pub fn mjd_from_ms(ms: f64) -> Result<f64, JsValue> {
    let dt = ms_to_chrono(ms)?;
    Ok(RustMJD::from_utc(dt).value())
}

/// Convert a Julian Date to a millisecond timestamp.
///
/// Throws if the JD is outside the representable UTC range.
#[wasm_bindgen(js_name = "jdToMs")]
pub fn jd_to_ms(jd: f64) -> Result<f64, JsValue> {
    let dt = RustJD::new(jd)
        .to_utc()
        .ok_or_else(|| JsValue::from_str("Julian date is outside the representable UTC range"))?;
    Ok(chrono_to_ms(dt))
}

/// Convert a Modified Julian Date to a millisecond timestamp.
///
/// Throws if the MJD is outside the representable UTC range.
#[wasm_bindgen(js_name = "mjdToMs")]
pub fn mjd_to_ms(mjd: f64) -> Result<f64, JsValue> {
    let dt = RustMJD::new(mjd)
        .to_utc()
        .ok_or_else(|| JsValue::from_str("MJD is outside the representable UTC range"))?;
    Ok(chrono_to_ms(dt))
}

// ─────────────────────────────────────────────────────────────────────────────
// UTC components → JD/MJD
// ─────────────────────────────────────────────────────────────────────────────

/// Create a Julian Date from explicit UTC components.
///
/// The ΔT correction is applied automatically.
#[wasm_bindgen(js_name = "jdFromUtc")]
pub fn jd_from_utc(
    year: i32,
    month: u32,
    day: u32,
    hour: u32,
    minute: u32,
    second: f64,
) -> Result<f64, JsValue> {
    let whole_sec = second.floor() as u32;
    let nanos = (second.fract() * 1_000_000_000.0) as u32;
    let naive = NaiveDate::from_ymd_opt(year, month, day)
        .and_then(|d| d.and_hms_nano_opt(hour, minute, whole_sec, nanos))
        .ok_or_else(|| JsValue::from_str("Invalid UTC date/time components"))?;
    let dt = DateTime::<Utc>::from_naive_utc_and_offset(naive, Utc);
    Ok(RustJD::from_utc(dt).value())
}

/// Create a Modified Julian Date from explicit UTC components.
#[wasm_bindgen(js_name = "mjdFromUtc")]
pub fn mjd_from_utc(
    year: i32,
    month: u32,
    day: u32,
    hour: u32,
    minute: u32,
    second: f64,
) -> Result<f64, JsValue> {
    let whole_sec = second.floor() as u32;
    let nanos = (second.fract() * 1_000_000_000.0) as u32;
    let naive = NaiveDate::from_ymd_opt(year, month, day)
        .and_then(|d| d.and_hms_nano_opt(hour, minute, whole_sec, nanos))
        .ok_or_else(|| JsValue::from_str("Invalid UTC date/time components"))?;
    let dt = DateTime::<Utc>::from_naive_utc_and_offset(naive, Utc);
    Ok(RustMJD::from_utc(dt).value())
}

// ─────────────────────────────────────────────────────────────────────────────
// Arithmetic
// ─────────────────────────────────────────────────────────────────────────────

/// Add days to a Julian Date, returning the new JD value.
#[wasm_bindgen(js_name = "jdAddDays")]
pub fn jd_add_days(jd: f64, days: f64) -> f64 {
    RustJD::new(jd).add_duration(Days::new(days)).value()
}

/// Add days to a Modified Julian Date, returning the new MJD value.
#[wasm_bindgen(js_name = "mjdAddDays")]
pub fn mjd_add_days(mjd: f64, days: f64) -> f64 {
    RustMJD::new(mjd).add_duration(Days::new(days)).value()
}

/// Signed difference `jd1 − jd2` in days.
#[wasm_bindgen(js_name = "jdDifference")]
pub fn jd_difference(jd1: f64, jd2: f64) -> f64 {
    RustJD::new(jd1).difference(&RustJD::new(jd2)).value()
}

/// Signed difference `mjd1 − mjd2` in days.
#[wasm_bindgen(js_name = "mjdDifference")]
pub fn mjd_difference(mjd1: f64, mjd2: f64) -> f64 {
    RustMJD::new(mjd1).difference(&RustMJD::new(mjd2)).value()
}

// ─────────────────────────────────────────────────────────────────────────────
// Version
// ─────────────────────────────────────────────────────────────────────────────

/// Return the tempoch-web version string.
#[wasm_bindgen(js_name = "version")]
pub fn version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}
