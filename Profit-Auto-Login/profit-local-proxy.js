"use strict";

const http = require("http");
const https = require("https");
const os = require("os");
const { randomBytes } = require("crypto");

const HOST = process.env.PROFIT_PROXY_HOST || "0.0.0.0";
// Cloud platforms conventionally inject PORT. Keep the local default for
// Windows/LAN use, while allowing a hosted process to pass its health check.
const PORT = Number.parseInt(process.env.PORT || process.env.PROFIT_PROXY_PORT || "47832", 10);
const TARGET_ORIGIN = "https://profit.aeon.com.vn";
const ACCESS_COOKIE = "profit_local_access";
const ACCESS_TOKEN = process.env.PROFIT_PROXY_TOKEN || randomBytes(24).toString("base64url");
const TRUSTED_LAN_PREFIX = process.env.PROFIT_TRUSTED_LAN_PREFIX || "10.5.36.";

function isLoopback(address = "") {
  return address === "127.0.0.1" || address === "::1" || address === "::ffff:127.0.0.1";
}

function isTrustedLan(address = "") {
  return address.replace(/^::ffff:/, "").startsWith(TRUSTED_LAN_PREFIX);
}

function hasAccessCookie(request) {
  const cookies = request.headers.cookie || "";
  return cookies.split(/;\s*/).some((cookie) => cookie === `${ACCESS_COOKIE}=${ACCESS_TOKEN}`);
}

function removeAccessCookie(cookies = "") {
  return cookies.split(/;\s*/).filter((cookie) => !cookie.startsWith(`${ACCESS_COOKIE}=`)).join("; ");
}

function getLanAddress() {
  for (const adapter of Object.values(os.networkInterfaces())) {
    for (const address of adapter || []) {
      if (address.family === "IPv4" && !address.internal && !address.address.startsWith("169.254.")) return address.address;
    }
  }
  return null;
}

const loginAutomation = `<script>
(() => {
  const storageKey = '__profit_retry_login';
  const settingsKey = '__profit_auto_login_settings';
  const defaults = { enabled: true, retryReturnedLogin: true, loginDelay: 0.85, retryDelay: 15 };
  const clamp = (value, min, max, fallback) => Number.isFinite(value) ? Math.min(Math.max(value, min), max) : fallback;
  const readSettings = () => {
    try {
      const stored = JSON.parse(sessionStorage.getItem(settingsKey) || '{}');
      return {
        enabled: stored.enabled !== false,
        retryReturnedLogin: stored.retryReturnedLogin !== false,
        loginDelay: clamp(Number(stored.loginDelay), 0.1, 10, defaults.loginDelay),
        retryDelay: clamp(Number(stored.retryDelay), 0.5, 120, defaults.retryDelay),
      };
    } catch { return { ...defaults }; }
  };
  let settings = readSettings();
  const saveSettings = () => sessionStorage.setItem(settingsKey, JSON.stringify(settings));
  const form = document.forms.FORM;
  const user = form && form.elements.txtUsr_id;
  const password = form && form.elements.txtPassword;
  const loginButton = form && form.elements.btnLogin;
  const clearSaved = () => sessionStorage.removeItem(storageKey);
  const readSaved = () => { try { return JSON.parse(sessionStorage.getItem(storageKey) || 'null'); } catch { clearSaved(); return null; } };
  const saveCurrent = (attempts = 0) => {
    if (!user || !password || !user.value.trim() || !password.value) return null;
    const value = { user: user.value.trim(), password: password.value, attempts };
    sessionStorage.setItem(storageKey, JSON.stringify(value));
    return value;
  };
  const isCapacityMessage = () => /(?:\\bfull\\b|max(?:imum)?\\s+(?:number|users?|login)|too\\s+many|concurrent\\s+users?|capacity\\s+(?:is\\s+)?(?:full|reached)|(?:user\\s+)?limit\\s+(?:is\\s+)?reached|no\\s+(?:more\\s+)?(?:user|login)\\s+(?:slot|available)|try\\s+again\\s+later|system\\s+(?:is\\s+)?busy)/i.test(document.body.innerText);
  const isCredentialFailure = () => /(?:invalid\\s+(?:user|password|login)|incorrect\\s+(?:user|password|login)|wrong\\s+password|user(?:\\s|_)*(?:not\\s+found|does\\s+not\\s+exist)|access\\s+denied|not\\s+authorized|password\\s+expired|cannot\\s+be\\s+blank)/i.test(document.body.innerText);
  const status = (text, canStop) => {
    let box = document.getElementById('__profit_auto_login_status');
    if (!box) { box = document.createElement('div'); box.id = '__profit_auto_login_status'; box.style.cssText = 'position:fixed;z-index:2147483647;top:12px;right:12px;max-width:310px;padding:12px 14px;background:#4b2483;color:#fff;border-radius:8px;font:14px Segoe UI,Arial,sans-serif;box-shadow:0 4px 14px #0006'; document.body.appendChild(box); }
    box.textContent = text;
    if (canStop) { const button = document.createElement('button'); button.textContent = 'Dừng'; button.style.cssText = 'margin-left:12px;border:1px solid #fff;background:transparent;color:#fff;border-radius:4px;cursor:pointer'; button.onclick = () => { clearTimeout(timer); clearSaved(); box.remove(); }; box.appendChild(button); }
  };
  const addControls = () => {
    const panel = document.createElement('section');
    panel.id = '__profit_auto_login_controls';
    panel.style.cssText = 'position:fixed;z-index:2147483646;top:67px;right:12px;width:286px;padding:12px 14px;background:#fff;color:#18213a;border:1px solid #d7dbea;border-radius:8px;font:13px Segoe UI,Arial,sans-serif;box-shadow:0 4px 14px #0003';
    panel.innerHTML = '<div style="font-weight:700;color:#4b2483;margin-bottom:9px">⚙ TÙY CHỈNH AUTO LOGIN</div>' +
      '<label style="display:block;margin:8px 0">Tài khoản <input data-auto="account" type="text" autocomplete="username" style="box-sizing:border-box;width:100%;margin-top:4px;padding:5px"></label>' +
      '<label style="display:block;margin:8px 0">Mật khẩu <input data-auto="account-password" type="password" autocomplete="current-password" style="box-sizing:border-box;width:100%;margin-top:4px;padding:5px"></label>' +
      '<button data-auto="use-account" type="button" style="width:100%;padding:7px;border:0;border-radius:5px;background:#4b2483;color:#fff;cursor:pointer">Đăng nhập với thông tin trên</button>' +
      '<label style="display:flex;gap:8px;align-items:center;margin:8px 0"><input type="checkbox" data-auto="enabled"> Bật tự động đăng nhập</label>' +
      '<label style="display:flex;gap:8px;align-items:center;margin:8px 0"><input type="checkbox" data-auto="retry-returned-login"> Tự thử lại nếu quay về màn hình Login</label>' +
      '<label style="display:block;margin:8px 0">Chờ trước khi bấm Login <input data-auto="login-delay" type="number" min="0.1" max="10" step="0.1" style="width:48px;margin-left:5px"> giây</label>' +
      '<label style="display:block;margin:8px 0">Thử lại khi Profit đầy <input data-auto="retry-delay" type="number" min="0.5" max="120" step="0.1" style="width:48px;margin-left:5px"> giây</label>' +
      '<div style="font-size:11px;color:#657086;margin-top:8px">Tự động chỉ lặp khi trang báo hết chỗ/capacity.</div>';
    const enabled = panel.querySelector('[data-auto="enabled"]');
    const retryReturnedLogin = panel.querySelector('[data-auto="retry-returned-login"]');
    const account = panel.querySelector('[data-auto="account"]');
    const accountPassword = panel.querySelector('[data-auto="account-password"]');
    const useAccount = panel.querySelector('[data-auto="use-account"]');
    const loginDelay = panel.querySelector('[data-auto="login-delay"]');
    const retryDelay = panel.querySelector('[data-auto="retry-delay"]');
    enabled.checked = settings.enabled;
    retryReturnedLogin.checked = settings.retryReturnedLogin;
    loginDelay.value = settings.loginDelay;
    retryDelay.value = settings.retryDelay;
    const queued = readSaved();
    if (queued) { account.value = queued.user || ''; accountPassword.value = queued.password || ''; }
    useAccount.addEventListener('click', () => {
      if (!account.value.trim() || !accountPassword.value) {
        status('Hãy nhập Tài khoản và Mật khẩu trong bảng Auto Login.', false);
        return;
      }
      user.value = account.value.trim();
      password.value = accountPassword.value;
      submitWhenReady();
      status('⚡ AUTO LOGIN: sẽ bấm Log In sau ' + settings.loginDelay + ' giây.', false);
    });
    enabled.addEventListener('change', () => {
      settings.enabled = enabled.checked;
      if (!settings.enabled) { clearTimeout(timer); clearSaved(); status('AUTO LOGIN: ĐÃ TẮT', false); }
      else status('⚡ AUTO LOGIN: BẬT — tự bấm Log In sau khi bạn nhập đủ User ID và mật khẩu.', false);
      saveSettings();
    });
    retryReturnedLogin.addEventListener('change', () => { settings.retryReturnedLogin = retryReturnedLogin.checked; saveSettings(); });
    loginDelay.addEventListener('change', () => { settings.loginDelay = clamp(Number(loginDelay.value), 0.1, 10, defaults.loginDelay); loginDelay.value = settings.loginDelay; saveSettings(); });
    retryDelay.addEventListener('change', () => { settings.retryDelay = clamp(Number(retryDelay.value), 0.5, 120, defaults.retryDelay); retryDelay.value = settings.retryDelay; saveSettings(); });
    document.body.appendChild(panel);
  };
  if (!form || !user || !password || !loginButton) { clearSaved(); return; }
  let timer;
  let autoSubmitting = false;
  const submit = (attempts = 0) => {
    clearTimeout(timer);
    if (!saveCurrent(attempts)) return;
    autoSubmitting = true;
    loginButton.click();
  };
  const submitWhenReady = () => {
    clearTimeout(timer);
    if (!settings.enabled) return;
    if (!user.value.trim() || !password.value) return;
    timer = setTimeout(() => submit(0), Math.round(settings.loginDelay * 1000));
  };
  // Covers a manual click too: the legacy page submits via form.submit(),
  // which does not dispatch a submit event.
  document.addEventListener('click', (event) => { if (!autoSubmitting && event.target === loginButton) saveCurrent(0); }, true);
  user.addEventListener('input', submitWhenReady);
  password.addEventListener('input', submitWhenReady);

  const saved = readSaved();
  if (saved && settings.enabled && !isCredentialFailure() && (isCapacityMessage() || settings.retryReturnedLogin)) {
    user.value = saved.user;
    password.value = saved.password;
    const nextAttempt = (Number(saved.attempts) || 0) + 1;
    saveCurrent(nextAttempt);
    status((isCapacityMessage() ? 'Profit đang đầy.' : 'Profit quay lại màn hình Login.') + ' Tự điền lại thông tin và thử lại sau ' + settings.retryDelay + ' giây (lần ' + nextAttempt + ').', true);
    timer = setTimeout(() => submit(nextAttempt), Math.round(settings.retryDelay * 1000));
  } else if (saved) {
    // A returned login screen without a capacity message is treated as an
    // authentication/access response, never retried automatically.
    clearSaved();
  }
  addControls();
  if (!saved || (!isCapacityMessage() && !settings.retryReturnedLogin)) status(settings.enabled ? '⚡ AUTO LOGIN: BẬT — tự bấm Log In sau khi bạn nhập đủ User ID và mật khẩu.' : 'AUTO LOGIN: ĐÃ TẮT', false);
})();
</script>`;

function rewriteCookie(cookie) {
  // Cookies need to belong to localhost for the browser to send them back to
  // this local proxy. Secure cookies cannot be used over a localhost HTTP URL.
  return cookie
    .replace(/;\s*Domain=[^;]*/gi, "")
    .replace(/;\s*SameSite=None/gi, "; SameSite=Lax")
    .replace(/;\s*Secure/gi, "");
}

function rewriteHeaders(headers, localOrigin) {
  const result = { ...headers };
  delete result["content-length"];
  delete result["content-encoding"];
  delete result["content-security-policy"];
  delete result["content-security-policy-report-only"];
  if (Array.isArray(result["set-cookie"])) result["set-cookie"] = result["set-cookie"].map(rewriteCookie);
  if (typeof result.location === "string") result.location = result.location.replace(TARGET_ORIGIN, localOrigin);
  return result;
}

function injectLoginAutomation(html, localOrigin) {
  const proxied = html.split(TARGET_ORIGIN).join(localOrigin);
  return /<\/body\s*>/i.test(proxied)
    ? proxied.replace(/<\/body\s*>/i, `${loginAutomation}</body>`)
    : `${proxied}${loginAutomation}`;
}

const server = http.createServer((clientRequest, clientResponse) => {
  const localOrigin = `http://${clientRequest.headers.host || `127.0.0.1:${PORT}`}`;
  const incomingUrl = new URL(clientRequest.url, localOrigin);
  if (!isLoopback(clientRequest.socket.remoteAddress) && !isTrustedLan(clientRequest.socket.remoteAddress) && !hasAccessCookie(clientRequest)) {
    if (clientRequest.method === "GET" && incomingUrl.searchParams.get("access") === ACCESS_TOKEN) {
      incomingUrl.searchParams.delete("access");
      clientResponse.writeHead(302, {
        Location: `${incomingUrl.pathname}${incomingUrl.search}`,
        "Set-Cookie": `${ACCESS_COOKIE}=${ACCESS_TOKEN}; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800`,
        "Cache-Control": "no-store",
      });
      return clientResponse.end();
    }
    clientResponse.writeHead(403, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
    return clientResponse.end("Link này cần khoá truy cập. Hãy dùng đúng link LAN được cung cấp.");
  }
  const requestUrl = new URL(`${incomingUrl.pathname}${incomingUrl.search}`, TARGET_ORIGIN);
  if (!requestUrl.pathname.startsWith("/VNM/")) {
    clientResponse.writeHead(302, { Location: "/VNM/servlet/SvltLogin", "Cache-Control": "no-store" });
    return clientResponse.end();
  }

  const headers = { ...clientRequest.headers, host: "profit.aeon.com.vn" };
  delete headers.connection;
  delete headers["accept-encoding"];
  if (headers.cookie) {
    headers.cookie = removeAccessCookie(headers.cookie);
    if (!headers.cookie) delete headers.cookie;
  }
  const targetRequest = https.request(requestUrl, { method: clientRequest.method, headers }, (targetResponse) => {
    const contentType = targetResponse.headers["content-type"] || "";
    if (!/text\/html/i.test(contentType)) {
      clientResponse.writeHead(targetResponse.statusCode || 502, rewriteHeaders(targetResponse.headers, localOrigin));
      return targetResponse.pipe(clientResponse);
    }
    const chunks = [];
    targetResponse.on("data", (chunk) => chunks.push(chunk));
    targetResponse.on("end", () => {
      const html = injectLoginAutomation(Buffer.concat(chunks).toString("utf8"), localOrigin);
      clientResponse.writeHead(targetResponse.statusCode || 502, rewriteHeaders(targetResponse.headers, localOrigin));
      clientResponse.end(html);
    });
  });
  targetRequest.on("error", () => {
    clientResponse.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
    clientResponse.end("Không thể kết nối tới Profit. Hãy kiểm tra mạng/VPN rồi tải lại trang.");
  });
  clientRequest.pipe(targetRequest);
});

server.listen(PORT, HOST, () => {
  const lanAddress = getLanAddress();
  console.log(`Profit Proxy local: http://127.0.0.1:${PORT}/VNM/servlet/SvltLogin`);
  if (lanAddress) console.log(`Profit Proxy LAN (no key, trusted subnet only): http://${lanAddress}:${PORT}/VNM/servlet/SvltLogin`);
});
