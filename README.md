# tempoch-js workspace

JavaScript and WebAssembly bindings for
[tempoch](./tempoch/README.md), the Siderust astronomical time library.

This repository is the publishable JS workspace. It contains the npm packages,
the thin Rust transport layers for Node and Web, and the vendored `tempoch`
workspace that provides the canonical time-scale, epoch, and period logic.

## Packages

| Package | Target | Status | Notes |
| --- | --- | --- | --- |
| [`@siderust/tempoch`](./tempoch-node/README.md) | Node.js | `0.1.0` | Native addon built with `napi-rs`; uses `@siderust/qtty@^0.1.0` for quantity objects in the JS API. |
| `@siderust/tempoch-web` | Browsers / bundlers | `0.1.0` | WebAssembly build with `wasm-bindgen`; requires `await init()` and uses `@siderust/qtty-web@^0.1.0` for quantity objects in the API. |

The Rust crates under `tempoch-node/` and `tempoch-web/` are transport layers
only. All astronomical time semantics come from the vendored
[`tempoch`](./tempoch) workspace.

## Repository layout

```text
tempoch-js/
├── tempoch/       Vendored Rust workspace (canonical time logic)
├── tempoch-node/  Node package: @siderust/tempoch
├── tempoch-web/   Browser package: @siderust/tempoch-web
└── scripts/       CI helpers for the Node package
```

## What ships in 0.1.0

- A Node package exposing `JulianDate`, `ModifiedJulianDate`, `Period`, UTC
  conversion helpers, and epoch arithmetic utilities.
- A browser/WASM package exposing the same core time model with explicit async
  initialization via `init()`.
- JS APIs that interoperate with the published `qtty-js` `0.1.0` line, using
  `@siderust/qtty` and `@siderust/qtty-web` quantity objects for durations and
  day-count results.
- TypeScript declarations for both packages matching the runtime surface.
- Node examples, tests, and CI for format, lint, build, test, and coverage.

## Install

### Node.js

```bash
npm install @siderust/tempoch @siderust/qtty
```

```js
const { JulianDate } = require('@siderust/tempoch');
const { Hours } = require('@siderust/qtty/units');

const jd = JulianDate.j2000();
const later = jd.add(Hours(6));
console.log(later.toDate().toISOString());
```

### Browser / WebAssembly

```bash
npm install @siderust/tempoch-web @siderust/qtty-web
```

```js
import { init, JulianDate } from '@siderust/tempoch-web';
import { Quantity } from '@siderust/qtty-web';

await init();

const jd = JulianDate.j2000();
const later = jd.add(new Quantity(6, 'Hour'));
console.log(later.toDate().toISOString());
```

## Development

Clone the repository with submodules so the vendored Rust workspace is present:

```bash
git clone --recurse-submodules git@github.com:Siderust/tempoch-js.git
cd tempoch-js
```

If you already cloned without submodules:

```bash
git submodule update --init --recursive
```

### Node package workflow

```bash
cd tempoch-node
npm ci
npm run build:debug
npm test
```

The repository also exposes CI helpers:

```bash
./scripts/ci.sh all
```

### Web package workflow

`tempoch-web` uses `wasm-pack`:

```bash
cd tempoch-web
wasm-pack build --target web --out-dir pkg --release --scope siderust
```

## Related documentation

- [`tempoch-node/README.md`](./tempoch-node/README.md) for the Node package API
  and examples.
- [`tempoch/README.md`](./tempoch/README.md) for the vendored Rust workspace.
- [`tempoch/CHANGELOG.md`](./tempoch/CHANGELOG.md) for backend/library changes
  that feed these bindings.

## License

AGPL-3.0. See [LICENSE](./LICENSE).
