// examples/timescales.mjs
// Astronomical time contexts: J2000.0, centuries, epoch arithmetic.
// Run: node examples/timescales.mjs
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const { JulianDate, ModifiedJulianDate, Period, julianCenturies, julianYears } = require(
  join(dirname(fileURLToPath(import.meta.url)), '..', 'index.js'),
);

const line = (label = '') =>
  console.log(
    label ? `─── ${label} ${'─'.repeat(Math.max(0, 52 - label.length))}` : '─'.repeat(56),
  );

// ─── The J2000.0 reference epoch ──────────────────────────────────────────
line('J2000.0 epoch');
const J2000 = JulianDate.j2000();
console.log(`JD     : ${J2000.value}`);
console.log(`MJD    : ${J2000.toMjd().value}`);
// UTC ≈ 2000-01-01T11:58:56Z (J2000.0 is TT, not UTC; ΔT ≈ 63.8 s in 2000)
console.log(`UTC    : ${J2000.toDate().toISOString()}  (ΔT ≈ 63.8 s offset from TT noon)`);

// ─── Standard astronomical epochs ─────────────────────────────────────────
line('Standard epochs');
const epochs = [
  { name: 'J1900.0', jd: 2_415_020.0 },
  { name: 'J1950.0', jd: 2_433_282.5 },
  { name: 'J2000.0', jd: 2_451_545.0 },
  { name: 'J2050.0', jd: 2_469_807.5 },
];

for (const { name, jd } of epochs) {
  const T = julianCenturies(jd);
  const y = julianYears(jd);
  console.log(`${name}  JD = ${jd.toFixed(1)}  T = ${T.toFixed(4)}  y = ${y.toFixed(2)}`);
}

// ─── Julian centuries as a "clock" ────────────────────────────────────────
line('Centuries since J2000');
const observations = [
  new Date('1990-01-01T00:00:00Z'),
  new Date('2000-01-01T12:00:00Z'),
  new Date('2010-06-15T00:00:00Z'),
  new Date('2025-01-01T00:00:00Z'),
];
console.log(`${'Date'.padEnd(26)} ${'T (centuries)'.padStart(15)}`);
for (const d of observations) {
  const jd = JulianDate.fromDate(d);
  const T = jd.julianCenturies();
  console.log(`${d.toISOString().slice(0, 10).padEnd(26)} ${T.toFixed(6).padStart(15)}`);
}

// ─── Epoch arithmetic ─────────────────────────────────────────────────────
line('Epoch arithmetic');
const JULIAN_YEAR = 365.25; // days
const JULIAN_CENTURY = 36_525.0; // days

const jd2000 = JulianDate.j2000();
const jd2100 = jd2000.addDays(JULIAN_CENTURY);
console.log(`J2100.0 JD   : ${jd2100.value}`);
console.log(`J2100.0 UTC  : ${jd2100.toDate().toISOString().slice(0, 10)}`);
console.log(`J2100 T      : ${jd2100.julianCenturies().toFixed(1)}`);

const jd_minus5 = jd2000.addDays(-5 * JULIAN_YEAR);
console.log(`J1995.0 JD   : ${jd_minus5.value.toFixed(1)}`);
console.log(`T from J2000 : ${jd_minus5.julianCenturies().toFixed(6)}`);

// ─── Observation window with T values ─────────────────────────────────────
line('Observation window');
const nightStart = new Date('2025-04-15T22:00:00Z');
const nightEnd = new Date('2025-04-16T04:00:00Z');
const night = Period.fromDates(nightStart, nightEnd);

const midMjd = (night.startMjd + night.endMjd) / 2;
const midJd = new ModifiedJulianDate(midMjd).toJd();

console.log(`Start UTC  : ${nightStart.toISOString()}`);
console.log(`End UTC    : ${nightEnd.toISOString()}`);
console.log(`Duration   : ${(night.durationDays() * 24).toFixed(1)} h`);
console.log(`Mid JD     : ${midJd.value.toFixed(5)}`);
console.log(`Mid T      : ${midJd.julianCenturies().toFixed(8)}  centuries since J2000`);

// ─── MJD as a compact date format ─────────────────────────────────────────
line('MJD compact dates');
const today = ModifiedJulianDate.fromDate(new Date());
console.log(`Today MJD        : ${today.value.toFixed(4)}`);
console.log(`Days since J2000 : ${(today.value - 51_544.5).toFixed(2)}`);
const formatted = today.format();
console.log(`Formatted        : ${formatted}`);
