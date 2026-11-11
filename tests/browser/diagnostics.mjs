import { test as base, expect } from "@playwright/test";

export { expect };
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
