/**
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
