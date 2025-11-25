import { defineStore } from 'pinia'
import { reactive, computed } from 'vue'
import api from '../services/api'

export const useConversationsStore = defineStore('conversations', () => {
  const state = reactive({
    conversations: [],
    archived: new Set(),
    loading: false,
    error: null,
  })

const filtered = (search = '', filter = 'all') => {
  const q = search.trim().toLowerCase()
  return state.conversations
    .filter(c => {
      if (filter === 'archived' && !state.archived.has(c._id)) return false
      if (filter === 'active' && state.archived.has(c._id)) return false
      return true
    })
    .filter(c => {
      if (!q) return true
      const participantNames = Array.isArray(c.participants)
        ? c.participants.map(p => (p.name || p.email || '').toLowerCase()).join(' ')
        : ''
      return (
        (c.name || '').toLowerCase().includes(q) ||
        (c.lastMessage?.content || '').toLowerCase().includes(q) ||
        participantNames.includes(q)
      )
    })
}

  const all = computed(() => state.conversations)

  async function fetchConversations(token) {
    state.loading = true
    state.error = null
    try {
      const data = await api.get('/messages/conversations', token)
      // normaliser quelques champs pour l'affichage
      state.conversations = Array.isArray(data) ? data : data?.conversations || []
    } catch (err) {
      state.error = err?.message || 'Impossible de charger les conversations'
    } finally {
      state.loading = false
    }
  }

  function markRead(id) {
    const conv = state.conversations.find(c => c._id === id)
    if (conv) conv.unread = 0
  }

  function upsertConversation(conv) {
    if (!conv?._id) return
    const idx = state.conversations.findIndex(c => c._id === conv._id)
    if (idx >= 0) {
      state.conversations[idx] = { ...state.conversations[idx], ...conv }
    } else {
      state.conversations.unshift(conv)
    }
  }

  function addMessage(message) {
    if (!message?.conversationId) return
    const conv = state.conversations.find(c => c._id === message.conversationId)
    if (conv) {
      conv.messages = conv.messages || []
      conv.messages.push(message)
      conv.lastMessage = { content: message.content, createdAt: message.createdAt }
      if (!message.me) {
        conv.unread = (conv.unread || 0) + 1
      }
    } else {
      state.conversations.unshift({
        _id: message.conversationId,
        name: 'Nouvelle conversation',
        messages: [message],
        lastMessage: { content: message.content, createdAt: message.createdAt },
        unread: message.me ? 0 : 1,
      })
    }
  }

  function archive(id) {
    state.archived.add(id)
  }

  function unarchive(id) {
    state.archived.delete(id)
  }

  function remove(id) {
    state.conversations = state.conversations.filter(c => c._id !== id)
    state.archived.delete(id)
  }

  async function createConversation(participantIds, token, name = '') {
    state.loading = true
    state.error = null
    try {
      const body = { participantIds, name }
      const conv = await api.post('/messages/conversations', body, token)
      if (conv) {
        state.conversations.unshift(conv)
        return conv
      }
      return null
    } catch (err) {
      state.error = err?.message || 'Impossible de créer la conversation'
      throw err
    } finally {
      state.loading = false
    }
  }

  return {
    ...state,
    all,
    filtered,
    fetchConversations,
    markRead,
    upsertConversation,
    addMessage,
    archive,
    unarchive,
    remove,
    createConversation,
  }
})
