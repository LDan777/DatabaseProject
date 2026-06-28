const fs = require('fs');
const p = 'd:/Project/DatabaseProject/airline-frontend/src/views/AdminView.vue';
let c = fs.readFileSync(p, 'utf8');

// 5a. Add sidebar menu items for 城市管理 and 机场管理
c = c.replace(
  `        <div class="el-menu-item" :class="{ 'is-active': activeMenu === 'users' }" @click="activeMenu = 'users'">\r\n          <i class="fas fa-users"></i><span v-show="!isCollapse">用户档案</span>\r\n        </div>\r\n        \r\n        <div class="el-menu-group-title" v-show="!isCollapse">航班调度</div>`,
  `        <div class="el-menu-item" :class="{ 'is-active': activeMenu === 'users' }" @click="activeMenu = 'users'">\r\n          <i class="fas fa-users"></i><span v-show="!isCollapse">用户档案</span>\r\n        </div>\r\n        <div class="el-menu-item" :class="{ 'is-active': activeMenu === 'cities' }" @click="activeMenu = 'cities'">\r\n          <i class="fas fa-city"></i><span v-show="!isCollapse">城市管理</span>\r\n        </div>\r\n        <div class="el-menu-item" :class="{ 'is-active': activeMenu === 'airports' }" @click="activeMenu = 'airports'">\r\n          <i class="fas fa-tower-observation\"></i><span v-show="!isCollapse">机场管理</span>\r\n        </div>\r\n        \r\n        <div class="el-menu-group-title" v-show="!isCollapse">航班调度</div>`
);

// 5b. Add dashboard quick links
c = c.replace(
  `                  <button class="quick-link-btn" @click="activeMenu = 'routes'"><i class="fas fa-arrows-up-to-line"></i> 班次查询</button>`,
  `                  <button class="quick-link-btn" @click="activeMenu = 'routes'"><i class="fas fa-arrows-up-to-line"></i> 班次查询</button>\r\n                  <button class="quick-link-btn" @click="activeMenu = 'cities'"><i class="fas fa-city"></i> 城市管理</button>\r\n                  <button class="quick-link-btn" @click="activeMenu = 'airports'"><i class="fas fa-tower-observation\"></i> 机场管理</button>`
);

// 5c. Extend main view v-if to include cities and airports
c = c.replace(
  `v-if="activeMenu === 'flights' || activeMenu === 'orders' || activeMenu === 'system'" class="standard-view fade-in"`,
  `v-if="activeMenu === 'flights' || activeMenu === 'orders' || activeMenu === 'system' || activeMenu === 'cities' || activeMenu === 'airports'" class="standard-view fade-in"`
);

// 5d. Fix operate-left title
c = c.replace(
  `{{ activeMenu === 'flights' ? '航班参数实体表' : activeMenu === 'orders' ? '全域订单流水表' : '资讯实体表' }}`,
  `{{ activeMenu === 'flights' ? '航班参数实体表' : activeMenu === 'orders' ? '全域订单流水表' : activeMenu === 'cities' ? '城市基础数据表' : activeMenu === 'airports' ? '机场基础数据表' : '资讯实体表' }}`
);

fs.writeFileSync(p, c, 'utf8');
console.log('Phase 3a: sidebar + quick links + v-if done');
