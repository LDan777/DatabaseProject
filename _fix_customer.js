const fs = require('fs');
const path = 'd:/Project/DatabaseProject/airline-frontend/src/views/CustomerView.vue';
let c = fs.readFileSync(path, 'utf8');

// 1. Add regIdCard and showPassword variables after formError
c = c.replace(
  'const formError = ref(\'\') \r\n\r\n// 身份证状态',
  'const formError = ref(\'\') \r\nconst regIdCard = ref(\'\')       // 注册时填写的身份证号\r\nconst showPassword = ref(false)  // 密码显示/隐藏切换\r\n\r\n// 身份证状态'
);

// 2. Add ID card validation in registration mode (before password check)
c = c.replace(
  '  if (isRegisterMode.value) {\r\n    if (!/^(?=.*[a-z])(?=.*[A-Z]).{8,}$/.test(password.value)) {',
  '  if (isRegisterMode.value) {\r\n    if (!regIdCard.value || regIdCard.value.length !== 18) {\r\n      formError.value = \'请输入18位身份证号码\'\r\n      return\r\n    }\r\n    if (!/^(?=.*[a-z])(?=.*[A-Z]).{8,}$/.test(password.value)) {'
);

// 3. Fix registration to use real ID card instead of auto-generated one
c = c.replace(
  '        id_card: \'REG_\' + phoneNumber.value, \r\n        name: \'用户_\' + phoneNumber.value.slice(-4)',
  '        id_card: regIdCard.value,\r\n        name: \'用户_\' + phoneNumber.value.slice(-4)'
);

// 4. Add ID card input field in registration form (after confirm password div)
c = c.replace(
  '        <div class="input-group-modern" v-if="isRegisterMode">\r\n          <label>确认密码</label>\r\n          <input v-model="confirmPassword" type="password" placeholder="请再次确认密码">\r\n        </div>',
  '        <div class="input-group-modern" v-if="isRegisterMode">\r\n          <label>身份证号码</label>\r\n          <input v-model="regIdCard" type="text" placeholder="请输入18位身份证号" maxlength="18">\r\n        </div>\r\n\r\n        <div class="input-group-modern" v-if="isRegisterMode">\r\n          <label>确认密码</label>\r\n          <input v-model="confirmPassword" :type="showPassword ? \'text\' : \'password\'" placeholder="请再次确认密码">\r\n        </div>'
);

// 5. Add password toggle button to login password field + make it toggleable
c = c.replace(
  '        <div class="input-group-modern">\r\n          <label>登录密码</label>\r\n          <input v-model="password" type="password" placeholder="请输入密码">\r\n        </div>',
  '        <div class="input-group-modern">\r\n          <label>登录密码</label>\r\n          <div class="password-wrap">\r\n            <input v-model="password" :type="showPassword ? \'text\' : \'password\'" placeholder="请输入密码">\r\n            <button type="button" class="btn-toggle-pwd" @click="showPassword = !showPassword">\r\n              <i :class="showPassword ? \'fas fa-eye-slash\' : \'fas fa-eye\'"></i>\r\n            </button>\r\n          </div>\r\n        </div>'
);

// 6. Add admin entry link in login modal (before the cancel button)
c = c.replace(
  '        <button class="btn-cancel-flat" @click="showLoginModal = false">取消</button>\r\n      </div>\r\n    </div>',
  '        <div class="admin-entry">\r\n          <a href="/admin" style="font-size:12px;color:#94a3b8;">管理员入口 →</a>\r\n        </div>\r\n        <button class="btn-cancel-flat" @click="showLoginModal = false">取消</button>\r\n      </div>\r\n    </div>'
);

// 7. Add password-toggle CSS
c = c.replace(
  '.btn-cancel-flat:hover { color: #475569; }',
  '.btn-cancel-flat:hover { color: #475569; }\r\n\r\n.password-wrap { position: relative; display: flex; align-items: center; }\r\n.password-wrap input { flex: 1; padding-right: 40px; }\r\n.btn-toggle-pwd { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 16px; padding: 4px; }\r\n.btn-toggle-pwd:hover { color: #475569; }\r\n\r\n.admin-entry { text-align: center; margin-top: 10px; }\r\n.admin-entry a { color: #94a3b8; text-decoration: none; transition: 0.2s; }\r\n.admin-entry a:hover { color: #38bdf8; text-decoration: underline; }'
);

fs.writeFileSync(path, c, 'utf8');
console.log('CustomerView.vue updated successfully!');
