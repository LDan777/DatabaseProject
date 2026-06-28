import { createRouter, createWebHistory } from 'vue-router'
import CustomerView from '../views/CustomerView.vue'
import AdminView from '../views/AdminView.vue'

const router = createRouter({
  // 使用 HTML5 的历史记录模式，网址看起来更干净 (没有 #)
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'customer',
      component: CustomerView // 访问根目录时，展示 C端购票页
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminView // 访问 /admin 时，展示 B端管理后台
    }
  ]
})

export default router