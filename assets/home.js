function setupDocumentScrollProgress() {
  const target = document.getElementById("main-navigation-3D");
  if (!target) return;
  let pending = false;
  let dirty = false;

  function schedule() {
    dirty = true;
    if (pending) return;
    pending = true;
    $ae.waitLayout.read(() => {
      dirty = false;
      const documentScroll = document.scrollingElement || document.documentElement;
      const maximum = documentScroll.scrollHeight - documentScroll.clientHeight;
      return maximum > 0 ? Math.max(0, Math.min(1, documentScroll.scrollTop / maximum)) : 0;
    }).then(progress => $ae.waitLayout.update(() => {
      if (!target.isConnected) return;
      const value = String(progress);
      if (target.style.getPropertyValue("--home-scroll-progress-y") !== value)
        target.style.setProperty("--home-scroll-progress-y", value);
    })).catch(error => {
      console.error("Failed to update document scroll progress.", error);
    }).finally(() => {
      pending = false;
      if (dirty) schedule();
    });
  }

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  window.addEventListener("pageshow", schedule);
  window.addEventListener("load", schedule, { once: true });
  if (window.ResizeObserver) {
    const observer = new ResizeObserver(schedule);
    observer.observe(document.documentElement);
    observer.observe(document.body);
  }
  schedule();
}

if ($ae.waitLayout) setupDocumentScrollProgress();
else $ae.on("Ready", setupDocumentScrollProgress, { once: true });

document.addEventListener("click", async event => {
  const button = event.target.closest("[data-copy]");
  if (!button) return;
  const code = document.getElementById(button.dataset.copy);
  const status = document.getElementById("copy-status");
  try {
    await navigator.clipboard.writeText(code.textContent);
    status.textContent = "Copied to clipboard.";
  } catch {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(code);
    selection.removeAllRanges();
    selection.addRange(range);
    status.textContent = "Clipboard unavailable. The code is selected; use your device’s copy command.";
  }
});

let highlightReady = null;
let highlightStylesReady = false;

function prepareCodeScrollboxes() {
  document.querySelectorAll("pre:not([data-ae-scrollbox])").forEach(pre => {
    pre.setAttribute("data-ae-scrollbox", "pointer");
    pre.setAttribute("data-ae-scrollbar", "horizontal");
    pre.setAttribute("data-ae-scrollbar-parent", "wrapper");
    if (!pre.parentElement.classList.contains("code-wrapper")) {
      const wrapper = document.createElement("div");
      wrapper.className = "code-wrapper bg-body-tertiary";
      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.append(pre);
    }
  });
}

$ae.on("BeforeMount", prepareCodeScrollboxes);

function syncHighlightTheme() {
  if (!highlightStylesReady) return;
  const dark = $ae.currentPreference("color-scheme") === "dark";
  const lightStyle = document.querySelector('link[data-ae-dep="highlightjs-css"]');
  const darkStyle = document.querySelector('link[data-ae-dep="highlightjs-css-dark"]');
  if (lightStyle) lightStyle.disabled = dark;
  if (darkStyle) darkStyle.disabled = !dark;
}

function getHighlighter() {
  if (!highlightReady) {
    // Shared dependencies for the hero and setup snippets.
    const baseUrl = "https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.12/";
    highlightReady = (async () => {
      await Promise.all([
        $ae.dep("highlightjs", `${baseUrl}highlight.min.js`),
        $ae.dep("highlightjs-css", `${baseUrl}styles/github.min.css`),
        $ae.dep("highlightjs-css-dark", `${baseUrl}styles/github-dark.min.css`)
      ]);
      highlightStylesReady = true;
      await Promise.all(["xml", "javascript", "css", "bash"].filter(language => !window.hljs.getLanguage(language))
        .map(language => $ae.dep(`highlightjs-${language}`, `${baseUrl}languages/${language}.min.js`)));
      syncHighlightTheme();
      return window.hljs;
    })().catch(error => {
      highlightReady = null;
      throw error;
    });
  }
  return highlightReady;
}

$ae.on("PreferencesChange", syncHighlightTheme);

getHighlighter().then(highlighter => {
  document.querySelectorAll(".hero pre code, #getting-started pre code").forEach(code => {
    if (!code.dataset.highlighted) highlighter.highlightElement(code);
  });
}).catch(error => {
  console.error("Failed to highlight the homepage code.", error);
});

prepareCodeScrollboxes();
