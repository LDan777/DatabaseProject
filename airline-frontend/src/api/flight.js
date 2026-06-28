/**
 * 航班模块 API
 * 对应后端：城市表、机场表、航班表、航班实例表、舱位定价表
 */

import request from './request.js'

// ============ C端乘客查询接口 ============

/**
 * 乘客查询航班
 * @param {Object} params - { origin, destination, date }
 *   origin: 出发机场代码 (e.g., 'SHA')
 *   destination: 到达机场代码 (e.g., 'PKX')
 *   date: 出行日期 (YYYY-MM-DD 格式)
 * @returns {Promise} 返回 { code, data: [航班对象列表], message }
 */
export function searchFlights(params) {
  return request({
    url: '/flights/search',
    method: 'post',
    params
  })
}

/**
 * 获取航班详情
 * @param {string} flightId - 航班ID
 * @returns {Promise}
 */
export function getFlightDetail(flightId) {
  return request({
    url: `/flights/list`,
    method: 'get'
  })
}

/**
 * 获取所有机场列表
 * @returns {Promise} 返回 { code, data: [机场对象列表], message }
 */
export function getAirports() {
  return request({
    url: '/airports',
    method: 'get'
  })
}

/**
 * 获取所有城市列表
 * @returns {Promise}
 */
export function getCities() {
  return request({
    url: '/cities',
    method: 'get'
  })
}

// ============ B端管理员操作接口 ============

/**
 * 获取所有航班（排班编排列表）
 * @param {Object} params - 可选分页参数 { page, limit }
 * @returns {Promise}
 */
export function getFlights(params = {}) {
  return request({
    url: '/flights',
    method: 'get',
    params
  })
}

/**
 * 新增航班
 * @param {Object} data - 航班信息
 *   {
 *     flightNo: '航班号',
 *     origin: '出发机场代码',
 *     destination: '到达机场代码',
 *     depTime: '起飞时间 (HH:MM)',
 *     arrTime: '到达时间 (HH:MM)',
 *     aircraft: '机型',
 *     schedule: '执行周期 (1=周一, 2=周二...)',
 *     firstSeats: '头等舱座位数',
 *     economySeats: '经济舱座位数'
 *   }
 * @returns {Promise}
 */
export function createFlight(data) {
  return request({
    url: '/flights',
    method: 'post',
    data
  })
}

/**
 * 修改航班信息
 * @param {string} flightId - 航班ID
 * @param {Object} data - 要修改的数据
 * @returns {Promise}
 */
export function updateFlight(flightId, data) {
  return request({
    url: `/flights/${flightId}`,
    method: 'put',
    data
  })
}

/**
 * 删除航班（根据航班号）
 * @param {string} flightId - 航班ID
 * @returns {Promise}
 */
export function deleteFlight(flightId) {
  return request({
    url: `/flights/${flightId}`,
    method: 'delete'
  })
}

/**
 * 获取航班实例列表（某航班在特定日期的多个班次）
 * @param {Object} params - { flightNo, date }
 * @returns {Promise}
 */
export function getFlightInstances(params) {
  return request({
    url: '/flight-instances',
    method: 'get',
    params
  })
}

/**
 * 新增航班实例
 * @param {Object} data - { flightNo, actualDepTime, actualArrTime, status }
 * @returns {Promise}
 */
export function createFlightInstance(data) {
  return request({
    url: '/flight-instances',
    method: 'post',
    data
  })
}

/**
 * 更新航班实例（修改班次状态）
 * @param {string} instanceId - 实例ID
 * @param {Object} data - { status, actualDepTime, actualArrTime }
 * @returns {Promise}
 */
export function updateFlightInstance(instanceId, data) {
  return request({
    url: `/flight-instances/${instanceId}`,
    method: 'put',
    data
  })
}

/**
 * 获取舱位定价列表
 * @returns {Promise}
 */
export function getCabinPrices() {
  return request({
    url: '/cabin-prices',
    method: 'get'
  })
}

/**
 * 设置舱位定价
 * @param {Object} data - { flightNo, cabin, price }
 *   cabin: 'F' (头等舱) 或 'Y' (经济舱)
 * @returns {Promise}
 */
export function setCabinPrice(data) {
  return request({
    url: '/cabin-prices',
    method: 'post',
    data
  })
}

/**
 * 获取会员折扣
 * @returns {Promise}
 */
export function getMemberDiscounts() {
  return request({
    url: '/member-discounts',
    method: 'get'
  })
}

/**
 * 设置会员折扣
 * @param {Object} data - { level, discount }
 *   level: 会员等级 (如 'GOLD', 'SILVER')
 *   discount: 折扣比例 (如 0.9 表示 90% 折)
 * @returns {Promise}
 */
export function setMemberDiscount(data) {
  return request({
    url: '/member-discounts',
    method: 'post',
    data
  })
}

/**
 * 获取热门航线统计
 * @returns {Promise}
 */
export function getPopularRoutes() {
  return request({
    url: '/statistics/popular-routes',
    method: 'get'
  })
}
