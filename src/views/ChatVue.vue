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
            <v-text-field
              v-model="search"
              placeholder="Rechercher ou démarrer une discussion"
              dense
              hide-details
              rounded
              prepend-inner-icon="mdi-magnify"
            />
            <v-select
              v-model="filter"
              :items="filterItems"
              density="compact"
              hide-details
              variant="outlined"
              class="mt-2"
              label="Filtrer"
            />
            <div class="chip-row mt-2">
              <v-chip
                v-for="opt in quickFilters"
                :key="opt.value"
                size="small"
                :color="filter === opt.value ? 'primary' : ''"
                variant="tonal"
                @click="filter = opt.value"
              >
                {{ opt.label }}
              </v-chip>
            </div>

            <!-- LISTE DES CONVERSATIONS -->
            <v-list dense nav class="mt-2 convo-list">
              <v-list-item
                v-for="c in filteredList"
                :key="c._id"
                :value="c._id"
                @click="selectChat(c)"
                :class="['convo-list-item', { 'active-convo': selected && selected._id === c._id }]"
              >
                <!-- Avatar (Vuetify 3 : slot prepend) -->
                <template #prepend>
                  <v-avatar size="40">
                    <img :src="avatarUrl(c)" alt="" />
                  </v-avatar>
                </template>

                <!-- Contenu principal -->
                <div class="w-100">
                  <div class="d-flex align-center justify-space-between">
                    <div class="d-flex align-center">
                      <span>{{ displayName(c) }}</span>
                      <v-chip
                        v-if="c.isGroup"
                        size="x-small"
                        class="ml-2"
                        color="primary"
                        variant="tonal"
                      >
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

                <!-- Actions (Vuetify 3 : slot append) -->
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
            <v-avatar size="40">{{ selected ? avatarInitials(selected) : 'U' }}</v-avatar>
            <div class="ml-3">
              <div class="title">
                {{ selected ? displayName(selected) : 'Sélectionnez une discussion' }}
              </div>
              <div class="subtitle">
                <template v-if="selected">
                  <span v-if="typingLabel">{{ typingLabel }}</span>
                  <span v-else>{{ selected.isGroup ? 'Groupe' : 'Privé' }}</span>
                </template>
              </div>
            </div>
            <v-spacer></v-spacer>
            <div class="d-flex align-center">
              <v-menu>
                <template #activator="{ props }">
                  <!-- Bouton activator propre Vuetify 3 -->
                  <v-btn
                    v-bind="props"
                    icon
                    class="mr-2"
                    variant="text"
                  >
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

          <v-card-text class="messages-area" ref="messagesArea">
            <div v-if="!selected" class="empty-chat">
              Sélectionnez une conversation à gauche pour commencer.
            </div>

            <div v-else class="messages">
              <div
                v-for="(m, idx) in selected.messages || []"
                :key="m._id || m.id || idx"
                :class="['message-row', isMine(m) ? 'message-me' : 'message-other']"
              >
                <div class="message-bubble">
                  <div class="message-text">{{ m.content }}</div>
                  <div class="message-time">{{ formatTime(m.createdAt) }}</div>
                </div>
              </div>
            </div>
          </v-card-text>

          <v-divider></v-divider>

          <v-card-actions class="p-3">
            <v-text-field
              v-model="newMessage"
              placeholder="Écrire un message"
              dense
              hide-details
              rounded
              class="flex-grow-1"
              @keyup.enter="sendMessage"
              @input="onInputTyping"
              @blur="onStopTyping"
            />
            <v-btn icon color="green" @click="sendMessage">
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
            <v-chip
              v-for="id in selectedUsers"
              :key="id"
              size="small"
              class="mr-2 mb-2"
              closable
              @click:close="removeSelected(id)"
            >
              {{ userLabel(id) }}
            </v-chip>
          </div>
          <v-text-field
            v-model="userSearch"
            label="Rechercher un utilisateur"
            dense
            prepend-inner-icon="mdi-magnify"
            @keyup="searchUsers"
          />

          <!-- LISTE DES UTILISATEURS (dialog) -->
          <v-list v-if="userResults.length">
            <v-list-item
              v-for="u in userResults"
              :key="u._id"
              @click="toggleUser(u)"
              :class="['user-result', { selected: isSelected(u._id) }]"
            >
              <!-- Avatar (slot prepend) -->
              <template #prepend>
                <v-avatar size="36">
                  <img :src="u.avatar || fallbackAvatar" alt="" />
                </v-avatar>
              </template>

              <!-- Contenu -->
              <div>
                <v-list-item-title>{{ u.name }}</v-list-item-title>
                <v-list-item-subtitle>{{ u.email }}</v-list-item-subtitle>
              </div>

              <!-- Icône check (slot append) -->
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
          <v-btn
            color="primary"
            :disabled="!selectedUsers.length || newConvoLoading"
            :loading="newConvoLoading"
            @click="startConversation"
          >
            Démarrer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watchEffect, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useConversationsStore } from '../stores/conversations'
import api from '../services/api'
import { useSocket } from '../composables/useSocket'

const router = useRouter()
const auth = useAuthStore()
const myId = computed(() => auth.user?._id || auth.user?.id)
const convoStore = useConversationsStore()
const { socket, connect, disconnect } = useSocket(auth.accessToken?.value || auth.accessToken)

const fallbackAvatar = 'https://api.dicebear.com/6.x/initials/svg?seed=default'

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

// Typing : conversationId -> { userId: true }
const typingState = ref({})
let typingTimer = null

const filteredList = computed(() => convoStore.filtered(search.value, filter.value))

const typingLabel = computed(() => {
  if (!selected.value) return ''

  const convId = String(selected.value._id || '')
  if (!convId) return ''

  const usersMap = typingState.value[convId]
  if (!usersMap) return ''

  const ids = Object.keys(usersMap).filter(id => id && id !== String(myId.value || ''))
  if (!ids.length) return ''

  const participants = selected.value.participants || []
  const names = ids
    .map(id => {
      const p = participants.find(u => String(u._id || u.id) === id)
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

  selected.value = c
  convoStore.markRead(c._id)
  emitJoin(c._id)
  emitMarkRead(c._id)

  const token = auth.accessToken?.value || auth.accessToken
  if (token && (!c.messages || !c.messages.length)) {
    await convoStore.fetchMessages(c._id, token)
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

/**
 * Gestion du "typing" côté front :
 *  - onInputTyping() => emit('typing', { conversationId, isTyping: true })
 *  - timeout 2s => emit('typing', { isTyping: false })
 *  - onStopTyping() (blur) => isTyping: false
 */
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

/**
 *  - mes messages : sender._id === auth.user._id => côté droit (vert)
 *  - les autres : côté gauche (gris)
 */
function isMine(m) {
  if (!m || !myId.value) return false

  const senderId =
    (m.sender && (m.sender._id || m.sender.id)) || m.sender

  return String(senderId) === String(myId.value)
}

async function sendMessage() {
  if (!selected.value || !newMessage.value.trim()) return

  const content = newMessage.value.trim()
  const tempId = `tmp-${Date.now()}`

  const tempMsg = {
    _id: tempId,
    content,
    createdAt: new Date().toISOString(),
    status: 'pending',
    sender: {
      _id: myId.value,
      name: auth.user?.name,
      avatar: auth.user?.avatar,
    },
    conversation: selected.value._id,
  }

  selected.value.messages = selected.value.messages || []
  selected.value.messages.push(tempMsg)
  selected.value.lastMessage = {
    content: tempMsg.content,
    createdAt: tempMsg.createdAt,
  }
  newMessage.value = ''
  nextTick(() => scrollToBottom())

  // on arrête le "typing" dès qu'on envoie
  onStopTyping()

  const token = auth.accessToken?.value || auth.accessToken
  const canUseSocket = socket.value && socket.value.connected

  const sendViaHttp = async () => {
    if (!token) return
    try {
      const res = await api.post(
        '/messages',
        { conversation_id: selected.value._id, content },
        token
      )
      if (res) {
        const idx = selected.value.messages.findIndex(m => m._id === tempId)
        if (idx !== -1) {
          selected.value.messages[idx] = res
        }
      }
    } catch (e) {
      tempMsg.status = 'error'
    }
  }

  if (canUseSocket) {
    socket.value.emit(
      'send-message',
      { conversationId: selected.value._id, content },
      ack => {
        if (ack?.messageId) {
          tempMsg._id = ack.messageId
        }
      }
    )
  } else {
    await sendViaHttp()
  }
}

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0')
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
  if (selected.value?._id === c._id) selected.value = null
}

async function refresh() {
  const token = auth.accessToken?.value || auth.accessToken
  if (!token) return
  await convoStore.fetchConversations(token)
  joinAllConversations()
  if (!selected.value && convoStore.conversations.length) selectChat(convoStore.conversations[0])
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
      res = await api.get(`/users/search?q=${encodeURIComponent(q)}`, token)
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

  // Conversation créée ailleurs (via contrôleur HTTP + getIo())
  s.on('conversation-created', conv => {
    convoStore.upsertConversation(conv)
  })

  // Indicateur "user-typing" venant du back
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

  // Réception temps réel des messages
  s.on('receive-message', message => {
    const convId =
      message.conversation?._id || message.conversation || message.conversationId

    convoStore.addMessage({
      ...message,
      conversationId: convId,
    })

    if (selected.value?._id === convId) {
      selected.value.messages = selected.value.messages || []
      const exists = selected.value.messages.some(m => m._id === message._id)
      if (!exists) {
        selected.value.messages.push(message)
      }
      nextTick(() => scrollToBottom())
    }
  })

  s.on('missed-messages', data => {
    ;(data?.messages || []).forEach(m => {
      const convId = m.conversation?._id || m.conversation || m.conversationId
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

watchEffect(() => {
  if (!auth.isAuthenticated?.value) {
    router.push('/login')
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
  height: calc(100vh - 220px);
  overflow-y: auto;
  padding: 16px;
  background-image: linear-gradient(180deg, rgba(0, 0, 0, 0.02), transparent);
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
</style>
