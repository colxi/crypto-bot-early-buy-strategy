export default {
  path: '/login',
  name: 'Login',
  component: (): unknown => import(/* webpackChunkName: "Login" */ '../presentation/Login.vue'),
}
