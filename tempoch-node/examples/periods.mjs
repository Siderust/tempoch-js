// examples/periods.mjs
// Run: node examples/periods.mjs
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const {
  JulianDate,
  ModifiedJulianDate,
  Period,
  mjdFromDate,
} = require(join(dirname(fileURLToPath(import.meta.url)), '..', 'index.js'));

const line = (label = '') => console.log(label ? `─── ${label} ${'─'.repeat(Math.max(0, 52 - label.length))}` : '─'.repeat(56));

// ─── Construction ─────────────────────────────────────────────────────────
line('Period construction');

// From raw MJD values
const J2000_MJD = 51_544.5;
const p1 = new Period(J2000_MJD, J2000_MJD + 30);
console.log(`p1 : ${p1.format()}`);
console.log(`  duration : ${p1.durationDays()} d`);

// From JavaScript Date objects
const start2024 = new Date('2024-01-01T00:00:00Z');
const end2024   = new Date('2025-01-01T00:00:00Z');
const year2024  = Period.fromDates(start2024, end2024);
console.log(`2024 calendar year:`);
console.log(`  startMjd : ${year2024.startMjd.toFixed(2)}`);
console.log(`  endMjd   : ${year2024.endMjd.toFixed(2)}`);
console.log(`  duration : ${year2024.durationDays().toFixed(2)} d  (2024 is a leap year)`);

// ─── Accessors ────────────────────────────────────────────────────────────
line('Accessors');
const p = new Period(J2000_MJD, J2000_MJD + 10);
const startObj = p.start;   // ModifiedJulianDate
const endObj   = p.end;     // ModifiedJulianDate
console.log(`start : MJD ${startObj.value} → ${startObj.toDate().toISOString()}`);
console.log(`end   : MJD ${endObj.value} → ${endObj.toDate().toISOString()}`);

// ─── Containment ──────────────────────────────────────────────────────────
line('Containment [start, end)');
const week = new Period(J2000_MJD, J2000_MJD + 7);
const points = [
  [J2000_MJD,       'start (included)'],
  [J2000_MJD + 3.5, 'midpoint (included)'],
  [J2000_MJD + 7,   'end (excluded — half-open)'],
  [J2000_MJD - 1,   'before start (excluded)'],
];
for (const [mjd, label] of points) {
  console.log(`  contains(${mjd.toFixed(1)}): ${week.contains(mjd)}  ← ${label}`);
}

// ─── Intersection ─────────────────────────────────────────────────────────
line('Intersection');
const a = new Period(J2000_MJD,       J2000_MJD + 10);
const b = new Period(J2000_MJD + 5,   J2000_MJD + 15);
const c = new Period(J2000_MJD + 20,  J2000_MJD + 30);

console.log(`a = [${a.startMjd}, ${a.endMjd})`);
console.log(`b = [${b.startMjd}, ${b.endMjd})`);
console.log(`c = [${c.startMjd}, ${c.endMjd})`);

const ab = a.intersection(b);
console.log(`a ∩ b = ${ab ? `[${ab.startMjd}, ${ab.endMjd}) → ${ab.durationDays()} d` : 'null'}`);

const ac = a.intersection(c);
console.log(`a ∩ c = ${ac ? `[${ac.startMjd}, ${ac.endMjd})` : 'null (no overlap)'}`);

// ─── UTC round-trip ───────────────────────────────────────────────────────
line('UTC bounds');
const obs = Period.fromDates(
  new Date('2025-04-01T20:00:00Z'),
  new Date('2025-04-02T06:00:00Z'),
);
const { startMs, endMs } = obs.toUtc();
const startDate = new Date(startMs);
const endDate   = new Date(endMs);
console.log(`Observation window:`);
console.log(`  start : ${startDate.toISOString()}`);
console.log(`  end   : ${endDate.toISOString()}`);
console.log(`  duration : ${(obs.durationDays() * 24).toFixed(1)} h`);
