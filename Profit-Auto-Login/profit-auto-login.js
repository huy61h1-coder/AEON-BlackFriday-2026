"use strict";

const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright-core");

const LOGIN_URL = "https://profit.aeon.com.vn/VNM/servlet/SvltLogin";
const MAX_ATTEMPTS = Number.parseInt(process.argv[2] || "3", 10);
const browserPaths = [
  process.env.PROFIT_BROWSER_PATH,
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
].filter(Boolean);

function log(message) {
  process.stdout.write(`[Profit Auto Login] ${message}\n`);
}

function readCredentials() {
  return new Promise((resolve, reject) => {
    let input = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => { input += chunk; });
    process.stdin.on("end", () => {
      try {
        const credentials = JSON.parse(input);
        if (!credentials.user || !credentials.password) {
          throw new Error("Thiếu User ID hoặc mật khẩu.");
        }
        resolve(credentials);
      } catch (error) {
        reject(error);
      }
    });
  });
}

function findBrowser() {
  const executablePath = browserPaths.find((candidate) => fs.existsSync(candidate));
  if (!executablePath) {
    throw new Error("Không tìm thấy Microsoft Edge hoặc Google Chrome. Cài một trong hai trình duyệt rồi thử lại.");
  }
  return executablePath;
}

async function hasLoginForm(page) {
  return page.locator('input[name="txtUsr_id"]').isVisible().catch(() => false);
}

async function loginErrorText(page) {
  const text = await page.locator("body").innerText().catch(() => "");
  // The server supplies its own error codes.  A returned login form is handled
  // cautiously as a credential/access issue, never as a reason to brute-force.
  const errorLine = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => /(?:invalid|incorrect|cannot|denied|failed|error|password|user[_ ]?id)/i.test(line));
  return errorLine || "Máy chủ vẫn hiển thị màn hình đăng nhập.";
}

async function openAndLogin(executablePath, credentials) {
  const profileDir = path.join(__dirname, "profile");
  const context = await chromium.launchPersistentContext(profileDir, {
    executablePath,
    headless: false,
    viewport: null,
    args: ["--start-maximized"],
  });
  const page = context.pages()[0] || await context.newPage();
  page.setDefaultTimeout(20_000);
  page.setDefaultNavigationTimeout(30_000);

  try {
    await page.goto(LOGIN_URL, { waitUntil: "domcontentloaded" });
    await page.locator('input[name="txtUsr_id"]').fill(credentials.user);
    await page.locator('input[name="txtPassword"]').fill(credentials.password);
    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30_000 }).catch(() => null),
      page.locator('input[name="btnLogin"]').click(),
    ]);

    // Let the legacy application complete any server-side redirect.
    await page.waitForTimeout(1_000);
    if (await hasLoginForm(page)) {
      const detail = await loginErrorText(page);
      throw Object.assign(new Error(detail), { credentialOrAccessFailure: true });
    }
    return { context, page };
  } catch (error) {
    await context.close().catch(() => {});
    throw error;
  }
}

async function main() {
  const credentials = await readCredentials();
  const executablePath = findBrowser();
  const attempts = Number.isInteger(MAX_ATTEMPTS) ? Math.min(Math.max(MAX_ATTEMPTS, 1), 5) : 3;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      log(`Đang đăng nhập (lần ${attempt}/${attempts})…`);
      const { context, page } = await openAndLogin(executablePath, credentials);
      log("Đăng nhập thành công. Cửa sổ Profit đang được giữ mở.");
      await Promise.race([
        page.waitForEvent("close"),
        context.waitForEvent("close"),
      ]);
      return;
    } catch (error) {
      if (error.credentialOrAccessFailure) {
        throw new Error(`Profit không chấp nhận đăng nhập: ${error.message}\nKhông thử lại để tránh khóa tài khoản. Kiểm tra User ID/mật khẩu hoặc quyền truy cập rồi chạy lại.`);
      }
      if (attempt === attempts) {
        throw new Error(`Không thể kết nối/đăng nhập sau ${attempts} lần: ${error.message}`);
      }
      log(`Lỗi kết nối tạm thời; sẽ thử lại sau 3 giây (${error.message}).`);
      await new Promise((resolve) => setTimeout(resolve, 3_000));
    }
  }
}

main().catch((error) => {
  process.stderr.write(`\n${error.message}\n`);
  process.exitCode = 1;
});
