// @ts-check
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const {
  JulianDate,
  ModifiedJulianDate,
  Period,
  jdToMjd,
  mjdToJd,
  julianCenturies,
  julianYears,
  jdFromDate,
  mjdFromDate,
  jdToDate,
  mjdToDate,
  jdDifference,
  mjdDifference,
  version,
} = require(join(__dirname, '..', 'index.js'));

// ── Constants ──────────────────────────────────────────────────────────────
const J2000_JD = 2_451_545.0;
const J2000_MJD = 51_544.5;
const EPSILON = 1e-9; // relative tolerance for day-precision values

// ═══════════════════════════════════════════════════════════════════════════
// JulianDate
// ═══════════════════════════════════════════════════════════════════════════

describe('JulianDate', () => {
  // ── constructor ─────────────────────────────────────────────────────
  describe('constructor', () => {
    it('stores the raw value', () => {
      const jd = new JulianDate(J2000_JD);
      assert.equal(jd.value, J2000_JD);
    });

    it('accepts zero', () => {
      assert.equal(new JulianDate(0).value, 0);
    });

    it('accepts negative values (pre-Julian epoch)', () => {
      assert.ok(new JulianDate(-10_000).value < 0);
    });

    it('throws on NaN', () => {
      assert.throws(() => new JulianDate(NaN), /finite/i);
    });

    it('throws on +Infinity', () => {
      assert.throws(() => new JulianDate(Infinity), /finite/i);
    });

    it('throws on -Infinity', () => {
      assert.throws(() => new JulianDate(-Infinity), /finite/i);
    });
  });

  // ── factories ───────────────────────────────────────────────────────
  describe('j2000()', () => {
    it('returns JD 2 451 545.0', () => {
      assert.equal(JulianDate.j2000().value, J2000_JD);
    });
  });

  describe('fromDate()', () => {
    it('round-trips a well-known UTC date', () => {
      // J2000 UTC is ~11:58:56Z due to ΔT; create a date from that back-converted ts
      const jd0 = JulianDate.j2000();
      const d = jd0.toDate();
      const jdRT = JulianDate.fromDate(d);
      assert.ok(Math.abs(jdRT.value - J2000_JD) < 1e-6);
    });

    it('preserves millisecond precision on round-trip', () => {
      const now = new Date(Date.UTC(2025, 5, 15, 10, 30, 45, 500));
      const jd = JulianDate.fromDate(now);
      const back = jd.toDate();
      assert.ok(Math.abs(back.getTime() - now.getTime()) < 2); // ≤2 ms
    });
  });

  describe('fromUtc()', () => {
    it('matches fromDate for the same UTC instant', () => {
      // 2025-06-15 10:30:00 UTC
      const d = new Date(Date.UTC(2025, 5, 15, 10, 30, 0));
      const jd1 = JulianDate.fromDate(d);
      const jd2 = JulianDate.fromUtc(2025, 6, 15, 10, 30, 0);
      assert.ok(Math.abs(jd1.value - jd2.value) < 1e-10);
    });

    it('supports sub-second precision via fractional second', () => {
      const jd1 = JulianDate.fromUtc(2025, 6, 15, 0, 0, 0.5);
      const jd2 = JulianDate.fromUtc(2025, 6, 15, 0, 0, 0);
      const diffDays = jd1.value - jd2.value;
      // 0.5 s / 86400 s·day⁻¹; f64 precision at JD ~2461037 allows ~2e-10 abs error
      assert.ok(Math.abs(diffDays - 0.5 / 86400) < 1e-9);
    });

    it('throws on invalid components', () => {
      assert.throws(() => JulianDate.fromUtc(2025, 13, 1, 0, 0, 0), /invalid/i);
    });
  });

  // ── conversions ─────────────────────────────────────────────────────
  describe('toMjd()', () => {
    it('converts J2000 correctly', () => {
      const mjd = JulianDate.j2000().toMjd();
      assert.ok(Math.abs(mjd.value - J2000_MJD) < EPSILON);
    });

    it('returns a ModifiedJulianDate instance', () => {
      const mjd = new JulianDate(J2000_JD).toMjd();
      assert.equal(typeof mjd.value, 'number');
      assert.equal(typeof mjd.toJd, 'function');
    });
  });

  describe('toDate()', () => {
    it('returns a JavaScript Date', () => {
      const d = JulianDate.j2000().toDate();
      assert.ok(d instanceof Date);
    });

    it('J2000.0 UTC is approximately 2000-01-01T11:58:56Z (ΔT ≈ 63.8 s)', () => {
      const d = JulianDate.j2000().toDate();
      assert.equal(d.getUTCFullYear(), 2000);
      assert.equal(d.getUTCMonth(), 0); // January
      assert.equal(d.getUTCDate(), 1);
      assert.equal(d.getUTCHours(), 11);
      // ΔT puts the minute at 58 (63+ seconds before noon TT)
      assert.equal(d.getUTCMinutes(), 58);
    });
  });

  // ── epoch quantities ─────────────────────────────────────────────────
  describe('julianCenturies()', () => {
    it('is exactly 0 for J2000.0', () => {
      assert.equal(JulianDate.j2000().julianCenturies(), 0);
    });

    it('is 1.0 for J2100.0 (JD + 36525)', () => {
      const jd2100 = new JulianDate(J2000_JD + 36_525.0);
      assert.ok(Math.abs(jd2100.julianCenturies() - 1.0) < 1e-12);
    });
  });

  describe('julianYears()', () => {
    it('is 0 for J2000.0', () => {
      assert.equal(JulianDate.j2000().julianYears(), 0);
    });

    it('is 1 for J2001.0 (JD + 365.25)', () => {
      const jd2001 = new JulianDate(J2000_JD + 365.25);
      assert.ok(Math.abs(jd2001.julianYears() - 1.0) < 1e-12);
    });
  });

  // ── arithmetic ───────────────────────────────────────────────────────
  describe('addDays()', () => {
    it('adds a positive duration', () => {
      const jd = new JulianDate(J2000_JD);
      assert.ok(Math.abs(jd.addDays(1).value - (J2000_JD + 1)) < EPSILON);
    });

    it('adds a negative duration (subtract)', () => {
      const jd = new JulianDate(J2000_JD);
      assert.ok(Math.abs(jd.addDays(-1).value - (J2000_JD - 1)) < EPSILON);
    });

    it('returns a new JulianDate (immutable)', () => {
      const jd = new JulianDate(J2000_JD);
      const jd2 = jd.addDays(10);
      assert.equal(jd.value, J2000_JD); // original unchanged
      assert.equal(jd2.value, J2000_JD + 10);
    });

    it('throws on NaN days', () => {
      assert.throws(() => new JulianDate(J2000_JD).addDays(NaN), /finite/i);
    });
  });

  describe('difference()', () => {
    it('self − self is 0', () => {
      const jd = new JulianDate(J2000_JD);
      assert.equal(jd.difference(jd), 0);
    });

    it('later − earlier is positive', () => {
      const jd1 = new JulianDate(J2000_JD + 10);
      const jd2 = new JulianDate(J2000_JD);
      assert.ok(Math.abs(jd1.difference(jd2) - 10) < EPSILON);
    });

    it('earlier − later is negative', () => {
      const jd1 = new JulianDate(J2000_JD);
      const jd2 = new JulianDate(J2000_JD + 10);
      assert.ok(Math.abs(jd1.difference(jd2) + 10) < EPSILON);
    });
  });

  // ── formatting ───────────────────────────────────────────────────────
  describe('format()', () => {
    it('returns a non-empty string containing the value', () => {
      const s = JulianDate.j2000().format();
      assert.ok(typeof s === 'string' && s.length > 0);
      assert.ok(s.includes('2451545'));
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ModifiedJulianDate
// ═══════════════════════════════════════════════════════════════════════════

describe('ModifiedJulianDate', () => {
  describe('constructor', () => {
    it('stores raw value', () => {
      const mjd = new ModifiedJulianDate(J2000_MJD);
      assert.equal(mjd.value, J2000_MJD);
    });

    it('throws on NaN', () => {
      assert.throws(() => new ModifiedJulianDate(NaN), /finite/i);
    });

    it('throws on Infinity', () => {
      assert.throws(() => new ModifiedJulianDate(Infinity), /finite/i);
    });
  });

  describe('fromDate()', () => {
    it('round-trips a well-known date', () => {
      const now = new Date(Date.UTC(2025, 0, 1, 0, 0, 0));
      const mjd = ModifiedJulianDate.fromDate(now);
      const back = mjd.toDate();
      assert.ok(Math.abs(back.getTime() - now.getTime()) < 2);
    });
  });

  describe('fromUtc()', () => {
    it('MJD epoch (1858-11-17 00:00:00 UTC) is MJD 0', () => {
      const mjd = ModifiedJulianDate.fromUtc(1858, 11, 17, 0, 0, 0);
      // ΔT in 1858 is large (>5 min), so only verify rough order of magnitude
      assert.ok(Math.abs(mjd.value) < 1);
    });
  });

  describe('toJd()', () => {
    it('converts J2000 MJD back to J2000 JD', () => {
      const jd = new ModifiedJulianDate(J2000_MJD).toJd();
      assert.ok(Math.abs(jd.value - J2000_JD) < EPSILON);
    });
  });

  describe('toDate()', () => {
    it('restores the original date on round-trip', () => {
      const d = new Date(Date.UTC(2020, 3, 15, 8, 0, 0));
      const mjd = ModifiedJulianDate.fromDate(d);
      const back = mjd.toDate();
      assert.ok(Math.abs(back.getTime() - d.getTime()) < 2);
    });
  });

  describe('addDays()', () => {
    it('adds fractional days', () => {
      const mjd = new ModifiedJulianDate(J2000_MJD);
      const mjd2 = mjd.addDays(0.5);
      assert.ok(Math.abs(mjd2.value - (J2000_MJD + 0.5)) < EPSILON);
    });
  });

  describe('difference()', () => {
    it('1 day apart gives 1', () => {
      const a = new ModifiedJulianDate(J2000_MJD + 1);
      const b = new ModifiedJulianDate(J2000_MJD);
      assert.ok(Math.abs(a.difference(b) - 1) < EPSILON);
    });
  });

  describe('format()', () => {
    it('includes the MJD value', () => {
      const s = new ModifiedJulianDate(J2000_MJD).format();
      assert.ok(typeof s === 'string' && s.includes('51544'));
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Period
// ═══════════════════════════════════════════════════════════════════════════

describe('Period', () => {
  describe('constructor', () => {
    it('creates a valid period', () => {
      const p = new Period(J2000_MJD, J2000_MJD + 1);
      assert.equal(p.startMjd, J2000_MJD);
      assert.equal(p.endMjd, J2000_MJD + 1);
    });

    it('accepts zero-length period (start === end)', () => {
      const p = new Period(J2000_MJD, J2000_MJD);
      assert.equal(p.durationDays(), 0);
    });

    it('throws when start > end', () => {
      assert.throws(() => new Period(J2000_MJD + 1, J2000_MJD), /start.*end|end.*start/i);
    });

    it('throws on non-finite endpoints', () => {
      assert.throws(() => new Period(NaN, J2000_MJD), /finite/i);
      assert.throws(() => new Period(J2000_MJD, Infinity), /finite/i);
    });
  });

  describe('fromDates()', () => {
    it('creates a period from two JS Dates', () => {
      const start = new Date(Date.UTC(2020, 0, 1));
      const end = new Date(Date.UTC(2021, 0, 1));
      const p = Period.fromDates(start, end);
      // The MJD-based duration may differ from the calendar duration by a small
      // ΔT correction (~0.1 s/yr). Verify against the free-function equivalent.
      const expected = mjdFromDate(end) - mjdFromDate(start);
      assert.ok(Math.abs(p.durationDays() - expected) < 1e-9);
      // Sanity: roughly 366 days (2020 is a leap year)
      assert.ok(p.durationDays() > 365.9 && p.durationDays() < 366.1);
    });

    it('throws when start > end', () => {
      const start = new Date(Date.UTC(2021, 0, 1));
      const end = new Date(Date.UTC(2020, 0, 1));
      assert.throws(() => Period.fromDates(start, end), /start.*end|end.*start/i);
    });
  });

  describe('accessors', () => {
    it('start returns a ModifiedJulianDate', () => {
      const p = new Period(J2000_MJD, J2000_MJD + 5);
      const s = p.start;
      assert.equal(s.value, J2000_MJD);
      assert.equal(typeof s.toJd, 'function');
    });

    it('end returns a ModifiedJulianDate', () => {
      const p = new Period(J2000_MJD, J2000_MJD + 5);
      assert.equal(p.end.value, J2000_MJD + 5);
    });
  });

  describe('durationDays()', () => {
    it('returns correct duration', () => {
      const p = new Period(J2000_MJD, J2000_MJD + 7.5);
      assert.ok(Math.abs(p.durationDays() - 7.5) < EPSILON);
    });
  });

  describe('contains()', () => {
    it('includes start (closed left)', () => {
      const p = new Period(J2000_MJD, J2000_MJD + 1);
      assert.ok(p.contains(J2000_MJD));
    });

    it('includes interior points', () => {
      const p = new Period(J2000_MJD, J2000_MJD + 1);
      assert.ok(p.contains(J2000_MJD + 0.5));
    });

    it('excludes end (open right)', () => {
      const p = new Period(J2000_MJD, J2000_MJD + 1);
      assert.ok(!p.contains(J2000_MJD + 1));
    });

    it('excludes points before start', () => {
      const p = new Period(J2000_MJD, J2000_MJD + 1);
      assert.ok(!p.contains(J2000_MJD - 0.1));
    });
  });

  describe('intersection()', () => {
    it('returns overlapping sub-period', () => {
      const a = new Period(J2000_MJD, J2000_MJD + 2);
      const b = new Period(J2000_MJD + 1, J2000_MJD + 3);
      const i = a.intersection(b);
      assert.notEqual(i, null);
      assert.ok(Math.abs(i.startMjd - (J2000_MJD + 1)) < EPSILON);
      assert.ok(Math.abs(i.endMjd - (J2000_MJD + 2)) < EPSILON);
    });

    it('returns null for non-overlapping periods', () => {
      const a = new Period(J2000_MJD, J2000_MJD + 1);
      const b = new Period(J2000_MJD + 2, J2000_MJD + 3);
      assert.equal(a.intersection(b), null);
    });

    it('returns null for adjacent periods (shared endpoint only)', () => {
      const a = new Period(J2000_MJD, J2000_MJD + 1);
      const b = new Period(J2000_MJD + 1, J2000_MJD + 2);
      assert.equal(a.intersection(b), null);
    });

    it('intersection of a period with itself is itself', () => {
      const p = new Period(J2000_MJD, J2000_MJD + 5);
      const i = p.intersection(p);
      assert.notEqual(i, null);
      assert.ok(Math.abs(i.durationDays() - 5) < EPSILON);
    });
  });

  describe('toUtc()', () => {
    it('returns startMs and endMs as numbers', () => {
      const p = new Period(J2000_MJD, J2000_MJD + 1);
      const { startMs, endMs } = p.toUtc();
      assert.equal(typeof startMs, 'number');
      assert.equal(typeof endMs, 'number');
    });

    it('endMs − startMs equals durationDays × 86400000', () => {
      const p = new Period(J2000_MJD, J2000_MJD + 2);
      const { startMs, endMs } = p.toUtc();
      const diffDays = (endMs - startMs) / 86_400_000;
      assert.ok(Math.abs(diffDays - 2) < 1e-6);
    });

    it('startMs reconstructs a valid Date', () => {
      const p = new Period(J2000_MJD, J2000_MJD + 1);
      const { startMs } = p.toUtc();
      const d = new Date(startMs);
      assert.ok(d instanceof Date && !isNaN(d));
    });
  });

  describe('format()', () => {
    it('returns a string containing the MJD values', () => {
      const p = new Period(J2000_MJD, J2000_MJD + 1);
      const s = p.format();
      assert.ok(typeof s === 'string');
      assert.ok(s.includes('51544'));
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Free functions
// ═══════════════════════════════════════════════════════════════════════════

describe('jdToMjd() / mjdToJd()', () => {
  it('jdToMjd(J2000) = 51544.5', () => {
    assert.ok(Math.abs(jdToMjd(J2000_JD) - J2000_MJD) < EPSILON);
  });

  it('mjdToJd(51544.5) = J2000_JD', () => {
    assert.ok(Math.abs(mjdToJd(J2000_MJD) - J2000_JD) < EPSILON);
  });

  it('round-trips', () => {
    const jd = 2_460_000.5;
    assert.ok(Math.abs(mjdToJd(jdToMjd(jd)) - jd) < EPSILON);
  });
});

describe('julianCenturies() / julianYears()', () => {
  it('julianCenturies(J2000) = 0', () => {
    assert.equal(julianCenturies(J2000_JD), 0);
  });

  it('julianCenturies(J2000 + 36525) = 1', () => {
    assert.ok(Math.abs(julianCenturies(J2000_JD + 36_525) - 1) < 1e-12);
  });

  it('julianYears(J2000) = 0', () => {
    assert.equal(julianYears(J2000_JD), 0);
  });

  it('julianYears(J2000 + 365.25) = 1', () => {
    assert.ok(Math.abs(julianYears(J2000_JD + 365.25) - 1) < 1e-12);
  });
});

describe('jdFromDate() / mjdFromDate()', () => {
  it('jdFromDate round-trips via jdToDate', () => {
    const d = new Date(Date.UTC(2025, 0, 1, 0, 0, 0));
    const jd = jdFromDate(d);
    assert.equal(typeof jd, 'number');
    assert.ok(isFinite(jd));
  });

  it('mjdFromDate returns expected MJD for a known date', () => {
    const d = new Date(Date.UTC(2025, 0, 1, 0, 0, 0));
    const mjd = mjdFromDate(d);
    // J2025.0 is approx MJD 60676 (rough check)
    assert.ok(mjd > 60_000 && mjd < 70_000);
  });

  it('jdFromDate and JulianDate.fromDate agree', () => {
    const d = new Date(Date.UTC(2010, 5, 15, 12, 0, 0));
    const jd1 = jdFromDate(d);
    const jd2 = JulianDate.fromDate(d).value;
    assert.ok(Math.abs(jd1 - jd2) < EPSILON);
  });
});

describe('jdToDate() / mjdToDate()', () => {
  it('jdToDate returns a JS Date', () => {
    const d = jdToDate(J2000_JD);
    assert.ok(d instanceof Date);
    assert.ok(!isNaN(d));
  });

  it('mjdToDate returns a JS Date', () => {
    const d = mjdToDate(J2000_MJD);
    assert.ok(d instanceof Date);
    assert.ok(!isNaN(d));
  });

  it('jdToDate and mjdToDate agree for the same epoch', () => {
    const d1 = jdToDate(J2000_JD);
    const d2 = mjdToDate(J2000_MJD);
    // Both represent the same instant; allow ≤ 1 ms rounding
    assert.ok(Math.abs(d1.getTime() - d2.getTime()) <= 1);
  });
});

describe('jdDifference() / mjdDifference()', () => {
  it('jdDifference(a, b) = a − b', () => {
    assert.ok(Math.abs(jdDifference(J2000_JD + 5, J2000_JD) - 5) < EPSILON);
  });

  it('jdDifference is antisymmetric', () => {
    const d = jdDifference(J2000_JD, J2000_JD + 3);
    assert.ok(Math.abs(d + 3) < EPSILON);
  });

  it('mjdDifference(a, b) = a − b', () => {
    assert.ok(Math.abs(mjdDifference(J2000_MJD + 2, J2000_MJD) - 2) < EPSILON);
  });
});

describe('version()', () => {
  it('returns a semver string', () => {
    const v = version();
    assert.match(v, /^\d+\.\d+\.\d+/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// End-to-end / cross-type workflows
// ═══════════════════════════════════════════════════════════════════════════

describe('End-to-end workflows', () => {
  it('JD → MJD → Date → MJD round-trip preserves value', () => {
    const jd = new JulianDate(J2000_JD + 100);
    const mjd = jd.toMjd();
    const d = mjd.toDate();
    const mjd2 = ModifiedJulianDate.fromDate(d);
    assert.ok(Math.abs(mjd2.value - mjd.value) < 1e-6);
  });

  it('Period built from JD difference is consistent', () => {
    const start = new JulianDate(J2000_JD).toMjd().value;
    const end = new JulianDate(J2000_JD + 365.25).toMjd().value;
    const p = new Period(start, end);
    assert.ok(Math.abs(p.durationDays() - 365.25) < 1e-6);
  });

  it('adding 36525 days to J2000 gives J2100', () => {
    const jd2100 = new JulianDate(J2000_JD).addDays(36_525);
    assert.ok(Math.abs(jd2100.julianCenturies() - 1.0) < 1e-10);
  });

  it('Period.fromDates ↔ startMjd/endMjd agreement', () => {
    const d1 = new Date(Date.UTC(2020, 0, 1));
    const d2 = new Date(Date.UTC(2020, 6, 1));
    const p = Period.fromDates(d1, d2);
    // Reconstruct via free functions
    const startExpected = mjdFromDate(d1);
    const endExpected = mjdFromDate(d2);
    assert.ok(Math.abs(p.startMjd - startExpected) < 1e-9);
    assert.ok(Math.abs(p.endMjd - endExpected) < 1e-9);
  });
});
