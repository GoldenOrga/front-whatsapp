import { createRouter, createWebHistory } from 'vue-router'
import Auth from '../views/Auth.vue'
import Chat from '../views/Chat.vue' // ajouté

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'Auth', component: Auth },
    { path: '/chat', name: 'Chat', component: Chat }, // ajouté
  ],
})

export default router
