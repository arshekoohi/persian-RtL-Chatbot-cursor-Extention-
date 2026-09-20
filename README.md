# Cursor FA RTL — Persian Chat for Cursor

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.2-blue.svg)](./package.json)
[![Platform](https://img.shields.io/badge/Cursor-VS%20Code%20compatible-purple.svg)](https://cursor.com)

**English** · [فارسی](#-فارسی)

Lightweight Cursor / VS Code extension that makes **Agent & Chat** feel natural for Persian (and Arabic): automatic **RTL**, **Vazirmatn** font, while **code blocks stay LTR**.

> Cursor has no official RTL API for chat. This extension carefully patches `workbench.html` and injects a small runtime script.

---

## Features

| Feature | Detail |
|--------|--------|
| Auto RTL | Detects Persian / Arabic in chat & Composer messages |
| Always / Off modes | Force all chat RTL, or disable direction only |
| Vazirmatn font | Beautiful Persian typography via CDN (toggleable) |
| Code stays LTR | `pre` / `code` / Monaco blocks remain left-to-right |
| Floating control | **FA RTL** button — toggle, mode cycle, font toggle |
| Survives updates | Auto-heal + **Re-apply** after Cursor upgrades |
| Zero dependencies | Plain JS extension — no `node_modules` required |

### Floating button

| Action | Effect |
|--------|--------|
| Click | Enable / disable RTL |
| Right-click | Cycle mode: `auto` → `always` → `off` |
| Shift + Right-click | Toggle Vazirmatn font |

---

## Quick install

### 1. Download & package (from source)

```bash
git clone https://github.com/arshekoohi/persian-RtL-Chatbot-cursor-Extention-.git
cd persian-RtL-Chatbot-cursor-Extention-
npm run package
```

This produces `cursor-fa-rtl-1.0.2.vsix`.

### 2. Install into Cursor

```bash
cursor --install-extension cursor-fa-rtl-1.0.2.vsix
```

Or: **Extensions** → `⋯` → **Install from VSIX…**

### 3. Enable the patch

1. `Ctrl+Shift+P` (macOS: `Cmd+Shift+P`)
2. Run **Cursor FA RTL: Enable**
3. **Fully quit Cursor and reopen** (Reload Window is not enough)

You should see the **FA RTL** control and Persian messages right-aligned with Vazirmatn.

---

## Commands

| Command | Purpose |
|---------|---------|
| `Cursor FA RTL: Enable` | Patch workbench + copy inject script |
| `Cursor FA RTL: Disable` | Restore original workbench |
| `Cursor FA RTL: Re-apply` | After Cursor update wiped the patch |
| `Cursor FA RTL: Status` | Show paths & patch state |

---

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `cursorFaRtl.autoEnable` | `true` | Re-apply patch on startup if it disappeared |
| `cursorFaRtl.mode` | `auto` | `auto` / `always` / `off` |
| `cursorFaRtl.vazirFont` | `true` | Use Vazirmatn on Persian chat text |

Open: **Cursor Settings** → search `Cursor FA RTL`.

---

## How it works

```text
┌─────────────────┐     Enable      ┌──────────────────────────┐
│  Extension UI   │ ──────────────► │  workbench.html + inject │
│  (commands)     │                 │  cursor-fa-rtl.js        │
└─────────────────┘                 └────────────┬─────────────┘
                                                 │
                                                 ▼
                                        Chat / Composer DOM
                                        • mark RTL blocks
                                        • load Vazirmatn
                                        • keep code LTR
```

1. **Enable** copies `src/inject/cursor-fa-rtl.js` next to Cursor’s `workbench.html` and injects a `<script>` tag.
2. The script watches chat DOM, detects Arabic-script text, sets `direction: rtl`, and applies Vazirmatn.
3. Checksums in `product.json` are updated so Cursor is less likely to “repair” the file away.

---

## Uninstall / disable

```text
Ctrl+Shift+P → Cursor FA RTL: Disable → fully restart Cursor
```

Then uninstall the extension from the Extensions panel if desired.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| No FA button after Enable | Fully quit Cursor (not only Reload) and reopen |
| Patch gone after Cursor update | Run **Re-apply**, then full restart |
| “Installation appears to be corrupt” | Usually harmless; extension updates checksums |
| Permission denied on Windows | Open Cursor **as Administrator**, then Enable |
| Font not loading | Need network once (jsDelivr CDN); then cached |
| Want system font only | Shift+right-click FA button, or set `vazirFont: false` |

---

## Project layout

```text
├── package.json              # Extension manifest
├── src/
│   ├── extension.js          # Enable / disable / checksum helpers
│   └── inject/
│       └── cursor-fa-rtl.js  # Runtime RTL + Vazirmatn in chat UI
├── media/icon.svg
├── LICENSE
└── README.md
```

---

## Privacy & safety

- No telemetry, no network calls from the extension host except the **optional** font CSS from jsDelivr when Vazir is on.
- Only touches Cursor’s local `workbench.html` (with backup `*.cursor-fa-rtl.bak`).
- Always review the inject script before enabling on a locked-down machine.

---

## License

[MIT](./LICENSE) © 2026 Matinteb / contributors

---

# 🇮🇷 فارسی

افزونهٔ سبک برای **چت و Agent در Cursor**: متن **فارسی/عربی** راست‌چین می‌شود، فونت **وزیرمتن** اعمال می‌شود، و **کد** چپ‌چین می‌ماند.

## نصب سریع

```bash
git clone https://github.com/arshekoohi/persian-RtL-Chatbot-cursor-Extention-.git
cd persian-RtL-Chatbot-cursor-Extention-
npm run package
cursor --install-extension cursor-fa-rtl-1.0.2.vsix
```

1. `Ctrl+Shift+P` → **Cursor FA RTL: Enable**
2. Cursor را **کامل ببندید و دوباره باز کنید** (Reload کافی نیست)

## امکانات

- تشخیص خودکار فارسی/عربی در پیام‌ها و Composer  
- فونت وزیرمتن (قابل خاموش‌کردن)  
- بلوک‌های کد همیشه LTR  
- دکمهٔ شناور **FA RTL**  
- بازیابی خودکار / دستور **Re-apply** بعد از آپدیت Cursor  

### دکمهٔ FA RTL

| عمل | نتیجه |
|-----|--------|
| کلیک | روشن / خاموش |
| راست‌کلیک | چرخش حالت `auto` → `always` → `off` |
| Shift + راست‌کلیک | روشن / خاموش فونت وزیر |

## تنظیمات

- `cursorFaRtl.autoEnable` — ترمیم خودکار پچ  
- `cursorFaRtl.mode` — `auto` / `always` / `off`  
- `cursorFaRtl.vazirFont` — فونت وزیرمتن  

## رفع اشکال

- دکمه دیده نمی‌شود → Restart کامل Cursor  
- بعد از آپدیت Cursor خراب شد → **Re-apply**  
- خطای corrupt → معمولاً بی‌ضرر است  
- خطای نوشتن در Windows → اجرای Cursor با **Run as administrator**  
- فونت نیامد → یک‌بار اینترنت برای CDN  

## مجوز

MIT
