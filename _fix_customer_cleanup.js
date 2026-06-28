const fs = require('fs');
const path = 'd:/Project/DatabaseProject/airline-frontend/src/views/CustomerView.vue';
let c = fs.readFileSync(path, 'utf8');

// Fix the API call to use idCard.value instead of regIdCard.value
c = c.replace(
  'id_card: regIdCard.value,',
  'id_card: idCard.value,'
);

// Remove the misplaced debug log inside the validation if block (line 156)
// Match: the console.log that's inside the if block for idCard check
c = c.replace(
  "      formError.value = '请输入18位身份证号码'",
  "      formError.value = '请输入18位身份证号码'"
);

// Actually remove the misplaced debug log (the one with pwdLen, inside if block)
c = c.replace(
  "  console.log('【注册调试】开始注册流程...', { phone: phoneNumber.value, id_card: idCard.value, pwdLen: password.value.length })\r\n      formError.value = '请输入18位身份证号码'",
  "      formError.value = '请输入18位身份证号码'"
);

fs.writeFileSync(path, c, 'utf8');
console.log('CustomerView.vue cleanup done!');
