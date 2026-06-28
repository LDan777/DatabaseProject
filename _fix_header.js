const fs = require('fs');
const path = 'd:/Project/DatabaseProject/airline-frontend/src/views/CustomerView.vue';
let c = fs.readFileSync(path, 'utf8');

// Add admin entry button in header next to login/register buttons
c = c.replace(
  '            <div class="auth-btns">\r\n              <button class="btn-login-outline" @click="showLoginModal = true; switchAuthMode(false)">登录</button>\r\n              <button class="btn-register-solid" @click="showLoginModal = true; switchAuthMode(true)">注册</button>\r\n            </div>',
  '            <div class="auth-btns">\r\n              <button class="btn-login-outline" @click="showLoginModal = true; switchAuthMode(false)">登录</button>\r\n              <button class="btn-register-solid" @click="showLoginModal = true; switchAuthMode(true)">注册</button>\r\n              <a href="/admin" class="btn-admin-entry" title="管理员后台">🔧</a>\r\n            </div>'
);

// Add CSS for admin entry button in header
c = c.replace(
  '.btn-register-solid:hover { background: #0ea5e9; }',
  '.btn-register-solid:hover { background: #0ea5e9; }\r\n.btn-admin-entry { font-size: 18px; color: #94a3b8; text-decoration: none; padding: 6px 8px; transition: 0.2s; }\r\n.btn-admin-entry:hover { color: #38bdf8; }'
);

fs.writeFileSync(path, c, 'utf8');
console.log('Header admin button added!');
