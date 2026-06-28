/**
 * Axios 核心配置文件
 * 作用：统一管理后端连接地址、自动注入登录 Token、统一处理网络和业务错误
 */

import axios from 'axios'

// 1. 创建 Axios 实例
// 1. 创建 Axios 实例
const service = axios.create({
  // 核心修改：一键切到你的 Python 后端 5000 端口！
  baseURL: 'http://127.0.0.1:5000/api', 
  timeout: 5000 // 请求超时时间：5 秒
})

// 2. 请求拦截器 (Request Interceptor)
// 作用：在前端把请求发出去之前，悄悄帮你在信封（Headers）上盖个“身份章”
service.interceptors.request.use(
  (config) => {
    // 从浏览器的本地缓存中拿取用户登录成功时存进去的 token
    const token = localStorage.getItem('token') 
    
    if (token) {
      // 按照国际标准（JWT），将 Token 以 'Bearer ' 开头的格式挂载到 Authorization 请求头中
      config.headers['Authorization'] = `Bearer ${token}`
    }
    
    return config
  },
  (error) => {
    // 请求发送失败时的处理
    console.error('【请求拦截器错误】:', error)
    return Promise.reject(error)
  }
)

// 3. 响应拦截器 (Response Interceptor)
// 作用：当后端把结果送回来、或者网络报错时，前端在这里统一拦截和加工
service.interceptors.response.use(
  (response) => {
    // response.data 就是后端返回的 JSON 数据（包含 code, data, message）
    const res = response.data 

    // 如果你们约定状态码为 200 代表业务执行成功
    if (res.code === 200) {
      return res // 精准返回后端包在内部的真实数据对象
    } else {
      // 如果 code 不是 200（比如密码错误、库存不足、余额不足等）
      console.warn('【业务报错提示】:', res.message || '未知业务错误')
      
      // 可以根据不同的错误码做统一处理，比如：
      if (res.code === 401) {
        alert('登录已过期，请重新登录！')
        localStorage.removeItem('token') // 清除假或过期的 token
        window.location.href = '/'       // 强制跳转回首页登录
      }
      
      // 把后端返回的错误继续往下抛，让 .vue 页面里的 catch 能够抓到具体的 res.message
      return Promise.reject(res)
    }
  },
  (error) => {
    // 网络层面的错误（比如后端没开服务器导致404、500网络崩溃、请求超时等）
    console.error('【网络/服务器错误】:', error)
    
    if (error.response) {
      console.warn(`请求返回状态码: ${error.response.status}`, error.response.data)
    } else if (error.request) {
      alert('无法连接到后端服务器，请确认后端的 Flask 服务（5000 端口）是否成功启动，并且开启了 CORS 跨域限制！')
    } else {
      alert('网络未知错误：' + error.message)
    }
    
    return Promise.reject(error)
  }
)

export default service