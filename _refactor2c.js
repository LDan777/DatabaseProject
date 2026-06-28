const fs = require('fs');
const p = 'd:/Project/DatabaseProject/airline-frontend/src/views/AdminView.vue';
let c = fs.readFileSync(p, 'utf8');

// City submit: add validation + better error toast
c = c.replace(
  `const handleCitySubmit = async () => {\r\n  try {\r\n    const res = cityEditMode.value ? await editCity(cityForm.value) : await addCity(cityForm.value)\r\n    if (res.code === 200) { triggerToast(res.msg || '成功', 'success'); cityModalVisible.value = false; await loadCities() }\r\n    else triggerToast(res.msg || '失败', 'error')\r\n  } catch (e) { triggerToast('网络错误', 'error') }\r\n}`,
  `const handleCitySubmit = async () => {\r\n  if (!cityForm.value.area_code || !cityForm.value.city_name || !cityForm.value.province) {\r\n    triggerToast('请填写完整的城市信息（代码、名称、省份）', 'error'); return\r\n  }\r\n  try {\r\n    const res = cityEditMode.value ? await editCity(cityForm.value) : await addCity(cityForm.value)\r\n    if (res.code === 200) { triggerToast(res.msg || '操作成功', 'success'); cityModalVisible.value = false; await loadCities() }\r\n    else triggerToast(res.msg || '操作失败', 'error')\r\n  } catch (e) { triggerToast('新增失败：' + (e.response?.data?.msg || e.message || '网络错误'), 'error') }\r\n}`
);

// Airport submit: add validation + better error toast
c = c.replace(
  `const handleAirportSubmit = async () => {\r\n  try {\r\n    const res = airportEditMode.value ? await editAirport(airportForm.value) : await addAirport(airportForm.value)\r\n    if (res.code === 200) { triggerToast(res.msg || '成功', 'success'); airportModalVisible.value = false; await loadAirports() }\r\n    else triggerToast(res.msg || '失败', 'error')\r\n  } catch (e) { triggerToast('网络错误', 'error') }\r\n}`,
  `const handleAirportSubmit = async () => {\r\n  if (!airportForm.value.airport_code || !airportForm.value.airport_name || !airportForm.value.area_code) {\r\n    triggerToast('请填写完整的机场信息（代码、名称、所属城市）', 'error'); return\r\n  }\r\n  try {\r\n    const res = airportEditMode.value ? await editAirport(airportForm.value) : await addAirport(airportForm.value)\r\n    if (res.code === 200) { triggerToast(res.msg || '操作成功', 'success'); airportModalVisible.value = false; await loadAirports() }\r\n    else triggerToast(res.msg || '操作失败', 'error')\r\n  } catch (e) { triggerToast('新增失败：' + (e.response?.data?.msg || e.message || '网络错误'), 'error') }\r\n}`
);

fs.writeFileSync(p, c, 'utf8');
console.log('city/airport submit error done');
