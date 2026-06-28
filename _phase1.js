const fs = require('fs');
const p = 'd:/Project/DatabaseProject/airline-frontend/src/views/AdminView.vue';
let c = fs.readFileSync(p, 'utf8');

// 1. Import API functions
c = c.replace(
  '// import { cancelFlightInstance } from \'@/api/order.js\'\r\n\r\n// --- 0. 常量定义',
  '// import { cancelFlightInstance } from \'@/api/order.js\'\r\nimport { getCityList, addCity, editCity, deleteCity, getAirportList, addAirport, editAirport, deleteAirport, getAirportByArea } from \'@/api/flight.js\'\r\n\r\n// --- 0. 常量定义'
);

// 2. Add city/airport state after routes
c = c.replace(
  'const routes = ref([\r\n  { id: \'R01\', origin: \'PEK\', destination: \'SHA\', type: \'国内干线\' },\r\n  { id: \'R02\', origin: \'TFU\', destination: \'XIY\', type: \'西部支线\' },\r\n  { id: \'R03\', origin: \'SHA\', destination: \'PKX\', type: \'热门干线\' }\r\n])',
  'const routes = ref([\r\n  { id: \'R01\', origin: \'PEK\', destination: \'SHA\', type: \'国内干线\' },\r\n  { id: \'R02\', origin: \'TFU\', destination: \'XIY\', type: \'西部支线\' },\r\n  { id: \'R03\', origin: \'SHA\', destination: \'PKX\', type: \'热门干线\' }\r\n])\r\n\r\n// --- 城市管理 ---\r\nconst cities = ref([])\r\nconst citySearchKeyword = ref(\'\')\r\nconst cityModalVisible = ref(false)\r\nconst cityEditMode = ref(false)\r\nconst cityForm = ref({ area_code: \'\', city_name: \'\', province: \'\' })\r\n\r\n// --- 机场管理 ---\r\nconst airports = ref([])\r\nconst airportSearchKeyword = ref(\'\')\r\nconst airportFilterArea = ref(\'\')\r\nconst airportModalVisible = ref(false)\r\nconst airportEditMode = ref(false)\r\nconst airportForm = ref({ airport_code: \'\', airport_name: \'\', area_code: \'\' })'
);

fs.writeFileSync(p, c, 'utf8');
console.log('Phase 1: imports + state done');
