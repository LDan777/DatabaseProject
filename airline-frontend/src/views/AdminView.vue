<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const API_BASE = 'http://127.0.0.1:5000/api'
// ===== 以下 API 导入已注释（后端尚无对应路由，AdminView 降级使用本地模拟数据）=====
// import { login } from '@/api/auth.js'
// import { getFlights, getAllOrders } from '@/api/flight.js'
// import { getAllOrders as getAllOrdersFromOrder } from '@/api/order.js'
// import { cancelFlightInstance } from '@/api/order.js'

// --- 0. 常量定义 (避免魔法值) ---
const FLIGHT_STATUS = {
  SCHEDULED: 'Scheduled',
  FLYING: 'Flying',
  DELAYED: 'Delayed',
  ARRIVED: 'Arrived',
  CANCELLED: 'Cancelled'
}
const ORDER_STATUS = {
  PAID: '已支付',
  PENDING: '待支付',
  REFUNDED: '已退款',
  COMPLETED: '已完成'
}

// --- 1. 登录逻辑与权限 ---
const isLoggedIn = ref(false)
const adminUser = ref({ username: '', password: '' })
const loginError = ref('')

// --- 2. 核心导航与状态（必须优先声明，供 watch / computed / onMounted 引用）---
const activeMenu = ref('dashboard')
const orderFilter = ref('ALL')
const orderSearchQuery = ref('')
const isCollapse = ref(false)

// ===================== 实时刷新定时器 =====================
const autoRefreshTimer = ref(null)
const REFRESH_INTERVAL = 15 * 1000 // 每15秒自动刷新一次航班实例

const startAutoRefresh = () => {
  stopAutoRefresh()
  autoRefreshTimer.value = setInterval(async () => {
    if (activeMenu.value === 'flights') {
      await loadFlightInstances()
    }
    if (activeMenu.value === 'routes') {
      await loadFlights()
    }
  }, REFRESH_INTERVAL)
}

const stopAutoRefresh = () => {
  if (autoRefreshTimer.value) {
    clearInterval(autoRefreshTimer.value)
    autoRefreshTimer.value = null
  }
}

// 页面加载时优先恢复登录态，再拉取数据，启动定时刷新
const router = useRouter()

function goToUserHome() {
  router.push('/')
}

onMounted(async () => {
  const loggedInFlag = localStorage.getItem('adminIsLoggedIn')
  if (loggedInFlag === 'true') {
    isLoggedIn.value = true
    await loadCities()
    await loadAirports()
    await loadFlights()
    await loadFlightInstances()
    await loadUsers()
    await loadOrders()
    startAutoRefresh()
  } else {
    isLoggedIn.value = false
    localStorage.removeItem('adminIsLoggedIn')
    localStorage.removeItem('adminAccessGranted')
  }
})

onBeforeUnmount(() => {
  stopAutoRefresh()
})

watch(activeMenu, (val) => {
  if (val === 'flights') loadFlightInstances()
  if (val === 'routes') loadFlights()
  if (val === 'users') loadUsers()
  if (val === 'orders') loadOrders()
})

const handleAdminLogin = () => {
  loginError.value = ''
  if (adminUser.value.username.trim() === 'admin' && adminUser.value.password === '123456') { 
    isLoggedIn.value = true
    localStorage.setItem('adminIsLoggedIn', 'true')
    triggerToast('登录成功，欢迎进入管理系统')
  } else {
    loginError.value = '授权失败：口令或账号不匹配 '
  }
}

const handleLogout = () => {
  isLoggedIn.value = false
  localStorage.removeItem('adminIsLoggedIn')
  triggerToast('已安全退出')
}

// --- 3. 模拟数据库实体 (默认值) ---
const systemNews = ref([
  { id: 'N01', title: '夏季航季调整公告：新增成都天府航线', author: '运营部', time: '2026-05-01', status: '已发布', content: '为提升华西地区运力，自5月起逐步增加成都天府往返班次。', link: 'https://www.example.com/notice/summer' },
  { id: 'N02', title: '系统维护通知：主数据库升级', author: 'IT运维', time: '2026-04-28', status: '草稿', content: '维护窗口预计为周六凌晨02:00-04:00，期间部分查询功能会有短时抖动。', link: '' }
])

const users = ref([])
const userSearchKeyword = ref('')

const routes = ref([])

// --- 城市管理 ---
const cities = ref([])
const citySearchKeyword = ref('')
const citySearchInput = ref('')
const cityModalVisible = ref(false)
const cityEditMode = ref(false)
const cityForm = ref({ area_code: '', city_name: '', province: '' })

// --- 机场管理 ---
const airports = ref([])
const airportSearchKeyword = ref('')
const airportFilterArea = ref('')
const airportModalVisible = ref(false)
const airportEditMode = ref(false)
const airportForm = ref({ airport_code: '', airport_name: '', area_code: '' })

const flights = ref([])

const orders = ref([])
const loadOrders = async () => {
  try {
    const res = await axios.get(`${API_BASE}/admin/ticket_record/list`)
    if (res.data && res.data.code === 200) {
      const rawData = Array.isArray(res.data.data) ? res.data.data : []
      orders.value = rawData.map(t => {
        try {
          const safe = (val) => (val !== null && val !== void 0 ? val : '')
          let dateStr = ''
          if (t.fly_date) {
            try { dateStr = String(t.fly_date).slice(0, 10) } catch (_) { dateStr = '' }
          }
          return {
            ticket_id: safe(t.ticket_id),
            id_card: safe(t.id_card),
            name: safe(t.passenger_name) || safe(t.id_card) || '未知乘客',
            flightNo: safe(t.flight_no),
            date: dateStr,
            cabin: safe(t.cabin_level),
            price: safe(t.real_price),
            status: safe(t.ticket_status),
            phone: safe(t.phone),
            dep_airport: safe(t.dep_airport),
            arr_airport: safe(t.arr_airport)
          }
        } catch (rowErr) {
          console.warn('订单行解析失败:', rowErr, t)
          return {
            ticket_id: safeDef(t, 'ticket_id'), id_card: safeDef(t, 'id_card'),
            name: safeDef(t, 'passenger_name') || safeDef(t, 'id_card') || '解析异常',
            flightNo: safeDef(t, 'flight_no'), date: '', cabin: safeDef(t, 'cabin_level'),
            price: safeDef(t, 'real_price'), status: safeDef(t, 'ticket_status'),
            phone: safeDef(t, 'phone'), dep_airport: safeDef(t, 'dep_airport'),
            arr_airport: safeDef(t, 'arr_airport')
          }
        }
      })
      if (rawData.length > 0 && orders.value.length === 0) {
        triggerToast('订单数据格式异常，已加载但无法解析全部记录', 'warning')
      }
      if (rawData.length === 0) {
        triggerToast('未查询到任何订单记录', 'info')
      }
    } else {
      triggerToast('订单数据加载失败: ' + (res.data?.msg || '返回格式异常'), 'error')
    }
  } catch (e) {
    console.error('loadOrders error:', e)
    const msg = e.response?.data?.msg || e.response?.data?.message || e.message || '未知网络错误'
    triggerToast('订单数据加载失败: ' + msg, 'error')
  }
}

// 通用安全兜底工具函数（用于 rowErr 分支，不依赖闭包 try 内声明的 safe）
const safeDef = (obj, key) => {
  const v = (obj && obj[key] !== null && obj[key] !== void 0) ? obj[key] : ''
  return v
}

const aircraftLibrary = ref([
  { code: 'A320', model: 'Airbus A320', typicalSeats: '8F/150Y' },
  { code: 'A330', model: 'Airbus A330', typicalSeats: '30F/220Y' },
  { code: 'B737', model: 'Boeing 737', typicalSeats: '8F/150Y' },
  { code: 'B787', model: 'Boeing 787', typicalSeats: '28F/260Y' }
])



// --- 4. 复杂的查询与过滤 ---
const flightQuery = ref({ dep: '', arr: '', schedule: '', status: '' })
const flightSearchKeyword = ref('')
const routeSearchKeywordForFlight = ref('')
const flightLibraryKeyword = ref('')
const bulkUserText = ref('')
const showBulkUserModal = ref(false)

const normalizeOrder = (order) => ({
  ...order,
  needManual: !!order.needManual,
  manualReason: order.manualReason || '',
  userMessage: order.userMessage || ''
})

const resetFlightQuery = () => {
  flightQuery.value = { dep: '', arr: '', schedule: '', status: '' }
  triggerToast('筛选条件已清空', 'info')
}



const filteredOrders = computed(() => {
  let res = orders.value.map(normalizeOrder)
  if (orderFilter.value !== 'ALL') res = res.filter(o => o.status === orderFilter.value)
  if (orderSearchQuery.value.trim()) {
    const keyword = orderSearchQuery.value.trim().toLowerCase()
    res = res.filter(o => o.name.toLowerCase().includes(keyword) || o.flightNo.toLowerCase().includes(keyword))
  }
  return res
})

const filteredFlights = computed(() => {
  const keyword = routeSearchKeywordForFlight.value.trim().toLowerCase()
  if (!keyword) return flights.value
  return flights.value.filter(f => {
    if ((f.flight_no || '').toLowerCase().includes(keyword)) return true
    if ((f.plane_model || '').toLowerCase().includes(keyword)) return true
    if ((f.stops || []).some(s => (s.airport_name || s.airport_code || '').toLowerCase().includes(keyword))) return true
    return false
  })
})

const filteredAircraftLibrary = computed(() => {
  const keyword = flightLibraryKeyword.value.trim().toLowerCase()
  if (!keyword) return aircraftLibrary.value
  return aircraftLibrary.value.filter(item =>
    item.code.toLowerCase().includes(keyword) ||
    item.model.toLowerCase().includes(keyword)
  )
})

const exportData = () => {
  triggerToast('正在生成CSV报表，请稍候...', 'success')
}

// --- 5. 真正的 CRUD 交互逻辑 ---
const showToast = ref(false)
const toastMsg = ref('')
const toastType = ref('success') // 'success' | 'error' | 'info'
const triggerToast = (msg, type = 'success') => {
  toastMsg.value = msg; toastType.value = type; showToast.value = true
  setTimeout(() => showToast.value = false, 2500)
}

// ===================== 城市管理 CRUD =====================
const loadCities = async () => {
  try { const res = await axios.get(`${API_BASE}/admin/city/list`); if (res.data.code === 200) cities.value = res.data.data } catch (e) {
    // 后端不可用时，使用本地 Mock 兜底数据
    cities.value = [
      { area_code: 'SHA', city_name: '上海', province: '上海市' },
      { area_code: 'PEK', city_name: '北京', province: '北京市' },
      { area_code: 'CAN', city_name: '广州', province: '广东省' },
      { area_code: 'CTU', city_name: '成都', province: '四川省' }
    ]
  }
}
const openCityModal = (city = null) => {
  cityEditMode.value = !!city
  cityForm.value = city ? { area_code: city.area_code, city_name: city.city_name, province: city.province } : { area_code: '', city_name: '', province: '' }
  cityModalVisible.value = true
}
const handleCitySubmit = async () => {
  if (!cityForm.value.area_code || !cityForm.value.city_name || !cityForm.value.province) {
    triggerToast('请填写完整的城市信息（代码、名称、省份）', 'error'); return
  }
  try {
    const url = `${API_BASE}/admin/city/${cityEditMode.value ? 'edit' : 'add'}`; const res = await axios.post(url, cityForm.value)
    if (res.data.code === 200) { triggerToast(res.data.msg || '操作成功', 'success'); cityModalVisible.value = false; await loadCities() }
    else triggerToast(res.data.msg || '操作失败', 'error')
  } catch (e) { triggerToast('新增失败：' + (e.response?.data?.msg || e.message || '网络错误'), 'error') }
}
const handleCityDelete = async (code) => {
  if (!confirm('确定删除城市 ' + code + ' 吗？')) return
  try {
    const res = await axios.post(`${API_BASE}/admin/city/del`, { area_code: code })
    if (res.data.code === 200) { triggerToast('城市 ' + code + ' 已删除', 'success'); await loadCities() }
  } catch (e) {
    // 兼容两种错误格式：拦截器 reject 的原始数据 或 AxiosError(500)
    const msg = e.response?.data?.message || e.response?.data?.msg || e.msg || e.message || JSON.stringify(e)
    if (/foreign|constraint|1451|外键|关联|cannot delete/i.test(msg)) {
      triggerToast('删除失败：[' + code + '] 下仍有注册机场，请先前往【机场管理】删除关联机场后再试', 'error')
    } else {
      triggerToast('删除失败 [' + code + ']：' + msg, 'error')
    }
  }
}
const handleCitySearch = () => { citySearchKeyword.value = citySearchInput.value }
const filteredCities = computed(() => {
  if (!citySearchKeyword.value) return cities.value
  const k = citySearchKeyword.value.toLowerCase()
  return cities.value.filter(ct => ct.area_code?.toLowerCase().includes(k) || ct.city_name?.toLowerCase().includes(k) || ct.province?.toLowerCase().includes(k))
})

// ===================== 机场管理 CRUD =====================
const loadAirports = async () => {
  try { const res = await axios.get(`${API_BASE}/admin/airport/list`); if (res.data.code === 200) airports.value = res.data.data } catch (e) {
    // 后端不可用时，使用本地 Mock 兜底数据
    airports.value = [
      { airport_code: 'SHA', airport_name: '上海虹桥国际机场', area_code: 'SHA' },
      { airport_code: 'PVG', airport_name: '上海浦东国际机场', area_code: 'SHA' },
      { airport_code: 'PEK', airport_name: '北京首都国际机场', area_code: 'PEK' },
      { airport_code: 'PKX', airport_name: '北京大兴国际机场', area_code: 'PEK' },
      { airport_code: 'CAN', airport_name: '广州白云国际机场', area_code: 'CAN' },
      { airport_code: 'CTU', airport_name: '成都天府国际机场', area_code: 'CTU' }
    ]
  }
}
const openAirportModal = (ap = null) => {
  airportEditMode.value = !!ap
  airportForm.value = ap ? { airport_code: ap.airport_code, airport_name: ap.airport_name, area_code: ap.area_code } : { airport_code: '', airport_name: '', area_code: '' }
  airportModalVisible.value = true
}
const handleAirportSubmit = async () => {
  if (!airportForm.value.airport_code || !airportForm.value.airport_name || !airportForm.value.area_code) {
    triggerToast('请填写完整的机场信息（代码、名称、所属城市）', 'error'); return
  }
  try {
    const url = `${API_BASE}/admin/airport/${airportEditMode.value ? 'edit' : 'add'}`; const res = await axios.post(url, airportForm.value)
    if (res.data.code === 200) { triggerToast(res.data.msg || '操作成功', 'success'); airportModalVisible.value = false; await loadAirports() }
    else triggerToast(res.data.msg || '操作失败', 'error')
  } catch (e) { triggerToast('新增失败：' + (e.response?.data?.msg || e.message || '网络错误'), 'error') }
}
const handleAirportDelete = async (code) => {
  if (!confirm('确定删除机场 ' + code + ' 吗？')) return
  try {
    const res = await axios.post(`${API_BASE}/admin/airport/del`, { airport_code: code })
    if (res.data.code === 200) { triggerToast('机场 ' + code + ' 已删除', 'success'); await loadAirports() }
    else triggerToast(res.data.msg || '删除失败', 'error')
  } catch (e) {
    triggerToast('删除失败: ' + (e.response?.data?.msg || e.message || JSON.stringify(e)), 'error')
  }
}
const handleAirportFilterByArea = async () => {
  if (!airportFilterArea.value) { await loadAirports(); return }
  // 后端 GET /api/admin/airport/getByArea 目前用 request.json 取值有 Bug
  // 改用本地过滤：先从全量机场中按 area_code 筛选
  try { await loadAirports() } catch (e) {}
  const code = airportFilterArea.value.trim().toUpperCase()
  airports.value = airports.value.filter(ap => ap.area_code?.toUpperCase() === code)
  if (airports.value.length === 0) triggerToast('未找到代码为 ' + code + ' 的机场', 'info')
  else triggerToast('找到 ' + airports.value.length + ' 个机场', 'success')
}
// ===================== 航班管理 CRUD =====================
const flightModalVisible = ref(false)
const flightEditMode = ref(false)
const flightForm = ref({ flight_no: '', plane_model: '', first_class_num: 0, economy_num: 0, depart_time: '', arrive_time: '', stops: [] })
const flightWeekDays = ref([1,2,3,4,5,6,7])

// 星期标签映射
const WEEKDAY_MAP = { 1:'周一', 2:'周二', 3:'周三', 4:'周四', 5:'周五', 6:'周六', 7:'周日' }

const loadFlights = async () => {
  try { const res = await axios.get(`${API_BASE}/admin/flight/list`); if (res.data.code === 200) flights.value = res.data.data } catch (e) {
    // 后端不可用时，使用本地 Mock 兜底数据，确保页面正常渲染
    flights.value = [
      {
        flight_no: 'MU5101', plane_model: 'Boeing 737', first_class_num: 8, economy_num: 150,
        depart_time: '08:30:00', arrive_time: '10:50:00', fly_week_day: '1,2,3,4,5,6,7',
        stops: [
          { airport_code: 'SHA', airport_name: '上海虹桥', stop_sort: '起飞' },
          { airport_code: 'PEK', airport_name: '北京首都', stop_sort: '降落' }
        ]
      },
      {
        flight_no: 'CA1831', plane_model: 'Airbus A330', first_class_num: 12, economy_num: 260,
        depart_time: '13:00:00', arrive_time: '15:30:00', fly_week_day: '1,3,5,7',
        stops: [
          { airport_code: 'PEK', airport_name: '北京首都', stop_sort: '起飞' },
          { airport_code: 'CAN', airport_name: '广州白云', stop_sort: '降落' }
        ]
      },
      {
        flight_no: 'CZ3999', plane_model: 'Boeing 787', first_class_num: 28, economy_num: 260,
        depart_time: '07:15:00', arrive_time: '09:45:00', fly_week_day: '2,4,6',
        stops: [
          { airport_code: 'CAN', airport_name: '广州白云', stop_sort: '起飞' },
          { airport_code: 'CTU', airport_name: '成都天府', stop_sort: '降落' }
        ]
      }
    ]
  }
}

const flightInstances = ref([])
const instanceSearchKeyword = ref('')
const isLoadingInstances = ref(false)
const instancesLoadError = ref('')

const loadFlightInstances = async () => {
  isLoadingInstances.value = true
  instancesLoadError.value = ''
  try {
    const res = await axios.get(`${API_BASE}/admin/flight_instance/list`)
    if (res.data.code === 200) {
      flightInstances.value = res.data.data
      console.log(`[实时刷新] 航班实例已更新，共 ${flightInstances.value.length} 条记录`)
    } else {
      console.warn('[航班实例] 后端返回异常:', res.data.msg)
      instancesLoadError.value = res.data.msg || '后端返回异常'
      triggerToast('航班实例加载异常：' + instancesLoadError.value, 'error')
    }
  } catch (e) {
    const errMsg = e.response?.data?.msg || e.message || '网络错误'
    console.error('[航班实例] 加载失败，使用本地模拟数据:', errMsg)
    instancesLoadError.value = '无法连接后端，显示本地模拟数据'
    // 降级：使用本地模拟数据
    flightInstances.value = [
      { flight_no: 'MU5101', fly_date: '2026-07-01', flight_status: '计划', first_remain: 8, economy_remain: 150, depart_time_actual: '08:30:00', arrive_time_actual: '10:50:00' },
      { flight_no: 'MU5101', fly_date: '2026-07-02', flight_status: '完成', first_remain: 5, economy_remain: 142, depart_time_actual: '08:32:00', arrive_time_actual: '10:48:00' },
      { flight_no: 'CA1831', fly_date: '2026-07-01', flight_status: '延误', first_remain: 12, economy_remain: 260, depart_time_actual: '13:25:00', arrive_time_actual: '16:10:00' },
      { flight_no: 'CA1831', fly_date: '2026-07-03', flight_status: '计划', first_remain: 12, economy_remain: 260, depart_time_actual: '13:00:00', arrive_time_actual: '15:30:00' },
      { flight_no: 'CZ3999', fly_date: '2026-07-02', flight_status: '取消', first_remain: 0, economy_remain: 0, depart_time_actual: '07:15:00', arrive_time_actual: '09:45:00' },
      { flight_no: 'CZ3999', fly_date: '2026-07-04', flight_status: '计划', first_remain: 28, economy_remain: 260, depart_time_actual: '07:15:00', arrive_time_actual: '09:45:00' },
      { flight_no: 'MU5101', fly_date: '2026-07-03', flight_status: '完成', first_remain: 3, economy_remain: 128, depart_time_actual: '08:31:00', arrive_time_actual: '10:55:00' },
      { flight_no: 'CA1831', fly_date: '2026-07-05', flight_status: '计划', first_remain: 12, economy_remain: 258, depart_time_actual: '13:00:00', arrive_time_actual: '15:30:00' }
    ]
  } finally {
    isLoadingInstances.value = false
  }
}
const filteredFlightInstances = computed(() => {
  const kw = instanceSearchKeyword.value.trim().toLowerCase()
  if (!kw) return flightInstances.value
  return flightInstances.value.filter(i =>
    (i.flight_no || '').toLowerCase().includes(kw) ||
    (i.flight_status || '').toLowerCase().includes(kw) ||
    (i.fly_date || '').toLowerCase().includes(kw)
  )
})

// ===================== 航班实例行内编辑 =====================
const editingInstanceKey = ref('')        // 当前编辑行的唯一标识 (flight_no + '__' + fly_date)
const editingInstanceData = ref({})       // 编辑中的临时数据

const FLIGHT_INSTANCE_STATUS_OPTIONS = ['计划', '延误', '取消', '完成']

const startEditInstance = (inst) => {
  const key = inst.flight_no + '__' + inst.fly_date
  editingInstanceKey.value = key
  editingInstanceData.value = {
    flight_status: inst.flight_status || '计划',
    first_remain: inst.first_remain ?? 0,
    economy_remain: inst.economy_remain ?? 0,
    depart_time_actual: (inst.depart_time_actual || '').substring(0, 5),
    arrive_time_actual: (inst.arrive_time_actual || '').substring(0, 5)
  }
}

const cancelEditInstance = () => {
  editingInstanceKey.value = ''
  editingInstanceData.value = {}
}

const saveEditInstance = async (inst) => {
  try {
    const res = await axios.post(`${API_BASE}/admin/flight_instance/update`, {
      flight_no: inst.flight_no,
      fly_date: inst.fly_date,
      flight_status: editingInstanceData.value.flight_status,
      first_remain: Number(editingInstanceData.value.first_remain),
      economy_remain: Number(editingInstanceData.value.economy_remain),
      depart_time_actual: editingInstanceData.value.depart_time_actual
        ? editingInstanceData.value.depart_time_actual + ':00' : '00:00:00',
      arrive_time_actual: editingInstanceData.value.arrive_time_actual
        ? editingInstanceData.value.arrive_time_actual + ':00' : '00:00:00'
    })
    if (res.data.code === 200) {
      triggerToast('航班实例 ' + inst.flight_no + ' 更新成功', 'success')
      editingInstanceKey.value = ''
      editingInstanceData.value = {}
      await loadFlightInstances()
    } else {
      triggerToast(res.data.msg || '更新失败', 'error')
    }
  } catch (e) {
    triggerToast('更新失败：' + (e.response?.data?.msg || e.message || '网络错误'), 'error')
  }
}

const isEditingInstance = (inst) => {
  return editingInstanceKey.value === (inst.flight_no + '__' + inst.fly_date)
}

// ===================== 航班实例新增/删除 =====================
const instanceModalVisible = ref(false)
const instanceForm = ref({ flight_no: '', fly_date: '' })

const openInstanceModal = () => {
  instanceForm.value = { flight_no: '', fly_date: '' }
  instanceModalVisible.value = true
}

const handleInstanceSubmit = async () => {
  if (!instanceForm.value.flight_no || !instanceForm.value.fly_date) {
    triggerToast('请填写航班号和飞行日期', 'error'); return
  }
  try {
    const res = await axios.post(`${API_BASE}/admin/flight_instance/add`, instanceForm.value)
    if (res.data.code === 200) {
      triggerToast(res.data.msg || '航班实例创建成功', 'success')
      instanceModalVisible.value = false
      await loadFlightInstances()
    } else {
      triggerToast(res.data.msg || '创建失败', 'error')
    }
  } catch (e) {
    triggerToast('创建失败：' + (e.response?.data?.msg || e.message || '网络错误'), 'error')
  }
}

const handleInstanceDelete = async (inst) => {
  if (!confirm(`确定删除航班实例 ${inst.flight_no} / ${inst.fly_date} 吗？此操作不可恢复。`)) return
  try {
    const res = await axios.post(`${API_BASE}/admin/flight_instance/del`, {
      flight_no: inst.flight_no,
      fly_date: inst.fly_date
    })
    if (res.data.code === 200) {
      triggerToast(res.data.msg || '航班实例已删除', 'success')
      await loadFlightInstances()
    } else {
      triggerToast(res.data.msg || '删除失败', 'error')
    }
  } catch (e) {
    triggerToast('删除失败：' + (e.response?.data?.msg || e.message || '网络错误'), 'error')
  }
}

const openFlightModal = (f = null) => {
  flightEditMode.value = !!f
  if (f) {
    flightForm.value = {
      flight_no: f.flight_no || '',
      plane_model: f.plane_model || '',
      first_class_num: f.first_class_num || 0,
      economy_num: f.economy_num || 0,
      depart_time: (f.depart_time || '').substring(0, 5),
      arrive_time: (f.arrive_time || '').substring(0, 5),
      first_price: f.first_price != null ? String(f.first_price) : '',
      economy_price: f.economy_price != null ? String(f.economy_price) : '',
      stops: (f.stops || []).map(s => ({ airport_code: s.airport_code, stop_sort: s.stop_sort, airport_name: s.airport_name, searchText: '' }))
    }
    const days = (f.fly_week_day || '1,2,3,4,5,6,7').replace(/\s/g, '').split(',').filter(Boolean).map(Number)
    flightWeekDays.value = days.length ? days : [1,2,3,4,5,6,7]
  } else {
    flightForm.value = { flight_no: '', plane_model: '', first_class_num: 0, economy_num: 0, depart_time: '', arrive_time: '',
      stops: [
        { airport_code: '', stop_sort: '起飞', airport_name: '', searchText: '' },
        { airport_code: '', stop_sort: '降落', airport_name: '', searchText: '' }
      ]
    }
    flightWeekDays.value = [1,2,3,4,5,6,7]
  }
  flightModalVisible.value = true
}

const handleFlightSubmit = async () => {
  if (!flightForm.value.flight_no || !flightForm.value.plane_model) {
    triggerToast('请填写航班号和机型', 'error'); return
  }
  // 确保至少有起飞和降落机场
  const hasDepart = flightForm.value.stops.some(s => s.stop_sort === '起飞')
  const hasArrive = flightForm.value.stops.some(s => s.stop_sort === '降落')
  if (!hasDepart || !hasArrive) {
    triggerToast('请至少设置起飞机场和降落机场', 'error'); return
  }
  try {
    const payload = {
      ...flightForm.value,
      fly_week_day: flightWeekDays.value.join(','),
      depart_time: flightForm.value.depart_time ? flightForm.value.depart_time + ':00' : '00:00:00',
      arrive_time: flightForm.value.arrive_time ? flightForm.value.arrive_time + ':00' : '00:00:00',
      stops: flightForm.value.stops.map(s => ({ airport_code: s.airport_code, stop_sort: s.stop_sort })),
      first_price: flightForm.value.first_price ? Number(flightForm.value.first_price) : null,
      economy_price: flightForm.value.economy_price ? Number(flightForm.value.economy_price) : null
    }
    const url = `${API_BASE}/admin/flight/${flightEditMode.value ? 'edit' : 'add'}`
    const res = await axios.post(url, payload)
    if (res.data.code === 200) { triggerToast(res.data.msg || '操作成功', 'success'); flightModalVisible.value = false; await loadFlights() }
    else triggerToast(res.data.msg || '操作失败', 'error')
  } catch (e) { triggerToast('操作失败：' + (e.response?.data?.msg || e.message || '网络错误'), 'error') }
}

// 获取航班起降机场显示（含经停，按 stop_sort 顺序排列）
const getFlightStopsDisplay = (f) => {
  if (!f.stops || !f.stops.length) return '-'
  // 按 stop_sort 排序：起飞 -> 经停1 -> 经停2 -> 经停3 -> 降落
  const sortOrder = { '起飞': 0, '经停1': 1, '经停2': 2, '经停3': 3, '降落': 4 }
  const sorted = [...f.stops].sort((a, b) => (sortOrder[a.stop_sort] ?? 99) - (sortOrder[b.stop_sort] ?? 99))
  return sorted.map(s => s.airport_name || s.airport_code || '?').join(' → ')
}

// 将 fly_week_day 如 "1,2,3,4,5,6,7" 转换为 "周一, 周二, ..."
const formatWeekDays = (flyWeekDay) => {
  if (!flyWeekDay) return '-'
  return flyWeekDay.split(',').map(d => WEEKDAY_MAP[Number(d.trim())] || d.trim()).join(', ')
}

// 将 fly_date 如 "2026-07-01" 转换为 "周三 2026-07-01"
const formatFlyDate = (flyDate) => {
  if (!flyDate) return '-'
  try {
    const d = new Date(flyDate)
    if (isNaN(d.getTime())) return flyDate
    const dayMap = { 0: '周日', 1: '周一', 2: '周二', 3: '周三', 4: '周四', 5: '周五', 6: '周六' }
    const dayName = dayMap[d.getDay()]
    return `${dayName} ${flyDate}`
  } catch { return flyDate }
}

// 淡旺季判断（与后端 get_season_type 保持一致）
const getSeasonType = (flyDate) => {
  if (!flyDate) return '平季'
  const d = new Date(flyDate)
  if (isNaN(d.getTime())) return '平季'
  const month = d.getMonth() + 1
  const day = d.getDate()
  const isSummer = month === 7 || month === 8
  const isNational = month === 10 && day <= 7
  const isMay = month === 5 && day <= 5
  const isSpring = (month === 1 && day >= 20) || (month === 2 && day <= 20)
  if (isSummer || isNational || isMay || isSpring) return '旺季'
  const offSeason = (month === 1 && day <= 19) || (month === 2 && day >= 21) || month === 6 || month === 12
  if (offSeason) return '淡季'
  return '平季'
}

const SEASON_MULTIPLIER = { '旺季': 1.2, '平季': 1.0, '淡季': 0.8 }
const SEASON_TAG = { '旺季': 'danger', '平季': '', '淡季': 'info' }

// 获取航班实例的动态票价（根据季节对标准票价的浮动）
const getInstancePriceDisplay = (inst, flightsData) => {
  const flight = flightsData.find(f => f.flight_no === inst.flight_no)
  if (!flight || (!flight.first_price && !flight.economy_price)) return '-'
  const season = getSeasonType(inst.fly_date)
  const mult = SEASON_MULTIPLIER[season]
  let parts = []
  if (flight.first_price) parts.push(`F:¥${(flight.first_price * mult).toFixed(0)}`)
  if (flight.economy_price) parts.push(`Y:¥${(flight.economy_price * mult).toFixed(0)}`)
  return parts.join(' / ')
}

const addFlightStop = () => {
  const stopSorts = ['起飞', '降落', '经停1', '经停2', '经停3']
  const usedSorts = new Set(flightForm.value.stops.map(s => s.stop_sort))
  const nextSort = stopSorts.find(s => !usedSorts.has(s))
  if (nextSort) {
    flightForm.value.stops.push({ airport_code: '', stop_sort: nextSort, airport_name: '', searchText: '' })
  } else {
    triggerToast('最多支持起飞+降落+3个经停', 'info')
  }
}

// 为指定停靠行获取过滤后的机场列表
const getFilteredAirports = (stop) => {
  const kw = (stop.searchText || '').trim().toLowerCase()
  if (!kw) return []
  return airports.value.filter(ap =>
    (ap.airport_code || '').toLowerCase().includes(kw) ||
    (ap.airport_name || '').toLowerCase().includes(kw)
  ).slice(0, 12)
}

// 点击选择机场
const selectAirport = (idx, ap) => {
  flightForm.value.stops[idx].airport_code = ap.airport_code
  flightForm.value.stops[idx].airport_name = ap.airport_name
  flightForm.value.stops[idx].searchText = ap.airport_name + ' (' + ap.airport_code + ')'
}

// 清除已选机场
const clearAirport = (idx) => {
  flightForm.value.stops[idx].airport_code = ''
  flightForm.value.stops[idx].airport_name = ''
  flightForm.value.stops[idx].searchText = ''
}

const removeFlightStop = (index) => {
  const stop = flightForm.value.stops[index]
  if (stop.stop_sort === '起飞' || stop.stop_sort === '降落') {
    triggerToast('起飞和降落机场不可删除', 'info'); return
  }
  flightForm.value.stops.splice(index, 1)
  // 重新排序经停编号
  let stopoverIdx = 1
  flightForm.value.stops.forEach(s => {
    if (s.stop_sort.startsWith('经停')) {
      s.stop_sort = '经停' + stopoverIdx++
    }
  })
}

// 机场选择变更时同步 airport_name
const onStopAirportChange = (idx) => {
  const code = flightForm.value.stops[idx].airport_code
  const ap = airports.value.find(a => a.airport_code === code)
  if (ap) flightForm.value.stops[idx].airport_name = ap.airport_name
}

const handleFlightDelete = async (no) => {
  if (!confirm('确定删除航班 ' + no + ' 及所有关联实例吗？')) return
  try {
    const res = await axios.post(`${API_BASE}/admin/flight/del`, { flight_no: no })
    if (res.data.code === 200) { triggerToast('航班 ' + no + ' 已删除', 'success'); await loadFlights() }
    else triggerToast(res.data.msg || '删除失败', 'error')
  } catch (e) { triggerToast('删除失败：' + (e.response?.data?.msg || e.message || '网络错误'), 'error') }
}

// ===================== 航线管理 CRUD =====================
const routeModalVisible = ref(false)
const routeEditMode = ref(false)
const routeForm = ref({ departure_city: '', arrival_city: '' })
const routeSearchKeyword = ref('')

const openRouteModal = (r = null) => {
  routeEditMode.value = !!r
  routeForm.value = r ? { ...r } : { departure_city: '', arrival_city: '' }
  routeModalVisible.value = true
}

const handleRouteSubmit = () => {
  if (!routeForm.value.departure_city || !routeForm.value.arrival_city) {
    triggerToast('请填写完整的起降城市', 'error'); return
  }
  if (routeEditMode.value) {
    const idx = routes.value.findIndex(r => r.id === routeForm.value.id)
    if (idx > -1) routes.value[idx] = { ...routeForm.value }
  } else {
    routes.value.unshift({ id: 'RT' + Date.now(), ...routeForm.value })
  }
  triggerToast(routeEditMode.value ? '航线已更新' : '航线已添加', 'success')
  routeModalVisible.value = false
}

const handleRouteDelete = (id) => {
  if (!confirm('确定删除此航线吗？')) return
  routes.value = routes.value.filter(r => r.id !== id)
  triggerToast('航线已删除', 'success')
}

const filteredRoutes = computed(() => {
  if (!routeSearchKeyword.value) return routes.value
  const k = routeSearchKeyword.value.toLowerCase()
  return routes.value.filter(r => (r.departure_city || '').toLowerCase().includes(k) || (r.arrival_city || '').toLowerCase().includes(k))
})

const filteredAirports = computed(() => {
  if (!airportSearchKeyword.value) return airports.value
  const k = airportSearchKeyword.value.toLowerCase()
  return airports.value.filter(ap => ap.airport_code?.toLowerCase().includes(k) || ap.airport_name?.toLowerCase().includes(k))
})

// ===================== 用户档案管理 =====================
const loadUsers = async () => {
  try {
    const res = await axios.get(`${API_BASE}/admin/passenger/list`)
    if (res.data.code === 200) {
      users.value = res.data.data
      console.log(`[用户档案] 已加载 ${users.value.length} 条乘客记录`)
    }
  } catch (e) {
    console.error('[用户档案] 加载失败:', e.message || e)
  }
}

const maskIdCard = (idCard) => {
  if (!idCard) return '-'
  const s = String(idCard)
  if (s.length >= 8) return s.substring(0, 3) + '****' + s.substring(s.length - 4)
  return s
}

const filteredUsers = computed(() => {
  const kw = userSearchKeyword.value.trim().toLowerCase()
  if (!kw) return users.value
  return users.value.filter(u =>
    (u.name || '').toLowerCase().includes(kw) ||
    (u.phone || '').toLowerCase().includes(kw) ||
    (u.id_card || '').toLowerCase().includes(kw)
  )
})

// 带确认的删除逻辑（重构：直连后端 API）
const deleteItem = async (listType, idStr) => {
  const typeNameMap = { 'news': '资讯', 'user': '用户', 'route': '航线', 'flight': '航班', 'order': '订单', 'city': '城市', 'airport': '机场' }
  if (!confirm(` 确认删除该${typeNameMap[listType] || listType}记录？`)) return

  // === 后端真实删除 ===
  if (listType === 'flight') {
    try {
      triggerToast('后端暂无航班删除接口，已从本地列表移除', 'info')
      flights.value = flights.value.filter(f => f.flightNo !== idStr)
    } catch (e) { triggerToast('删除失败: ' + (e.response?.data?.msg || e.message), 'error') }
    return
  }

  // === 纯前端模拟 ===
  if(listType === 'news') systemNews.value = systemNews.value.filter(n => n.id !== idStr)
  if(listType === 'user') users.value = users.value.filter(u => u.id !== idStr)
  if(listType === 'route') routes.value = routes.value.filter(r => r.id !== idStr)
  if(listType === 'order') orders.value = orders.value.filter(o => o.ticket_id !== idStr)
  triggerToast('删除成功')
}

// 弹窗表单状态
const showEditModal = ref(false)
const editForm = ref({})
const currentEditType = ref('')
const isAddMode = ref(false)

// 拆分初始化逻辑 (函数解耦)
const initAddForm = (type) => {
  switch(type) {
    case 'news': return { id: 'N0' + (systemNews.value.length + 1), title: '', author: '管理员', time: new Date().toISOString().slice(0,10), status: '草稿', content: '请输入资讯正文...', link: '' }
    case 'user': return { id: 'U00' + (users.value.length + 1), name: '', account: '', phone: '', idCard: '', gender: '男' }
    case 'flight': return { flightNo: '', name: '', dep: '', arr: '', time: '', aircraft: '', price: 0, fSeats: 0, eSeats: 0, schedule: 'Daily', status: FLIGHT_STATUS.SCHEDULED }
    case 'route': return { id: 'R0' + (routes.value.length + 1), origin: '', destination: '', type: '普通航线' }
    case 'order': return {} // 订单通常不直接新增，走购买流程
  }
}

// 打开弹窗
const openEditModal = (item, type) => {
  currentEditType.value = type
  if (item) {
    isAddMode.value = false
    editForm.value = JSON.parse(JSON.stringify(item))
  } else {
    isAddMode.value = true
    editForm.value = initAddForm(type)
  }
  showEditModal.value = true
}

const navigateFromDashboard = (target) => {
  activeMenu.value = target
}

const openBulkUserModal = () => {
  bulkUserText.value = '赵雷,zhaolei,13811110000,110101199312120011,男\n孙倩,sunqian,13922223333,310105199109091122,女'
  showBulkUserModal.value = true
}

const saveBulkUsers = () => {
  const rows = bulkUserText.value.split('\n').map(row => row.trim()).filter(Boolean)
  if (!rows.length) {
    triggerToast('请先输入批量数据', 'error')
    return
  }
  const validRows = []
  for (const row of rows) {
    const cols = row.split(',').map(c => c.trim())
    if (cols.length < 5) continue
    const [name, account, phone, idCard, gender] = cols
    if (!name || !/^1[3-9]\d{9}$/.test(phone) || !/^\d{17}[\dXx]$/.test(idCard)) continue
    validRows.push({
      id: 'U' + String(users.value.length + validRows.length + 1).padStart(3, '0'),
      name, account, phone, idCard, gender: gender || '男'
    })
  }
  if (!validRows.length) {
    triggerToast('批量导入失败：格式不正确', 'error')
    return
  }
  users.value.unshift(...validRows)
  showBulkUserModal.value = false
  triggerToast(`已批量新增 ${validRows.length} 个用户`)
}

const createRouteApproval = () => {
  triggerToast('已创建航线审批申请，等待监管单位确认', 'info')
}

const importRouteTemplate = () => {
  triggerToast('已模拟导入航线模板（演示数据）')
}

const useAircraftTemplate = (item) => {
  openFlightModal(null)
  flightForm.value.plane_model = item.model
  const [f, e] = item.typicalSeats.split('/')
  flightForm.value.first_class_num = Number((f || '0').replace(/\D/g, ''))
  flightForm.value.economy_num = Number((e || '0').replace(/\D/g, ''))
}

// 引入取消航班接口 (在文件顶部确保引入，如果没有可补上)

/**
 * 核心联动：一键取消航班实例
 * 💡 落实讨论要点：点已取消之后，后台事务一键联动，前台提示已发送信息，不需要人工退改签 
 */
const handleCancelFlightAction = async (order) => {
  if (!confirm(` 警报：确定要一键取消 ${order.flightNo} 班次吗？\n此操作将联动取消该班次下的所有乘客订单并发送通知。`)) return

  try {
    // 🚀 核心修改：调用订单接口，传入航班号和起飞日期
    // [已注释] const response = await cancelFlightInstance({...})
    // TODO: 后端实现管理接口后恢复此功能
    triggerToast('前端模拟取消: ' + order.flightNo, 'success')
    orders.value.forEach(o => {
      if (o.flightNo === order.flightNo && o.date === order.date) {
        o.status = '已取消'
      }
    })
  } catch (error) {
    console.error('一键取消功能异常:', error)
    triggerToast('网络错误，联动取消命令执行失败', 'error')
  }
}

const manualOrders = computed(() => orders.value.map(normalizeOrder).filter(o => o.needManual || o.userMessage))

const toggleManualOrder = (order) => {
  order.needManual = !order.needManual
  if (!order.needManual) {
    order.manualReason = ''
    order.userMessage = ''
  }
  triggerToast(order.needManual ? '已转人工处理' : '已恢复自动处理', 'success')
}

const paxFlightDetail = computed(() => {
  return flights.value.map(f => {
    const orderCount = orders.value.filter(o => o.flightNo === f.flight_no).length
    const totalSeats = (f.first_class_num || 0) + (f.economy_num || 0)
    const estimated = Math.min(orderCount * 95 + 80, totalSeats)
    const loadFactor = Math.round((estimated / (totalSeats || 1)) * 100)
    return {
      ...f,
      passenger: estimated,
      loadFactor
    }
  })
})

// 严格表单校验
const validateForm = () => {
  const form = editForm.value
  if (currentEditType.value === 'user') {
    if (!form.vip_level) { triggerToast('请选择会员等级', 'error'); return false }
  }
  if (currentEditType.value === 'flight') {
    if (!form.flightNo.trim() || !/^[A-Z0-9]{4,6}$/.test(form.flightNo)) { triggerToast('航班号格式错误(例: MU5101)', 'error'); return false }
    if (!/^[A-Z]{3}$/.test(form.dep) || !/^[A-Z]{3}$/.test(form.arr)) { triggerToast('机场代码必须为3位大写字母', 'error'); return false }
    if (form.price < 0 || form.fSeats < 0 || form.eSeats < 0) { triggerToast('价格和座位数不能为负数', 'error'); return false }
  }
  if (currentEditType.value === 'news' && !form.title.trim()) { triggerToast('资讯标题不能为空', 'error'); return false }
  if (currentEditType.value === 'route' && (!form.origin || !form.destination)) { triggerToast('起降地不能为空', 'error'); return false }
  return true
}

// 保存逻辑（重构：直连后端 API）
const saveEdit = async () => {
  if (!validateForm()) return

  // === 后端：航班新增 / 实例更新 ===
  if (currentEditType.value === 'flight') {
    try {
      if (isAddMode.value) {
        const res = await axios.post(API_BASE + '/admin/flight/add', {
          flight_no: editForm.value.flightNo,
          plane_model: editForm.value.aircraft,
          first_class_num: editForm.value.fSeats,
          economy_num: editForm.value.eSeats,
          fly_duration: editForm.value.flyDuration || '120'
        })
        if (res.data.code === 200) {
          triggerToast('航班 ' + editForm.value.flightNo + ' 创建成功（默认每周全周飞行）', 'success')
          showEditModal.value = false
        } else triggerToast(res.data.msg || '航班创建失败', 'error')
      } else {
        const res = await axios.post(API_BASE + '/admin/flight_instance/update', {
          flight_no: editForm.value.flightNo,
          fly_date: editForm.value.date || new Date().toISOString().slice(0,10),
          flight_status: editForm.value.status || 'Scheduled',
          first_remain: editForm.value.fSeats,
          economy_remain: editForm.value.eSeats
        })
        if (res.data.code === 200) {
          const idx = flights.value.findIndex(f => f.flightNo === editForm.value.flightNo)
          if(idx > -1) flights.value[idx] = editForm.value
          triggerToast('航班实例更新成功', 'success'); showEditModal.value = false
        } else triggerToast(res.data.msg || '更新失败', 'error')
      }
      return
    } catch (e) { triggerToast('请求失败: ' + (e.msg || e.message || '网络错误'), 'error'); return }
  }

  // === 后端：用户会员等级更新 ===
  if (currentEditType.value === 'user') {
    try {
      const res = await axios.post(`${API_BASE}/admin/passenger/update_vip`, {
        id_card: editForm.value.id_card,
        vip_level: editForm.value.vip_level
      })
      if (res.data.code === 200) {
        triggerToast(res.data.msg || '会员等级已更新', 'success')
        showEditModal.value = false
        await loadUsers()
      } else {
        triggerToast(res.data.msg || '更新失败', 'error')
      }
    } catch (e) {
      triggerToast('更新失败：' + (e.response?.data?.msg || e.message || '网络错误'), 'error')
    }
    return
  }

  // === 纯前端模拟 ===
  const updateList = (list) => {
    const idx = list.findIndex(i => (i.id || i.flightNo) === (editForm.value.id || editForm.value.flightNo))
    if(idx > -1) list[idx] = editForm.value
  }
  if (isAddMode.value) {
    if(currentEditType.value === 'news') systemNews.value.unshift(editForm.value)
    if(currentEditType.value === 'route') routes.value.unshift(editForm.value)
    triggerToast('添加成功')
  } else {
    if(currentEditType.value === 'news') updateList(systemNews.value)
    else if(currentEditType.value === 'route') updateList(routes.value)
    else if(currentEditType.value === 'order') updateList(orders.value)
    triggerToast('修改保存成功')
  }
  showEditModal.value = false
}

// 统计数据计算
const stats = computed(() => ({
  paxToday: 1240,
  revenue: '¥428,500',
  pendingRefund: orders.value.filter(o => o.status === ORDER_STATUS.REFUNDED || o.status === ORDER_STATUS.PENDING).length,
  systemHealth: '99.9%'
}))

const flightStatusSummary = computed(() => {
  const total = flights.value.length || 1
  const flying = flights.value.filter(f => f.status === FLIGHT_STATUS.FLYING).length
  const delayed = flights.value.filter(f => f.status === FLIGHT_STATUS.DELAYED).length
  const arrived = flights.value.filter(f => f.status === FLIGHT_STATUS.ARRIVED).length
  const scheduled = flights.value.filter(f => f.status === FLIGHT_STATUS.SCHEDULED).length

  return [
    { label: '飞行中', value: flying, percent: Math.round((flying / total) * 100), type: 'success' },
    { label: '延误', value: delayed, percent: Math.round((delayed / total) * 100), type: 'danger' },
    { label: '已到达', value: arrived, percent: Math.round((arrived / total) * 100), type: 'info' },
    { label: '计划中', value: scheduled, percent: Math.round((scheduled / total) * 100), type: 'primary' }
  ]
})

const topRoutes = computed(() => {
  const routeCounter = {}
  orders.value.forEach(order => {
    const flight = flights.value.find(f => f.flightNo === order.flightNo)
    const routeKey = flight ? `${flight.dep} - ${flight.arr}` : '未匹配航线'
    routeCounter[routeKey] = (routeCounter[routeKey] || 0) + 1
  })

  return Object.entries(routeCounter)
    .map(([route, count]) => ({ route, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
})

const pendingTasks = computed(() => ([
  { id: 'T01', title: '待处理退款申请', value: orders.value.filter(o => o.status === ORDER_STATUS.REFUNDED).length, level: 'danger', action: 'manualQueue' },
  { id: 'T02', title: '待确认支付订单', value: orders.value.filter(o => o.status === ORDER_STATUS.PENDING).length, level: 'warning', action: 'orders' },
  { id: 'T03', title: '今日新增资讯草稿', value: systemNews.value.filter(n => n.status === '草稿').length, level: 'info' }
]))

const recentOrders = computed(() => orders.value.slice(0, 4))

// 面包屑
const breadcrumb = computed(() => {
  const map = {
    'dashboard': '首页 / 运营看板',
    'system': '系统管理 / 资讯中心',
    'users': '用户管理 / 用户档案',
    'routes': '航班调度 / 航线管理',
    'flights': '航班调度 / 航班实例',
    'orders': '订单管理 / 订单流水',
    'paxDetail': '运营看板 / 今日旅客明细',
    'manualQueue': '订单管理 / 人工处理队列'
  }
  return map[activeMenu.value] || ''
})
</script>

<template>
  <div v-if="!isLoggedIn" class="login-wrapper">
    <div class="glass-login-box">
      <div class="login-header">
        <h2>航空票务管理系统</h2>
      </div>
      
      <div v-if="loginError" class="error-toast">{{ loginError }}</div>
      
      <div class="login-input-group">
        <i class="fas fa-user"></i>
        <input v-model="adminUser.username" type="text" placeholder="管理员账号">
      </div>
      <div class="login-input-group">
        <i class="fas fa-lock"></i>
        <input v-model="adminUser.password" type="password" placeholder="授权口令 " @keyup.enter="handleAdminLogin">
      </div>
      
        <button class="btn-glass" @click="handleAdminLogin">登录系统</button>
        <div style="margin-top: 16px; text-align: center;">
          <button class="back-to-user-from-login-btn" @click="goToUserHome">返回用户界面</button>
        </div>
      </div>
    </div>

  <div v-else class="app-wrapper">
    <aside class="sidebar-container" :class="{ 'collapsed': isCollapse }">
      <div class="sidebar-logo">
        <i class="fas fa-paper-plane"></i>
        <span v-show="!isCollapse">票务管理引擎</span>
      </div>
      
      <div class="el-menu custom-scrollbar">
        <div class="el-menu-item" :class="{ 'is-active': activeMenu === 'dashboard' }" @click="activeMenu = 'dashboard'">
          <i class="fas fa-gauge-high"></i><span v-show="!isCollapse">运营看板</span>
        </div>
        
        <div class="el-menu-group-title" v-show="!isCollapse">基础管理</div>
        <div class="el-menu-item" :class="{ 'is-active': activeMenu === 'system' }" @click="activeMenu = 'system'">
          <i class="fas fa-gears"></i><span v-show="!isCollapse">资讯中心</span>
        </div>
        <div class="el-menu-item" :class="{ 'is-active': activeMenu === 'users' }" @click="activeMenu = 'users'">
          <i class="fas fa-users"></i><span v-show="!isCollapse">用户档案</span>
        </div>
        <div class="el-menu-item" :class="{ 'is-active': activeMenu === 'cities' }" @click="activeMenu = 'cities'">
          <i class="fas fa-city"></i><span v-show="!isCollapse">城市管理</span>
        </div>
        <div class="el-menu-item" :class="{ 'is-active': activeMenu === 'airports' }" @click="activeMenu = 'airports'">
          <i class="fas fa-tower-observation"></i><span v-show="!isCollapse">机场管理</span>
        </div>
        
        <div class="el-menu-group-title" v-show="!isCollapse">航班调度</div>
        <div class="el-menu-item" :class="{ 'is-active': activeMenu === 'routes' }" @click="activeMenu = 'routes'">
          <i class="fas fa-route"></i><span v-show="!isCollapse">航线管理</span>
        </div>
        <div class="el-menu-item" :class="{ 'is-active': activeMenu === 'flights' }" @click="activeMenu = 'flights'">
          <i class="fas fa-plane"></i><span v-show="!isCollapse">航班管理</span>
        </div>
        <div class="el-menu-group-title" v-show="!isCollapse">交易处理</div>
        <div class="el-menu-item" :class="{ 'is-active': activeMenu === 'orders' }" @click="activeMenu = 'orders'">
          <i class="fas fa-file-invoice"></i><span v-show="!isCollapse">订单流水</span>
        </div>
      </div>

      <div class="sidebar-footer">
        <button class="logout-btn" @click="handleLogout">
          <span>🚪</span>
          <span v-show="!isCollapse">退出登录</span>
        </button>
      </div>
    </aside>

    <div class="main-container">
      <header class="navbar">
        <div class="nav-left">
          <div class="hamburger" @click="isCollapse = !isCollapse">
            <i class="fas" :class="isCollapse ? 'fa-indent' : 'fa-outdent'"></i>
          </div>
          <div class="breadcrumb">{{ breadcrumb }}</div>
        </div>
        <div class="nav-right">
          <button class="back-to-user-btn" @click="goToUserHome" style="margin-right: 16px; background: none; border: 1px solid #d8e4f7; color: #1e3a8a; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s;">返回用户界面</button>
          <div class="user-dropdown">
            <span class="name">Admin</span>
            <div class="dropdown-menu">
              <div class="dp-item text-danger" @click="handleLogout"><i class="fas fa-power-off"></i> 退出登录</div>
            </div>
          </div>
        </div>
      </header>

      <main class="app-main custom-scrollbar">
        

        <div v-if="activeMenu === 'dashboard'" class="dashboard-container fade-in">
          <div class="el-row top-row">
            
            <div class="el-col-1">
              <div class="el-card fill-height">
                <div class="el-card-header"><span><i class="fas fa-bolt"></i> 快捷入口</span></div>
                <div class="quick-link-column">
                  <button class="quick-link-btn" @click="activeMenu = 'users'"><i class="fas fa-user-gear"></i> 用户管理</button>
                  <button class="quick-link-btn" @click="activeMenu = 'routes'"><i class="fas fa-route"></i> 航线管理</button>
                  <button class="quick-link-btn" @click="activeMenu = 'flights'"><i class="fas fa-plane"></i> 航班管理</button>
                  <button class="quick-link-btn" @click="activeMenu = 'orders'"><i class="fas fa-receipt"></i> 订单处理</button>
                </div>
              </div>
            </div>

            <div class="el-col-4"> <div class="el-card fill-height">
                <div class="el-card-header"><span><i class="fas fa-clock-rotate-left"></i> 最新订单</span></div>
                <div class="recent-order-list">
                  <div class="recent-order-item" v-for="order in recentOrders" :key="order.ticket_id">
                    <div>
                      <div class="recent-order-name">{{ order.name }} · {{ order.flightNo }}</div>
                      <div class="recent-order-sub">#{{ order.ticket_id }} / {{ order.date }}</div>
                    </div>
                    <span class="el-tag" :class="order.status==='已支付' ? 'info' : order.status==='已改签' ? 'warning' : order.status==='已退票' ? 'danger' : ''">{{ order.status }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="el-col-3 stats-vertical-col">
              
              <div class="card-panel clickable-card" @click="navigateFromDashboard('paxDetail')">
                <div class="card-icon c-blue"><i class="fas fa-users"></i></div>
                <div class="card-desc">
                  <div class="card-title">今日旅客</div>
                  <div class="card-num">{{ stats.paxToday }}</div>
                  <div class="card-trend text-success"><i class="fas fa-caret-up"></i> +12%</div>
                </div>
              </div>
              
              <div class="card-panel">
                <div class="card-icon c-green"><i class="fas fa-sack-dollar"></i></div>
                <div class="card-desc">
                  <div class="card-title">票务总收入</div>
                  <div class="card-num" style="font-size: 16px;">{{ stats.revenue }}</div> <div class="card-trend text-success"><i class="fas fa-caret-up"></i> +5.2%</div>
                </div>
              </div>
              
              <div class="card-panel clickable-card" @click="navigateFromDashboard('manualQueue')">
                <div class="card-icon c-orange"><i class="fas fa-file-invoice"></i></div>
                <div class="card-desc">
                  <div class="card-title">异常退票</div>
                  <div class="card-num">{{ stats.pendingRefund }}</div>
                  <div class="card-trend text-danger">需复核</div>
                </div>
              </div>
              
              <div class="card-panel">
                <div class="card-icon c-red"><i class="fas fa-server"></i></div>
                <div class="card-desc">
                  <div class="card-title">DB健康度</div>
                  <div class="card-num">{{ stats.systemHealth }}</div>
                  <div class="card-trend text-info">平稳</div>
                </div>
              </div>

            </div> 
          </div> 
        </div>
        
        <div>
          <div class="el-row">
            <div class="el-col-6">
              <div class="el-card">
                <div class="el-card-header"><span><i class="fas fa-bullhorn"></i> 航空资讯公告</span></div>
                <div class="news-list">
                  <div class="news-item" v-for="n in systemNews.slice(0,5)" :key="n.id">
                    <span class="news-title">{{ n.title }}</span><span class="news-date">{{ n.time }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="el-col-4">
              <div class="el-card">
                <div class="el-card-header"><span><i class="fas fa-tower-broadcast"></i> 航班运行状态</span></div>
                <div class="status-chart-list">
                  <div class="status-chart-item" v-for="item in flightStatusSummary" :key="item.label">
                    <div class="status-chart-top">
                      <span class="status-name">{{ item.label }}</span>
                      <span class="status-value">{{ item.value }}班 / {{ item.percent }}%</span>
                    </div>
                    <div class="status-progress">
                      <div class="status-progress-inner" :class="item.type" :style="{ width: `${item.percent}%` }"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          

          
        </div>

        <div v-if="activeMenu === 'paxDetail'" class="standard-view fade-in">
          <div class="table-container table-responsive">
            <div class="operate-container border-bottom">
              <div class="operate-left"><i class="fas fa-users"></i> 今日旅客明细（按航班）</div>
              <div class="operate-right">
                <button class="el-button default small" @click="activeMenu = 'dashboard'">返回看板</button>
              </div>
            </div>
            <table class="el-table">
              <thead><tr><th>航班号</th><th>航线</th><th>机型</th><th>旅客数</th><th>上座率</th><th>状态</th></tr></thead>
              <tbody>
                <tr v-for="f in paxFlightDetail" :key="f.flightNo">
                  <td><b>{{ f.flightNo }}</b></td>
                  <td>{{ f.dep }} - {{ f.arr }}</td>
                  <td>{{ f.aircraft }}</td>
                  <td>{{ f.passenger }}</td>
                  <td>{{ f.loadFactor }}%</td>
                  <td><span class="el-tag info">{{ f.status }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="activeMenu === 'manualQueue'" class="standard-view fade-in">
          <div class="table-container table-responsive">
            <div class="operate-container border-bottom">
              <div class="operate-left"><i class="fas fa-headset"></i> 人工处理队列（客服协同）</div>
              <div class="operate-right">
                <button class="el-button default small" @click="activeMenu = 'orders'">查看全部订单</button>
              </div>
            </div>
            <table class="el-table">
              <thead><tr><th>流水号</th><th>用户</th><th>异常原因</th><th>用户留言</th><th>状态</th><th class="text-center">操作</th></tr></thead>
              <tbody>
                <tr v-if="manualOrders.length === 0"><td colspan="6" class="text-center py-3 text-secondary">当前没有需要人工处理的订单</td></tr>
                <tr v-for="o in manualOrders" :key="o.ticket_id">
                  <td>{{ o.ticket_id }}</td>
                  <td>{{ o.name }}<br><span class="text-secondary">{{ o.flightNo }}</span></td>
                  <td>{{ o.manualReason || '用户留言触发' }}</td>
                  <td>{{ o.userMessage || '无留言' }}</td>
                  <td><span class="el-tag warning">人工处理中</span></td>
                  <td class="text-center">
                    <button class="el-button text primary" @click="toggleManualOrder(o)">标记已处理</button>
                    <button class="el-button text danger" @click="deleteItem('order', o.ticket_id)">移除</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="activeMenu === 'users'" class="standard-view fade-in">
          <div class="table-container table-responsive">
            <div class="operate-container border-bottom">
              <div class="operate-left"><i class="fas fa-users"></i> 用户档案列表 <span class="text-secondary" style="font-size:12px;font-weight:400;">（共 {{ users.length }} 条）</span></div>
              <div class="operate-right" style="display: flex; gap: 10px; align-items: center;">
                <span v-if="filteredUsers.length !== users.length" class="text-secondary" style="font-size:12px;">筛选: {{ filteredUsers.length }} 条</span>
                <input v-model="userSearchKeyword" class="el-input__inner" placeholder="搜索姓名/手机号/身份证" style="width:200px;">
                <button class="el-button default small" @click="loadUsers()" title="手动刷新"><i class="fas fa-sync-alt"></i> 刷新</button>
              </div>
            </div>
            <table class="el-table">
              <thead><tr><th>姓名</th><th>手机号</th><th>身份证号</th><th>会员等级</th><th class="text-center">操作</th></tr></thead>
              <tbody>
                <tr v-if="filteredUsers.length === 0"><td colspan="5" class="text-center py-3 text-secondary">暂无用户数据</td></tr>
                <tr v-for="u in filteredUsers" :key="u.id_card || u.phone">
                  <td><b>{{ u.name }}</b></td>
                  <td>{{ u.phone }}</td>
                  <td>{{ maskIdCard(u.id_card) }}</td>
                  <td>
                    <span v-if="u.vip_level==='金卡'" class="el-tag warning">金卡</span>
                    <span v-else-if="u.vip_level==='银卡'" class="el-tag info">银卡</span>
                    <span v-else class="el-tag">普通</span>
                  </td>
                  <td class="text-center">
                    <button class="el-button text primary" @click="openEditModal(u, 'user')">编辑</button>
                    <button class="el-button text danger" @click="deleteItem('user', u.id_card)">删除</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="activeMenu === 'routes'" class="standard-view fade-in">
          <div class="table-container table-responsive">
            <div class="operate-container border-bottom">
              <div class="operate-left"><i class="fas fa-route"></i> 航线基准数据表</div>
              <div class="operate-right" style="display: flex; gap: 10px; align-items: center;">
                <input v-model="routeSearchKeywordForFlight" class="el-input__inner" placeholder="搜索航班号/机场" style="width:190px;">
                <button class="el-button primary small" @click="openFlightModal(null)"><i class="fas fa-plus"></i> 新增航线</button>
              </div>
            </div>
            <table class="el-table">
              <thead><tr><th>航班号</th><th>机型</th><th>座位配置(F/Y)</th><th>起降机场（含经停）</th><th>每周飞行日</th><th>飞行时间</th><th>标准票价</th><th class="text-center">操作</th></tr></thead>
              <tbody>
                <tr v-if="filteredFlights.length === 0"><td colspan="8" class="text-center py-3 text-secondary">暂无航线数据，请点击"新增航线"添加</td></tr>
                <tr v-for="f in filteredFlights" :key="f.flight_no">
                  <td><b class="text-primary">{{ f.flight_no }}</b></td>
                  <td>{{ f.plane_model }}</td>
                  <td><span class="el-tag info mini">F:{{ f.first_class_num }} / Y:{{ f.economy_num }}</span></td>
                  <td>{{ getFlightStopsDisplay(f) }}</td>
                  <td>{{ formatWeekDays(f.fly_week_day) }}</td>
                  <td>{{ (f.depart_time || '').substring(0,5) }} - {{ (f.arrive_time || '').substring(0,5) }}</td>
                  <td>
                    <span v-if="f.first_price || f.economy_price">
                      <span v-if="f.first_price" class="text-danger">F:¥{{ f.first_price }}</span>
                      <span v-if="f.first_price && f.economy_price"> / </span>
                      <span v-if="f.economy_price">Y:¥{{ f.economy_price }}</span>
                    </span>
                    <span v-else class="text-secondary">-</span>
                  </td>
                  <td class="text-center">
                    <button class="el-button text primary" @click="openFlightModal(f)">编辑</button>
                    <button class="el-button text danger" @click="handleFlightDelete(f.flight_no)">删除</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="activeMenu === 'flights'" class="standard-view fade-in">
          <div class="table-container table-responsive">
            <div class="operate-container border-bottom">
              <div class="operate-left"><i class="fas fa-plane"></i> 航班实例列表 <span class="text-secondary" style="font-size:12px;font-weight:400;">（共 {{ flightInstances.length }} 条，每 {{ REFRESH_INTERVAL / 1000 }}s 自动刷新）</span>
                <span v-if="isLoadingInstances" class="text-secondary" style="font-size:12px;margin-left:8px;"><i class="fas fa-spinner fa-pulse"></i> 加载中...</span>
              </div>
              <div class="operate-right" style="display: flex; gap: 10px; align-items: center;">
                <span v-if="filteredFlightInstances.length !== flightInstances.length" class="text-secondary" style="font-size:12px;">筛选: {{ filteredFlightInstances.length }} 条</span>
                <input v-model="instanceSearchKeyword" class="el-input__inner" placeholder="搜索航班号/状态/日期" style="width:200px;">
                <button class="el-button default small" @click="loadFlightInstances()" title="手动刷新"><i class="fas fa-sync-alt" :class="{ 'fa-spin': isLoadingInstances }"></i> 刷新</button>
                <button class="el-button primary small" @click="openInstanceModal()"><i class="fas fa-plus"></i> 管理航班</button>
              </div>
            </div>
            <!-- 后端连接失败提示 -->
            <div v-if="instancesLoadError" class="el-alert warning" style="margin:8px 0;padding:8px 12px;border-radius:4px;display:flex;justify-content:space-between;align-items:center;">
              <span><i class="fas fa-exclamation-triangle"></i> {{ instancesLoadError }}</span>
              <button class="el-button text small" @click="instancesLoadError = ''">✕</button>
            </div>
            <table class="el-table">
              <thead><tr><th>航班号</th><th>飞行日期</th><th>状态</th><th>头等余票</th><th>经济余票</th><th>实际起飞</th><th>实际到达</th><th>票价（淡/平/旺季）</th><th class="text-center">操作</th></tr></thead>
              <tbody>
                <tr v-if="filteredFlightInstances.length === 0"><td colspan="9" class="text-center py-3 text-secondary">暂无航班实例，请先在「航线管理」中新增航线</td></tr>
                <tr v-for="inst in filteredFlightInstances" :key="inst.flight_no + '_' + inst.fly_date">
                  <td><b class="text-primary">{{ inst.flight_no }}</b></td>
                  <td>{{ formatFlyDate(inst.fly_date) }}</td>
                  <!-- 编辑模式：下拉选择状态 -->
                  <td v-if="isEditingInstance(inst)">
                    <select v-model="editingInstanceData.flight_status" class="el-input__inner" style="width:100px;">
                      <option v-for="opt in FLIGHT_INSTANCE_STATUS_OPTIONS" :key="opt" :value="opt">{{ opt }}</option>
                    </select>
                  </td>
                  <!-- 查看模式：标签显示 -->
                  <td v-else>
                    <span v-if="inst.flight_status==='计划'" class="el-tag info">计划</span>
                    <span v-else-if="inst.flight_status==='延误'" class="el-tag warning">延误</span>
                    <span v-else-if="inst.flight_status==='取消'" class="el-tag danger">取消</span>
                    <span v-else-if="inst.flight_status==='完成'" class="el-tag success">完成</span>
                    <span v-else>{{ inst.flight_status }}</span>
                  </td>
                  <!-- 编辑模式：输入余票 -->
                  <td v-if="isEditingInstance(inst)">
                    <input v-model.number="editingInstanceData.first_remain" type="number" min="0" class="el-input__inner" style="width:70px;">
                  </td>
                  <td v-else>{{ inst.first_remain }}</td>
                  <td v-if="isEditingInstance(inst)">
                    <input v-model.number="editingInstanceData.economy_remain" type="number" min="0" class="el-input__inner" style="width:70px;">
                  </td>
                  <td v-else>{{ inst.economy_remain }}</td>
                  <!-- 实际起飞时间 -->
                  <td v-if="isEditingInstance(inst)">
                    <input v-model="editingInstanceData.depart_time_actual" type="time" class="el-input__inner" style="width:110px;">
                  </td>
                  <td v-else>{{ (inst.depart_time_actual || '').substring(0,5) || '-' }}</td>
                  <!-- 实际到达时间 -->
                  <td v-if="isEditingInstance(inst)">
                    <input v-model="editingInstanceData.arrive_time_actual" type="time" class="el-input__inner" style="width:110px;">
                  </td>
                  <td v-else>{{ (inst.arrive_time_actual || '').substring(0,5) || '-' }}</td>
                  <!-- 动态票价 -->
                  <td>
                    <span v-if="getInstancePriceDisplay(inst, flights) !== '-'">
                      <span :class="'el-tag ' + (SEASON_TAG[getSeasonType(inst.fly_date)] || '')" style="font-size:11px;margin-right:4px;">{{ getSeasonType(inst.fly_date) }}</span>
                      {{ getInstancePriceDisplay(inst, flights) }}
                    </span>
                    <span v-else class="text-secondary">-</span>
                  </td>
                  <!-- 操作按钮 -->
                  <td class="text-center">
                    <template v-if="isEditingInstance(inst)">
                      <button class="el-button text success" @click="saveEditInstance(inst)">保存</button>
                      <button class="el-button text" @click="cancelEditInstance()">取消</button>
                    </template>
                    <template v-else>
                      <button class="el-button text primary" @click="startEditInstance(inst)"> 编辑</button>
                      <button class="el-button text danger" @click="handleInstanceDelete(inst)">🗑 删除</button>
                    </template>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 航班实例新增弹窗 -->
        <div v-if="instanceModalVisible" class="el-dialog__wrapper">
          <div class="el-dialog" style="max-width: 420px;">
            <div class="el-dialog__header">
              <span class="el-dialog__title">新增航班实例</span>
              <button class="el-dialog__headerbtn" @click="instanceModalVisible = false"><i class="fas fa-times"></i></button>
            </div>
            <div class="el-dialog__body">
              <form class="el-form">
                <div class="el-form-item"><label>航班号 <span class="text-danger">*</span></label><input v-model="instanceForm.flight_no" class="el-input__inner" placeholder="如：MU5101"></div>
                <div class="el-form-item"><label>飞行日期 <span class="text-danger">*</span></label><input v-model="instanceForm.fly_date" type="date" class="el-input__inner"></div>
                <p class="text-secondary" style="font-size:12px;margin-top:4px;"></p>
              </form>
            </div>
            <div class="el-dialog__footer">
              <button class="el-button default" @click="instanceModalVisible = false">取消</button>
              <button class="el-button primary" @click="handleInstanceSubmit">保存</button>
            </div>
          </div>
        </div>

        <!-- ====== 订单流水（独立条件块） ====== -->
        <div v-if="activeMenu === 'orders'" class="standard-view fade-in">
          <div class="table-container table-responsive">
            <div class="operate-container border-bottom">
              <div class="operate-left"><i class="fas fa-list"></i> 全域订单流水表</div>
              <div class="operate-right" style="display: flex; gap: 10px; align-items: center;">
                <input v-model="orderSearchQuery" class="el-input__inner" placeholder="搜索姓名/航班号" style="width:180px;">
                <button class="el-button default small" @click="loadOrders()" title="手动刷新" style="margin-left:6px;"><i class="fas fa-sync-alt"></i> 刷新</button>
                <select v-model="orderFilter" class="el-input__inner" style="width: 120px;">
                  <option value="ALL">全部状态</option>
                  <option value="已支付">已支付</option>
                  <option value="已改签">已改签</option>
                  <option value="已退票">已退票</option>
                </select>
              </div>
            </div>
            <table class="el-table">
              <thead><tr><th>流水号</th><th>乘客信息</th><th>航班号</th><th>日期/舱位</th><th>金额</th><th>状态</th><th class="text-center">路线</th></tr></thead>
              <tbody>
                <tr v-if="filteredOrders.length === 0"><td colspan="7" class="text-center py-3 text-secondary">暂无订单数据，点击刷新按钮从数据库加载</td></tr>
                <tr v-for="o in filteredOrders" :key="o.ticket_id">
                  <td>{{ o.ticket_id }}</td>
                  <td><b>{{ o.name }}</b><br><span class="text-secondary">身份证: {{ maskIdCard(o.id_card) }}</span></td>
                  <td>{{ o.flightNo }}</td>
                  <td>{{ o.date }}<br><span class="text-secondary">{{ o.cabin }}舱</span></td>
                  <td class="text-danger font-weight-bold">¥{{ o.price }}</td>
                  <td>
                    <span v-if="o.status==='已支付'" class="el-tag info">已支付</span>
                    <span v-else-if="o.status==='已改签'" class="el-tag warning">已改签</span>
                    <span v-else-if="o.status==='已退票'" class="el-tag danger">已退票</span>
                    <span v-else class="el-tag">{{ o.status }}</span>
                  </td>
                  <td class="text-center" style="font-size:12px;color:#6b7280;">{{ o.dep_airport || '-' }} → {{ o.arr_airport || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ====== 资讯中心（独立条件块） ====== -->
        <div v-if="activeMenu === 'system'" class="standard-view fade-in">
          <div class="table-container table-responsive">
            <div class="operate-container border-bottom">
              <div class="operate-left"><i class="fas fa-list"></i> 资讯实体表</div>
              <div class="operate-right">
                <button class="el-button primary small" @click="openEditModal(null, 'news')"><i class="fas fa-plus"></i> 新增资讯</button>
              </div>
            </div>
            <table class="el-table">
              <thead><tr><th>资讯编号</th><th>资讯标题</th><th>发布源</th><th>发布时间</th><th class="text-center">操作</th></tr></thead>
              <tbody>
                <tr v-for="n in systemNews" :key="n.id">
                  <td>{{ n.id }}</td>
                  <td><b>{{ n.title }}</b></td>
                  <td>{{ n.author }}<br><span class="text-secondary">{{ n.time }}</span></td>
                  <td><span :class="n.status==='已发布'?'el-tag success':'el-tag info'">{{ n.status }}</span></td>
                  <td class="text-center">
                    <button class="el-button text primary" @click="openEditModal(n, 'news')">编辑</button>
                    <button class="el-button text danger" @click="deleteItem('news', n.id)">删除</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ====== 城市管理（独立条件块） ====== -->
        <div v-if="activeMenu === 'cities'" class="standard-view fade-in">
          <div class="table-container table-responsive">
            <div class="operate-container border-bottom">
              <div class="operate-left"><i class="fas fa-list"></i> 城市基础数据表</div>
              <div class="operate-right" style="display: flex; gap: 10px; align-items: center;">
                <input v-model="citySearchInput" class="el-input__inner" placeholder="搜索城市代码/名称/省份" style="width:220px;" @keyup.enter="handleCitySearch">
                <button class="el-button default small" @click="handleCitySearch"><i class="fas fa-search"></i> 搜索</button>
                <button class="el-button primary small" @click="openCityModal(null)"><i class="fas fa-plus"></i> 新增城市</button>
              </div>
            </div>
            <table class="el-table">
              <thead><tr><th>城市代码</th><th>城市名称</th><th>所属省份</th><th class="text-center">操作</th></tr></thead>
              <tbody>
                <tr v-if="filteredCities.length === 0"><td colspan="4" class="text-center py-3 text-secondary">暂无数据</td></tr>
                <tr v-for="ct in filteredCities" :key="ct.area_code">
                  <td><b>{{ ct.area_code }}</b></td><td>{{ ct.city_name }}</td><td>{{ ct.province }}</td>
                  <td class="text-center">
                    <button class="el-button text primary" @click="openCityModal(ct)">编辑</button>
                    <button class="el-button text danger" @click="handleCityDelete(ct.area_code)">删除</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ====== 机场管理（独立条件块） ====== -->
        <div v-if="activeMenu === 'airports'" class="standard-view fade-in">
          <div class="table-container table-responsive">
            <div class="operate-container border-bottom">
              <div class="operate-left"><i class="fas fa-list"></i> 机场基础数据表</div>
              <div class="operate-right" style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                <input v-model="airportSearchKeyword" class="el-input__inner" placeholder="搜索机场代码/名称" style="width:200px;">
                <input v-model="airportFilterArea" class="el-input__inner" placeholder="按城市代码筛选" style="width:180px;">
                <button class="el-button default small" @click="handleAirportFilterByArea"><i class="fas fa-filter"></i> 筛选</button>
                <button class="el-button primary small" @click="openAirportModal(null)"><i class="fas fa-plus"></i> 新增机场</button>
              </div>
            </div>
            <table class="el-table">
              <thead><tr><th>机场代码</th><th>机场名称</th><th>所属城市</th><th class="text-center">操作</th></tr></thead>
              <tbody>
                <tr v-if="filteredAirports.length === 0"><td colspan="4" class="text-center py-3 text-secondary">暂无数据</td></tr>
                <tr v-for="ap in filteredAirports" :key="ap.airport_code">
                  <td><b>{{ ap.airport_code }}</b></td><td>{{ ap.airport_name }}</td><td>{{ ap.area_code }}</td>
                  <td class="text-center">
                    <button class="el-button text primary" @click="openAirportModal(ap)">编辑</button>
                    <button class="el-button text danger" @click="handleAirportDelete(ap.airport_code)">删除</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>


    <!-- 航线编辑弹窗 -->
    <div v-if="routeModalVisible" class="el-dialog__wrapper">
      <div class="el-dialog">
        <div class="el-dialog__header">
          <span class="el-dialog__title">{{ routeEditMode ? '编辑' : '新增' }}航线</span>
          <button class="el-dialog__headerbtn" @click="routeModalVisible = false"><i class="fas fa-times"></i></button>
        </div>
        <div class="el-dialog__body">
          <form class="el-form">
            <div class="el-form-item"><label>出发城市</label><input v-model="routeForm.departure_city" class="el-input__inner" placeholder="如：上海"></div>
            <div class="el-form-item"><label>到达城市</label><input v-model="routeForm.arrival_city" class="el-input__inner" placeholder="如：北京"></div>
          </form>
        </div>
        <div class="el-dialog__footer">
          <button class="el-button default" @click="routeModalVisible = false">取消</button>
          <button class="el-button primary" @click="handleRouteSubmit">保存</button>
        </div>
      </div>
    </div>

    <!-- 航班编辑弹窗 -->
    <div v-if="flightModalVisible" class="el-dialog__wrapper">
      <div class="el-dialog" style="max-width: 620px;">
        <div class="el-dialog__header">
          <span class="el-dialog__title">{{ flightEditMode ? '编辑' : '新增' }}航班</span>
          <button class="el-dialog__headerbtn" @click="flightModalVisible = false"><i class="fas fa-times"></i></button>
        </div>
        <div class="el-dialog__body custom-scrollbar" style="max-height: 65vh; overflow-y: auto;">
          <form class="el-form">
            <div class="el-form-item"><label>航班号 <span class="text-danger">*</span></label><input v-model="flightForm.flight_no" class="el-input__inner" :disabled="flightEditMode" placeholder="如：MU5101"></div>
            <div class="el-form-item"><label>机型 <span class="text-danger">*</span></label><input v-model="flightForm.plane_model" class="el-input__inner" placeholder="如：Boeing 737 / Airbus A330"></div>
            <div class="el-form-row">
              <div class="el-form-item" style="flex:1"><label>头等舱座位数</label><input v-model.number="flightForm.first_class_num" type="number" min="0" class="el-input__inner"></div>
              <div class="el-form-item" style="flex:1"><label>经济舱座位数</label><input v-model.number="flightForm.economy_num" type="number" min="0" class="el-input__inner"></div>
            </div>

            <!-- 舱位基准票价 -->
            <div class="el-form-item"><label>舱位基准票价（元）</label></div>
            <div class="el-form-row">
              <div class="el-form-item" style="flex:1"><label>头等舱</label><input v-model="flightForm.first_price" type="number" min="0" step="0.01" class="el-input__inner" placeholder="如：2880.00"></div>
              <div class="el-form-item" style="flex:1"><label>经济舱</label><input v-model="flightForm.economy_price" type="number" min="0" step="0.01" class="el-input__inner" placeholder="如：1280.00"></div>
            </div>

            <!-- 每周飞行日（多选） -->
            <div class="el-form-item">
              <label>每周飞行日</label>
              <div class="weekday-checkboxes" style="display:flex;flex-wrap:wrap;gap:6px;padding-top:4px;">
                <label v-for="d in [1,2,3,4,5,6,7]" :key="d" class="weekday-label" style="display:flex;align-items:center;gap:3px;cursor:pointer;padding:4px 10px;border:1px solid #d9d9d9;border-radius:6px;font-size:13px;" :style="{background:flightWeekDays.includes(d)?'#409eff':'' , color:flightWeekDays.includes(d)?'#fff':'' , borderColor:flightWeekDays.includes(d)?'#409eff':'#d9d9d9'}">
                  <input type="checkbox" :value="d" v-model="flightWeekDays" style="display:none;">
                  {{ WEEKDAY_MAP[d] }}
                </label>
              </div>
            </div>

            <!-- 出发/到达时间 -->
            <div class="el-form-row">
              <div class="el-form-item" style="flex:1"><label>每日出发时间</label><input v-model="flightForm.depart_time" type="time" class="el-input__inner"></div>
              <div class="el-form-item" style="flex:1"><label>每日到达时间</label><input v-model="flightForm.arrive_time" type="time" class="el-input__inner"></div>
            </div>

            <!-- 机场停靠 -->
            <div class="el-form-item">
              <label>机场停靠 <span class="text-danger">*</span></label>
              <button type="button" class="el-button primary small" @click="addFlightStop" style="margin-left:10px;"><i class="fas fa-plus"></i> 添加经停</button>
            </div>
            <div v-for="(stop, idx) in flightForm.stops" :key="idx" style="margin-bottom:10px;">
              <div style="display:flex;align-items:center;gap:8px;padding:6px 8px;background:#fafafa;border-radius:6px;">
                <span class="el-tag" :class="stop.stop_sort==='起飞'?'success':'warning'" style="min-width:48px;text-align:center;">{{ stop.stop_sort }}</span>
                <div style="flex:1;position:relative;">
                  <input v-model="stop.searchText" class="el-input__inner" style="width:100%;" :placeholder="stop.airport_code ? '' : '输入城市或机场名称搜索...'" @input="stop.searchText = $event.target.value">
                  <button v-if="stop.airport_code" type="button" @click="clearAirport(idx)" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;color:#999;cursor:pointer;font-size:16px;">&times;</button>
                  <div v-if="getFilteredAirports(stop).length > 0 && !stop.airport_code" style="position:absolute;top:100%;left:0;right:0;z-index:100;background:#fff;border:1px solid #dcdfe6;border-radius:0 0 6px 6px;max-height:200px;overflow-y:auto;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
                    <div v-for="ap in getFilteredAirports(stop)" :key="ap.airport_code" @click="selectAirport(idx, ap)" style="padding:8px 12px;cursor:pointer;border-bottom:1px solid #f0f0f0;font-size:13px;" @mouseenter="$event.target.style.background='#f5f7fa'" @mouseleave="$event.target.style.background=''">
                      <b>{{ ap.airport_name }}</b> <span style="color:#909399;">{{ ap.airport_code }}</span>
                    </div>
                  </div>
                </div>
                <button type="button" class="el-button text danger" @click="removeFlightStop(idx)" v-if="stop.stop_sort!=='起飞' && stop.stop_sort!=='降落'" style="min-width:40px;"><i class="fas fa-trash"></i></button>
              </div>
            </div>
          </form>
        </div>
        <div class="el-dialog__footer">
          <button class="el-button default" @click="flightModalVisible = false">取消</button>
          <button class="el-button primary" @click="handleFlightSubmit">保存</button>
        </div>
      </div>
    </div>
      </main>

    <!-- 城市编辑弹窗 -->
    <div v-if="cityModalVisible" class="el-dialog__wrapper">
      <div class="el-dialog">
        <div class="el-dialog__header">
          <span class="el-dialog__title">{{ cityEditMode ? '编辑' : '新增' }}城市</span>
          <button class="el-dialog__headerbtn" @click="cityModalVisible = false"><i class="fas fa-times"></i></button>
        </div>
        <div class="el-dialog__body">
          <form class="el-form">
            <div class="el-form-item"><label>城市代码</label><input v-model="cityForm.area_code" class="el-input__inner" placeholder="如: SHA, PEK" :disabled="cityEditMode"></div>
            <div class="el-form-item"><label>城市名称</label><input v-model="cityForm.city_name" class="el-input__inner" placeholder="如: 上海"></div>
            <div class="el-form-item"><label>所属省份</label><input v-model="cityForm.province" class="el-input__inner" placeholder="如: 上海市"></div>
          </form>
        </div>
        <div class="el-dialog__footer">
          <button class="el-button default" @click="cityModalVisible = false">取消</button>
          <button class="el-button primary" @click="handleCitySubmit">保存</button>
        </div>
      </div>
    </div>

    <!-- 机场编辑弹窗 -->
    <div v-if="airportModalVisible" class="el-dialog__wrapper">
      <div class="el-dialog">
        <div class="el-dialog__header">
          <span class="el-dialog__title">{{ airportEditMode ? '编辑' : '新增' }}机场</span>
          <button class="el-dialog__headerbtn" @click="airportModalVisible = false"><i class="fas fa-times"></i></button>
        </div>
        <div class="el-dialog__body">
          <form class="el-form">
            <div class="el-form-item"><label>机场代码</label><input v-model="airportForm.airport_code" class="el-input__inner" placeholder="如: SHA, PVG" :disabled="airportEditMode"></div>
            <div class="el-form-item"><label>机场名称</label><input v-model="airportForm.airport_name" class="el-input__inner" placeholder="如: 上海虹桥国际机场"></div>
            <div class="el-form-item"><label>所属城市代码</label><input v-model="airportForm.area_code" class="el-input__inner" placeholder="如: SHA"></div>
          </form>
        </div>
        <div class="el-dialog__footer">
          <button class="el-button default" @click="airportModalVisible = false">取消</button>
          <button class="el-button primary" @click="handleAirportSubmit">保存</button>
        </div>
      </div>
    </div>
    </div>

    <div v-if="showEditModal" class="el-dialog__wrapper">
      <div class="el-dialog">
        <div class="el-dialog__header">
          <span class="el-dialog__title">{{ isAddMode ? '新增' : '编辑' }}数据</span>
          <button class="el-dialog__headerbtn" @click="showEditModal = false"><i class="fas fa-times"></i></button>
        </div>
        <div class="el-dialog__body custom-scrollbar" style="max-height: 60vh; overflow-y: auto;">
          <form class="el-form">
            
            <template v-if="currentEditType === 'news'">
               <div class="el-form-item"><label class="el-form-item__label">标题<span class="text-danger">*</span></label>
                <div class="el-form-item__content"><input v-model="editForm.title" class="el-input__inner"></div>
              </div>
              <div class="el-form-item"><label class="el-form-item__label">发布部门</label>
                <div class="el-form-item__content"><input v-model="editForm.author" class="el-input__inner"></div>
              </div>
              <div class="el-form-item"><label class="el-form-item__label">发布状态</label>
                <div class="el-form-item__content">
                  <select v-model="editForm.status" class="el-input__inner">
                    <option value="草稿">草稿</option>
                    <option value="已发布">已发布</option>
                  </select>
                </div>
              </div>
              <div class="el-form-item"><label class="el-form-item__label">正文</label>
                <div class="el-form-item__content"><textarea v-model="editForm.content" class="el-input__inner text-area" placeholder="支持演示级图文内容，建议输入2-3句话"></textarea></div>
              </div>
              <div class="el-form-item"><label class="el-form-item__label">链接</label>
                <div class="el-form-item__content"><input v-model="editForm.link" class="el-input__inner" placeholder="https://"></div>
              </div>
              <div class="news-preview-box">
                <div class="news-preview-title">{{ editForm.title || '资讯标题预览' }}</div>
                <p>{{ editForm.content || '这里显示正文预览，可用于发布前审阅。' }}</p>
                <a v-if="editForm.link" :href="editForm.link" target="_blank">查看外部链接</a>
              </div>
            </template>

            <template v-if="currentEditType === 'order'">
               <div class="el-form-item"><label class="el-form-item__label">流水号</label>
                <div class="el-form-item__content"><input v-model="editForm.id" class="el-input__inner" disabled></div>
              </div>
              <div class="el-form-item"><label class="el-form-item__label">客户姓名</label>
                <div class="el-form-item__content"><input v-model="editForm.name" class="el-input__inner" disabled></div>
              </div>
              <div class="el-form-item"><label class="el-form-item__label">订单状态</label>
                <div class="el-form-item__content">
                  <select v-model="editForm.status" class="el-input__inner">
                     <option :value="ORDER_STATUS.PENDING">待支付</option>
                     <option :value="ORDER_STATUS.PAID">已支付</option>
                     <option :value="ORDER_STATUS.COMPLETED">已完成</option>
                     <option :value="ORDER_STATUS.REFUNDED">已退款</option>
                  </select>
                </div>
              </div>
            </template>

            <template v-if="currentEditType === 'user'">
              <div class="el-form-item"><label class="el-form-item__label">姓名</label>
                <div class="el-form-item__content"><input class="el-input__inner" :value="editForm.name" disabled></div>
              </div>
              <div class="el-form-item"><label class="el-form-item__label">手机号</label>
                <div class="el-form-item__content"><input class="el-input__inner" :value="editForm.phone" disabled></div>
              </div>
              <div class="el-form-item"><label class="el-form-item__label">身份证号</label>
                <div class="el-form-item__content"><input class="el-input__inner" :value="maskIdCard(editForm.id_card)" disabled></div>
              </div>
              <div class="el-form-item"><label class="el-form-item__label">会员等级 <span class="text-danger">*</span></label>
                <div class="el-form-item__content">
                  <select v-model="editForm.vip_level" class="el-input__inner">
                    <option value="普通">普通</option>
                    <option value="银卡">银卡</option>
                    <option value="金卡">金卡</option>
                  </select>
                </div>
              </div>
              <p class="text-secondary" style="font-size:12px;margin-top:4px;"></p>
            </template>

            <template v-if="currentEditType === 'flight'">
              <div class="el-form-item"><label class="el-form-item__label">航班号<span class="text-danger">*</span></label>
                <div class="el-form-item__content"><input v-model="editForm.flightNo" class="el-input__inner" :disabled="!isAddMode" placeholder="如 MU5101"></div>
              </div>
              <div class="el-form-item"><label class="el-form-item__label">起飞机场<span class="text-danger">*</span></label>
                <div class="el-form-item__content"><input v-model="editForm.dep" class="el-input__inner" placeholder="3位大写代码，如 SHA"></div>
              </div>
              <div class="el-form-item"><label class="el-form-item__label">到达机场<span class="text-danger">*</span></label>
                <div class="el-form-item__content"><input v-model="editForm.arr" class="el-input__inner" placeholder="3位大写代码，如 PKX"></div>
              </div>
              <div class="el-form-item"><label class="el-form-item__label">航班状态</label>
                <div class="el-form-item__content">
                  <select v-model="editForm.status" class="el-input__inner">
                    <option :value="FLIGHT_STATUS.SCHEDULED">计划中</option>
                    <option :value="FLIGHT_STATUS.FLYING">飞行中</option>
                    <option :value="FLIGHT_STATUS.DELAYED">延误</option>
                    <option :value="FLIGHT_STATUS.ARRIVED">已到达</option>
                    <option :value="FLIGHT_STATUS.CANCELLED">已取消</option>
                  </select>
                </div>
              </div>
              <div class="el-form-item"><label class="el-form-item__label">机型</label>
                <div class="el-form-item__content"><input v-model="editForm.aircraft" class="el-input__inner" placeholder="如 A330"></div>
              </div>
              <div class="el-form-item"><label class="el-form-item__label">基准价 (¥)</label>
                <div class="el-form-item__content"><input v-model="editForm.price" type="number" min="0" class="el-input__inner"></div>
              </div>
            </template>

            <template v-if="currentEditType === 'route'">
              <div class="el-form-item"><label class="el-form-item__label">出发地<span class="text-danger">*</span></label>
                <div class="el-form-item__content"><input v-model="editForm.origin" class="el-input__inner" placeholder="如 PEK"></div>
              </div>
              <div class="el-form-item"><label class="el-form-item__label">目的地<span class="text-danger">*</span></label>
                <div class="el-form-item__content"><input v-model="editForm.destination" class="el-input__inner" placeholder="如 SHA"></div>
              </div>
              <div class="el-form-item"><label class="el-form-item__label">航线类型</label>
                <div class="el-form-item__content"><input v-model="editForm.type" class="el-input__inner" placeholder="如 国内干线"></div>
              </div>
            </template>

          </form>
        </div>
        <div class="el-dialog__footer">
          <button class="el-button default" @click="showEditModal = false">取 消</button>
          <button class="el-button primary" @click="saveEdit">保 存</button>
        </div>
      </div>
    </div>

    <Transition name="el-message-fade">
      <div v-if="showToast" :class="['el-message', toastType === 'error' ? 'el-message--error' : toastType === 'info' ? 'el-message--info' : 'el-message--success']">
        <i class="fas" :class="toastType === 'error' ? 'fa-circle-xmark' : toastType === 'info' ? 'fa-circle-info' : 'fa-circle-check'"></i>
        <p class="el-message__content">{{ toastMsg }}</p>
      </div>
    </Transition>
  </div>

  <div v-if="showBulkUserModal" class="el-dialog__wrapper">
    <div class="el-dialog">
      <div class="el-dialog__header">
        <span class="el-dialog__title">批量新增用户</span>
        <button class="el-dialog__headerbtn" @click="showBulkUserModal = false"><i class="fas fa-times"></i></button>
      </div>
      <div class="el-dialog__body">
        <p class="text-secondary" style="margin-top: 0;">每行一个用户：姓名,账号,手机号,身份证,性别</p>
        <textarea v-model="bulkUserText" class="el-input__inner text-area" style="min-height: 180px;"></textarea>
      </div>
      <div class="el-dialog__footer">
        <button class="el-button default" @click="showBulkUserModal = false">取消</button>
        <button class="el-button primary" @click="saveBulkUsers">确认导入</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ================= 全局变量与美化 ================= */
:root {
  --el-color-primary: #1e3a8a;
  --el-color-success: #67c23a;
  --el-color-warning: #e6a23c;
  --el-color-danger: #f56c6c;
  --el-color-info: #909399;
  --el-text-color-primary: #303133;
  --el-text-color-secondary: #909399;
  --el-border-color-light: #ebeef5;
  --el-bg-color-page: #f0f2f5;
  --sidebar-width: 210px;
}
* { box-sizing: border-box; }

/* 自定义滚动条 */
.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #c0c4cc; border-radius: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }

/* 渐入动画 */
.fade-in { animation: fadeIn 0.4s ease-in-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

/* 状态呼吸灯特效 */
.status-blink { animation: blink 2s infinite; }
@keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.6; } 100% { opacity: 1; } }

.text-center { text-align: center; }
.font-weight-bold { font-weight: 700; }
.text-primary { color: var(--el-color-primary); }
.text-secondary { color: var(--el-text-color-secondary); font-size: 13px;}
.text-danger { color: var(--el-color-danger); }
.text-success { color: var(--el-color-success); }
.text-info { color: var(--el-color-info); }
.py-3 { padding: 15px 0 !important; }

/* ================= 登录页 ================= */
.login-wrapper { position: fixed; inset: 0; background: radial-gradient(circle at center, #1e3a8a 0%, #020617 100%); display: flex; align-items: center; justify-content: center; font-family: 'Helvetica Neue', Helvetica, sans-serif; z-index: 10000; }
.glass-login-box { background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1); padding: 40px 50px; border-radius: 20px; width: 400px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); text-align: center; }
.login-header h2 { color: #fff; font-size: 1.8rem; margin: 0 0 30px; letter-spacing: 2px; }
.error-toast { background: rgba(239, 68, 68, 0.2); color: #fca5a5; padding: 10px; border-radius: 8px; margin-bottom: 20px; font-size: 13px; }
.login-input-group { background: rgba(0, 0, 0, 0.2); border-radius: 12px; display: flex; align-items: center; padding: 0 15px; margin-bottom: 20px; border: 1px solid transparent; transition: 0.3s; }
.login-input-group:focus-within { border-color: #60a5fa; background: rgba(0, 0, 0, 0.4); }
.login-input-group i { color: #94a3b8; margin-right: 12px; }
.login-input-group input { background: none; border: none; color: #fff; padding: 15px 0; width: 100%; outline: none; font-size: 14px; }
.btn-glass { width: 100%; padding: 15px; font-size: 16px; font-weight: 600; cursor: pointer; color: #fff; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 12px; backdrop-filter: blur(10px); transition: 0.3s; }
.btn-glass:hover { background: rgba(255, 255, 255, 0.2); transform: translateY(-2px); }

.back-to-user-from-login-btn { background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.2); color: #94a3b8; padding: 8px 20px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.3s; }
.back-to-user-from-login-btn:hover { background: rgba(255, 255, 255, 0.15); color: #fff; border-color: rgba(255, 255, 255, 0.35); }

/* Sidebar Footer */
.sidebar-footer { border-top: 1px solid #e6eef8; padding: 10px 0; margin-top: auto; background: #fff; }
.sidebar-footer button { display: flex; align-items: center; gap: 8px; width: 100%; padding: 10px 20px; border: none; background: transparent; color: #4b5563; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.sidebar-footer button:hover { background: #fef0f0; color: #f56c6c; }

/* ================= 布局框架 ================= */
.app-wrapper { display: flex; height: 100vh; background: var(--el-bg-color-page); font-family: 'Helvetica Neue', Helvetica, sans-serif; }
.sidebar-container { width: var(--sidebar-width); background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%); display: flex; flex-direction: column; transition: width 0.3s; box-shadow: 2px 0 10px rgba(0,21,41,.08); z-index: 1001; border-right: 1px solid #dbe7f5; }
.sidebar-container.collapsed { width: 64px; }
.sidebar-logo { height: 54px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; color: var(--el-color-primary); background: #fff; box-shadow: 0 1px 4px rgba(0,21,41,.08); border-bottom: 1px solid #e6eef8; }
.sidebar-logo i { font-size: 20px; margin-right: 8px; color: var(--el-color-primary); }
.el-menu { flex: 1; padding: 10px 0; overflow-y: auto; background: #fff; }
.el-menu-group-title { padding: 15px 20px 5px; font-size: 12px; color: #4b5563; font-weight: 700; letter-spacing: 0.5px; }
.el-menu-item { height: 46px; display: flex; align-items: center; padding: 0 20px; color: #1f2937; cursor: pointer; transition: 0.3s; font-size: 14px; margin: 4px 10px; border-radius: 8px; border-left: 4px solid transparent; font-weight: 600;}
.el-menu-item i { width: 24px; text-align: center; margin-right: 8px; font-size: 16px; color: #4b5563; }
.el-menu-item:hover { color: var(--el-color-primary); background: #eef5ff; }
.el-menu-item.is-active { background-color: #1e3a8a !important; color: #ffffff !important; border-left: 4px solid #7dd3fc;}
.el-menu-item.is-active i { color: #ffffff !important; }

.main-container { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.navbar { height: 54px; background: #fff; box-shadow: 0 1px 6px rgba(0,21,41,.08); display: flex; justify-content: space-between; padding: 0 15px; z-index: 10; border-bottom: 1px solid #e4edf8;}
.nav-left, .nav-right { display: flex; align-items: center; height: 100%; }
.hamburger { padding: 0 15px; cursor: pointer; font-size: 18px; color: #5a5e66; }
.breadcrumb { font-size: 15px; color: #1e3a8a; font-weight: 600; margin-left: 10px; }
.user-dropdown { cursor: pointer; margin-left: 20px; position: relative; padding: 10px 0; }
.user-dropdown .name { font-size: 14px; color: #5a5e66; font-weight: bold; }
.user-dropdown:hover .dropdown-menu { display: block; }
.dropdown-menu { display: none; position: absolute; top: 40px; right: 0; background: #fff; box-shadow: 0 2px 12px 0 rgba(0,0,0,.1); border-radius: 4px; padding: 5px 0; min-width: 120px; border: 1px solid #e4e7ed; }
.dp-item { padding: 10px 20px; font-size: 14px; color: #606266; }
.dp-item:hover { background: #fef0f0; color: #f56c6c; }

.app-main { flex: 1; padding: 20px; overflow-y: auto; }

/* Dashboard 面板 */
.panel-group { display: flex; margin: 0 -10px 20px; }
.panel-col { flex: 1; padding: 0 10px; }
.card-panel { height: 110px; background: #fff; box-shadow: 4px 4px 40px rgba(0,0,0,.05); border-radius: 4px; display: flex; align-items: center; padding: 0 20px; justify-content: space-between; }
.clickable-card { cursor: pointer; }
.clickable-card:hover { transform: translateY(-2px); }
.card-icon { font-size: 48px; padding: 16px; transition: all 0.3s ease-out; border-radius: 6px; }
.c-blue { color: #40c9c6; } .c-green { color: #36a3f7; } .c-orange { color: #f4516c; } .c-red { color: #34bfa3; }
.card-panel:hover .card-icon { color: #fff; transform: scale(1.05); }
.card-panel:hover .c-blue { background: #40c9c6; } .card-panel:hover .c-green { background: #36a3f7; } .card-panel:hover .c-orange { background: #f4516c; } .card-panel:hover .c-red { background: #34bfa3; }
.card-desc { text-align: right; }
.card-title { color: rgba(0,0,0,0.45); font-size: 14px; margin-bottom: 5px; }
.card-num { font-size: 20px; font-weight: bold; color: #666; margin-bottom: 5px; }
.card-trend { font-size: 12px; }

.el-row { display: flex; gap: 20px; }
.el-col-6 { flex: 6; } .el-col-4 { flex: 4; }
.el-card { border: 1px solid var(--el-border-color-light); background-color: #fff; border-radius: 4px; box-shadow: 0 2px 12px 0 rgba(0,0,0,.05); }
.el-card-header { padding: 15px 20px; border-bottom: 1px solid var(--el-border-color-light); font-size: 15px; color: var(--el-text-color-primary); display: flex; align-items: center; gap: 8px;}
.news-list { padding: 10px 20px; }
.news-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px dashed #ebeef5; font-size: 14px; color: #606266; }
.news-item:last-child { border-bottom: none;}
.news-date { color: #909399; font-size: 13px; }

.status-chart-list { padding: 12px 20px 16px; }
.status-chart-item { margin-bottom: 14px; }
.status-chart-item:last-child { margin-bottom: 0; }
.status-chart-top { display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: #1f2937; }
.status-progress { height: 8px; border-radius: 6px; background: #e5edf8; overflow: hidden; }
.status-progress-inner { height: 100%; border-radius: 6px; }
.status-progress-inner.primary { background: #1e3a8a; }
.status-progress-inner.success { background: #2f9b59; }
.status-progress-inner.danger { background: #d14343; }
.status-progress-inner.info { background: #4b77c4; }

.quick-link-grid { padding: 16px 20px 20px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.quick-link-btn { border: 1px solid #d8e4f7; background: #f7fbff; color: #1e3a8a; font-weight: 700; border-radius: 8px; padding: 12px 10px; cursor: pointer; transition: all 0.2s; }
.quick-link-btn:hover { background: #1e3a8a; color: #fff; }

.rank-list { padding: 12px 20px 16px; }
.rank-item { display: flex; align-items: center; justify-content: space-between; padding: 11px 0; border-bottom: 1px dashed #e4eaf5; }
.rank-item:last-child { border-bottom: none; }
.rank-main { display: flex; align-items: center; gap: 10px; color: #111827; font-weight: 600; }
.rank-index { width: 22px; height: 22px; border-radius: 50%; background: #eaf1ff; color: #1e3a8a; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; }
.rank-count { color: #374151; font-weight: 700; }

.todo-list { padding: 12px 20px 16px; }
.todo-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px dashed #e5e7eb; }
.todo-item:last-child { border-bottom: none; }
.todo-title { color: #1f2937; font-weight: 600; }
.task-clickable { cursor: pointer; }

.recent-order-list { padding: 12px 20px 16px; }
.recent-order-item { display: flex; justify-content: space-between; align-items: center; padding: 11px 0; border-bottom: 1px dashed #e5e7eb; }
.recent-order-item:last-child { border-bottom: none; }
.recent-order-name { font-weight: 700; color: #111827; margin-bottom: 3px; }
.recent-order-sub { font-size: 12px; color: #6b7280; }

/* 页面通用布局 */
.standard-view { display: flex; flex-direction: column; gap: 20px; }
.filter-container { padding: 20px; }
.filter-wrapper { display: flex; align-items: center; gap: 20px; color: #606266; font-size: 14px; }
.filter-inputs { display: flex; gap: 10px; flex: 1; align-items: center;}
.el-input__inner { background-color: #fff; border: 1px solid #c7d2e1; border-radius: 4px; color: #1f2937; font-size: 14px; height: 32px; line-height: 32px; padding: 0 10px; outline: none; transition: 0.2s;}
.el-input__inner:focus { border-color: var(--el-color-primary); }
.multi-line { flex-direction: column; align-items: flex-start; }
.f-title { font-weight: bold; margin-bottom: 15px; display: flex; justify-content: space-between; width: 100%; align-items: center;}
.grid-inputs { display: grid; grid-template-columns: repeat(4, 1fr); width: 100%; gap: 15px; }
.f-item { display: flex; align-items: center; }
.f-item label { width: 80px; font-size: 13px; color: #606266; flex-shrink: 0;}
.f-item .el-input__inner { flex: 1; width: 100%; }

/* Buttons */
.el-button { display: inline-block; cursor: pointer; background: #fff; border: 1px solid #909399; color: #1f2937; text-align: center; padding: 8px 15px; font-size: 14px; border-radius: 4px; outline: none; transition: 0.2s;}
.el-button:hover { opacity: 0.85; }
.el-button.primary:hover { background-color: #163072; border-color: #163072; }
.el-button.primary { color: #1a1a2e; background-color: var(--el-color-primary); border-color: var(--el-color-primary); font-weight: 600; }
.el-button.default:hover { color: var(--el-color-primary); border-color: #c6e2ff; background-color: #ecf5ff; }
.el-button.text { border-color: transparent; background: transparent; padding-left: 0; padding-right: 0; margin: 0 5px; color: #1e3a8a; font-weight: 600;}
.el-button.text:hover { background: transparent; opacity: 0.6; }
.el-button.danger.text { color: #c0392b; font-weight: 600; }
.el-button.small { padding: 6px 12px; font-size: 12px; }

/* Table Container */
.operate-container { padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; font-size: 14px; background: #fff;}
.table-container { background: #fff; border: 1px solid var(--el-border-color-light); border-radius: 4px; padding-bottom: 10px; overflow: hidden;}
.shadow-card { box-shadow: 0 2px 12px 0 rgba(0,0,0,.05); }
.border-bottom { border-bottom: 1px solid var(--el-border-color-light); }
.table-responsive { overflow-x: auto; }
.library-box { margin: 10px 16px 4px; border: 1px dashed #c9d9f1; border-radius: 6px; padding: 10px 14px; background: #f8fbff; }
.library-title { font-size: 13px; color: #334155; font-weight: 700; margin-bottom: 8px; }
.library-list { display: flex; flex-direction: column; gap: 6px; }
.library-item { display: flex; justify-content: space-between; align-items: center; gap: 10px; }

.el-table { width: 100%; border-collapse: collapse; font-size: 14px; color: #374151; }
.el-table th { background-color: #eef3fb; padding: 12px 10px; border-bottom: 1px solid var(--el-border-color-light); color: #334155; font-weight: bold; text-align: left; white-space: nowrap;}
.el-table td { padding: 12px 10px; border-bottom: 1px solid var(--el-border-color-light); vertical-align: middle; }
.el-table tbody tr:hover { background-color: #f0f7ff; }

/* Tags */
.el-tag { display: inline-block; padding: 0 8px; line-height: 22px; font-size: 12px; color: var(--el-color-primary); background-color: #ecf5ff; border: 1px solid #d9ecff; border-radius: 4px; white-space: nowrap; }
.el-tag.success { background-color: #f0f9eb; border-color: #e1f3d8; color: var(--el-color-success); }
.el-tag.warning { background-color: #fdf6ec; border-color: #faecd8; color: var(--el-color-warning); }
.el-tag.danger { background-color: #fef0f0; border-color: #fde2e2; color: var(--el-color-danger); }
.el-tag.info { background-color: #f4f4f5; border-color: #e9e9eb; color: var(--el-color-info); }
.el-tag.mini { padding: 0 4px; line-height: 18px; font-size: 10px; }

/* Route List */
.route-list { padding: 0; margin: 0; list-style: none; }
.route-list li { padding: 15px 20px; border-bottom: 1px solid #ebeef5; display: flex; justify-content: space-between; align-items: center; transition: 0.2s;}
.route-list li:hover { background-color: #f5f7fa; }

/* ================= Dialog / Modal 真实表单 ================= */
.el-dialog__wrapper { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; justify-content: center; align-items: center; z-index: 2001; }
.el-dialog { background: #fff; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,.3); width: 500px; display: flex; flex-direction: column; animation: fadeIn 0.3s ease-out; }
.el-dialog__header { padding: 20px 20px 10px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; }
.el-dialog__title { font-size: 16px; color: #303133; font-weight: bold;}
.el-dialog__headerbtn { background: transparent; border: none; outline: none; cursor: pointer; font-size: 16px; color: #909399; }
.el-dialog__headerbtn:hover { color: var(--el-color-primary); }
.el-dialog__body { padding: 20px 30px; }
.el-dialog__footer { padding: 15px 20px; text-align: right; border-top: 1px solid #eee; background: #fafafa; border-radius: 0 0 6px 6px;}

.el-form-row { display: flex; gap: 16px; }
.el-form-item { display: flex; margin-bottom: 20px; align-items: center; }
.el-form-item label { width: 110px; text-align: right; font-size: 14px; color: #606266; padding-right: 12px; font-weight: bold; flex-shrink: 0; }
.el-form-item__label { width: 90px; text-align: right; font-size: 14px; color: #606266; padding-right: 15px; font-weight: bold; flex-shrink: 0;}
.el-form-item__content { flex: 1; }
.el-form-item__content .el-input__inner { height: 36px; width: 100%; border: 1px solid #dcdfe6; padding: 0 10px; border-radius: 4px; }
.el-form-item__content .el-input__inner:disabled { background: #f5f7fa; color: #c0c4cc; cursor: not-allowed; }
.text-area { min-height: 110px; line-height: 1.6; padding: 10px; resize: vertical; }
.news-preview-box { border: 1px solid #dbe7f5; background: #f8fbff; border-radius: 6px; padding: 12px; margin-top: 4px; }
.news-preview-title { font-weight: 700; color: #1e3a8a; margin-bottom: 8px; }
.news-preview-box p { margin: 0 0 6px; color: #334155; font-size: 13px; }
.news-preview-box a { color: #1e3a8a; font-size: 13px; text-decoration: underline; }

/* Message */
.el-message { min-width: 380px; border-radius: 4px; border: 1px solid #ebeef5; position: fixed; left: 50%; top: 20px; transform: translateX(-50%); transition: opacity .3s, transform .4s, top .4s; padding: 15px 15px 15px 20px; display: flex; align-items: center; z-index: 3000; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.el-message--success { background-color: #f0f9eb; border-color: #e1f3d8; color: var(--el-color-success); }
.el-message--error { background-color: #fef0f0; border-color: #fde2e2; color: var(--el-color-danger); }
.el-message--info { background-color: #f4f4f5; border-color: #e9e9eb; color: var(--el-color-info); }
.el-message i { margin-right: 10px; font-size: 16px; }
.el-message__content { font-size: 14px; line-height: 1; margin: 0; }
.el-message-fade-enter-active, .el-message-fade-leave-active { transition: opacity .3s, transform .3s; }
.el-message-fade-enter-from, .el-message-fade-leave-to { opacity: 0; transform: translate(-50%, -100%); }

/* 新增这个样式，让按钮垂直单列排布 */
.quick-link-column {
  padding: 16px 20px 20px;
  display: flex;
  flex-direction: column; /* 核心：让子元素垂直向下排成一列 */
  gap: 10px;             /* 按钮之间的间距 */
}

/* 确保按钮宽度能够撑满整列 */
.quick-link-column .quick-link-btn {
  width: 100%;
}

/* 确保最上方一行的三列 Flex 布局等高 */
.top-row {
  display: flex;
  align-items: stretch; /* 核心：让快捷入口、最新订单、数据指标三列等高 */
  gap: 20px;
  margin-bottom: 20px;  /* 与下方其他行板块拉开间距 */
}

/* 确保卡片完全填满列高度 */
.fill-height {
  height: 100%;
}

/* 控制最右侧四个小卡片板块的垂直排列布局 */
.stats-vertical-col {
  display: flex;
  flex-direction: column;   /* 核心：变更为垂直列排布 */
  justify-content: space-between; /* 让四个卡片在总高度内均匀留白分布 */
  gap: 10px;                /* 设置卡片之间的垂直缝隙 */
}

/* 稍微微调一下右侧小卡片的高度和内部间距，让其在紧凑排列下更精致 */
.stats-vertical-col .card-panel {
  flex: 1;                 /* 均匀分配高度 */
  height: auto;            /* 让高度自适应 Flex 约束 */
  padding: 10px 15px;       /* 适当缩减内边距 */
}

.stats-vertical-col .card-icon {
  font-size: 32px;         /* 适当缩小图标尺寸 */
  padding: 8px;
}

/* ================= 响应式媒体查询 ================= */
@media (max-width: 1200px) {
  .panel-group { flex-wrap: wrap; }
  .panel-col { flex: 0 0 50%; margin-bottom: 20px; }
  .grid-inputs { grid-template-columns: repeat(2, 1fr); }
  .flex-responsive { flex-direction: column; }
  .route-sidebar { flex: none; width: 100%; margin-bottom: 20px;}
  .main-table-col { flex: none; width: 100%; }
}
@media (max-width: 768px) {
  .panel-col { flex: 0 0 100%; }
  .grid-inputs { grid-template-columns: 1fr; }
  .sidebar-container { position: absolute; height: 100%; left: -210px; }
  .sidebar-container.collapsed { left: 0; width: 210px; } /* 移动端抽屉式侧边栏反转逻辑可按需调整，这里做简易处理 */
  .el-dialog { width: 90%; }
}
</style>