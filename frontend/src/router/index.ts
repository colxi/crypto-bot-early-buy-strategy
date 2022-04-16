import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import Dashboard from '../modules/dashboard/route'

const routes: Array<RouteRecordRaw> = [
  Dashboard,
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
})

export default router
