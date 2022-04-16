export default {
  path: '/',
  name: 'Dashboard',
  component: (): unknown => import(/* webpackChunkName: "Map" */ '../presentation/Dashboard.vue'),
}
