import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import Dashboard from '../modules/dashboard/route'
import Login from '../modules/login/route'

const routes: Array<RouteRecordRaw> = [
  Login,
  Dashboard,
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
})

export default router
