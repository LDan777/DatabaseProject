const fs = require('fs');
const path = 'd:/Project/DatabaseProject/airline-frontend/src/views/AdminView.vue';
let c = fs.readFileSync(path, 'utf8');

// Replace the entire routes tab content (from "activeMenu === 'routes'" div to before "activeMenu === 'flights'")
const oldRoutesStart = c.indexOf('<div v-if="activeMenu === \'routes\'" class="standard-view fade-in">');
const oldRoutesEnd = c.indexOf('<div v-if="activeMenu === \'flights\' || activeMenu ===');

const newRoutes = `<div v-if="activeMenu === 'routes'" class="standard-view fade-in">
          <div class="table-container table-responsive">
            <div class="operate-container border-bottom">
              <div class="operate-left"><i class="fas fa-map"></i> 航线基准数据表</div>
              <div class="operate-right" style="display: flex; gap: 10px; align-items: center;">
                <input v-model="routeSearchKeyword" class="el-input__inner" placeholder="搜索起降城市" style="width:200px;">
                <button class="el-button primary small" @click="openRouteModal(null)"><i class="fas fa-plus"></i> 新增航线</button>
              </div>
            </div>
            <table class="el-table">
              <thead><tr><th>航线编号</th><th>出发城市</th><th>到达城市</th><th class="text-center">操作</th></tr></thead>
              <tbody>
                <tr v-if="filteredRoutes.length === 0"><td colspan="4" class="text-center py-3 text-secondary">暂无航线数据，请点击"新增航线"添加</td></tr>
                <tr v-for="r in filteredRoutes" :key="r.id">
                  <td><b>{{ r.id }}</b></td>
                  <td>{{ r.departure_city }}</td>
                  <td>{{ r.arrival_city }}</td>
                  <td class="text-center">
                    <button class="el-button text primary" @click="openRouteModal(r)">编辑</button>
                    <button class="el-button text danger" @click="handleRouteDelete(r.id)">删除</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        `;

c = c.substring(0, oldRoutesStart) + newRoutes + c.substring(oldRoutesEnd);

// Replace the flights table section
const oldFlightTableStart = c.indexOf('<table class="el-table" v-if="activeMenu === \'flights\'">');
const oldFlightTableEnd = c.indexOf('</table>\r\n            <div v-if="activeMenu === \'flights\'" class="library-box">');

const newFlightTable = `<table class="el-table" v-if="activeMenu === 'flights'">
              <thead><tr><th>航班号</th><th>机型</th><th>座位配置(F/Y)</th><th>起降城市</th><th>每周飞行日</th><th>飞行时段</th><th class="text-center">操作</th></tr></thead>
              <tbody>
                <tr v-if="filteredFlights.length === 0"><td colspan="7" class="text-center py-3 text-secondary">暂无航班数据，点击"新增航班"添加</td></tr>
                <tr v-for="f in filteredFlights" :key="f.flight_no">
                  <td><b class="text-primary">{{ f.flight_no }}</b></td>
                  <td>{{ f.plane_model }}</td>
                  <td><span class="el-tag info mini">F:{{ f.first_class_num }} / Y:{{ f.economy_num }}</span></td>
                  <td>{{ f.departure_city || '-' }} → {{ f.arrival_city || '-' }}</td>
                  <td>{{ f.fly_week_day }}</td>
                  <td>{{ f.fly_duration || '-' }}</td>
                  <td class="text-center">
                    <button class="el-button text primary" @click="openFlightModal(f)">编辑</button>
                    <button class="el-button text danger" @click="handleFlightDelete(f.flight_no)">删除</button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-if="activeMenu === 'flights'" class="library-box">`;

c = c.substring(0, oldFlightTableStart) + newFlightTable + c.substring(oldFlightTableEnd);

// Fix the "新增航班" button to use openFlightModal instead of openEditModal
c = c.replace(
  'openEditModal(null, \'flight\')',
  'openFlightModal(null)'
);

// Also fix any remaining "新增航线" references in the operate section
c = c.replace(
  '<button v-if="activeMenu === \'flights\'" class="el-button primary small" @click="openFlightModal(null)"><i class="fas fa-plus"></i> 新增航班</button>',
  '<button v-if="activeMenu === \'flights\'" class="el-button primary small" @click="openFlightModal(null)"><i class="fas fa-plus"></i> 新增航班</button>'
);

fs.writeFileSync(path, c, 'utf8');
console.log('Template sections replaced!');
