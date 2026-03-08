# Changelog

All notable changes to the JavaScript workspace are documented here.

The vendored Rust workspace keeps its own history in
[`tempoch/CHANGELOG.md`](./tempoch/CHANGELOG.md).

## [0.1.0] - 2026-03-08

### Added
- Initial `tempoch-js` release repository with the vendored `tempoch`
  workspace as the canonical Rust backend.
- `@siderust/tempoch` for Node.js, exposing `JulianDate`,
  `ModifiedJulianDate`, `Period`, UTC conversion helpers, and epoch arithmetic.
- `@siderust/tempoch-web` for browsers and bundlers, exposing the same time
  primitives over WebAssembly with explicit async initialization via `init()`.
- TypeScript declaration files for the Node and Web packages.
- Node examples covering quickstart usage, periods, and timescale-oriented
  workflows.
- Node automated tests and CI for format, lint, build, test, and coverage.

### Changed
- The JS API now targets the published `qtty-js` `0.1.0` line via
  `@siderust/qtty` and `@siderust/qtty-web`, using quantity objects for
  duration input and day-count output.
