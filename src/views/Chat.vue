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

            <v-list dense nav class="mt-2 convo-list">
              <v-list-item
                v-for="c in filteredList"
                :key="c._id"
                :value="c._id"
                @click="selectChat(c)"
                :class="['convo-list-item', { 'active-convo': selected && selected._id === c._id }]"
              >
                <v-list-item-avatar>
                  <v-avatar size="40">
                    <img :src="avatarUrl(c)" alt="" />
                  </v-avatar>
                </v-list-item-avatar>

                <v-list-item-content>
                  <v-list-item-title class="d-flex align-center justify-space-between">
                    <div class="d-flex align-center">
                      <span>{{ c.name || 'Conversation' }}</span>
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
                  </v-list-item-title>
                  <v-list-item-subtitle class="truncate">
                    {{ c.lastMessage?.content || 'Aucun message' }}
                  </v-list-item-subtitle>
                  <div class="status-row">
                    <span class="status-dot" :class="{ online: c.online }"></span>
                    <span class="status-text">{{ c.online ? 'En ligne' : 'Hors ligne' }}</span>
                  </div>
                </v-list-item-content>

                <v-list-item-action class="d-flex align-center" style="gap: 6px;">
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
                </v-list-item-action>
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
              <div class="title">{{ selected ? selected.name : 'Sélectionnez une discussion' }}</div>
              <div class="subtitle">{{ selected ? (selected.isGroup ? 'Groupe' : 'Privé') : '' }}</div>
            </div>
            <v-spacer></v-spacer>
            <div class="d-flex align-center">
              <v-menu>
                <template #activator="{ props }">
                  <v-avatar
                    v-bind="props"
                    size="36"
                    class="mr-2 clickable"
                  >
                    <img :src="auth.user?.avatar || fallbackAvatar" alt="moi" />
                  </v-avatar>
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
                v-for="m in selected.messages || []"
                :key="m._id || m.id"
                :class="['message-row', m.me ? 'message-me' : 'message-other']"
              >
                <div class="message-bubble">
                  <div class="message-text">{{ m.content || m.text }}</div>
                  <div class="message-time">{{ formatTime(m.createdAt || m.time) }}</div>
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
            />
            <v-btn icon color="green" @click="sendMessage">
              <v-icon>mdi-send</v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

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
          <v-list v-if="userResults.length">
            <v-list-item
              v-for="u in userResults"
              :key="u._id"
              @click="toggleUser(u)"
              :class="['user-result', { selected: isSelected(u._id) }]"
            >
              <v-list-item-avatar>
                <v-avatar size="36">
                  <img :src="u.avatar || fallbackAvatar" alt="" />
                </v-avatar>
              </v-list-item-avatar>
              <v-list-item-title>{{ u.name }}</v-list-item-title>
              <v-list-item-subtitle>{{ u.email }}</v-list-item-subtitle>
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
import { ref, computed, onMounted, nextTick, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useConversationsStore } from '../stores/conversations'
import api from '../services/api'

const router = useRouter()
const auth = useAuthStore()
const convoStore = useConversationsStore()

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

const filteredList = computed(() => convoStore.filtered(search.value, filter.value))

function selectChat(c) {
  selected.value = c
  convoStore.markRead(c._id)
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

function avatarUrl(c) {
  if (c.avatar) return c.avatar
  const firstUser = Array.isArray(c.participants) ? c.participants[0] : null
  return firstUser?.avatar || fallbackAvatar
}

function sendMessage() {
  if (!selected.value || !newMessage.value.trim()) return
  const msg = {
    id: Date.now(),
    content: newMessage.value.trim(),
    time: Date.now(),
    me: true,
  }
  selected.value.messages = selected.value.messages || []
  selected.value.messages.push(msg)
  selected.value.lastMessage = { content: msg.content }
  newMessage.value = ''
  nextTick(() => scrollToBottom())
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

watchEffect(() => {
  if (!auth.isAuthenticated?.value) {
    router.push('/login')
  }
})

onMounted(async () => {
  await refresh()
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
