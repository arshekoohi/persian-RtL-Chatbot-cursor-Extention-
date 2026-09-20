const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MARK_START = '<!-- CURSOR-FA-RTL-START -->';
const MARK_END = '<!-- CURSOR-FA-RTL-END -->';
const SCRIPT_NAME = 'cursor-fa-rtl.js';
const BACKUP_SUFFIX = '.cursor-fa-rtl.bak';
const CHECKSUM_KEY = 'vs/code/electron-sandbox/workbench/workbench.html';

/**
 * @param {import('vscode').ExtensionContext} context
 */
function activate(context) {
  const vscode = require('vscode');

  const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 90);
  status.command = 'cursorFaRtl.status';
  context.subscriptions.push(status);

  const refreshStatus = () => {
    try {
      const { htmlPath } = resolveWorkbench(vscode);
      const on = isPatched(htmlPath);
      status.text = on ? '$(globe) FA RTL' : '$(globe) FA RTL !';
      status.tooltip = on
        ? 'Cursor FA RTL فعال — کلیک برای وضعیت'
        : 'پچ RTL نیست — کلیک کنید یا Enable بزنید';
      status.show();
    } catch (e) {
      status.text = '$(warning) FA RTL';
      status.tooltip = String(e.message || e);
      status.show();
    }
  };

  const runEnable = async (quiet) => {
    await enable(context, vscode);
    refreshStatus();
    if (!quiet) {
      const reload = await vscode.window.showInformationMessage(
        'RTL فارسی پچ شد. Cursor را کامل ببندید و دوباره باز کنید (Reload کافی نیست).',
        'Reload Window',
      );
      if (reload === 'Reload Window') {
        await vscode.commands.executeCommand('workbench.action.reloadWindow');
      }
    }
  };

  context.subscriptions.push(
    vscode.commands.registerCommand('cursorFaRtl.enable', async () => {
      try {
        await runEnable(false);
      } catch (e) {
        vscode.window.showErrorMessage(`فعال‌سازی RTL ناموفق: ${e.message || e}`);
      }
    }),
    vscode.commands.registerCommand('cursorFaRtl.disable', async () => {
      try {
        await disable(vscode);
        await context.globalState.update('cursorFaRtl.wasEnabled', false);
        refreshStatus();
        vscode.window.showInformationMessage(
          'RTL غیرفعال شد. Cursor را کامل Restart کنید.',
        );
      } catch (e) {
        vscode.window.showErrorMessage(`غیرفعال‌سازی RTL ناموفق: ${e.message || e}`);
      }
    }),
    vscode.commands.registerCommand('cursorFaRtl.reapply', async () => {
      try {
        await disable(vscode).catch(() => {});
        await runEnable(false);
      } catch (e) {
        vscode.window.showErrorMessage(`Re-apply ناموفق: ${e.message || e}`);
      }
    }),
    vscode.commands.registerCommand('cursorFaRtl.status', async () => {
      try {
        const { htmlPath, appRoot } = resolveWorkbench(vscode);
        const on = isPatched(htmlPath);
        const scriptPath = path.join(path.dirname(htmlPath), SCRIPT_NAME);
        const msg = [
          `وضعیت پچ: ${on ? 'فعال ✅' : 'غیرفعال ❌'}`,
          `App: ${appRoot}`,
          `html: ${htmlPath}`,
          `script: ${fs.existsSync(scriptPath) ? 'موجود' : 'نیست'}`,
        ].join('\n');
        const pick = await vscode.window.showInformationMessage(
          msg,
          on ? 'Disable' : 'Enable',
          'Re-apply',
        );
        if (pick === 'Enable') await vscode.commands.executeCommand('cursorFaRtl.enable');
        if (pick === 'Disable') await vscode.commands.executeCommand('cursorFaRtl.disable');
        if (pick === 'Re-apply') await vscode.commands.executeCommand('cursorFaRtl.reapply');
      } catch (e) {
        vscode.window.showErrorMessage(String(e.message || e));
      }
    }),
  );

  // Auto-heal: Cursor updates often wipe workbench.html
  setTimeout(async () => {
    try {
      const cfg = vscode.workspace.getConfiguration('cursorFaRtl');
      const auto = cfg.get('autoEnable', true);
      const wasEnabled = context.globalState.get('cursorFaRtl.wasEnabled', true);
      const { htmlPath } = resolveWorkbench(vscode);
      if (auto && wasEnabled && !isPatched(htmlPath)) {
        await enable(context, vscode);
        refreshStatus();
        vscode.window.showWarningMessage(
          'پچ FA RTL دوباره اعمال شد (بعد از آپدیت/بازیابی Cursor). یک‌بار Cursor را کامل Restart کنید تا دکمه «فا» دیده شود.',
          'باشه',
        );
      } else {
        refreshStatus();
      }
    } catch (e) {
      refreshStatus();
      console.error('[cursor-fa-rtl]', e);
    }
  }, 1500);
}

/**
 * @param {import('vscode').ExtensionContext} context
 * @param {typeof import('vscode')} vscode
 */
async function enable(context, vscode) {
  const { htmlPath } = resolveWorkbench(vscode);
  const dir = path.dirname(htmlPath);
  const scriptDest = path.join(dir, SCRIPT_NAME);
  const scriptSrc = path.join(context.extensionPath, 'src', 'inject', SCRIPT_NAME);

  if (!fs.existsSync(scriptSrc)) {
    throw new Error(`فایل inject پیدا نشد: ${scriptSrc}`);
  }

  ensureWritable(htmlPath);
  ensureWritable(dir);

  const backup = htmlPath + BACKUP_SUFFIX;
  if (!fs.existsSync(backup)) {
    fs.copyFileSync(htmlPath, backup);
  }

  fs.copyFileSync(scriptSrc, scriptDest);

  let html = fs.readFileSync(htmlPath, 'utf8');
  html = stripPatch(html);

  const vazirOn = vscode.workspace.getConfiguration('cursorFaRtl').get('vazirFont', true);
  const boot = `<script>try{localStorage.setItem('cursorFaRtl.vazir','${vazirOn ? '1' : '0'}')}catch(e){}</script>`;
  const injection = [
    MARK_START,
    boot,
    `<script src="./${SCRIPT_NAME}"></script>`,
    MARK_END,
  ].join('\n\t');

  if (/<\/html>/i.test(html)) {
    html = html.replace(/<\/html>/i, `${injection}\n</html>`);
  } else {
    html = `${html}\n${injection}\n`;
  }

  fs.writeFileSync(htmlPath, html, 'utf8');
  fixChecksums(htmlPath, vscode);
  await context.globalState.update('cursorFaRtl.wasEnabled', true);
}

/**
 * @param {typeof import('vscode')} vscode
 */
async function disable(vscode) {
  const { htmlPath } = resolveWorkbench(vscode);
  const dir = path.dirname(htmlPath);
  const scriptDest = path.join(dir, SCRIPT_NAME);
  const backup = htmlPath + BACKUP_SUFFIX;

  ensureWritable(htmlPath);

  if (fs.existsSync(backup)) {
    // Restore original, then strip any leftover marks from a dirty backup
    let restored = fs.readFileSync(backup, 'utf8');
    restored = stripPatch(restored);
    fs.writeFileSync(htmlPath, restored, 'utf8');
  } else if (isPatched(htmlPath)) {
    let html = fs.readFileSync(htmlPath, 'utf8');
    html = stripPatch(html);
    fs.writeFileSync(htmlPath, html, 'utf8');
  }

  if (fs.existsSync(scriptDest)) {
    try {
      fs.unlinkSync(scriptDest);
    } catch (_) {}
  }

  fixChecksums(htmlPath, vscode);
}

function stripPatch(html) {
  const re = new RegExp(
    `${escapeReg(MARK_START)}[\\s\\S]*?${escapeReg(MARK_END)}\\s*`,
    'g',
  );
  return html.replace(re, '');
}

function isPatched(htmlPath) {
  if (!fs.existsSync(htmlPath)) return false;
  const html = fs.readFileSync(htmlPath, 'utf8');
  return html.includes(MARK_START) && html.includes(SCRIPT_NAME);
}

/**
 * @param {typeof import('vscode')} vscode
 */
function resolveWorkbench(vscode) {
  const appRoot = vscode.env.appRoot;
  if (!appRoot) throw new Error('vscode.env.appRoot خالی است');

  const candidates = [
    path.join(
      appRoot,
      'out',
      'vs',
      'code',
      'electron-sandbox',
      'workbench',
      'workbench.html',
    ),
    path.join(
      appRoot,
      'out',
      'vs',
      'code',
      'electron-browser',
      'workbench',
      'workbench.html',
    ),
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return { htmlPath: p, appRoot };
    }
  }

  throw new Error(`workbench.html پیدا نشد تحت ${appRoot}`);
}

function ensureWritable(target) {
  try {
    fs.accessSync(target, fs.constants.W_OK);
  } catch (_) {
    throw new Error(
      `اجازهٔ نوشتن نیست:\n${target}\n\nCursor را با Run as administrator باز کنید و Enable بزنید.`,
    );
  }
}

/**
 * Update product.json checksum so Cursor does not restore workbench.html.
 * @param {string} htmlPath
 * @param {typeof import('vscode')} vscode
 */
function fixChecksums(htmlPath, vscode) {
  try {
    const appRoot = vscode.env.appRoot;
    const productPath = path.join(appRoot, 'product.json');
    if (!fs.existsSync(productPath)) return;

    const raw = fs.readFileSync(productPath, 'utf8');
    const product = JSON.parse(raw);
    if (!product.checksums || typeof product.checksums !== 'object') return;

    // VS Code / Cursor uses base64 MD5 without trailing =
    const md5 = crypto
      .createHash('md5')
      .update(fs.readFileSync(htmlPath))
      .digest('base64')
      .replace(/=+$/, '');

    const bak = productPath + BACKUP_SUFFIX;
    if (!fs.existsSync(bak)) fs.copyFileSync(productPath, bak);

    product.checksums[CHECKSUM_KEY] = md5;

    // Also update any key that points at workbench.html
    for (const key of Object.keys(product.checksums)) {
      if (key.replace(/\\/g, '/').endsWith('workbench/workbench.html')) {
        product.checksums[key] = md5;
      }
    }

    fs.writeFileSync(productPath, JSON.stringify(product, null, '\t') + '\n', 'utf8');
  } catch (e) {
    console.warn('[cursor-fa-rtl] checksum fix failed', e);
  }
}

function escapeReg(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function deactivate() {}

module.exports = { activate, deactivate };
