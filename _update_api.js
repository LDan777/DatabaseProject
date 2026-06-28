const fs = require('fs');
const path = require('path');

const base = 'd:/Project/DatabaseProject/airline-frontend/src/api';

// --- auth.js ---
fs.writeFileSync(path.join(base, 'auth.js'), `/**
 * 认证模块 API
 * 对齐后端 ds-aviation-backend/app.py：
 *   POST /api/register   — 用户注册（身份证+姓名+手机号+密码）
 *   POST /api/login      — 用户登录（身份证+密码）
 *   GET  /api/my_ticket  — 查询我的已定行程
 */

import request from './request.js'

/**
 * 用户注册
 * 对齐后端: POST /api/register
 * @param {Object} data - { id_card, name, phone, password }
 * @returns {Promise}
 */
export function register(data) {
  return request({
    url: '/register',
    method: 'post',
    data
  })
}

/**
 * 用户登录（身份证+密码）
 * 对齐后端: POST /api/login
 * @param {Object} data - { id_card, password }
 * @returns {Promise}
 */
export function login(data) {
  return request({
    url: '/login',
    method: 'post',
    data
  })
}

/**
 * 查询我的已定行程（售票记录）
 * 对齐后端: GET /api/my_ticket
 * @param {string} idCard - 身份证号
 * @returns {Promise}
 */
export function getMyTickets(idCard) {
  return request({
    url: '/my_ticket',
    method: 'get',
    params: { id_card: idCard }
  })
}
`, 'utf8');

// --- flight.js ---
fs.writeFileSync(path.join(base, 'flight.js'), `/**
 * 航班模块 API
 * 对齐后端 ds-aviation-backend/app.py：
 *   C端：GET  /api/search_flight              — 搜索航班
 *   管理端：城市/机场/航班/航班实例 CRUD
 */

import request from './request.js'

// ==================== C端乘客接口 ====================

/**
 * 搜索航班（根据起落城市区域代码 + 日期）
 * 对齐后端: GET /api/search_flight
 * @param {Object} params - { start_city, end_city, fly_date }
 * @returns {Promise}
 */
export function searchFlights(params) {
  return request({
    url: '/search_flight',
    method: 'get',
    params
  })
}

// ==================== 管理端：城市 CRUD ====================

/** 获取城市列表  对齐后端: GET /api/admin/city/list */
export function getCityList() {
  return request({ url: '/admin/city/list', method: 'get' })
}

/** 新增城市  对齐后端: POST /api/admin/city/add */
export function addCity(data) {
  return request({ url: '/admin/city/add', method: 'post', data })
}

/** 修改城市  对齐后端: POST /api/admin/city/edit */
export function editCity(data) {
  return request({ url: '/admin/city/edit', method: 'post', data })
}

/** 删除城市  对齐后端: POST /api/admin/city/del */
export function deleteCity(areaCode) {
  return request({ url: '/admin/city/del', method: 'post', data: { area_code: areaCode } })
}

// ==================== 管理端：机场 CRUD ====================

/** 获取机场列表  对齐后端: GET /api/admin/airport/list */
export function getAirportList() {
  return request({ url: '/admin/airport/list', method: 'get' })
}

/** 新增机场  对齐后端: POST /api/admin/airport/add */
export function addAirport(data) {
  return request({ url: '/admin/airport/add', method: 'post', data })
}

/** 修改机场  对齐后端: POST /api/admin/airport/edit */
export function editAirport(data) {
  return request({ url: '/admin/airport/edit', method: 'post', data })
}

/** 删除机场  对齐后端: POST /api/admin/airport/del */
export function deleteAirport(airportCode) {
  return request({ url: '/admin/airport/del', method: 'post', data: { airport_code: airportCode } })
}

// ==================== 管理端：航班 & 航班实例 ====================

/** 新增航班（默认每周全周飞行）  对齐后端: POST /api/admin/flight/add */
export function addFlight(data) {
  return request({ url: '/admin/flight/add', method: 'post', data })
}

/** 更新航班实例（修改航班状态、余票）  对齐后端: POST /api/admin/flight_instance/update */
export function updateFlightInstance(data) {
  return request({ url: '/admin/flight_instance/update', method: 'post', data })
}
`, 'utf8');

// --- order.js ---
fs.writeFileSync(path.join(base, 'order.js'), `/**
 * 订单/票务模块 API
 * 对齐后端 ds-aviation-backend/app.py：
 *   POST /api/buy_ticket     — 购买机票（生成订单，扣减余票）
 *   POST /api/refund_ticket  — 退票（订单改为已退票，返还座位）
 *   POST /api/change_ticket  — 改签（起落城市不变，更换航班日期）
 */

import request from './request.js'

/**
 * 购买机票（生成订单，扣减余票）
 * 对齐后端: POST /api/buy_ticket
 * @param {Object} data - { id_card, flight_no, fly_date, cabin_level, real_price }
 * @returns {Promise}
 */
export function buyTicket(data) {
  return request({
    url: '/buy_ticket',
    method: 'post',
    data
  })
}

/**
 * 退票（订单改为已退票，返还座位）
 * 对齐后端: POST /api/refund_ticket
 * @param {number} ticketId - 订单/票务ID
 * @returns {Promise}
 */
export function refundTicket(ticketId) {
  return request({
    url: '/refund_ticket',
    method: 'post',
    data: { ticket_id: ticketId }
  })
}

/**
 * 改签（起落城市不变，更换航班日期/航班号）
 * 对齐后端: POST /api/change_ticket
 * @param {Object} data - { ticket_id, new_flight_no, new_fly_date }
 * @returns {Promise}
 */
export function changeTicket(data) {
  return request({
    url: '/change_ticket',
    method: 'post',
    data
  })
}
`, 'utf8');

console.log('All API files updated successfully!');
