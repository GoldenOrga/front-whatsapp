<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="5" lg="4">
        <v-card class="whatsapp-card">
          <div class="whatsapp-header">
            <v-avatar class="logo-avatar" size="40">WA</v-avatar>
            <div>
              <div class="title">WatChat</div>
              <div class="subtitle">Créer un compte</div>
            </div>
          </div>

          <v-card-text>
            <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-3">
              {{ error }}
            </v-alert>

            <v-form ref="formRef" @submit.prevent="onSubmit">
              <v-text-field
                v-model="name"
                label="Pseudo"
                :rules="[rules.required, rules.min(3)]"
                dense
                required
              />
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

              <v-checkbox
                v-model="rememberMe"
                density="compact"
                label="Se souvenir de moi"
                hide-details
                class="mt-1"
              />

              <v-btn
                class="primary-whatsapp whatsapp-btn mt-4"
                block
                :loading="loading"
                type="submit"
              >
                S'inscrire
              </v-btn>

              <div class="links mt-3">
                <RouterLink to="/login">Déjà un compte ? Se connecter</RouterLink>
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
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const name = ref('')
const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const formRef = ref(null)
const router = useRouter()
const auth = useAuthStore()

const rules = {
  required: v => (!!v && v.toString().trim().length > 0) || 'Champ requis',
  email: v => /.+@.+\..+/.test(v || '') || 'Email invalide',
  min: len => v => (v && v.length >= len) || `Minimum ${len} caractères`,
}

const loading = auth.loading
const error = auth.error

onMounted(() => auth.clearError())

const onSubmit = async () => {
  const valid = await formRef.value?.validate()
  if (!valid.valid) return
  try {
    await auth.register({
      name: name.value,
      email: email.value,
      password: password.value,
      rememberMe: rememberMe.value,
    })
    router.push('/choose-username')
  } catch (e) {
    // handled by store
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
  justify-content: center;
  font-size: 14px;
}

.links a {
  color: #075e54;
  text-decoration: none;
}
</style>
