import { ref } from 'vue'
import { createSocket } from '../services/socket'

export function useSocket(token) {
  const socket = ref(null)

  function connect() {
    if (socket.value) return socket.value
    socket.value = createSocket(token)
    return socket.value
  }

  function disconnect() {
    socket.value?.disconnect?.()
    socket.value = null
  }

  return { socket, connect, disconnect }
}
