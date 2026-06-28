const fs = require('fs');
const path = 'd:/Project/DatabaseProject/airline-frontend/src/views/CustomerView.vue';
let c = fs.readFileSync(path, 'utf8');

// 1. Change template: regIdCard -> idCard
c = c.replace(
  '<input v-model="regIdCard" type="text" placeholder="请输入18位身份证号" maxlength="18">',
  '<input v-model="idCard" type="text" placeholder="请输入18位身份证号" maxlength="18">'
);

// 2. Fix register validation: regIdCard -> idCard
c = c.replace(
  'if (!regIdCard.value || regIdCard.value.length !== 18) {',
  'if (!idCard.value || idCard.value.length !== 18) {'
);

// 3. Fix register debug log: regIdCard -> idCard
c = c.replace(
  "console.log('【注册调试】进入注册分支, phone=', phoneNumber.value, 'idCard=', regIdCard.value)",
  "console.log('【注册调试】进入注册分支, phone=', phoneNumber.value, 'idCard=', idCard.value)"
);

// 4. Fix register API call: regIdCard -> idCard  
c = c.replace(
  'id_card: regIdCard.value,',
  'id_card: idCard.value,'
);

// 5. Move the misplaced debug log: remove it from inside the if block
c = c.replace(
  "  console.log('【注册调试】开始注册流程...', { phone: phoneNumber.value, id_card: regIdCard.value, pwdLen: password.value.length })\r\n      formError.value = '请输入18位身份证号码'",
  "      formError.value = '请输入18位身份证号码'"
);

// 6. Add proper debug log before axios call (after all validations pass)
c = c.replace(
  "    try {\r\n      console.log('【注册调试】发送注册请求...', API_BASE + '/register')",
  "    console.log('【注册调试】开始注册流程...', { phone: phoneNumber.value, id_card: idCard.value })\r\n    try {\r\n      console.log('【注册调试】发送注册请求...', API_BASE + '/register')"
);

fs.writeFileSync(path, c, 'utf8');
console.log('CustomerView.vue fix complete!');
