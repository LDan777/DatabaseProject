const fs = require('fs');
const p = 'd:/Project/DatabaseProject/airline-frontend/src/views/AdminView.vue';
let c = fs.readFileSync(p, 'utf8');

// 1. Add citySearchInput state variable
c = c.replace(
  'const citySearchKeyword = ref(\'\')',
  'const citySearchKeyword = ref(\'\')\r\nconst citySearchInput = ref(\'\')'
);

// 2. Add citySearchTrigger function (after handleCityDelete)
c = c.replace(
  'const filteredCities = computed(() => {',
  'const handleCitySearch = () => { citySearchKeyword.value = citySearchInput.value }\r\nconst filteredCities = computed(() => {'
);

// 3. Change city search input to use citySearchInput + add search button
c = c.replace(
  `<input v-model="citySearchKeyword" class="el-input__inner" placeholder="搜索城市代码/名称/省份" style="width:240px;">\r\n                <button class="el-button primary small" @click="openCityModal(null)"><i class="fas fa-plus"></i> 新增城市</button>`,
  `<input v-model="citySearchInput" class="el-input__inner" placeholder="搜索城市代码/名称/省份" style="width:220px;" @keyup.enter="handleCitySearch">\r\n                <button class="el-button default small" @click="handleCitySearch"><i class="fas fa-search"></i> 搜索</button>\r\n                <button class="el-button primary small" @click="openCityModal(null)"><i class="fas fa-plus"></i> 新增城市</button>`
);

// 4. Fix button colors - dark text everywhere
// .el-button.primary: white text → dark text
c = c.replace(
  '.el-button.primary { color: #fff; background-color: var(--el-color-primary); border-color: var(--el-color-primary); }',
  '.el-button.primary { color: #1a1a2e; background-color: var(--el-color-primary); border-color: var(--el-color-primary); font-weight: 600; }'
);

// 5. default button darker border
c = c.replace(
  '.el-button { display: inline-block; cursor: pointer; background: #fff; border: 1px solid #dcdfe6; color: #606266;',
  '.el-button { display: inline-block; cursor: pointer; background: #fff; border: 1px solid #909399; color: #1f2937;'
);

// 6. text buttons darker
c = c.replace(
  '.el-button.text { border-color: transparent; background: transparent; padding-left: 0; padding-right: 0; margin: 0 5px; color: var(--el-color-primary);}',
  '.el-button.text { border-color: transparent; background: transparent; padding-left: 0; padding-right: 0; margin: 0 5px; color: #1e3a8a; font-weight: 600;}'
);

// 7. danger text button darker
c = c.replace(
  '.el-button.danger.text { color: var(--el-color-danger); }',
  '.el-button.danger.text { color: #c0392b; font-weight: 600; }'
);

// 8. Add primary button hover style
c = c.replace(
  '.el-button:hover { opacity: 0.8; }',
  '.el-button:hover { opacity: 0.85; }\r\n.el-button.primary:hover { background-color: #163072; border-color: #163072; }'
);

fs.writeFileSync(p, c, 'utf8');
console.log('Button fixes + city search button done');
