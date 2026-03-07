// examples/quickstart.mjs
// Run: node examples/quickstart.mjs
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const {
  JulianDate,
  ModifiedJulianDate,
  jdToMjd,
  mjdToJd,
  jdFromDate,
  mjdFromDate,
  jdToDate,
} = require(join(dirname(fileURLToPath(import.meta.url)), '..', 'index.js'));

const line = (label = '') =>
  console.log(
    label ? `─── ${label} ${'─'.repeat(Math.max(0, 52 - label.length))}` : '─'.repeat(56),
  );

// ─── Construction ─────────────────────────────────────────────────────────
line('Construction');
const J2000 = JulianDate.j2000();
console.log(`J2000.0 JD  : ${J2000.value}`);
console.log(`J2000.0 MJD : ${J2000.toMjd().value}`);

const now = new Date();
const jdNow = JulianDate.fromDate(now);
console.log(`Now (JD)    : ${jdNow.value.toFixed(5)}`);
console.log(`Now (MJD)   : ${jdNow.toMjd().value.toFixed(5)}`);

// ─── UTC ↔ JD conversion ──────────────────────────────────────────────────
line('UTC ↔ JD');
const vernal2025 = JulianDate.fromUtc(2025, 3, 20, 9, 1, 0);
console.log(`2025 Vernal Equinox JD  : ${vernal2025.value.toFixed(4)}`);
const utcBack = vernal2025.toDate();
console.log(`Back to UTC             : ${utcBack.toISOString()}`);

// ─── Free conversion functions ────────────────────────────────────────────
line('Free functions');
const d = new Date('2025-01-01T00:00:00Z');
console.log(`2025-01-01 JD  : ${jdFromDate(d).toFixed(4)}`);
console.log(`2025-01-01 MJD : ${mjdFromDate(d).toFixed(4)}`);
console.log(`jdToMjd(J2000) : ${jdToMjd(2_451_545.0)}`);
console.log(`mjdToJd(51544.5): ${mjdToJd(51_544.5)}`);

// ─── Epoch-based quantities ───────────────────────────────────────────────
line('Epoch quantities');
const obsDate = JulianDate.fromUtc(2025, 6, 15, 0, 0, 0);
console.log(`JD             : ${obsDate.value.toFixed(4)}`);
console.log(`Julian centuries (T): ${obsDate.julianCenturies().toFixed(6)}`);
console.log(`Julian years        : ${obsDate.julianYears().toFixed(4)}`);

// ─── Arithmetic ───────────────────────────────────────────────────────────
line('Arithmetic');
const t0 = JulianDate.fromUtc(2025, 1, 1, 0, 0, 0);
const t1 = t0.addDays(365.25);
console.log(`t0 : ${jdToDate(t0.value).toISOString().slice(0, 10)}`);
console.log(`t1 = t0 + 365.25 d : ${jdToDate(t1.value).toISOString().slice(0, 10)}`);
console.log(`t1 − t0 (days) : ${t1.difference(t0).toFixed(2)}`);

// ─── MJD class ────────────────────────────────────────────────────────────
line('ModifiedJulianDate');
const mjd0 = new ModifiedJulianDate(51_544.5);
console.log(`MJD 51544.5 → JD  : ${mjd0.toJd().value}`);
console.log(`MJD 51544.5 → UTC : ${mjd0.toDate().toISOString()}`);
const mjd1 = mjd0.addDays(1);
console.log(`+ 1 day           : ${mjd1.value}`);
console.log(`difference        : ${mjd1.difference(mjd0).toFixed(1)} d`);
