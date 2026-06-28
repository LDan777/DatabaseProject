/**
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
