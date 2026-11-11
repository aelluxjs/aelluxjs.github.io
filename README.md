# aellux.js homepage

Official website: https://aelluxjs.github.io/

The repository root contains the homepage (`index.htm`), shared `assets/`,
standalone `examples/` and the offline-capable `library/`. These files were
extracted from `aelluxjs/core` with their Git history. Runtime source, builds
and documentation remain in [Core](https://github.com/aelluxjs/core).

Core assets load from a fixed commit of `release/0.1.0` through jsDelivr:

```text
https://cdn.jsdelivr.net/gh/aelluxjs/core@af06c0fae0fb0d0364f0c77a8cd3ad423539d961/dist/
```

Use the regular `aellux.js` entry point and matching regular assets: jsDelivr can
generate `.min` files dynamically, changing the bytes signed by Core's integrity
metadata. The commit pin keeps the boot script and its dependencies on the same
release. Update the pin consistently in pages, Library exports, tests and the
service worker. The Library caches its explicit runtime dependencies after the
first successful online visit; increment its service worker `VERSION` when
deploying changes to those dependencies.

Documentation: https://aelluxjs.github.io/core/docs/0.1.x/

## Local development

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:4173/. No website build or local Core checkout is required.
The first visit needs internet access for runtime dependencies.

```sh
npm run test:unit
npx playwright install
npm run test:browser
```

Browser tests use the public Core CDN and local Bootstrap, Highlight.js and
Geist fixtures. The Chromium suite includes a real offline reload of every
Library snippet.

## Publishing

GitHub Pages publishes from the root of `main`. The repository must be named
`aelluxjs.github.io` to serve https://aelluxjs.github.io/.
The Core documentation continues to be served independently under `/core/docs/`.

Project code is [Apache-2.0](LICENSE). Bootstrap, Highlight.js and Geist retain
their license texts in `library/vendor/`, `library/assets/` and `tests/fixtures/`.
