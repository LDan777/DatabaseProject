const fs = require('fs');
const path = 'd:/Project/DatabaseProject/airline-frontend/src/views/CustomerView.vue';
let c = fs.readFileSync(path, 'utf8');

// 1. Fix register API to use userName instead of auto-generated name
c = c.replace(
  "name: '用户_' + phoneNumber.value.slice(-4)",
  "name: userName.value"
);

// 2. Add userName validation before idCard check in register mode
c = c.replace(
  "if (!idCard.value || idCard.value.length !== 18) {",
  "if (!userName.value || userName.value.trim().length < 2) {\r\n      formError.value = '请输入用户名（至少2个字符）'\r\n      return\r\n    }\r\n    if (!idCard.value || idCard.value.length !== 18) {"
);

// 3. Add userName to switchAuthMode cleanup
c = c.replace(
  "phoneNumber.value = ''",
  "userName.value = ''\r\n  phoneNumber.value = ''"
);

// 4. Fix eye icon: reverse the logic
// Template: showPassword ? 'fa-eye-slash' : 'fa-eye'
c = c.replace(
  "showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'",
  "showPassword ? 'fas fa-eye' : 'fas fa-eye-slash'"
);

// 5. Add username input BEFORE idCard in the template (reorder)
// Replace current idCard block with userName + idCard
c = c.replace(
  '        <div class="input-group-modern" v-if="isRegisterMode">\r\n          <label>身份证号码</label>\r\n          <input v-model="idCard" type="text" placeholder="请输入18位身份证号" maxlength="18">\r\n        </div>',
  '        <div class="input-group-modern" v-if="isRegisterMode">\r\n          <label>用户名</label>\r\n          <input v-model="userName" type="text" placeholder="请输入您的真实姓名" maxlength="20">\r\n        </div>\r\n\r\n        <div class="input-group-modern" v-if="isRegisterMode">\r\n          <label>身份证号码</label>\r\n          <input v-model="idCard" type="text" placeholder="请输入18位身份证号" maxlength="18">\r\n        </div>'
);

// 6. Move password + confirm-password to the bottom (they're after idCard already, but ensure)
// The current order should become: phone → userName → idCard → password → confirmPassword → submit
// Password and confirmPassword are ALREADY after idCard in the template structure, so leaving as-is

fs.writeFileSync(path, c, 'utf8');
console.log('CustomerView.vue v2 fix complete!');
