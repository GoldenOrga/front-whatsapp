<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="5" lg="4">
        <v-card class="whatsapp-card">
          <div class="whatsapp-header">
            <v-avatar class="logo-avatar" size="40">WA</v-avatar>
            <div>
              <div class="title">WatChat</div>
              <div class="subtitle">Photo de profil</div>
            </div>
          </div>

          <v-card-text>
            <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-3">
              {{ error }}
            </v-alert>

            <v-alert v-if="success" type="success" variant="tonal" density="compact" class="mb-3">
              Photo mise à jour.
            </v-alert>

            <div class="d-flex align-center mb-4">
              <v-avatar size="72" class="mr-3">
                <img :src="preview" alt="avatar preview" />
              </v-avatar>
              <span class="text-body-2">Prendre ou choisir une photo</span>
            </div>

            <v-form ref="formRef" @submit.prevent="onSubmit">
              <div class="mt-2">
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  class="d-none"
                  @change="onFileSelect"
                />
                <v-btn
                  class="whatsapp-btn"
                  variant="outlined"
                  color="primary"
                  block
                  @click="triggerFile"
                >
                  Choisir depuis l'appareil (caméra/stockage)
                </v-btn>
                <div class="text-caption mt-1" v-if="fileName">Fichier : {{ fileName }}</div>
                <div class="text-caption mt-1">Taille max 50 Mo, images autorisées.</div>
              </div>

              <div class="mt-3">
                <v-btn
                  variant="text"
                  color="primary"
                  class="mb-2"
                  @click="toggleCamera"
                >
                  {{ cameraActive ? 'Fermer la caméra' : 'Ouvrir la caméra' }}
                </v-btn>
                <v-chip v-if="cameraAllowed" color="green" size="small" class="ml-2">Caméra OK</v-chip>

                <div v-if="cameraActive" class="camera-preview">
                  <video ref="videoEl" autoplay playsinline muted></video>
                  <v-btn
                    class="primary-whatsapp whatsapp-btn mt-2"
                    block
                    @click="capturePhoto"
                  >
                    Prendre une photo
                  </v-btn>
                </div>
              </div>

              <v-btn
                class="primary-whatsapp whatsapp-btn mt-4"
                block
                :loading="loading || uploading"
                type="submit"
              >
                Sauvegarder et continuer
              </v-btn>

              <div class="links mt-3">
                <RouterLink to="/chat">Passer</RouterLink>
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watchEffect, nextTick } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import api from '../services/api'

const auth = useAuthStore()
const router = useRouter()
const defaultAvatar = 'https://api.dicebear.com/6.x/initials/svg?seed=default'
const previewUrl = ref(auth.user?.avatar || defaultAvatar)
const file = ref(null)
const fileName = ref('')
const uploading = ref(false)
const success = ref(false)
const cameraAllowed = ref(false)
const cameraActive = ref(false)
const cameraStream = ref(null)
const formRef = ref(null)
const fileInput = ref(null)
const videoEl = ref(null)
const capturedPhotoUrl = ref('')

const preview = computed(() => {
  return previewUrl.value || capturedPhotoUrl.value || defaultAvatar
})

const loading = auth.loading
const error = auth.error

function triggerFile() {
  fileInput.value?.click()
}

function onFileSelect(e) {
  const f = e.target.files?.[0]
  if (!f) return
  file.value = f
  fileName.value = f.name
  success.value = false
  previewUrl.value = URL.createObjectURL(f)
}

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    cameraStream.value = stream
    cameraAllowed.value = true
    if (videoEl.value) {
      videoEl.value.srcObject = stream
      // ensure playback starts
      await videoEl.value.play?.()
    }
  } catch {
    cameraStream.value = null
    cameraAllowed.value = false
    cameraActive.value = false
  }
}

function stopCamera() {
  cameraStream.value?.getTracks().forEach(t => t.stop())
  cameraStream.value = null
  cameraActive.value = false
}

async function toggleCamera() {
  success.value = false
  if (cameraActive.value) {
    stopCamera()
    return
  }
  cameraActive.value = true
  await nextTick()
  await startCamera()
}

async function capturePhoto() {
  if (!videoEl.value) return
  const video = videoEl.value
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth || 640
  canvas.height = video.videoHeight || 480
  const ctx = canvas.getContext('2d')
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
  if (!blob) return
  const capturedFile = new File([blob], 'photo-camera.png', { type: 'image/png' })
  file.value = capturedFile
  fileName.value = capturedFile.name
  capturedPhotoUrl.value = URL.createObjectURL(capturedFile)
  previewUrl.value = capturedPhotoUrl.value
  success.value = false
  stopCamera()
}

const onSubmit = async () => {
  success.value = false
  if (!file.value) {
    return
  }
  let finalUrl = ''

  uploading.value = true
  try {
    const uploaded = await api.uploadFile(file.value, auth.accessToken)
    finalUrl = api.buildFileUrl(uploaded.url)
  } catch {
    uploading.value = false
    return
  }
  uploading.value = false

  try {
    await auth.updateProfile({ avatar: finalUrl })
    success.value = true
    router.push('/chat')
  } catch {
    // handled in store
  }
}

onBeforeUnmount(() => {
  stopCamera()
})
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

.gap-2 {
  gap: 8px;
}

.d-none {
  display: none;
}

.camera-preview {
  margin-top: 8px;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 8px;
}

.camera-preview video {
  width: 100%;
  border-radius: 8px;
}

:deep(.v-avatar img) {
  object-fit: cover;
  width: 100%;
  height: 100%;
}
</style>
