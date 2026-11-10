# aellux.js homepage

Official website: https://aelluxjs.github.io/

The repository root contains the homepage (`index.htm`), shared `assets/`,
standalone `examples/` and the offline-capable `library/`. These files were
extracted from `aelluxjs/core` with their Git history. Runtime source, builds
and documentation remain in [Core](https://github.com/aelluxjs/core).

Core assets load from the GitHub `release/0.1.0` branch through jsDelivr:

```text
https://cdn.jsdelivr.net/gh/aelluxjs/core@release%2F0.1.0/dist/
```

The encoded slash identifies the complete branch name. Updating the branch
does not invalidate the CDN cache immediately. The Library caches its explicit
runtime dependencies after the first successful online visit; increment its
service worker `VERSION` when deploying changes to those dependencies.

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
