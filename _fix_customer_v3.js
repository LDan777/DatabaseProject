const fs = require('fs');
const path = 'd:/Project/DatabaseProject/airline-frontend/src/views/CustomerView.vue';
let c = fs.readFileSync(path, 'utf8');

// Restructure: Move password block. In login mode show password after idCard.
// In register mode show password+confirmPassword together at the BOTTOM.

const oldPasswordBlock = '        <div class="input-group-modern">\r\n          <label>登录密码</label>\r\n          <div class="password-wrap">\r\n            <input v-model="password" :type="showPassword ? \'text\' : \'password\'" placeholder="请输入密码">\r\n            <button type="button" class="btn-toggle-pwd" @click="showPassword = !showPassword">\r\n              <i :class="showPassword ? \'fas fa-eye\' : \'fas fa-eye-slash\'"></i>\r\n            </button>\r\n          </div>\r\n        </div>';

// Replace old password block with login-only password
const newLoginPassword = '        <div class="input-group-modern" v-if="!isRegisterMode">\r\n          <label>登录密码</label>\r\n          <div class="password-wrap">\r\n            <input v-model="password" :type="showPassword ? \'text\' : \'password\'" placeholder="请输入密码">\r\n            <button type="button" class="btn-toggle-pwd" @click="showPassword = !showPassword">\r\n              <i :class="showPassword ? \'fas fa-eye\' : \'fas fa-eye-slash\'"></i>\r\n            </button>\r\n          </div>\r\n        </div>';

c = c.replace(oldPasswordBlock, newLoginPassword);

// Now insert a register password block right after the confirmPassword block
const confirmBlock = '        <div class="input-group-modern" v-if="isRegisterMode">\r\n          <label>确认密码</label>\r\n          <input v-model="confirmPassword" :type="showPassword ? \'text\' : \'password\'" placeholder="请再次确认密码">\r\n        </div>';

const newRegisterPassBlock = '        <div class="input-group-modern" v-if="isRegisterMode">\r\n          <label>登录密码</label>\r\n          <div class="password-wrap">\r\n            <input v-model="password" :type="showPassword ? \'text\' : \'password\'" placeholder="请输入密码">\r\n            <button type="button" class="btn-toggle-pwd" @click="showPassword = !showPassword">\r\n              <i :class="showPassword ? \'fas fa-eye\' : \'fas fa-eye-slash\'"></i>\r\n            </button>\r\n          </div>\r\n        </div>\r\n\r\n        <div class="input-group-modern" v-if="isRegisterMode">\r\n          <label>确认密码</label>\r\n          <input v-model="confirmPassword" :type="showPassword ? \'text\' : \'password\'" placeholder="请再次确认密码">\r\n        </div>';

c = c.replace(confirmBlock, newRegisterPassBlock);

fs.writeFileSync(path, c, 'utf8');
console.log('CustomerView.vue v3: password fields reordered!');
