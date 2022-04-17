export default {
  path: '/dashboard',
  name: 'Dashboard',
  component: (): unknown => import(/* webpackChunkName: "Map" */ '../presentation/Dashboard.vue'),
}
