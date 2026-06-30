<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

// 💡 核心配置：一键切到你的 Python 后端 5000 端口
const API_BASE = 'http://127.0.0.1:5000/api'

// --- 用户状态与登录逻辑 ---
const isLoggedIn = ref(false)
const showLoginModal = ref(false)
const isRegisterMode = ref(false)
const loginMethod = ref('password') // 默认使用密码登录

const loginIdCard = ref('')    // 登录时填写的身份证号
const phoneNumber = ref('')     // 注册时填写的手机号
const userName = ref('')        // 注册时填写的用户名
const verifyCode = ref('')
const password = ref('')
const confirmPassword = ref('')
const formError = ref('') 
const regIdCard = ref('')       // 注册时填写的身份证号
const showPassword = ref(false)  // 密码显示/隐藏切换

// 身份证状态
const idCard = ref('') 
const showIdCardModal = ref(false)
const tempIdCardInput = ref('')
const tempNameInput = ref('') // 实名认证姓名

const currentUser = ref({ name: '乘客', level: '普通乘客', location: '中国·上海' })

// --- 搜索状态 ---
const departure = ref('')     // 后端要求传入城市/机场区域代码，如 SHA, PEK
const destination = ref('')   // 后端要求传入城市/机场区域代码
const travelDate = ref('2026-07-01')

// --- 页面切换逻辑 ---
const activeTab = ref('home') 

// --- 行程与航班实时数据 ---
const nextTrip = ref(null)
const historyFlights = ref([])
const flights = ref([])
const seasonInfo = ref({})
const loadingFlights = ref(false)
const errorMsg = ref('')

// --- 弹窗与协议 ---
const showAgreementModal = ref(false)
const showServiceToast = ref(false)
const toastMessage = ref('') 
const showBookingToast = ref(false)
const bookedFlight = ref(null)

// 热门资讯数据
const hotNews = ref([
  {
    id: 1,
    title: '2026年夏季航空出行预测：热门目的地TOP10出炉',
    summary: '随着暑期旅游旺季到来，航空出行需求大幅攀升。三亚、成都、昆明等城市成为热门目的地…',
    icon: 'fas fa-fire',
    color: '#f97316',
    url: 'https://www.caacnews.com.cn/',
    date: '2026-06-25'
  },
  {
    id: 2,
    title: '民航局发布新版旅客服务规范，退改签更便捷',
    summary: '新版规范进一步简化退改签流程，旅客通过航司官方渠道可一键完成操作，资金到账时间缩短50%…',
    icon: 'fas fa-file-alt',
    color: '#3b82f6',
    url: 'https://www.caac.gov.cn/',
    date: '2026-06-20'
  },
  {
    id: 3,
    title: '国产大飞机C919执飞航线突破50条，覆盖主要城市',
    summary: '截至6月底，C919已累计商业运行超过1万小时，旅客运输量突破百万人次，准点率高达95%…',
    icon: 'fas fa-rocket',
    color: '#10b981',
    url: 'https://www.comac.cc/',
    date: '2026-06-18'
  },
  {
    id: 4,
    title: 'DS航空联合多家航司推出暑期学生专属优惠',
    summary: '全日制在校学生凭有效证件可享受机票8折优惠，国际航线更有额外行李额度赠送…',
    icon: 'fas fa-graduation-cap',
    color: '#8b5cf6',
    url: 'https://www.example.com/',
    date: '2026-06-15'
  }
])

const openNewsUrl = (url) => {
  window.open(url, '_blank')
}

// 通用提示弹窗方法
const showToast = (msg) => {
  toastMessage.value = msg
  showServiceToast.value = true
  setTimeout(() => { showServiceToast.value = false }, 2000)
}

// 手机号与身份证脱敏
const maskedPhone = computed(() => phoneNumber.value ? phoneNumber.value.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '')
const maskedIdCard = computed(() => idCard.value ? idCard.value.replace(/^(.{6})(.*)(.{4})$/, '$1********$3') : '')

// 过滤航班（适配新后端结构字段：flight_no 代替 number）
const filteredFlights = computed(() => {
  return flights.value
})

// --- 1. 联合查询航班数据 (精密对齐后端 GET /api/search_flight) ---
const handleSearchFlights = async () => {
  try {
    loadingFlights.value = true
    errorMsg.value = ''
    const response = await axios.get(`${API_BASE}/search_flight`, {
      params: {
        start_city: departure.value,
        end_city: destination.value,
        fly_date: travelDate.value,
        id_card: idCard.value || ''
      }
    })
    
    if (response.data.code === 200) {
      flights.value = response.data.data || []
      seasonInfo.value = response.data.extra || {}
      if (!isAutoLoad) {
        activeTab.value = 'flights'}
    } else {
      errorMsg.value = response.data.msg || '加载航班失败'
    }
  } catch (error) {
    console.error('加载航班异常:', error)
    errorMsg.value = '暂无航班'
  } finally {
    loadingFlights.value = false
  }
}

// 页面初始化时自动查一次
onMounted(() => {
  handleSearchFlights(true)
})

// --- 2. 注册与登录功能 (身份证登录+手机号注册) ---
const handleLogin = async () => {
  console.log('【调试】handleLogin 被调用, isRegisterMode=', isRegisterMode.value)
  formError.value = ''

  // 登录模式：校验身份证号
  if (!isRegisterMode.value) {
    if (!loginIdCard.value || loginIdCard.value.length !== 18) {
      formError.value = '请输入18位身份证号码'
      return
    }
    if (!password.value) {
      formError.value = '请输入密码'
      return
    }

    try {
      const response = await axios.post(`${API_BASE}/login`, {
        id_card: loginIdCard.value,
        password: password.value
      })

        if (response.data.code === 200) {
        isLoggedIn.value = true
        showLoginModal.value = false
        const uData = response.data.data

        if (uData.id_card && !uData.id_card.startsWith('REG_')) {
          idCard.value = uData.id_card
          currentUser.value.name = uData.name
        } else {
          idCard.value = ''
          currentUser.value.name = '新乘客'
        }
        currentUser.value.level = uData.vip_level + '会员'
        phoneNumber.value = uData.phone || ''
        showToast(`欢迎回来，${currentUser.value.name}`)
        loadMyTickets()
        handleSearchFlights()
      } else {
        formError.value = response.data.msg || '登录失败'
      }
    } catch (error) {
      formError.value = '连接后端失败，请检查数据库配置'
    }
    return
  }

  // 注册模式：校验手机号
  if (!/^\d{11}$/.test(phoneNumber.value)) {
    formError.value = '请输入正确的11位手机号码'
    return
  }

  if (isRegisterMode.value) {
  console.log('【注册调试】进入注册分支, phone=', phoneNumber.value, 'idCard=', idCard.value)
    if (!userName.value || userName.value.trim().length < 2) {
      formError.value = '请输入用户名（至少2个字符）'
      return
    }
    if (!idCard.value || idCard.value.length !== 18) {
      formError.value = '请输入18位身份证号码'
      return
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z]).{8,}$/.test(password.value)) {
      formError.value = '密码至少8位，且必须包含大写和小写字母'
      return
    }
    if (password.value !== confirmPassword.value) {
      formError.value = '两次输入的密码不一致'
      return
    }
    
    console.log('【注册调试】开始注册流程...', { phone: phoneNumber.value, id_card: idCard.value })
    try {
      console.log('【注册调试】发送注册请求...', API_BASE + '/register')
      const response = await axios.post(`${API_BASE}/register`, {
        phone: phoneNumber.value,
        password: password.value,
        id_card: idCard.value,
        name: userName.value
      })
      
      console.log('【注册调试】收到响应:', JSON.stringify(response.data))
      if (response.data.code === 200) {
        showToast('注册成功！请直接登录。')
        isRegisterMode.value = false
      } else {
        formError.value = response.data.msg || '注册失败'
      }
    } catch (error) {
      console.error('【注册调试】请求异常:', error.message || error)
      if (error.response?.data?.msg) {
        formError.value = error.response.data.msg
      } else {
        formError.value = '注册失败，请确认后端 Flask 服务（5000端口）已启动'
      }
    }

  } else {
    if (!password.value) {
      formError.value = '请输入密码'
      return
    }
    
    try {
      const response = await axios.post(`${API_BASE}/login`, {
        phone: phoneNumber.value,
        password: password.value
      })
      
      if (response.data.code === 200) {
        isLoggedIn.value = true
        showLoginModal.value = false
        const uData = response.data.data
        
        if (uData.id_card && !uData.id_card.startsWith('REG_')) {
          idCard.value = uData.id_card
          currentUser.value.name = uData.name
        } else {
          idCard.value = ''
          currentUser.value.name = '新乘客'
        }
        currentUser.value.level = uData.vip_level + '会员'
        showToast(`欢迎回来，${currentUser.value.name}`)
        loadMyTickets() 
      } else {
        formError.value = response.data.msg || '手机号或密码错误'
      }
    } catch (error) {
      formError.value = '连接后端失败，请检查数据库配置'
    }
  }
}

const isChangeMode = ref(false)
const changeTicket = ref(null)

const loadMyTickets = async () => {
  if (!idCard.value) return
  try {
    const response = await axios.get(`${API_BASE}/my_ticket`, { params: { id_card: idCard.value } })
    if (response.data.code === 200) {
      historyFlights.value = response.data.data.map(t => ({
        id: t.ticket_id,
        flight: t.flight_no,
        cabin: t.cabin_level,
        from: t.dep_city_name || '',
        to: t.arr_city_name || '',
        dep_city: t.dep_city_name || '',
        arr_city: t.arr_city_name || '',
        dep_airport: t.dep_airport || '',
        arr_airport: t.arr_airport || '',
        depart_time: (t.depart_time_actual || t.depart_time || '').substring(0,5),
        fly_date: t.fly_date,
        date: t.fly_date ? t.fly_date.slice(0, 10).replace(/-/g, '/') : '',
        status: t.ticket_status,
        price: t.real_price,
        dep_city_code: t.dep_city_code || '',
        arr_city_code: t.arr_city_code || ''
      }))
    }
  } catch (e) { console.error(e) }
}

const handleBindIdCard = async () => {
  if (tempIdCardInput.value.length === 18 && tempNameInput.value.trim()) {
    try {
      idCard.value = tempIdCardInput.value
      currentUser.value.name = tempNameInput.value
      showIdCardModal.value = false
      showToast('实名认证成功！')
      loadMyTickets()
    } catch (e) { showToast('身份认证失败') }
  } else {
    showToast('请完整输入姓名和18位身份证号')
  }
}

const showBookModal = ref(false)
const bookFlight = ref(null)
const selectedCabin = ref('')

const openBookModal = (flight) => {
  if (!isLoggedIn.value) { showLoginModal.value = true; isRegisterMode.value = false; return }
  if (!idCard.value) { showIdCardModal.value = true; return }
  bookFlight.value = flight
  selectedCabin.value = ''
  showBookModal.value = true
}

const handleBookConfirm = async () => {
  if (!selectedCabin.value) { showToast('请选择舱位'); return }
  const f = bookFlight.value
  if (!f || !f.cabins) return
  const cabin = f.cabins.find(c => c.cabin_level === selectedCabin.value)
  if (!cabin) { showToast('所选舱位不可用'); return }
  try {
    const response = await axios.post(API_BASE + '/buy_ticket', {
      id_card: idCard.value,
      flight_no: f.flight_no,
      fly_date: f.fly_date || travelDate.value,
      cabin_level: cabin.cabin_level,
      real_price: cabin.real_price
    })
    if (response.data.code === 200) {
      bookedFlight.value = f
      showBookModal.value = false
      showBookingToast.value = true
      loadMyTickets()
      handleSearchFlights()
      setTimeout(() => { showBookingToast.value = false }, 3000)
    } else {
      showToast(response.data.msg || '购票失败')
    }
  } catch (error) {
    showToast('购票失败：' + (error.response?.data?.msg || '余票不足或重复购票'))
  }
}

const handleBook = async (flight) => {
  openBookModal(flight)
}

const _oldBook = async (flight) => {
  try {
    const response = await axios.post(`${API_BASE}/buy_ticket`, {
      id_card: idCard.value,
      flight_no: flight.flight_no,
      fly_date: travelDate.value,
      cabin_level: '经济舱', 
      real_price: flight.standard_price || 1280.00
    })

    if (response.data.code === 200) {
      bookedFlight.value = flight
      showBookingToast.value = true
      loadMyTickets() 
      handleSearchFlights() 
      setTimeout(() => { showBookingToast.value = false }, 3000)
    } else {
      showToast(response.data.msg || '抢票失败')
    }
  } catch (error) {
    showToast('购票失败，配额不足或存在超卖风险')
  }
}

const handleRefund = async (ticketId) => {
  if (!confirm('是否确定退票？')) return
  try {
    const response = await axios.post(`${API_BASE}/refund_ticket`, { ticket_id: ticketId })
    if (response.data.code === 200) {
      showToast('退票成功！')
      loadMyTickets()
      handleSearchFlights()
    } else {
      showToast(response.data.msg || '退票失败')
    }
  } catch (error) {
    showToast('退票异常，请联系系统管理员')
  }
}

const openChangeMode = (ticket) => {
  changeTicket.value = ticket
  departure.value = ticket.dep_city || ticket.from || ticket.dep_city_code || ''
  destination.value = ticket.arr_city || ticket.to || ticket.arr_city_code || ''
  travelDate.value = ''
  isChangeMode.value = true
  activeTab.value = 'flights'
  handleSearchFlights()
}

const cancelChangeMode = () => {
  isChangeMode.value = false
  changeTicket.value = null
  departure.value = ''
  destination.value = ''
  travelDate.value = ''
  activeTab.value = 'home'
  handleSearchFlights()
}

const handleRebookConfirm = async (flight) => {
  if (!changeTicket.value) return
  try {
    const response = await axios.post(API_BASE + '/change_ticket', {
      ticket_id: changeTicket.value.id,
      new_flight_no: flight.flight_no,
      new_fly_date: flight.fly_date || travelDate.value
    })
    if (response.data.code === 200) {
      showToast('改签成功！')
      isChangeMode.value = false
      changeTicket.value = null
      travelDate.value = ''
      loadMyTickets()
      handleSearchFlights()
    } else {
      showToast(response.data.msg || '改签失败')
    }
  } catch (error) {
    showToast('改签异常：' + (error.response?.data?.msg || error.message))
  }
}

const handleLogout = () => {
  isLoggedIn.value = false
  idCard.value = ''
  activeTab.value = 'home'
}

const swapLocations = () => {
  const temp = departure.value
  departure.value = destination.value
  destination.value = temp
}

const switchAuthMode = (isReg) => {
  isRegisterMode.value = isReg
  formError.value = ''
  loginIdCard.value = ''
  userName.value = ''
  phoneNumber.value = ''
  password.value = ''
  confirmPassword.value = ''
  idCard.value = ''
  verifyCode.value = ''
}

const handleServiceClick = () => {
  showToast('该服务正在全速排期中，敬请期待！')
}
</script>

<template>
  <div class="airline-app">
    <nav class="side-nav">
      <div class="logo">
        <i class="fas fa-paper-plane"></i>
        <span>DS航空</span>
      </div>
      <div class="menu-list">
        <button :class="{ active: activeTab === 'home' }" @click="activeTab = 'home'">
          <i class="fas fa-th-large"></i> 概览
        </button>
        <button :class="{ active: activeTab === 'flights' }" @click="activeTab = 'flights'">
          <i class="fas fa-plane"></i> 航班查询
        </button>
        <button :class="{ active: activeTab === 'orders' }" @click="activeTab = 'orders'">
          <i class="fas fa-user"></i> 行程记录
        </button>
        <button :class="{ active: activeTab === 'profile' }" @click="activeTab = 'profile'">
          <i class="fas fa-cog"></i> 系统设置
        </button>
      </div>
    </nav>

    <main class="main-body">
      <header class="top-header">
        <div class="header-left">
           <div class="search-bar-mini">
             <i class="fas fa-search"></i>
             <input type="text" placeholder="搜索全球航班信息...">
           </div>
        </div>
        <div class="user-actions">
          <div class="location-tag">
            <i class="fas fa-location-dot"></i> {{ currentUser.location }}
          </div>
          <template v-if="!isLoggedIn">
            <div class="auth-btns">
              <button class="btn-login-outline" @click="showLoginModal = true; switchAuthMode(false)">登录</button>
              <button class="btn-register-solid" @click="showLoginModal = true; switchAuthMode(true)">注册</button>
              <a href="/admin" class="btn-admin-entry" title="管理员后台">🔧</a>
            </div>
          </template>
          <template v-else>
            <div class="user-profile" @click="activeTab = 'profile'">
              <div class="user-info">
                <span class="u-name">{{ currentUser.name }}</span>
                <span class="u-level">{{ currentUser.level }}</span>
              </div>
              <div class="avatar-circle">A</div>
            </div>
          </template>
        </div>
      </header>

      <div class="content-scroll">
        
        <section v-if="activeTab === 'home' || activeTab === 'flights'" class="search-section card-shadow">
          <div class="search-title">你想去哪里？</div>
          <div class="search-container">
            <div class="loc-input">
              <input v-model="departure" type="text" placeholder="出发地" :disabled="isChangeMode">
              <div class="swap-icon" @click="swapLocations">
                <i class="fas fa-exchange-alt"></i>
              </div>
              <input v-model="destination" type="text" placeholder="到达地" :disabled="isChangeMode">
            </div>
            <div class="date-input">
              <input v-model="travelDate" type="date">
            </div>
            <button class="btn-search-main" @click="handleSearchFlights">查询</button>
          </div>
        </section>

        <div v-if="activeTab === 'home'" class="view-home">
          <h4 class="section-label">快捷服务</h4>
          <div class="service-grid">
            <div class="service-item" @click="handleServiceClick"><i class="fas fa-utensils color-orange"></i><span>航空订餐</span></div>
            <div class="service-item" @click="handleServiceClick"><i class="fas fa-chair color-blue"></i><span>预定接机</span></div>
            <div class="service-item" @click="handleServiceClick"><i class="fas fa-car color-pink"></i><span>租车约车</span></div>
            <div class="service-item" @click="handleServiceClick"><i class="fas fa-shield-halved color-green"></i><span>行程保险</span></div>
            <div class="service-item" @click="handleServiceClick"><i class="fas fa-book color-yellow"></i><span>乘机指南</span></div>
          </div>

          <h4 class="section-label" style="margin-top: 30px;">热门资讯</h4>
          <div class="news-grid">
            <div v-for="news in hotNews" :key="news.id" class="news-card card-shadow" @click="openNewsUrl(news.url)">
              <div class="news-icon-wrap" :style="{ background: news.color + '15' }">
                <i :class="news.icon" :style="{ color: news.color }"></i>
              </div>
              <div class="news-content">
                <div class="news-title">{{ news.title }}</div>
                <div class="news-summary">{{ news.summary }}</div>
                <div class="news-meta">
                  <span class="news-date"><i class="far fa-clock"></i> {{ news.date }}</span>
                  <span class="news-link">阅读全文 <i class="fas fa-arrow-right"></i></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'flights'" class="view-flights">
          <h4 class="section-label">实时航班详情</h4>
          
          <div v-if="loadingFlights" class="no-flights-msg card-shadow">
            <i class="fas fa-spinner fa-spin"></i>
            <p>正在努力从云端捞取航班数据...</p>
          </div>
          
          <div v-else-if="filteredFlights.length === 0" class="no-flights-msg card-shadow">
            <i class="fas fa-plane-slash"></i>
            <p>{{ errorMsg || '暂时没有符合条件的航班，换个日期试试吧' }}</p>
          </div>
          
          <div v-else class="flight-list">
            <div v-for="f in filteredFlights" :key="f.flight_no" class="flight-ticket-modern card-shadow">
              <div class="t-top">
                <div class="airline-info">
                  <img src="https://img.icons8.com/color/48/airplane-mode-on.png" width="20"/>
                  <span>云川航空 · {{ f.flight_no }}</span>
                  <span class="aircraft-badge">{{ f.plane_model }}</span>
                </div>
              </div>
              <div class="t-mid">
                <div class="time-block">
                  <h3>{{ (f.depart_time || '').substring(0,5) }}</h3>
                  <p>{{ f.dep_airport || f.dep_city || '-' }}</p>
                </div>
                <div class="duration-block">
                  <span>F:<span :style="f.first_remain != null && f.first_remain < 10 ? 'color:#e74c3c;font-weight:700' : ''">{{ f.first_remain ?? '-' }}</span><span v-if="f.first_remain != null && f.first_remain < 10" style="color:#e74c3c;font-size:10px;"> 紧张</span> / Y:<span :style="f.economy_remain != null && f.economy_remain < 10 ? 'color:#e74c3c;font-weight:700' : ''">{{ f.economy_remain ?? '-' }}</span><span v-if="f.economy_remain != null && f.economy_remain < 10" style="color:#e74c3c;font-size:10px;"> 紧张</span></span>
                  <div v-if="f.stopovers" style="font-size:11px;color:#e67e22;text-align:center;">经停: {{ f.stopovers }}</div><div class="arrow-line"><i class="fas fa-chevron-right"></i></div>
                </div>
                <div class="time-block text-right">
                  <h3>{{ (f.arrive_time || '').substring(0,5) }}</h3>
                  <p>{{ f.arr_airport || f.arr_city || '-' }}</p>
                </div>
              </div>
              <div class="t-bottom">
                <div class="price-area">
                  <div v-for="cabin in f.cabins" :key="cabin.cabin_level" style="margin-right:12px;">
                    <span class="price-tag">{{ cabin.cabin_level }}</span>
                    <span class="currency">¥</span>
                    <span v-if="cabin.real_price !== cabin.seasonal_price" class="amount" style="text-decoration:line-through;color:#94a3b8;font-size:13px;margin-right:4px;">{{ cabin.seasonal_price }}</span>
                    <span class="amount" style="color:#e74c3c;font-weight:700;">{{ cabin.real_price }}</span>
                  </div>
                  <span v-if="f.discount_rate < 1" style="font-size:11px;color:#e67e22;">({{ f.user_vip }}{{ Math.round(f.discount_rate*100) }}折)</span>
                </div>
                <button class="btn-book-now" @click="isChangeMode ? handleRebookConfirm(f) : openBookModal(f)" :style="isChangeMode ? {background:'#f59e0b'} : {}">{{ isChangeMode ? '改签到此航班' : '预订' }}</button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'orders'" class="view-profile">
          <h4 class="section-label">我的行程记录</h4>

          <div v-if="isLoggedIn" class="history-list">
            <div v-if="historyFlights.length === 0" class="no-flights-msg card-shadow">暂无行程订单</div>
            <div v-for="h in historyFlights" :key="h.id" class="history-card card-shadow">
              <div class="h-date">
                <div style="font-size:14px;font-weight:700;color:#1e293b;">{{ h.date }}</div>
                <div style="font-size:12px;color:#38bdf8;">{{ h.depart_time }}</div>
              </div>
              <div class="h-route">
                <strong>{{ h.flight }}</strong>
                <span style="font-size:12px;color:#64748b;">{{ h.dep_airport }} → {{ h.arr_airport }}</span>
                <span style="font-size:12px;color:#64748b;">{{ h.cabin || '' }} · ¥{{ h.price || '-' }}</span>
              </div>
              
              <div class="h-status" :class="{ 'status-green': h.status === '已完成', 'status-blue': h.status === '已支付', 'status-red': h.status === '已退票'|| h.status === '航班取消', 'status-orange': h.status === '已改签' }">
                {{ h.status }}
                
                <button v-if="h.status === '已支付'" class="btn-refund" @click.stop="handleRefund(h.id)">退票</button>
                <button v-if="h.status === '已支付'" class="btn-refund" style="border-color:#38bdf8;color:#38bdf8;" @click.stop="openChangeMode(h)">改签</button>
              </div>
            </div>
          </div>

          <div v-else class="settings-card card-shadow text-center">
             <div class="unauth-icon"><i class="fas fa-file-invoice"></i></div>
             <p class="unauth-text">请登录后查看行程记录</p>
             <button class="btn-login-main" style="width: 200px; margin: 0 auto;" @click="showLoginModal = true; switchAuthMode(false)">立即登录</button>
          </div>
        </div>

        <div v-if="activeTab === 'profile'" class="view-settings">
          <h4 class="section-label">系统设置与实名认证</h4>
          <div v-if="isLoggedIn" class="settings-card card-shadow">
             <div class="info-row">
               <label>旅客姓名</label>
               <span>{{ currentUser.name }}</span>
             </div>
             <div class="info-row">
               <label>联系电话</label>
               <span>已绑定 ({{ maskedPhone }})</span>
             </div>
             <div class="info-row">
               <label>安全实名认证</label>
               <span v-if="idCard">已绑定({{ maskedIdCard }})</span>
               <span v-else class="unbound-text">
                 未实名认证 
                 <button class="btn-bind-small" @click="showIdCardModal = true">去认证</button>
               </span>
             </div>
             <button class="btn-logout" @click="handleLogout">退出登录</button>
          </div>
          <div v-else class="settings-card card-shadow text-center">
             <div class="unauth-icon"><i class="fas fa-lock"></i></div>
             <p class="unauth-text">请登录后查看系统设置</p>
             <button class="btn-login-main" style="width: 200px; margin: 0 auto;" @click="showLoginModal = true; switchAuthMode(false)">立即登录</button>
          </div>
        </div>
      </div>
    </main>

    <div v-if="showLoginModal" class="modal-overlay">
      <div class="login-card-modern">
        <div class="login-header">
          <h3>{{ isRegisterMode ? '加入航司会员' : '旅客快捷登录' }}</h3>
          <p>{{ isRegisterMode ? '注册' : '请输入身份证号登录' }}</p>
        </div>

        <!-- 登录模式：身份证号码 -->
        <div class="input-group-modern" v-if="!isRegisterMode">
          <label>身份证号码</label>
          <input v-model="loginIdCard" type="text" placeholder="请输入18位身份证号" maxlength="18">
        </div>
        <!-- 注册模式：联系电话 -->
        <div class="input-group-modern" v-if="isRegisterMode">
          <label>联系电话</label>
          <input v-model="phoneNumber" type="tel" placeholder="请输入11位手机号" maxlength="11">
        </div>

        <div class="input-group-modern" v-if="!isRegisterMode">
          <label>登录密码</label>
          <div class="password-wrap">
            <input v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="请输入密码">
            <button type="button" class="btn-toggle-pwd" @click="showPassword = !showPassword">
              <i :class="showPassword ? 'fas fa-eye' : 'fas fa-eye-slash'"></i>
            </button>
          </div>
        </div>

        <div class="input-group-modern" v-if="isRegisterMode">
          <label>姓名</label>
          <input v-model="userName" type="text" placeholder="请输入您的真实姓名" maxlength="20">
        </div>

        <div class="input-group-modern" v-if="isRegisterMode">
          <label>身份证号码</label>
          <input v-model="idCard" type="text" placeholder="请输入18位身份证号" maxlength="18">
        </div>

        <div class="input-group-modern" v-if="isRegisterMode">
          <label>登录密码</label>
          <div class="password-wrap">
            <input v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="请输入密码">
            <button type="button" class="btn-toggle-pwd" @click="showPassword = !showPassword">
              <i :class="showPassword ? 'fas fa-eye' : 'fas fa-eye-slash'"></i>
            </button>
          </div>
        </div>

        <div class="input-group-modern" v-if="isRegisterMode">
          <label>确认密码</label>
          <input v-model="confirmPassword" :type="showPassword ? 'text' : 'password'" placeholder="请再次确认密码">
        </div>

        <div v-if="formError" class="error-msg">
          <i class="fas fa-exclamation-circle"></i> {{ formError }}
        </div>

        <button class="btn-login-main" @click="handleLogin">{{ isRegisterMode ? '立即注册并同步' : '登录' }}</button>
        
        <div class="auth-switch">
          <span v-if="!isRegisterMode">还没有账户？ <a @click="switchAuthMode(true)">点击注册</a></span>
          <span v-else>已有账户？ <a @click="switchAuthMode(false)">返回登录</a></span>
        </div>
        <div class="admin-entry">
          <a href="/admin" style="font-size:12px;color:#94a3b8;">管理员入口 →</a>
        </div>
        <button class="btn-cancel-flat" @click="showLoginModal = false">取消</button>
      </div>
    </div>

    <!-- 预订舱位选择弹窗 -->
    <div v-if="showBookModal" class="modal-overlay" @click.self="showBookModal = false">
      <div class="login-card-modern">
        <div class="login-header">
          <h3>选择舱位</h3>
          <p>{{ bookFlight?.flight_no }} · {{ bookFlight?.dep_airport }} → {{ bookFlight?.arr_airport }}</p>
        </div>
        <div v-for="cabin in bookFlight?.cabins" :key="cabin.cabin_level" 
             class="input-group-modern" 
             style="padding:12px;border:2px solid #e2e8f0;border-radius:12px;cursor:pointer;margin-bottom:10px;" 
             :style="{borderColor: selectedCabin === cabin.cabin_level ? '#38bdf8' : '#e2e8f0'}"
             @click="selectedCabin = cabin.cabin_level">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-weight:700;">{{ cabin.cabin_level }}</span>
            <span>
              <span v-if="cabin.real_price !== cabin.seasonal_price" style="text-decoration:line-through;color:#94a3b8;font-size:13px;margin-right:6px;">¥{{ cabin.seasonal_price }}</span>
              <span style="color:#e74c3c;font-size:18px;font-weight:700;">¥{{ cabin.real_price }}</span>
            </span>
          </div>
        </div>
        <button class="btn-login-main" @click="handleBookConfirm">确认预订</button>
        <button class="btn-cancel-flat" @click="showBookModal = false">取消</button>
      </div>
    </div>

        <!-- 改签模式遮罩（复用航班查询页面） -->
    <div v-if="isChangeMode" style="position:fixed;top:0;left:0;right:0;z-index:1000;background:#fff3cd;padding:8px 20px;display:flex;align-items:center;justify-content:space-between;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
      <span><i class="fas fa-exchange-alt"></i> <b>改签模式</b>：{{ changeTicket?.dep_city }} → {{ changeTicket?.arr_city }}（原航班 {{ changeTicket?.flight }}）</span>
      <button class="btn-refund" style="border-color:#94a3b8;color:#64748b;" @click="cancelChangeMode">取消改签</button>
    </div>

        <div v-if="showIdCardModal" class="modal-overlay">
      <div class="login-card-modern" style="padding-bottom: 30px;">
        <div class="login-header">
          <h3>实名认证</h3>
          <p>根据民航局规定，预订机票前需补充乘机人身份信息</p>
        </div>
        <div class="input-group-modern" style="margin-bottom: 15px;">
          <label>真实姓名</label>
          <input v-model="tempNameInput" type="text" placeholder="请输入乘机人姓名">
        </div>
        <div class="input-group-modern">
          <label>身份证号码</label>
          <input v-model="tempIdCardInput" type="text" placeholder="请输入18位二代身份证号" maxlength="18">
        </div>
        <button class="btn-login-main" @click="handleBindIdCard">确认绑定</button>
        <button class="btn-cancel-flat" @click="showIdCardModal = false">暂不绑定</button>
      </div>
    </div>

    <Transition name="fade">
      <div v-if="showBookingToast" class="booking-toast">
        <i class="fas fa-check-circle"></i>
        <span>预订成功！</span>
      </div>
    </Transition>
    
    <Transition name="fade">
      <div v-if="showServiceToast" class="booking-toast toast-warning">
        <i class="fas fa-info-circle"></i>
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* 保持你炫酷的前端原样式不变 */
.airline-app { display: flex; height: 100vh; background: #f4f7fa; color: #2d3436; font-family: sans-serif; }
.card-shadow { background: #fff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
.side-nav { width: 240px; background: #1e293b; color: #fff; padding: 30px 0; display: flex; flex-direction: column; }
.logo { padding: 0 30px 40px; font-size: 1.5rem; font-weight: 800; color: #38bdf8; display: flex; gap: 12px; align-items: center; }
.menu-list { flex: 1; padding: 0 15px; }
.menu-list button { width: 100%; text-align: left; padding: 14px 20px; border: none; background: none; border-radius: 12px; cursor: pointer; transition: 0.3s; color: #94a3b8; font-size: 1rem; margin-bottom: 8px; display: flex; gap: 12px; align-items: center; }
.menu-list button.active { background: #38bdf8; color: #fff; box-shadow: 0 4px 12px rgba(56, 189, 248, 0.3); }
.main-body { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.top-header { height: 80px; background: #fff; padding: 0 40px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; }
.search-bar-mini { background: #f1f5f9; padding: 10px 20px; border-radius: 30px; display: flex; gap: 10px; align-items: center; width: 300px; }
.search-bar-mini input { border: none; background: none; outline: none; font-size: 14px; width: 100%; }
.user-actions { display: flex; align-items: center; gap: 24px; }
.location-tag { color: #64748b; font-size: 14px; display: flex; gap: 6px; align-items: center; }
.btn-login-outline { padding: 8px 20px; border: 1.5px solid #38bdf8; color: #38bdf8; border-radius: 8px; background: none; cursor: pointer; font-weight: 600; }
.btn-register-solid { padding: 8px 20px; border: none; background: #38bdf8; color: #fff; border-radius: 8px; cursor: pointer; font-weight: 600; margin-left: 10px; }
.user-profile { display: flex; align-items: center; gap: 12px; cursor: pointer; }
.user-info { text-align: right; }
.u-name { display: block; font-weight: 700; font-size: 14px; }
.u-level { font-size: 12px; color: #fbbf24; }
.avatar-circle { width: 40px; height: 40px; background: #38bdf8; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; }
.content-scroll { flex: 1; padding: 30px 40px; overflow-y: auto; display: flex; flex-direction: column; }
.search-section { padding: 30px; margin-bottom: 40px; border-top: 4px solid #38bdf8; flex-shrink: 0; }
.search-title { font-size: 1.2rem; font-weight: 700; margin-bottom: 20px; }
.search-container { display: flex; gap: 20px; align-items: center; }
.loc-input { flex: 2; display: flex; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 5px 15px; }
.loc-input input { flex: 1; border: none; background: none; padding: 12px; font-size: 18px; font-weight: 600; outline: none; text-align: center; }
.swap-icon { padding: 10px; color: #38bdf8; cursor: pointer; transition: 0.3s; }
.date-input { flex: 1; }
.date-input input { width: 100%; padding: 14px; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 16px; background: #f8fafc; }
.btn-search-main { flex: 0.5; padding: 15px 30px; background: #38bdf8; color: #fff; border: none; border-radius: 12px; font-size: 18px; font-weight: 700; cursor: pointer; transition: 0.2s; }
.service-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 20px; margin-bottom: 40px; flex-shrink: 0; }
.service-item { background: #fff; padding: 25px 15px; border-radius: 16px; display: flex; flex-direction: column; align-items: center; gap: 12px; cursor: pointer; transition: 0.3s; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
.service-item:hover { transform: translateY(-5px); box-shadow: 0 10px 25px rgba(0,0,0,0.06); }
.service-item i { font-size: 1.8rem; }
.color-orange { color: #f97316; } .color-blue { color: #3b82f6; } .color-pink { color: #ec4899; } .color-green { color: #10b981; } .color-yellow { color: #eab308; }
.no-flights-msg { text-align: center; padding: 60px 0; color: #94a3b8; border-radius: 16px; margin-bottom: 40px; font-weight: bold;}
.flight-ticket-modern { margin-bottom: 20px; transition: 0.3s; }
.t-top { padding: 12px 25px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; font-size: 13px; color: #64748b; }
.aircraft-badge { background: #f1f5f9; padding: 2px 8px; border-radius: 4px; margin-left: 10px; }
.t-mid { padding: 25px; display: flex; align-items: center; justify-content: space-between; }
.time-block h3 { font-size: 24px; font-weight: 800; margin-bottom: 5px; }
.duration-block { text-align: center; color: #94a3b8; font-size: 12px; flex: 1; padding: 0 40px; }
.arrow-line { height: 1px; background: #e2e8f0; width: 100%; position: relative; margin-top: 8px; }
.arrow-line i { position: absolute; right: -2px; top: -6px; font-size: 12px; color: #cbd5e1; }
.t-bottom { padding: 15px 25px; background: #fafafa; display: flex; justify-content: space-between; align-items: center; }
.price-area { display: flex; align-items: baseline; gap: 4px; }
.price-tag { background: #fee2e2; color: #ef4444; padding: 2px 6px; border-radius: 4px; font-size: 11px; margin-right: 8px; font-weight: 700; }
.amount { font-size: 28px; font-weight: 800; color: #ef4444; }
.btn-book-now { background: #38bdf8; color: #fff; border: none; padding: 10px 30px; border-radius: 30px; font-weight: 700; cursor: pointer; }
.news-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 40px; }
.news-card { padding: 20px; display: flex; gap: 16px; cursor: pointer; transition: 0.3s; border-left: 4px solid transparent; }
.news-card:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(56,189,248,0.15); }
.news-icon-wrap { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 1.2rem; }
.news-content { flex: 1; min-width: 0; }
.news-title { font-size: 15px; font-weight: 700; color: #1e293b; margin-bottom: 6px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.news-summary { font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 10px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.news-meta { display: flex; justify-content: space-between; align-items: center; font-size: 12px; }
.news-date { color: #94a3b8; }
.news-link { color: #38bdf8; font-weight: 600; }
.settings-card { padding: 10px 40px 40px; margin-bottom: 40px; }
.info-row { display: flex; justify-content: space-between; align-items: center; padding: 25px 0; border-bottom: 1px solid #f1f5f9; }
.btn-logout { width: 100%; padding: 15px; background: #fee2e2; color: #ef4444; border: none; border-radius: 12px; font-weight: 700; font-size: 16px; cursor: pointer; margin-top: 20px; }
.unauth-icon { font-size: 3rem; color: #cbd5e1; margin-bottom: 20px; padding-top: 30px; }
.unauth-text { color: #64748b; font-weight: 600; margin-bottom: 30px; }
.btn-bind-small { background: #38bdf8; color: #fff; border: none; padding: 4px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; margin-left: 10px; font-weight: 600; }
.modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 2000; }
.login-card-modern { background: #fff; width: 400px; padding: 40px; border-radius: 24px; box-shadow: 0 25px 50px rgba(0,0,0,0.15); }
.login-header h3 { font-size: 1.6rem; font-weight: 800; margin-bottom: 8px; }
.login-header p { color: #64748b; margin-bottom: 25px; font-size: 14px; }
.input-group-modern { margin-bottom: 20px; }
.input-group-modern label { display: block; font-weight: 600; font-size: 14px; margin-bottom: 8px; color: #475569; }
.input-group-modern input { width: 100%; padding: 12px 16px; border: 1.5px solid #e2e8f0; border-radius: 12px; outline: none; font-size: 15px; }
.btn-login-main { width: 100%; padding: 14px; background: #38bdf8; color: #fff; border: none; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; }
.auth-switch { text-align: center; margin-top: 20px; font-size: 14px; color: #64748b; }
.auth-switch a { color: #38bdf8; font-weight: 600; cursor: pointer; }
.btn-cancel-flat { width: 100%; background: none; border: none; color: #94a3b8; margin-top: 15px; cursor: pointer; font-size: 14px; }
.error-msg { color: #ef4444; font-size: 13px; margin-bottom: 15px; display: flex; align-items: center; gap: 6px; }
.booking-toast { position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%); background: #1e293b; color: #fff; padding: 16px 30px; border-radius: 40px; display: flex; align-items: center; gap: 12px; z-index: 3000; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
.history-card { padding: 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.h-date { color: #94a3b8; font-size: 14px; font-weight: 600; }
.h-route { display: flex; flex-direction: column; flex: 1; padding-left: 20px;}
.h-status { font-weight: 700; font-size: 14px; display: flex; align-items: center; gap: 15px; }
.btn-refund { background: none; border: 1px solid #ef4444; color: #ef4444; border-radius: 6px; padding: 4px 12px; font-size: 12px; cursor: pointer; }
.status-blue { color: #38bdf8; } .status-green { color: #10b981; } .status-red { color: #ef4444; } .status-orange { color: #f59e0b; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>