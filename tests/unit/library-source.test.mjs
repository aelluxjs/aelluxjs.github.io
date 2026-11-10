import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { runInNewContext, Script } from "node:vm";
import test from "node:test";

const window = {};
runInNewContext(await readFile(new URL("../../library/assets/snippets.js", import.meta.url), "utf8"), { window });
const source = window.librarySource;

test("Library preserves stored snippet IDs and declares executable component fragments", () => {
  assert.equal(source.categories.length, 7);
  assert.equal(source.snippets.length, 17);
  const ids = new Set(source.snippets.map(snippet => snippet.id));
  assert.equal(ids.size, source.snippets.length);
  for (const id of ["hello-present", "little-tabs", "responsive-sidebar", "slow-scroll", "in-view", "your-theme", "next-focus"]) assert.ok(ids.has(id));
  for (const snippet of source.snippets) {
    assert.ok(source.categories.some(category => category.id === snippet.category), snippet.id);
    assert.ok(Array.isArray(snippet.dependencies) && Array.isArray(snippet.features), snippet.id);
    assert.doesNotMatch(snippet.code, /<!doctype|<(?:html|head|body)(?:\s|>)|\$ae\.(?:init|ext)\(/i);
    for (const [, code] of snippet.code.matchAll(/<script>([\s\S]*?)<\/script>/g)) assert.doesNotThrow(() => new Script(code), snippet.id);
  }
  assert.deepEqual(Array.from(source.snippets.find(snippet => snippet.id === "responsive-split-hero").extensions), []);
});

const cdn = "https://cdn.jsdelivr.net/gh/aelluxjs/core@release%2F0.1.0/dist/";
const worker = await readFile(new URL("../../library/sw.js", import.meta.url), "utf8");

for (const site of ["https://library.test/", "https://library.test/preview/"]) {
  test(`Library precache covers local assets and CDN dependencies under ${new URL(site).pathname}`, async () => {
    const scope = new URL("library/", site).href;
    const urls = runInNewContext(worker + "\nPRECACHE", { URL, self: { registration: { scope }, addEventListener() {} } });
    const cached = new Set(urls);
    const styled = new Set(["input", "present", "anchor", "scrollbox", "adaptive", "feedback"]);
    for (const snippet of source.snippets) {
      for (const extension of snippet.extensions) {
        assert.ok(cached.has(`${cdn}aellux.ext.${extension}.min.js`), `${snippet.id}: ${extension}`);
        if (styled.has(extension)) assert.ok(cached.has(`${cdn}aellux.ext.${extension}.min.css`), `${snippet.id}: stylesheet ${extension}`);
      }
    }
    for (const adapter of ["point", "keyboard"]) assert.ok(cached.has(`${cdn}aellux.input.${adapter}.min.js`));
    for (const url of urls) {
      if (url.startsWith(cdn)) continue;
      assert.ok(url.startsWith(site), url);
      await access(new URL(`../../${url.slice(site.length)}`, import.meta.url));
    }
  });
}

test("offline worker serves allowlisted cross-origin CDN requests without intercepting unrelated requests", async () => {
  const handlers = new Map();
  const cachedResponse = { cached: true };
  const scope = "https://library.test/library/";
  runInNewContext(worker, {
    URL,
    self: { registration: { scope }, location: new URL(scope), addEventListener: (type, handler) => handlers.set(type, handler) },
    caches: { open: async () => ({ match: async () => cachedResponse }) },
    fetch() { throw new Error("Unexpected network access"); }
  });
  function request(url, overrides = {}) {
    let response;
    handlers.get("fetch")({ request: { url, method: "GET", mode: "cors", headers: new Headers(), ...overrides }, respondWith(value) { response = value; } });
    return response;
  }
  assert.equal(await request(`${cdn}aellux.min.js`), cachedResponse);
  assert.equal(await request(`${cdn}aellux.ext.focus.min.js`), cachedResponse);
  assert.equal(request(`${cdn}unlisted.js`), undefined);
  assert.equal(request("https://other.test/script.js"), undefined);
  assert.equal(request(`${cdn}aellux.min.js`, { headers: new Headers({ authorization: "private" }) }), undefined);
  assert.equal(request(`${cdn}aellux.min.js`, { method: "POST" }), undefined);
  assert.equal(request("https://library.test/index.htm", { mode: "navigate" }), undefined);
});
