const fs = require('fs');
const path = 'd:/Project/DatabaseProject/airline-frontend/src/views/AdminView.vue';
let c = fs.readFileSync(path, 'utf8');

// 1. Remove the broken import line
c = c.replace("import { getCityList, addCity, editCity, deleteCity, getAirportList, addAirport, editAirport, deleteAirport, getAirportByArea } from '@/api/flight.js'\r\n", '');

// 2. Fix loadCities
c = c.replace(
  "const res = await getCityList(); if (res.code === 200) cities.value = res.data",
  "const res = await axios.get(`${API_BASE}/admin/city/list`); if (res.data.code === 200) cities.value = res.data.data"
);

// 3. Fix handleCitySubmit - replace editCity/addCity with axios
c = c.replace(
  "const res = cityEditMode.value ? await editCity(cityForm.value) : await addCity(cityForm.value)",
  "const url = `${API_BASE}/admin/city/${cityEditMode.value ? 'edit' : 'add'}`; const res = await axios.post(url, cityForm.value)"
);

// 4. Fix city submit response handling
c = c.replace(
  "if (res.code === 200) { triggerToast(res.msg || '操作成功', 'success'); cityModalVisible.value = false; await loadCities() }",
  "if (res.data.code === 200) { triggerToast(res.data.msg || '操作成功', 'success'); cityModalVisible.value = false; await loadCities() }"
);

// 5. Fix city submit else and catch
c = c.replace(
  "cityModalVisible.value = false; await loadCities() }\r\n    else triggerToast(res.msg || '操作失败', 'error')\r\n  } catch (e) { triggerToast('新增失败：' + (e.msg || e.message || '网络错误'), 'error') }",
  "cityModalVisible.value = false; await loadCities() }\r\n    else triggerToast(res.data.msg || '操作失败', 'error')\r\n  } catch (e) { triggerToast('新增失败：' + (e.response?.data?.msg || e.message || '网络错误'), 'error') }"
);

// 6. Fix handleCityDelete
c = c.replace(
  "const res = await deleteCity(code)",
  "const res = await axios.post(`${API_BASE}/admin/city/del`, { area_code: code })"
);
c = c.replace(
  "if (res.code === 200) { triggerToast('城市 ' + code + ' 已删除', 'success'); await loadCities() }",
  "if (res.data.code === 200) { triggerToast('城市 ' + code + ' 已删除', 'success'); await loadCities() }"
);

// 7. Fix loadAirports
c = c.replace(
  "const res = await getAirportList(); if (res.code === 200) airports.value = res.data",
  "const res = await axios.get(`${API_BASE}/admin/airport/list`); if (res.data.code === 200) airports.value = res.data.data"
);

// 8. Fix handleAirportSubmit
c = c.replace(
  "const res = airportEditMode.value ? await editAirport(airportForm.value) : await addAirport(airportForm.value)",
  "const url = `${API_BASE}/admin/airport/${airportEditMode.value ? 'edit' : 'add'}`; const res = await axios.post(url, airportForm.value)"
);
c = c.replace(
  "if (res.code === 200) { triggerToast(res.msg || '操作成功', 'success'); airportModalVisible.value = false; await loadAirports() }",
  "if (res.data.code === 200) { triggerToast(res.data.msg || '操作成功', 'success'); airportModalVisible.value = false; await loadAirports() }"
);
c = c.replace(
  "airportModalVisible.value = false; await loadAirports() }\r\n    else triggerToast(res.msg || '操作失败', 'error')\r\n  } catch (e) { triggerToast('新增失败：' + (e.response?.data?.msg || e.message || '网络错误'), 'error') }",
  "airportModalVisible.value = false; await loadAirports() }\r\n    else triggerToast(res.data.msg || '操作失败', 'error')\r\n  } catch (e) { triggerToast('新增失败：' + (e.response?.data?.msg || e.message || '网络错误'), 'error') }"
);

// 9. Fix handleAirportDelete
c = c.replace(
  "const res = await deleteAirport(code)",
  "const res = await axios.post(`${API_BASE}/admin/airport/del`, { airport_code: code })"
);
c = c.replace(
  "if (res.code === 200) { triggerToast('机场 ' + code + ' 已删除', 'success'); await loadAirports() }",
  "if (res.data.code === 200) { triggerToast('机场 ' + code + ' 已删除', 'success'); await loadAirports() }"
);

// 10. Fix flightResponse undefined ref
c = c.replace(
  "flightResponse.code === 200 && flightResponse.data",
  "false"
);

fs.writeFileSync(path, c, 'utf8');
console.log('AdminView.vue: CRUD functions fixed!');
