<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="5" lg="4">
        <v-card class="whatsapp-card">
          <div class="whatsapp-header">
            <v-avatar class="logo-avatar" size="40">WA</v-avatar>
            <div>
              <div class="title">WatChat</div>
              <div class="subtitle">Changer le mot de passe</div>
            </div>
          </div>

          <v-card-text>
            <v-alert v-if="success" type="success" variant="tonal" density="compact" class="mb-3">
              Mot de passe mis à jour.
            </v-alert>

            <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-3">
              {{ error }}
            </v-alert>

            <v-form ref="formRef" @submit.prevent="onSubmit">
              <div v-if="!auth.isAuthenticated">
                <div class="d-flex align-center mb-1">
                  <span class="text-body-2">Email du compte</span>
                  <v-tooltip
                    text="Nous sommes conscients que ceci n'est pas sécurisé mais nous n'avons pas la possibilité d'implémenter la réinitialisation du mot de passe par email. Nous faisons donc simplement comme ceci."
                    location="bottom"
                  >
                    <template #activator="{ props }">
                      <v-icon v-bind="props" size="18" color="primary" class="ml-1 tooltip-icon">
                        mdi-information-outline
                      </v-icon>
                    </template>
                  </v-tooltip>
                </div>
                <v-text-field
                  v-model="email"
                  label="Email"
                  type="email"
                  :rules="[rules.required, rules.email]"
                  dense
                  required
                  validate-on="input"
                />
              </div>

              <v-text-field
                v-if="auth.isAuthenticated"
                v-model="currentPassword"
                label="Mot de passe actuel"
                type="password"
                :rules="[rules.required, rules.min(6)]"
                dense
                required
                validate-on="input"
              />
              <v-text-field
                v-model="newPassword"
                label="Nouveau mot de passe"
                type="password"
                :rules="[rules.required, rules.min(6)]"
                dense
                required
                validate-on="input"
              />
              <v-text-field
                v-model="confirmPassword"
                label="Confirmer le mot de passe"
                type="password"
                :rules="confirmRules"
                dense
                required
                validate-on="input"
              />

              <v-btn
                class="primary-whatsapp whatsapp-btn mt-4"
                block
                :loading="loading"
                type="submit"
              >
                Valider
              </v-btn>

              <div class="links mt-3">
                <RouterLink to="/login">Retour</RouterLink>
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()

const email = ref('')
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const success = ref(false)
const formRef = ref(null)

const rules = {
  required: v => (!!v && v.toString().trim().length > 0) || 'Champ requis',
  min: len => v => (v && v.length >= len) || `Minimum ${len} caractères`,
  email: v => /.+@.+\..+/.test(v || '') || 'Email invalide',
}

const confirmRules = [
  v => (!!v && v.toString().trim().length > 0) || 'Champ requis',
  v => {
    const val = (v || '').trim()
    const other = (newPassword.value || '').trim()
    return val === other || 'Les mots de passe ne correspondent pas'
  },
]

const loading = auth.loading
const error = auth.error

onMounted(() => auth.clearError())

watch(newPassword, () => {
  // re-validate confirmation when new password changes
  formRef.value?.validate()
})

const onSubmit = async () => {
  const valid = await formRef.value?.validate()
  if (!valid.valid) return
  success.value = false
  try {
    if (auth.isAuthenticated?.value) {
      await auth.changePassword({
        currentPassword: currentPassword.value,
        newPassword: newPassword.value,
      })
    } else {
      await auth.changePasswordByEmail({
        email: email.value,
        newPassword: newPassword.value,
      })
    }
    success.value = true
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    router.push({ name: 'Login', query: { msg: 'Mot de passe mis à jour.' } })
  } catch (e) {
    // handled in store
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

.tooltip-icon {
  cursor: pointer;
}
</style>
