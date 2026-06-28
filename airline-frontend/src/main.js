import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router' // 引入刚刚写好的路由配置

const app = createApp(App)

app.use(router) // 告诉 app 使用这个路由
app.mount('#app')