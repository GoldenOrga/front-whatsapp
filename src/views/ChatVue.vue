<template>
  <v-container fluid class="fill-height chat-page">
    <v-row no-gutters>
      <!-- Sidebar -->
      <v-col cols="12" md="4" class="convo-col">
        <v-card class="whatsapp-card list-card" height="100%">
          <v-card-title class="whatsapp-header list-header">
            <v-avatar class="logo-avatar" size="40">
              <img :src="auth.user?.avatar || fallbackAvatar" alt="moi" />
            </v-avatar>
            <div>
              <div class="title">Conversations</div>
              <div class="subtitle">{{ auth.user?.name || 'Moi' }}</div>
            </div>
            <v-spacer />
            <v-menu>
              <template #activator="{ props }">
                <v-btn icon v-bind="props" size="small" variant="text">
                  <v-icon>mdi-dots-vertical</v-icon>
                </v-btn>
              </template>
              <v-list>
                <v-list-item @click="openNewDialog">
                  <v-list-item-title>Nouvelle discussion</v-list-item-title>
                </v-list-item>
                <v-list-item @click="refresh">
                  <v-list-item-title>Rafraîchir</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-card-title>

          <v-card-text>
            <v-text-field v-model="search" placeholder="Rechercher ou démarrer une discussion" dense hide-details
              rounded prepend-inner-icon="mdi-magnify" />
            <v-select v-model="filter" :items="filterItems" density="compact" hide-details variant="outlined"
              class="mt-2" label="Filtrer" />
            <div class="chip-row mt-2">
              <v-chip v-for="opt in quickFilters" :key="opt.value" size="small"
                :color="filter === opt.value ? 'primary' : ''" variant="tonal" @click="filter = opt.value">
                {{ opt.label }}
              </v-chip>
            </div>

            <!-- LISTE DES CONVERSATIONS -->
            <v-list dense nav class="mt-2 convo-list">
              <v-list-item v-for="c in filteredList" :key="c._id" :value="c._id" @click="selectChat(c)"
                :class="['convo-list-item', { 'active-convo': selected && selected._id === c._id }]">
                <template #prepend>
                  <v-avatar size="40">
                    <img :src="avatarUrl(c)" alt="" />
                  </v-avatar>
                </template>

                <div class="w-100">
                  <div class="d-flex align-center justify-space-between">
                    <div class="d-flex align-center">
                      <span>{{ displayName(c) }}</span>
                      <v-chip v-if="c.isGroup" size="x-small" class="ml-2" color="primary" variant="tonal">
                        Groupe
                      </v-chip>
                    </div>
                    <span class="time">{{ shortTime(c.updatedAt || c.createdAt) }}</span>
                  </div>

                  <v-list-item-subtitle class="truncate">
                    {{ c.lastMessage?.content || 'Aucun message' }}
                  </v-list-item-subtitle>

                  <div class="status-row">
                    <span class="status-dot" :class="{ online: isConversationOnline(c) }"></span>
                    <span class="status-text">
                      {{ isConversationOnline(c) ? 'En ligne' : 'Hors ligne' }}
                    </span>
                  </div>
                </div>

                <template #append>
                  <div class="d-flex align-center" style="gap: 6px;">
                    <v-badge v-if="c.unread" color="green" dot>
                      <span class="unread-count">{{ c.unread }}</span>
                    </v-badge>
                    <v-menu>
                      <template #activator="{ props }">
                        <v-btn v-bind="props" icon size="small" variant="text">
                          <v-icon>mdi-dots-vertical</v-icon>
                        </v-btn>
                      </template>
                      <v-list>
                        <v-list-item @click.stop="toggleArchive(c)">
                          <v-list-item-title>
                            {{ isArchived(c._id) ? 'Désarchiver' : 'Archiver' }}
                          </v-list-item-title>
                        </v-list-item>
                        <v-list-item @click.stop="removeConversation(c)">
                          <v-list-item-title>Supprimer</v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </v-menu>
                  </div>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Chat area -->
      <v-col cols="12" md="8" class="chat-col pl-5">
        <v-card class="whatsapp-card chat-card" height="100%">
          <v-card-title class="chat-header">
            <v-avatar size="40">
              <img v-if="selected" :src="avatarUrl(selected)" alt="avatar conversation" />
              <span v-else>
                {{ auth.user?.name ? auth.user.name[0].toUpperCase() : 'U' }}
              </span>
            </v-avatar>

            <div class="ml-3">
              <div class="title">
                {{ selected ? displayName(selected) : 'Sélectionnez une discussion' }}
              </div>
              <div class="subtitle">
                <span v-if="selected">
                  {{ selected.isGroup ? 'Groupe' : 'Privé' }}
                </span>
                <span v-if="typingLabel"> · {{ typingLabel }}</span>
              </div>
            </div>

            <v-spacer></v-spacer>
            <div class="d-flex align-center">
              <v-menu>
                <template #activator="{ props }">
                  <v-btn v-bind="props" icon class="mr-2" variant="text">
                    <v-avatar size="36">
                      <img :src="auth.user?.avatar || fallbackAvatar" alt="moi" />
                    </v-avatar>
                  </v-btn>
                </template>

                <v-list>
                  <v-list-item @click="goTo('/choose-username')">
                    <v-list-item-title>Modifier pseudo</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="goTo('/profile-photo')">
                    <v-list-item-title>Modifier photo</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="goTo('/forgot-password')">
                    <v-list-item-title>Changer mot de passe</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="handleLogout">
                    <v-list-item-title>Se déconnecter</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>

              <span class="mr-2">{{ auth.user?.name || 'Moi' }}</span>
            </div>
          </v-card-title>

          <v-divider></v-divider>

          <v-card-text class="messages-area" ref="messagesArea" @dragover.prevent="onDragOver"
            @dragenter.prevent="onDragOver" @dragleave.prevent="onDragLeave" @drop.prevent="onDrop">
            <div v-if="isDragOver && selected" class="dropzone-overlay">
              Déposez vos fichiers ici
            </div>

            <div v-if="!selected" class="empty-chat">
              Sélectionnez une conversation à gauche pour commencer.
            </div>

            <div v-else class="messages">
              <div v-for="(m, idx) in selected.messages || []" :key="m._id || m.id || idx"
                :class="['message-row', isMine(m) ? 'message-me' : 'message-other']">
                <div class="message-bubble">
                  <div class="message-text" v-if="m.content">
                    {{ m.content }}
                  </div>

                  <!-- ATTACHMENTS -->
                  <div v-if="m.attachments && m.attachments.length" class="message-attachments">
                    <div v-for="att in m.attachments" :key="att._id || att.id" class="attachment-item">
                      <!-- IMAGE / GIF PREVIEW -->
                      <template v-if="att.type === 'image'">
                        <img class="attachment-image" :src="fileUrl(att.url)" :alt="att.originalName || 'Image'"
                          @click="openAttachment(att)" />
                      </template>

                      <!-- AUTRES TYPES -->
                      <template v-else>
                        <a class="attachment-link" :href="fileUrl(att.url)" target="_blank" rel="noopener">
                          <span v-if="att.type === 'video'">🎬</span>
                          <span v-else-if="att.type === 'audio'">🎧</span>
                          <span v-else>📎</span>
                          {{ att.originalName || 'Fichier' }}
                        </a>
                      </template>
                    </div>
                  </div>

                  <div class="message-time">
                    {{ formatTime(m.createdAt) }}
                  </div>
                </div>
              </div>
            </div>
          </v-card-text>

          <!-- FICHIERS EN ATTENTE (juste au-dessus de la zone de texte) -->
          <div v-if="selected && pendingFiles.length" class="pending-attachments">
            <div v-for="(file, idx) in pendingFiles" :key="idx" class="pending-attachment-pill">
              <span class="pending-name">
                📎 {{ file.name }}
              </span>
              <v-btn icon size="x-small" variant="text" @click="removePendingFile(idx)">
                <v-icon size="14">mdi-close</v-icon>
              </v-btn>
            </div>
          </div>

          <v-divider></v-divider>

          <v-card-actions class="p-3">
            <!-- BOUTON JOINDRE -->
            <v-btn icon @click="triggerFilePicker" :disabled="!selected">
              <v-icon>mdi-paperclip</v-icon>
            </v-btn>

            <input ref="fileInput" type="file" multiple class="d-none" @change="onFileChange" />

            <v-text-field v-model="newMessage" placeholder="Écrire un message" dense hide-details rounded
              class="flex-grow-1" :disabled="!selected" @keyup.enter="sendMessage" @input="onInputTyping"
              @blur="onStopTyping" />
            <v-btn icon color="green" @click="sendMessage" :disabled="!selected">
              <v-icon>mdi-send</v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Nouvelle discussion -->
    <v-dialog v-model="showNewDialog" max-width="520">
      <v-card>
        <v-card-title>Nouvelle discussion</v-card-title>
        <v-card-text>
          <div v-if="selectedUsers.length" class="mb-2 selected-chips">
            <v-chip v-for="id in selectedUsers" :key="id" size="small" class="mr-2 mb-2" closable
              @click:close="removeSelected(id)">
              {{ userLabel(id) }}
            </v-chip>
          </div>
          <v-text-field v-model="userSearch" label="Rechercher un utilisateur" dense prepend-inner-icon="mdi-magnify"
            @keyup="searchUsers" />

          <v-list v-if="userResults.length">
            <v-list-item v-for="u in userResults" :key="u._id" @click="toggleUser(u)"
              :class="['user-result', { selected: isSelected(u._id) }]">
              <template #prepend>
                <v-avatar size="36">
                  <img :src="u.avatar || fallbackAvatar" alt="" />
                </v-avatar>
              </template>

              <div>
                <v-list-item-title>{{ u.name }}</v-list-item-title>
                <v-list-item-subtitle>{{ u.email }}</v-list-item-subtitle>
              </div>

              <template #append>
                <v-icon color="primary" v-if="isSelected(u._id)">mdi-check-circle</v-icon>
              </template>
            </v-list-item>
          </v-list>

          <div v-else class="text-caption">Aucun résultat</div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="showNewDialog = false">Fermer</v-btn>
          <v-btn color="primary" :disabled="!selectedUsers.length || newConvoLoading" :loading="newConvoLoading"
            @click="startConversation">
            Démarrer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import {
  ref,
  computed,
  onMounted,
  nextTick,
  watchEffect,
  onBeforeUnmount,
  watch,
} from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useConversationsStore } from '../stores/conversations'
import api from '../services/api'
import { useSocket } from '../composables/useSocket'

const router = useRouter()
const auth = useAuthStore()
const myId = computed(() => auth.user?._id || auth.user?.id)
const convoStore = useConversationsStore()
const { socket, connect, disconnect } = useSocket(
  auth.accessToken?.value || auth.accessToken
)

const fallbackAvatar =
  'https://api.dicebear.com/6.x/initials/svg?seed=default'

const search = ref('')
const filter = ref('all')
const filterItems = [
  { title: 'Toutes', value: 'all' },
  { title: 'Actives', value: 'active' },
  { title: 'Archivées', value: 'archived' },
]
const quickFilters = [
  { label: 'Tous', value: 'all' },
  { label: 'Actifs', value: 'active' },
  { label: 'Archivés', value: 'archived' },
]

const selected = ref(null)
const newMessage = ref('')
const messagesArea = ref(null)
const showNewDialog = ref(false)
const userSearch = ref('')
const userResults = ref([])
const selectedUsers = ref([])
const userSearchTimer = ref(null)
const newConvoLoading = ref(false)
const isSocketReady = ref(false)

const fileInput = ref(null)
const pendingFiles = ref([])
const isDragOver = ref(false)

// Typing : conversationId -> { userId: true }
const typingState = ref({})
let typingTimer = null

const filteredList = computed(() =>
  convoStore.filtered(search.value, filter.value)
)

const typingLabel = computed(() => {
  if (!selected.value) return ''

  const convId = String(selected.value._id || '')
  if (!convId) return ''

  const usersMap = typingState.value[convId]
  if (!usersMap) return ''

  const ids = Object.keys(usersMap).filter(
    id => id && id !== String(myId.value || '')
  )
  if (!ids.length) return ''

  const participants = selected.value.participants || []
  const names = ids
    .map(id => {
      const p = participants.find(
        u => String(u._id || u.id) === id
      )
      return p?.name || p?.email || 'Utilisateur'
    })
    .filter(Boolean)

  if (!names.length) return ''

  if (names.length === 1) {
    return `${names[0]} est en train d'écrire...`
  }
  if (names.length === 2) {
    return `${names[0]} et ${names[1]} écrivent...`
  }
  return 'Plusieurs personnes écrivent...'
})

async function selectChat(c) {
  if (!c) return

  const conv =
    convoStore.conversations.find(x => String(x._id) === String(c._id)) || c

  selected.value = conv
  newMessage.value = ''
  pendingFiles.value = []

  convoStore.markRead(conv._id)
  emitJoin(conv._id)
  emitMarkRead(conv._id)

  const token = auth.accessToken?.value || auth.accessToken
  if (token && (!conv.messages || !conv.messages.length)) {
    await convoStore.fetchMessages(conv._id, token)
  }

  nextTick(() => scrollToBottom())
}


function avatarInitials(c) {
  if (!c || !c.name) return 'U'
  return c.name
    .split(' ')
    .map(s => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function displayName(c) {
  if (!c) return 'Conversation'

  if (c.name && c.name.trim()) return c.name.trim()

  if (!Array.isArray(c.participants) || !c.participants.length) {
    return 'Conversation'
  }

  const others = c.participants.filter(p => {
    const pid = String(p._id || p.id || '')
    const mid = String(myId.value || '')
    return pid && mid && pid !== mid
  })

  if (others.length === 0) {
    return 'Moi'
  }

  if (others.length === 1) {
    return others[0].name || others[0].email || 'Utilisateur'
  }

  return others
    .map(o => o.name || o.email || 'Utilisateur')
    .join(', ')
}

function avatarUrl(c) {
  if (c?.avatar) return c.avatar

  if (!Array.isArray(c?.participants) || !c.participants.length) {
    return fallbackAvatar
  }

  const others = c.participants.filter(p => {
    const pid = String(p._id || p.id || '')
    const mid = String(myId.value || '')
    return pid && mid && pid !== mid
  })

  const firstOther = others[0] || c.participants[0]
  return firstOther?.avatar || fallbackAvatar
}

function triggerFilePicker() {
  if (!selected.value) return
  if (fileInput.value) {
    fileInput.value.click()
  }
}

function onFileChange(event) {
  if (!selected.value) return
  const files = Array.from(event.target.files || [])
  addPendingFiles(files)
  event.target.value = ''
}

function addPendingFiles(files) {
  if (!selected.value) return
  files.forEach(f => {
    pendingFiles.value.push(f)
  })
}

function removePendingFile(index) {
  pendingFiles.value.splice(index, 1)
}

function onDragOver() {
  if (!selected.value) return
  isDragOver.value = true
}

function onDragLeave(e) {
  if (!e.currentTarget.contains(e.relatedTarget)) {
    isDragOver.value = false
  }
}

function onDrop(e) {
  if (!selected.value) return
  isDragOver.value = false
  const files = Array.from(e.dataTransfer?.files || [])
  if (!files.length) return
  addPendingFiles(files)
}

async function uploadPendingFiles() {
  const token = auth.accessToken?.value || auth.accessToken
  if (!token || !pendingFiles.value.length || !selected.value) return []

  const ids = []

  for (const file of pendingFiles.value) {
    const attachment = await api.uploadFile(file, token, {
      conversationId: selected.value._id,
    })
    if (attachment && attachment._id) {
      ids.push(attachment._id)
    }
  }

  return ids
}

function isConversationOnline(c) {
  if (!c || !Array.isArray(c.participants)) return false

  return c.participants
    .filter(p => {
      const pid = String(p._id || p.id || '')
      const mid = String(myId.value || '')
      return pid && mid && pid !== mid
    })
    .some(p => p.isOnline)
}

function onInputTyping() {
  if (!selected.value || !socket.value || !socket.value.connected) return

  socket.value.emit('typing', {
    conversationId: selected.value._id,
    isTyping: true,
  })

  clearTimeout(typingTimer)
  typingTimer = setTimeout(() => {
    onStopTyping()
  }, 2000)
}

function onStopTyping() {
  if (!selected.value || !socket.value || !socket.value.connected) return

  socket.value.emit('typing', {
    conversationId: selected.value._id,
    isTyping: false,
  })
}

function isMine(m) {
  if (!m || !myId.value) return false

  const senderId =
    (m.sender && (m.sender._id || m.sender.id)) || m.sender

  return String(senderId) === String(myId.value)
}

async function sendMessage() {
  if (!selected.value) return

  const content = newMessage.value.trim()

  // On autorise : texte seul, fichiers seuls, ou les deux
  if (!content && !pendingFiles.value.length) return

  const convId = selected.value._id

  // on stoppe le "typing"
  onStopTyping()

  // on vide immédiatement le champ texte (UX)
  newMessage.value = ''

  const token = auth.accessToken?.value || auth.accessToken
  if (!token) return

  try {
    // 1) upload des fichiers
    const attachmentIds = await uploadPendingFiles()
    pendingFiles.value = []

    // 2) création du message côté back
    const payload = {
      conversation_id: convId,
      content,
      attachments: attachmentIds,
    }

    const res = await api.post('/messages', payload, token)

    if (res) {
      // 3) on met à jour le store
      //    (si le socket l'a déjà inséré, addMessage va MERGER et pas dupliquer)
      convoStore.addMessage({
        ...res,
        conversationId: convId,
      })

      // 4) si la conversation affichée est celle-là, on la resynchronise
      const fresh = convoStore.conversations.find(
        c => String(c._id) === String(convId)
      )
      if (fresh) {
        selected.value = fresh
      }

      nextTick(() => scrollToBottom())
    }
  } catch (e) {
    // ici tu peux logguer ou afficher une notif
    console.error('Erreur sendMessage', e)
  }
}


function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return (
    d.getHours().toString().padStart(2, '0') +
    ':' +
    d.getMinutes().toString().padStart(2, '0')
  )
}

function shortTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function scrollToBottom() {
  const el = messagesArea.value
  if (!el) return
  el.scrollTop = el.scrollHeight + 100
}

function goTo(path) {
  router.push(path)
}

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}

function isArchived(id) {
  return convoStore.archived.has(id)
}

function toggleArchive(c) {
  if (isArchived(c._id)) convoStore.unarchive(c._id)
  else convoStore.archive(c._id)
}

function removeConversation(c) {
  convoStore.remove(c._id)
  if (selected.value?._id === c._id) {
    selected.value = null
    newMessage.value = ''
    pendingFiles.value = []
  }
}

async function refresh() {
  const token = auth.accessToken?.value || auth.accessToken
  if (!token) return
  await convoStore.fetchConversations(token)
  joinAllConversations()
  if (!selected.value && convoStore.conversations.length) {
    selectChat(convoStore.conversations[0])
  }
}

async function searchUsers() {
  if (userSearchTimer.value) clearTimeout(userSearchTimer.value)
  userSearchTimer.value = setTimeout(async () => {
    const token = auth.accessToken?.value || auth.accessToken
    if (!token) {
      userResults.value = []
      return
    }
    const q = userSearch.value.trim()
    let res = []
    if (q) {
      res = await api.get(
        `/users/search?q=${encodeURIComponent(q)}`,
        token
      )
    } else {
      res = await api.get('/users?limit=10', token)
    }
    userResults.value = res?.users || res?.data || res || []
  }, 200)
}

async function startConversation(user) {
  const token = auth.accessToken?.value || auth.accessToken
  if (!token) return
  const participants = []
  if (user?._id) {
    participants.push(user._id)
  } else {
    participants.push(...selectedUsers.value)
  }
  if (!participants.length) return
  newConvoLoading.value = true
  try {
    const conv = await convoStore.createConversation(participants, token)
    if (conv) {
      emitJoin(conv._id)
      showNewDialog.value = false
      userSearch.value = ''
      userResults.value = []
      selectedUsers.value = []
      selectChat(conv)
    }
  } finally {
    newConvoLoading.value = false
  }
}

function openNewDialog() {
  showNewDialog.value = true
  userSearch.value = ''
  userResults.value = []
  selectedUsers.value = []
  searchUsers()
}

function isSelected(id) {
  return selectedUsers.value.includes(id)
}

function toggleUser(u) {
  if (!u?._id) return
  if (isSelected(u._id)) {
    selectedUsers.value = selectedUsers.value.filter(x => x !== u._id)
  } else {
    selectedUsers.value = [...selectedUsers.value, u._id]
  }
}

function removeSelected(id) {
  selectedUsers.value = selectedUsers.value.filter(x => x !== id)
}

function userLabel(id) {
  const u = userResults.value.find(x => x._id === id)
  return u?.name || 'Utilisateur'
}

function setupSocket() {
  if (isSocketReady.value || socket.value) return

  const token = auth.accessToken?.value || auth.accessToken
  if (!token) return

  const s = connect()
  if (!s) return

  s.on('connect', () => {
    isSocketReady.value = true
    joinAllConversations()
    s.emit('request-missed-messages', {
      lastMessageTimestamp: Date.now() - 1000 * 60 * 60 * 24,
    })
  })

  s.on('disconnect', () => {
    isSocketReady.value = false
  })

  s.on('user-status', payload => {
    const { userId, isOnline, lastSeen } = payload || {}
    if (!userId) return

    convoStore.updateUserStatus(userId, isOnline, lastSeen)

    const myIdStr = String(myId.value || '')
    if (myIdStr && myIdStr === String(userId)) {
      if (auth.user) {
        auth.user.isOnline = !!isOnline
        if (lastSeen) {
          auth.user.lastSeen = lastSeen
        }
      }
    }
  })

  s.on('connect_error', err => {
    isSocketReady.value = false
    console.error('Erreur socket :', err?.message || err)
  })

  s.on('conversation-created', conv => {
    convoStore.upsertConversation(conv)
  })

  s.on('user-typing', ({ conversationId, senderId, isTyping }) => {
    if (!conversationId || !senderId) return

    const convKey = String(conversationId)
    const current = typingState.value[convKey] || {}

    if (isTyping) {
      typingState.value = {
        ...typingState.value,
        [convKey]: {
          ...current,
          [senderId]: true,
        },
      }
    } else {
      const { [senderId]: _, ...rest } = current
      typingState.value = {
        ...typingState.value,
        [convKey]: rest,
      }
    }
  })

  s.on('receive-message', message => {
    const convId =
      message.conversation?._id ||
      message.conversation ||
      message.conversationId

    if (!convId) return

    // 1) On met à jour le store (dedup via _id géré par addMessage)
    convoStore.addMessage({
      ...message,
      conversationId: convId,
    })

    // 2) Si la conv affichée est celle-là, on resynchronise selected
    if (selected.value && String(selected.value._id) === String(convId)) {
      const fresh = convoStore.conversations.find(
        c => String(c._id) === String(convId)
      )
      if (fresh) {
        selected.value = fresh
      }
      nextTick(() => scrollToBottom())
    }
  })

  s.on('missed-messages', data => {
    ; (data?.messages || []).forEach(m => {
      const convId =
        m.conversation?._id || m.conversation || m.conversationId
      convoStore.addMessage({
        ...m,
        conversationId: convId,
      })
    })
  })
}

function emitJoin(conversationId) {
  if (socket.value && socket.value.connected) {
    socket.value.emit('join-conversation', { conversationId })
  }
}

function emitMarkRead(conversationId) {
  if (socket.value && socket.value.connected) {
    socket.value.emit('mark-conversation-as-read', { conversationId })
  }
}

function joinAllConversations() {
  convoStore.conversations.forEach(c => emitJoin(c._id))
}

function fileUrl(path) {
  return api.buildFileUrl(path)
}

function openAttachment(att) {
  const url = fileUrl(att.url)
  if (!url) return
  window.open(url, '_blank', 'noopener')
}

watchEffect(() => {
  if (!auth.isAuthenticated?.value) {
    router.push('/login')
  }
})

watch(selected, val => {
  if (!val) {
    newMessage.value = ''
    pendingFiles.value = []
  }
})

onMounted(async () => {
  setupSocket()
  await refresh()
})

onBeforeUnmount(() => {
  clearTimeout(typingTimer)
  disconnect()
})
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
  background: #ece5dd;
}

.pl-5 {
  padding-left: 20px;
}

.whatsapp-card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  background: #fff;
}

.list-card {
  height: 100%;
}

.whatsapp-header,
.chat-header {
  background: #075e54;
  color: #fff;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.messages-area {
  position: relative;
  height: calc(100vh - 260px);
  overflow-y: auto;
  padding: 16px;
  background-image: linear-gradient(180deg,
      rgba(0, 0, 0, 0.02),
      transparent);
}

.message-row {
  display: flex;
  margin: 8px 0;
}

.message-me {
  justify-content: flex-end;
}

.message-other {
  justify-content: flex-start;
}

.message-bubble {
  max-width: 70%;
  padding: 8px 12px;
  border-radius: 12px;
  background: #dcf8c6;
  position: relative;
  font-size: 14px;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.06);
  word-wrap: break-word;
}

.message-other .message-bubble {
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.message-time {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.45);
  margin-top: 6px;
  text-align: right;
}

.chat-card .v-text-field {
  background: transparent;
}

.active-convo {
  background: rgba(7, 94, 84, 0.06);
}

.unread-count {
  font-size: 12px;
  color: #fff;
  padding: 2px 6px;
  background: #25d366;
  border-radius: 12px;
}

.empty-chat {
  padding: 40px;
  color: rgba(0, 0, 0, 0.6);
  text-align: center;
}

.convo-list-item {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 8px;
  transition: background 0.15s;
  background: #fff;
}

.active-convo.convo-list-item {
  background: rgba(7, 94, 84, 0.06);
  border-color: #25d366;
}

:deep(.v-avatar img) {
  object-fit: cover;
  width: 100%;
  height: 100%;
}

.user-result {
  border: 1px solid #e5e5e5;
  margin-bottom: 6px;
  border-radius: 8px;
}

.user-result.selected {
  border-color: #25d366;
  background: rgba(37, 211, 102, 0.08);
}

.selected-chips {
  display: flex;
  flex-wrap: wrap;
}

.chip-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #bdbdbd;
  display: inline-block;
}

.status-dot.online {
  background: #25d366;
}

.status-text {
  font-size: 12px;
  color: #4f4f4f;
}

.time {
  font-size: 12px;
  color: #e0e0e0;
}

.new-btn {
  background: rgba(255, 255, 255, 0.1);
}

.dropzone-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
  font-weight: 500;
  pointer-events: none;
}

/* FICHIERS EN ATTENTE AU-DESSUS DU TEXTE */
.pending-attachments {
  padding: 4px 16px 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.pending-attachment-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  background: rgba(37, 211, 102, 0.12);
  font-size: 12px;
}

/* ATTACHMENTS DANS LES BULLES */
.message-attachments {
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.attachment-item {
  max-width: 240px;
}

.attachment-image {
  max-width: 100%;
  border-radius: 6px;
  cursor: pointer;
  display: block;
}

.attachment-link {
  font-size: 12px;
  text-decoration: none;
  color: #075e54;
  background: rgba(7, 94, 84, 0.08);
  padding: 4px 8px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>
