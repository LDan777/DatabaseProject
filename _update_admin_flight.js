const fs = require('fs');
const path = 'd:/Project/DatabaseProject/airline-frontend/src/views/AdminView.vue';
let c = fs.readFileSync(path, 'utf8');

// ===== 1. Sidebar: rename =====
c = c.replace('>航线班次</span>', '>航线管理</span>');
c = c.replace('>航班参数</span>', '>航班管理</span>');

// ===== 2. Breadcrumb =====
c = c.replace("'routes': '航班管理 / 航线班次'", "'routes': '航班管理 / 航线管理'");
c = c.replace("'flights': '航班管理 / 航班参数'", "'flights': '航班管理 / 航班表'");

// ===== 3. Clear fake route data =====
c = c.replace(
  "const routes = ref([\r\n  { id: 'R01', origin: 'PEK', destination: 'SHA', type: '国内干线' },\r\n  { id: 'R02', origin: 'TFU', destination: 'XIY', type: '西部支线' },\r\n  { id: 'R03', origin: 'SHA', destination: 'PKX', type: '热门干线' }\r\n])",
  "const routes = ref([])"
);

// ===== 4. Clear fake flight data =====
const oldFlightsData = "const flights = ref([\r\n  { flightNo: 'MU5101', name: '东方5101', dep: 'SHA', arr: 'PKX', time: '10:30', aircraft: 'A330', price: 1280, fSeats: 30, eSeats: 220, schedule: '1,3,5', status: FLIGHT_STATUS.FLYING },\r\n  { flightNo: 'CA1831', name: '国航1831', dep: 'PKX', arr: 'CTU', time: '14:20', aircraft: 'B737', price: 950, fSeats: 8, eSeats: 150, schedule: 'Daily', status: FLIGHT_STATUS.DELAYED },\r\n  { flightNo: 'CZ6201', name: '南航6201', dep: 'PVG', arr: 'TFU', time: '08:00', aircraft: 'B787', price: 1500, fSeats: 28, eSeats: 260, schedule: '2,4,6', status: FLIGHT_STATUS.ARRIVED }\r\n])";
c = c.replace(oldFlightsData, 'const flights = ref([])');

// ===== 5. Update onMounted =====
c = c.replace(
  'await loadCities()\r\n  await loadAirports()',
  'await loadCities()\r\n  await loadAirports()\r\n  await loadFlights()'
);

// ===== 6. Fix table title =====
c = c.replace(
  "{{ activeMenu === 'flights' ? '航班参数实体表'",
  "{{ activeMenu === 'flights' ? '航班基础数据表'"
);

// ===== 7. Remove old filteredScheduleFlights computed =====
c = c.replace(
  "const filteredScheduleFlights = computed(() => {\r\n  return flights.value.filter(f => {\r\n    const matchDep = f.dep.toLowerCase().includes(flightQuery.value.dep.toLowerCase())\r\n    const matchArr = f.arr.toLowerCase().includes(flightQuery.value.arr.toLowerCase())\r\n    const matchSchedule = flightQuery.value.schedule === '' || f.schedule.includes(flightQuery.value.schedule) || f.schedule === 'Daily'\r\n    const matchStatus = flightQuery.value.status === '' || f.status === flightQuery.value.status\r\n    return matchDep && matchArr && matchSchedule && matchStatus\r\n  })\r\n})",
  ''
);

fs.writeFileSync(path, c, 'utf8');
console.log('AdminView.vue part 1 done!');
