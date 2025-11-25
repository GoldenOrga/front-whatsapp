import { io } from 'socket.io-client'

export function createSocket(token) {
  if (!token) return null
  return io(import.meta.env.VITE_SOCKET_URL || 'https://backwatshap-production.up.railway.app/', {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  })
}
