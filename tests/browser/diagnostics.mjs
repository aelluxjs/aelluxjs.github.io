import { test as base, expect } from "@playwright/test";

export { expect };

export async function clickAfterScroll(locator) {
  // WebKit on Linux can continue smooth scrolling between mouse down and up,
  // moving the target away from the pointer. Cancel pending scroll animation
  // before Playwright checks stability and performs a real pointer click.
  await locator.evaluate(element => element.scrollIntoView({
    behavior: "instant", block: "center", inline: "nearest"
  }));
  // A nonzero delay makes Playwright await move/down/up in order instead of
  // sending them concurrently. Linux WebKit can otherwise lose the release
  // around iframe surfaces even after the main document has stopped scrolling.
  await locator.click({ delay: 50 });
}

export const test = base.extend({
  diagnostics: [async ({ page }, use, testInfo) => {
    await page.addInitScript(() => {
      const events = window.__interactionDiagnostics = [];
      for (const type of ["pointerdown", "pointerup", "click", "focusin"]) {
        document.addEventListener(type, event => {
          const target = event.target;
          const button = target.closest?.("button");
          const entry = { type, target: target.outerHTML?.slice(0, 240),
            x: event.clientX, y: event.clientY, scrollY,
            button: button?.outerHTML.slice(0, 280), disabled: button?.disabled };
          events.push(entry);
          if (events.length > 40) events.shift();
          queueMicrotask(() => { entry.defaultPrevented = event.defaultPrevented; });
        }, true);
      }
    });
    await use();
    if (testInfo.status === testInfo.expectedStatus || page.isClosed()) return;
    const diagnostic = await page.evaluate(() => ({
      events: window.__interactionDiagnostics,
      viewport: { width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth },
      fonts: document.fonts.status,
      snapshot: window.$ae?.ext.stateNavigation?.globalSnapshot,
      expanded: [...document.querySelectorAll('[aria-expanded="true"], .is-fullscreen')]
        .map(element => ({ tag: element.tagName, id: element.id, className: element.className })),
      panels: [...document.querySelectorAll('.source-panel')]
        .map(element => ({ id: element.id, hidden: element.hidden, className: element.className }))
    })).catch(error => ({ error: error.message }));
    const body = JSON.stringify(diagnostic, null, 2);
    await testInfo.attach("interaction-diagnostics", { body, contentType: "application/json" });
    console.log(`Interaction diagnostics: ${JSON.stringify(diagnostic)}`);
  }, { auto: true }]
});
