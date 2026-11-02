"use strict";

const http = require("http");
const path = require("path");
const { spawn } = require("child_process");

const HOST = "127.0.0.1";
const PORT = Number.parseInt(process.env.PROFIT_LOCAL_PORT || "47831", 10);
let state = { phase: "ready", message: "Sẵn sàng nhận đăng nhập.", running: false };
let activeProcess = null;

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

function sendHtml(response) {
  response.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(`<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Profit Auto Login</title><style>
  :root { color-scheme: light; font-family: "Segoe UI", sans-serif; }
  body { margin:0; min-height:100vh; display:grid; place-items:center; background:#f3f5fa; color:#17203a; }
  main { width:min(420px,calc(100% - 32px)); padding:32px; box-sizing:border-box; background:#fff; border-radius:18px; box-shadow:0 12px 34px #24325b20; }
  h1 { font-size:24px; margin:0 0 8px; color:#4b2483; } p { line-height:1.5; color:#586174; }
  label { display:block; margin:18px 0 7px; font-weight:600; } input { width:100%; box-sizing:border-box; padding:12px; border:1px solid #c8cdd8; border-radius:9px; font:inherit; }
  button { width:100%; margin-top:22px; padding:12px; border:0; border-radius:9px; background:#4b2483; color:white; cursor:pointer; font:600 16px "Segoe UI",sans-serif; }
  button:disabled { opacity:.65; cursor:wait; } #status { margin:20px 0 0; padding:12px; border-radius:9px; background:#f3f5fa; font-size:14px; } .note { font-size:13px; }
</style></head><body><main>
  <h1>Profit Auto Login</h1><p>Mở Profit bằng Edge/Chrome và đăng nhập tự động.</p>
  <form id="login"><label for="user">User ID</label><input id="user" name="user" autocomplete="username" required autofocus>
  <label for="password">Mật khẩu</label><input id="password" name="password" type="password" autocomplete="current-password" required>
  <button>Đăng nhập Profit</button></form>
  <div id="status" role="status">Đang tải trạng thái…</div>
  <p class="note">Thông tin không được lưu. Công cụ chỉ thử lại lỗi kết nối; nếu bị từ chối đăng nhập, nó sẽ dừng để tránh khóa tài khoản.</p>
</main><script>
const form=document.querySelector('#login'), button=form.querySelector('button'), status=document.querySelector('#status');
async function refresh(){const s=await fetch('/api/status',{cache:'no-store'}).then(r=>r.json());status.textContent=s.message;button.disabled=s.running;}
form.addEventListener('submit',async(e)=>{e.preventDefault();button.disabled=true;status.textContent='Đang mở Profit…';const data=Object.fromEntries(new FormData(form));form.querySelector('#password').value='';const res=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const body=await res.json();status.textContent=body.message;if(!res.ok)button.disabled=false;});
refresh();setInterval(refresh,1000);
</script></body></html>`);
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 8_192) request.destroy();
    });
    request.on("end", () => {
      try { resolve(JSON.parse(body)); } catch { reject(new Error("Dữ liệu đăng nhập không hợp lệ.")); }
    });
    request.on("error", reject);
  });
}

function startLogin(credentials) {
  activeProcess = spawn(process.execPath, [path.join(__dirname, "profit-auto-login.js"), "3"], {
    stdio: ["pipe", "pipe", "pipe"], windowsHide: false,
  });
  state = { phase: "working", message: "Đang kết nối Profit…", running: true };
  activeProcess.stdout.setEncoding("utf8");
  activeProcess.stderr.setEncoding("utf8");
  activeProcess.stdout.on("data", (chunk) => {
    const lastLine = chunk.trim().split(/\r?\n/).pop();
    if (lastLine) state.message = lastLine.replace(/^\[Profit Auto Login\]\s*/, "");
  });
  activeProcess.stderr.on("data", (chunk) => {
    const lastLine = chunk.trim().split(/\r?\n/).pop();
    if (lastLine) state.message = lastLine;
  });
  activeProcess.on("close", (code) => {
    state = code === 0
      ? { phase: "ready", message: "Phiên Profit đã đóng. Bạn có thể đăng nhập lại.", running: false }
      : { phase: "error", message: "Không đăng nhập được. Kiểm tra thông báo trong cửa sổ Profit hoặc thông tin đăng nhập.", running: false };
    activeProcess = null;
  });
  activeProcess.stdin.end(JSON.stringify(credentials));
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${HOST}:${PORT}`);
  if (request.method === "GET" && url.pathname === "/") return sendHtml(response);
  if (request.method === "GET" && url.pathname === "/api/status") return sendJson(response, 200, state);
  if (request.method === "POST" && url.pathname === "/api/login") {
    const origin = request.headers.origin || "";
    if (origin !== `http://${HOST}:${PORT}`) return sendJson(response, 403, { message: "Yêu cầu không hợp lệ." });
    if (activeProcess) return sendJson(response, 409, { message: "Đang xử lý một đăng nhập khác." });
    try {
      const { user, password } = await readJson(request);
      if (typeof user !== "string" || typeof password !== "string" || !user.trim() || !password) {
        return sendJson(response, 400, { message: "Hãy nhập User ID và mật khẩu." });
      }
      startLogin({ user: user.trim(), password });
      return sendJson(response, 202, { message: "Đang mở Profit…" });
    } catch (error) { return sendJson(response, 400, { message: error.message }); }
  }
  sendJson(response, 404, { message: "Không tìm thấy." });
});

server.listen(PORT, HOST, () => console.log(`Profit Auto Login: http://${HOST}:${PORT}`));
