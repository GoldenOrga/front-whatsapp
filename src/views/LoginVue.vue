<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="5" lg="4">
        <v-card class="whatsapp-card">
          <div class="whatsapp-header">
            <v-avatar class="logo-avatar" size="40">WA</v-avatar>
            <div>
              <div class="title">WatChat</div>
              <div class="subtitle">Connexion</div>
            </div>
          </div>

          <v-card-text>
            <v-alert
              v-if="successMsg"
              type="success"
              variant="tonal"
              density="compact"
              class="mb-3"
            >
              {{ successMsg }}
            </v-alert>
            <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-3">
              {{ error }}
            </v-alert>

            <v-form ref="formRef" @submit.prevent="onSubmit">
              <v-text-field
                v-model="email"
                label="Email"
                type="email"
                :rules="[rules.required, rules.email]"
                dense
                required
              />
              <v-text-field
                v-model="password"
                label="Mot de passe"
                type="password"
                :rules="[rules.required, rules.min(6)]"
                dense
                required
              />

              <div class="remember-row mt-1" role="checkbox" :aria-checked="rememberMe" @click="rememberMe = !rememberMe">
                <div class="remember-box" :class="{ checked: rememberMe }">
                  <svg v-if="rememberMe" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </div>
                <span class="remember-label">Se souvenir de moi</span>
              </div>

              <v-btn
                class="primary-whatsapp whatsapp-btn mt-4"
                block
                :loading="loading"
                type="submit"
              >
                Se connecter
              </v-btn>

              <div class="links mt-3">
                <RouterLink to="/register">Créer un compte</RouterLink>
                <RouterLink to="/forgot-password">Mot de passe oublié</RouterLink>
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const formRef = ref(null)
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const rules = {
  required: v => (!!v && v.toString().trim().length > 0) || 'Champ requis',
  email: v => /.+@.+\..+/.test(v || '') || 'Email invalide',
  min: len => v => (v && v.length >= len) || `Minimum ${len} caractères`,
}

const loading = auth.loading
const error = auth.error
const successMsg = ref('')

onMounted(() => {
  auth.clearError()
  successMsg.value = route.query.msg || ''
  // refléter l'état mémorisé si déjà connecté auparavant
  rememberMe.value = !!auth.rememberMe?.value
})

const onSubmit = async () => {
  const valid = await formRef.value?.validate()
  if (!valid.valid) return
  try {
    await auth.login({ email: email.value, password: password.value, rememberMe: rememberMe.value })
    const redirect = route.query.redirect || '/chat'
    router.push(redirect)
  } catch {
    // error already set in store
  }
}
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
  background: #ece5dd;
}

.whatsapp-card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  background: #ffffff;
}

.whatsapp-header {
  background: #075e54;
  color: #fff;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-avatar {
  background: #25d366 !important;
  color: #fff !important;
  font-weight: 700;
}

.title {
  font-weight: 700;
  font-size: 16px;
}

.subtitle {
  font-size: 12px;
  opacity: 0.9;
}

.primary-whatsapp {
  background-color: #25d366 !important;
  color: #fff !important;
  border-radius: 8px;
  text-transform: none;
}

.whatsapp-btn {
  min-height: 44px;
  padding: 10px 14px;
  font-size: 15px;
  box-shadow: none;
}

.links {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.links a {
  color: #075e54;
  text-decoration: none;
}

.remember-row {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.remember-box {
  width: 20px;
  height: 20px;
  border: 1.5px solid #075e54;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  transition: all 0.15s ease;
}

.remember-box.checked {
  background: #25d366;
  border-color: #25d366;
}

.remember-box svg {
  width: 14px;
  height: 14px;
}

.remember-label {
  color: #075e54;
  font-size: 14px;
}
</style>
