/**
 * Cursor FA RTL — runtime script injected into Cursor workbench.
 * Auto-detects Persian/Arabic blocks, keeps code LTR.
 */
(function () {
  'use strict';

  const STYLE_ID = 'cursor-fa-rtl-style';
  const BTN_ID = 'cursor-fa-rtl-toggle';
  const STORAGE_KEY = 'cursorFaRtl.enabled';
  const MODE_KEY = 'cursorFaRtl.mode'; // auto | always | off
  const FONT_KEY = 'cursorFaRtl.vazir'; // '1' | '0'
  const MARK = 'data-fa-rtl';
  const FONT_STACK = '"Vazirmatn", "Vazir", Tahoma, "Segoe UI", sans-serif';
  // Local woff2 files are copied next to this script on Enable (CSP blocks remote CSS).
  const FONT_FILES = [
    { file: 'Vazirmatn-Regular.woff2', weight: 400 },
    { file: 'Vazirmatn-Medium.woff2', weight: 500 },
    { file: 'Vazirmatn-SemiBold.woff2', weight: 600 },
    { file: 'Vazirmatn-Bold.woff2', weight: 700 },
  ];

  const RTL_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  const LTR_LETTER_RE = /[A-Za-z]/;

  function isRtlDominant(text) {
    if (!text) return false;
    const cleaned = String(text).replace(/```[\s\S]*?```/g, ' ').replace(/`[^`]+`/g, ' ');
    let rtl = 0;
    let ltr = 0;
    for (const ch of cleaned) {
      if (RTL_RE.test(ch)) rtl++;
      else if (LTR_LETTER_RE.test(ch)) ltr++;
    }
    if (rtl === 0) return false;
    return rtl >= ltr * 0.35 || rtl >= 8;
  }

  function useVazirFont() {
    try {
      const v = localStorage.getItem(FONT_KEY);
      return v === null ? true : v === '1';
    } catch (_) {
      return true;
    }
  }

  function fontFaceCss() {
    return FONT_FILES.map(
      (f) => `
      @font-face {
        font-family: "Vazirmatn";
        src: url("./${f.file}") format("woff2");
        font-weight: ${f.weight};
        font-style: normal;
        font-display: swap;
      }`,
    ).join('\n');
  }

  function ensureStyle() {
    const vazir = useVazirFont();
    if (vazir) document.documentElement.setAttribute('data-fa-vazir', '1');
    else document.documentElement.removeAttribute('data-fa-vazir');

    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement('style');
      style.id = STYLE_ID;
      document.documentElement.appendChild(style);
    }

    style.textContent = `
      ${vazir ? fontFaceCss() : ''}

      /* Toggle FAB */
      #${BTN_ID} {
        position: fixed;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 2147483646;
        min-width: 72px;
        height: 32px;
        padding: 0 12px;
        border-radius: 999px;
        border: 1px solid rgba(232,197,71,0.55);
        background: rgba(26,26,46,0.96);
        color: #e8c547;
        font: 700 12px/1 ${FONT_STACK};
        cursor: pointer;
        box-shadow: 0 6px 18px rgba(0,0,0,0.45);
        opacity: 0.95;
      }
      #${BTN_ID}:hover { opacity: 1; filter: brightness(1.08); }
      #${BTN_ID}[data-on="1"] { background: #1f4a42; color: #7dd3c0; border-color: #7dd3c0; }

      /* Applied RTL blocks */
      [${MARK}="rtl"] {
        direction: rtl !important;
        text-align: right !important;
        unicode-bidi: plaintext;
      }

      /* Vazirmatn on all text inside RTL chat (CSP-safe local @font-face) */
      html[data-fa-vazir="1"] [${MARK}="rtl"],
      html[data-fa-vazir="1"] [${MARK}="rtl"] *:not(pre):not(code):not(kbd):not(samp):not(.monaco-editor):not([class*="codeblock"]):not([class*="CodeBlock"]) {
        font-family: ${FONT_STACK} !important;
      }

      [${MARK}="rtl"] pre,
      [${MARK}="rtl"] code,
      [${MARK}="rtl"] kbd,
      [${MARK}="rtl"] samp,
      [${MARK}="rtl"] .monaco-editor,
      [${MARK}="rtl"] [class*="codeblock"],
      [${MARK}="rtl"] [class*="CodeBlock"],
      [${MARK}="rtl"] .anysphere-markdown-container-root pre,
      [${MARK}="rtl"] pre *,
      [${MARK}="rtl"] code * {
        direction: ltr !important;
        text-align: left !important;
        unicode-bidi: isolate;
        font-family: var(--monaco-monospace-font, Consolas, "Courier New", monospace) !important;
      }

      /* Composer input when RTL */
      .composer-input [${MARK}="rtl"],
      .aislash-editor-input[${MARK}="rtl"],
      div[contenteditable="true"][${MARK}="rtl"] {
        direction: rtl !important;
        text-align: right !important;
      }
      html[data-fa-vazir="1"] .composer-input [${MARK}="rtl"],
      html[data-fa-vazir="1"] .aislash-editor-input[${MARK}="rtl"],
      html[data-fa-vazir="1"] div[contenteditable="true"][${MARK}="rtl"],
      html[data-fa-vazir="1"] div[contenteditable="true"][${MARK}="rtl"] * {
        font-family: ${FONT_STACK} !important;
      }
    `;
  }

  function getMode() {
    try {
      return localStorage.getItem(MODE_KEY) || 'auto';
    } catch (_) {
      return 'auto';
    }
  }

  function isEnabled() {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      return v === null ? true : v === '1';
    } catch (_) {
      return true;
    }
  }

  function setEnabled(on) {
    try {
      localStorage.setItem(STORAGE_KEY, on ? '1' : '0');
    } catch (_) {}
    const btn = document.getElementById(BTN_ID);
    if (btn) btn.setAttribute('data-on', on ? '1' : '0');
    if (!on) clearMarks();
    else scanAll();
  }

  function clearMarks() {
    document.querySelectorAll(`[${MARK}]`).forEach((el) => el.removeAttribute(MARK));
  }

  function shouldSkip(el) {
    if (!el || el.nodeType !== 1) return true;
    if (el.id === BTN_ID || el.id === STYLE_ID) return true;
    if (el.closest('pre, code, .monaco-editor, textarea.monaco-mouse-cursor-text')) return true;
    if (el.closest('.terminal, .xterm, .debug-hover-widget')) return true;
    return false;
  }

  function markElement(el, force) {
    if (shouldSkip(el)) return;
    const mode = getMode();
    if (mode === 'off' || !isEnabled()) {
      el.removeAttribute(MARK);
      return;
    }
    const text = el.innerText || el.textContent || '';
    const rtl = mode === 'always' ? true : isRtlDominant(text);
    if (rtl || force) el.setAttribute(MARK, 'rtl');
    else el.removeAttribute(MARK);
  }

  function messageCandidates(root) {
    const scope = root || document;
    const selectors = [
      '.markdown-root > div',
      '.markdown-root',
      '.composer-human-message',
      '.composer-message',
      '[class*="composer-human"]',
      '[class*="ai-message"]',
      '[class*="AssistantMessage"]',
      '[class*="HumanMessage"]',
      '.anysphere-markdown-container-root',
      '[data-message-author-role]',
      '.chat-message',
      '.interactive-session .value',
    ];
    const set = new Set();
    for (const sel of selectors) {
      try {
        scope.querySelectorAll(sel).forEach((n) => set.add(n));
      } catch (_) {}
    }
    return [...set];
  }

  function inputCandidates(root) {
    const scope = root || document;
    return [
      ...scope.querySelectorAll(
        '.composer-input div[contenteditable="true"], .aislash-editor-input, div[contenteditable="true"][data-lexical-editor], .ProseMirror',
      ),
    ].filter((el) => {
      // Prefer chat/composer inputs, skip regular editors when possible
      const inComposer =
        el.closest(
          '.composer-bar, .composer-input, [class*="composer"], [class*="Chat"], [class*="aichat"], .pane-body',
        ) != null;
      return inComposer || el.classList.contains('aislash-editor-input');
    });
  }

  function scanAll(root) {
    if (!isEnabled()) return;
    ensureStyle();
    for (const el of messageCandidates(root)) markElement(el);
    for (const el of inputCandidates(root)) {
      const text = el.innerText || '';
      const mode = getMode();
      if (mode === 'off') {
        el.removeAttribute(MARK);
        continue;
      }
      if (mode === 'always' || isRtlDominant(text)) el.setAttribute(MARK, 'rtl');
      else el.removeAttribute(MARK);
    }
  }

  function ensureButton() {
    if (document.getElementById(BTN_ID)) return;
    const btn = document.createElement('button');
    btn.id = BTN_ID;
    btn.type = 'button';
    btn.title =
      'Cursor FA RTL — کلیک: روشن/خاموش | راست‌کلیک: حالت | Shift+راست‌کلیک: فونت وزیر';
    btn.textContent = 'FA RTL';
    btn.setAttribute('data-on', isEnabled() ? '1' : '0');
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      setEnabled(!isEnabled());
    });
    btn.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (e.shiftKey) {
        const next = useVazirFont() ? '0' : '1';
        try {
          localStorage.setItem(FONT_KEY, next);
        } catch (_) {}
        ensureStyle();
        btn.title = `Cursor FA RTL — فونت وزیر: ${next === '1' ? 'روشن' : 'خاموش'}`;
        return;
      }
      const order = ['auto', 'always', 'off'];
      const cur = getMode();
      const next = order[(order.indexOf(cur) + 1) % order.length];
      try {
        localStorage.setItem(MODE_KEY, next);
      } catch (_) {}
      btn.title = `Cursor FA RTL — mode: ${next}`;
      scanAll();
    });
    document.documentElement.appendChild(btn);
  }

  function startObserver() {
    const obs = new MutationObserver((mutations) => {
      if (!isEnabled()) return;
      let needs = false;
      for (const m of mutations) {
        if (m.type === 'characterData') {
          needs = true;
          break;
        }
        if (m.addedNodes && m.addedNodes.length) {
          needs = true;
          break;
        }
      }
      if (needs) {
        clearTimeout(startObserver._t);
        startObserver._t = setTimeout(() => scanAll(), 80);
      }
    });
    obs.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  function boot() {
    ensureStyle();
    ensureButton();
    scanAll();
    startObserver();
    // Cursor mounts chat lazily
    setInterval(() => {
      if (isEnabled()) scanAll();
    }, 2500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
