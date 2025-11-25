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

  /**
   * Formate une conversation venant du back
   * pour l'adapter à ce que le front attend.
   */
  function formatConversation(raw) {
    if (!raw) return null

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
      unread: raw.unreadCount ?? raw.unread ?? 0,
      updatedAt: raw.updatedAt || lastMsg?.createdAt || raw.createdAt,
      messages: Array.isArray(raw.messages) ? raw.messages : [],
    }
  }

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

      state.conversations = list
        .map(formatConversation)
        .filter(Boolean)
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
    const convId = String(message.conversationId || (message.conversation && message.conversation._id) || '')
    if (!convId) return

    const conv = state.conversations.find(c => String(c._id) === convId)
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

    // conversation inconnue → on crée une entrée minimale
    state.conversations.unshift({
      _id: convId,
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

  /**
   * Création via HTTP (quand c'est toi qui crées la conversation)
   */
  async function createConversation(participantIds, token, name = '') {
    state.loading = true
    state.error = null
    try {
      const body = { participantIds, name }
      const conv = await api.post('/messages/conversations', body, token)
      if (conv) {
        const formatted = formatConversation(conv)
        if (formatted) {
          state.conversations.unshift(formatted)
          return formatted
        }
      }
      return null
    } catch (err) {
      state.error = err?.message || 'Impossible de créer la conversation'
      throw err
    } finally {
      state.loading = false
    }
  }

  /**
   * Upsert utilisé par le websocket `conversation-created`
   * - si la conversation n'existe pas → on l'ajoute en haut
   * - si elle existe → on met à jour ses métadonnées mais on garde les messages existants
   */
  function upsertConversation(raw) {
    const formatted = formatConversation(raw)
    if (!formatted) return

    const idx = state.conversations.findIndex(c => String(c._id) === String(formatted._id))

    if (idx === -1) {
      state.conversations.unshift(formatted)
      return
    }

    const existing = state.conversations[idx]
    state.conversations[idx] = {
      ...formatted,
      // on garde les messages déjà chargés si on en a
      messages: existing.messages && existing.messages.length
        ? existing.messages
        : formatted.messages,
      unread: formatted.unread ?? existing.unread ?? 0,
    }

    bumpConversationToTop(formatted._id)
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
    upsertConversation,
  }
})
