import { defineStore } from 'pinia'
import { computed, reactive, toRefs } from 'vue'
import api from '../services/api'

const STORAGE_KEY = 'wachat_auth'

function getStorage(remember) {
  return remember ? window.localStorage : window.sessionStorage
}

function readSavedAuth() {
  const raw = window.localStorage.getItem(STORAGE_KEY) || window.sessionStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch (e) {
    console.error('Failed to parse auth cache', e)
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const state = reactive({
    user: null,
    accessToken: null,
    refreshToken: null,
    rememberMe: false,
    loading: false,
    error: null,
  })

  function persist() {
    const storage = getStorage(state.rememberMe)
    const payload = {
      user: state.user,
      accessToken: state.accessToken,
      refreshToken: state.refreshToken,
      rememberMe: state.rememberMe,
    }
    storage.setItem(STORAGE_KEY, JSON.stringify(payload))
    const other = state.rememberMe ? window.sessionStorage : window.localStorage
    other.removeItem(STORAGE_KEY)
  }

  function loadFromStorage() {
    const saved = readSavedAuth()
    if (saved) {
      state.user = saved.user
      state.accessToken = saved.accessToken
      state.refreshToken = saved.refreshToken
      state.rememberMe = !!saved.rememberMe
    }
  }

  async function login(payload) {
    state.loading = true
    state.error = null
    try {
      const res = await api.post('/auth/login', payload)
      state.user = res.user
      state.accessToken = res.accessToken
      state.refreshToken = res.refreshToken
      state.rememberMe = !!payload.rememberMe
      persist()
      return res.user
    } catch (err) {
      state.error = normalizeError(err)
      throw err
    } finally {
      state.loading = false
    }
  }

  async function register(payload) {
    state.loading = true
    state.error = null
    try {
      const res = await api.post('/auth/register', payload)
      state.user = res.user
      state.accessToken = res.accessToken
      state.refreshToken = res.refreshToken
      state.rememberMe = !!payload.rememberMe
      persist()
      return res.user
    } catch (err) {
      state.error = normalizeError(err)
      throw err
    } finally {
      state.loading = false
    }
  }

  async function logout() {
    try {
      await api.post('/auth/logout', {}, state.accessToken)
    } catch (e) {
      console.warn('logout failed, continue', e)
    }
    state.user = null
    state.accessToken = null
    state.refreshToken = null
    state.loading = false
    state.error = null
    window.localStorage.removeItem(STORAGE_KEY)
    window.sessionStorage.removeItem(STORAGE_KEY)
  }

  async function refresh() {
    if (!state.refreshToken) return null
    try {
      const res = await api.post('/auth/refresh-token', { refreshToken: state.refreshToken })
      state.accessToken = res.accessToken
      state.refreshToken = res.refreshToken
      persist()
      return res.accessToken
    } catch (err) {
      await logout()
      throw err
    }
  }

  async function updateProfile(payload) {
    if (!state.accessToken) throw new Error('Not authenticated')
    state.loading = true
    state.error = null
    try {
      const res = await api.put('/users/profile', payload, state.accessToken)
      state.user = res?.user || { ...state.user, ...payload }
      persist()
      return res
    } catch (err) {
      state.error = normalizeError(err)
      throw err
    } finally {
      state.loading = false
    }
  }

  async function changePassword(payload) {
    if (!state.accessToken) throw new Error('Not authenticated')
    state.loading = true
    state.error = null
    try {
      const res = await api.post('/users/change-password', payload, state.accessToken)
      return res
    } catch (err) {
      state.error = normalizeError(err)
      throw err
    } finally {
      state.loading = false
    }
  }

  async function changePasswordByEmail(payload) {
    // payload: { email, newPassword }
    state.loading = true
    state.error = null
    try {
      const res = await api.post('/users/change-password/email', payload, null)
      return res
    } catch (err) {
      state.error = normalizeError(err)
      throw err
    } finally {
      state.loading = false
    }
  }

  const isAuthenticated = computed(() => !!state.accessToken)

  function clearError() {
    state.error = null
  }

  function normalizeError(err) {
    if (!err) return 'Erreur inconnue'
    if (typeof err === 'string') return err
    if (err.message) return err.message
    return 'Une erreur est survenue'
  }

  loadFromStorage()

  return {
    ...toRefs(state),
    isAuthenticated,
    login,
    register,
    logout,
    refresh,
    updateProfile,
    changePassword,
    changePasswordByEmail,
    clearError,
  }
})
