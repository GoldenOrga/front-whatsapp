import { createRouter, createWebHistory } from 'vue-router'
import Chat from '../views/Chat.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import ForgotPassword from '../views/ForgotPassword.vue'
import ChooseUsername from '../views/ChooseUsername.vue'
import ProfilePhoto from '../views/ProfilePhoto.vue'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', name: 'Login', component: Login, meta: { guestOnly: true } },
    { path: '/register', name: 'Register', component: Register, meta: { guestOnly: true } },
    { path: '/forgot-password', name: 'ForgotPassword', component: ForgotPassword },
    { path: '/choose-username', name: 'ChooseUsername', component: ChooseUsername, meta: { requiresAuth: true } },
    { path: '/profile-photo', name: 'ProfilePhoto', component: ProfilePhoto, meta: { requiresAuth: true } },
    { path: '/chat', name: 'Chat', component: Chat, meta: { requiresAuth: true } },
    { path: '/:pathMatch(.*)*', redirect: '/login' },
  ],
})

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()
  const isAuth = auth.isAuthenticated?.value ?? auth.isAuthenticated

  if (to.meta.requiresAuth && !isAuth) {
    return next({ name: 'Login', query: { redirect: to.fullPath } })
  }

  if (to.meta.guestOnly && isAuth) {
    return next({ name: 'Chat' })
  }

  return next()
})

export default router
