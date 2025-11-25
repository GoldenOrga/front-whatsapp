// src/stores/conversations.js
import { defineStore } from 'pinia'
import { reactive, computed } from 'vue'
import api from '../services/api'

export const useConversationsStore = defineStore('conversations', () => {
  const state = reactive({
    conversations: [],
    archived: new Set(),
    loading: false,
    error: null,
    messagesLoading: new Map(), // conversationId -> bool
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
          ? c.participants.map(p => (p.name || '').toLowerCase()).join(' ')
          : ''
        return (
          (c.name || '').toLowerCase().includes(q) ||
          (c.lastMessage?.content || '').toLowerCase().includes(q) ||
          participantNames.includes(q)
        )
      })
  }

  const all = computed(() => state.conversations)

  function bumpConversationToTop(id) {
    const idx = state.conversations.findIndex(c => c._id === id)
    if (idx > 0) {
      const [conv] = state.conversations.splice(idx, 1)
      state.conversations.unshift(conv)
    }
  }

  async function fetchConversations(token) {
    state.loading = true
    state.error = null
    try {
      const data = await api.get('/messages/conversations', token)
      const list = Array.isArray(data) ? data : data?.conversations || []

      state.conversations = list.map(raw => {
        const lastMsg = raw.lastMessage || null
        return {
          _id: raw._id,
          name: raw.conversationName || raw.name || '',
          avatar: raw.avatar || null,
          participants: raw.participants || [],
          isGroup: !!raw.isGroup,
          lastMessage: lastMsg
            ? {
              _id: lastMsg._id,
              content: lastMsg.content,
              createdAt: lastMsg.createdAt,
              sender: lastMsg.sender,
            }
            : null,
          unread: raw.unreadCount ?? 0,
          updatedAt: raw.updatedAt,
          messages: [],
        }
      })
    } catch (err) {
      state.error = err?.message || 'Impossible de charger les conversations'
    } finally {
      state.loading = false
    }
  }

  async function fetchMessages(conversationId, token, page = 1) {
    if (!conversationId || !token) return
    if (state.messagesLoading.get(conversationId)) return

    state.messagesLoading.set(conversationId, true)
    try {
      const data = await api.get(
        `/messages/conversation/${conversationId}?page=${page}`,
        token
      )
      const messages = Array.isArray(data) ? data : data?.messages || []

      const conv = state.conversations.find(c => c._id === conversationId)
      if (!conv) return

      conv.messages = messages
      conv.unread = 0
    } finally {
      state.messagesLoading.set(conversationId, false)
    }
  }

  function markRead(id) {
    const conv = state.conversations.find(c => c._id === id)
    if (conv) conv.unread = 0
  }

  function addMessage(message) {
    const conv = state.conversations.find(c => c._id === message.conversationId)
    if (conv) {
      conv.messages = conv.messages || []

      const existsIdx = conv.messages.findIndex(m => m._id === message._id)
      if (existsIdx >= 0) {
        conv.messages[existsIdx] = { ...conv.messages[existsIdx], ...message }
      } else {
        conv.messages.push(message)
      }

      conv.lastMessage = {
        _id: message._id,
        content: message.content,
        createdAt: message.createdAt,
        sender: message.sender,
      }

      conv.updatedAt = message.createdAt
      bumpConversationToTop(conv._id)
      return
    }

    // conversation inconnue
    state.conversations.unshift({
      _id: message.conversationId,
      name: 'Nouvelle conversation',
      avatar: null,
      participants: [],
      isGroup: false,
      messages: [message],
      lastMessage: {
        _id: message._id,
        content: message.content,
        createdAt: message.createdAt,
        sender: message.sender,
      },
      unread: 0,
      updatedAt: message.createdAt,
    })
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
        const raw = conv
        const lastMsg = raw.lastMessage || null
        const formatted = {
          _id: raw._id,
          name: raw.conversationName || raw.name || '',
          avatar: raw.avatar || null,
          participants: raw.participants || [],
          isGroup: !!raw.isGroup,
          lastMessage: lastMsg
            ? {
              _id: lastMsg._id,
              content: lastMsg.content,
              createdAt: lastMsg.createdAt,
              sender: lastMsg.sender,
            }
            : null,
          unread: raw.unreadCount ?? 0,
          updatedAt: raw.updatedAt,
          messages: [],
        }
        state.conversations.unshift(formatted)
        return formatted
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
    fetchMessages,
    markRead,
    addMessage,
    archive,
    unarchive,
    remove,
    createConversation,
  }
})
