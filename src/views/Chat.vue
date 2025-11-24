<template>
    <v-container fluid class="fill-height chat-page">
        <v-row no-gutters>
            <!-- Left: Conversations list -->
            <v-col cols="12" md="4" class="convo-col">
                <v-card class="whatsapp-card list-card" height="100%">
                    <v-card-title class="whatsapp-header list-header">
                        <v-avatar class="logo-avatar" size="40">WA</v-avatar>
                        <div>
                            <div class="title">Conversations</div>
                        </div>
                    </v-card-title>

                    <v-card-text>
                        <v-text-field v-model="filter" placeholder="Rechercher ou démarrer une nouvelle discussion"
                            dense hide-details rounded append-inner-icon="mdi-magnify" />
                        <!-- Ajout d'un espace -->
                        <div style="height: 12px;"></div>
                        <v-subheader class="mt-2">Favoris</v-subheader>
                        <!-- Favoris - example -->
                        <v-list dense nav>
                            <v-list-item v-for="c in filteredChats" :key="c.id" :value="c.id" @click="selectChat(c.id)"
                                :class="['convo-list-item', { 'active-convo': selected && selected.id === c.id }]">
                                <v-list-item-avatar>
                                    <v-avatar size="40">{{ avatarInitials(c) }}</v-avatar>
                                </v-list-item-avatar>

                                <v-list-item-content>
                                    <v-list-item-title>{{ c.name }}</v-list-item-title>
                                    <v-list-item-subtitle class="truncate">{{ c.lastMessage }}</v-list-item-subtitle>
                                </v-list-item-content>

                                <v-list-item-action>
                                    <v-badge v-if="c.unread" color="green" dot>
                                        <span class="unread-count">{{ c.unread }}</span>
                                    </v-badge>
                                </v-list-item-action>
                            </v-list-item>
                        </v-list>
                    </v-card-text>
                </v-card>
            </v-col>

            <!-- Right: Chat window -->
            <v-col cols="12" md="8" class="chat-col pl-5">
                <v-card class="whatsapp-card chat-card" height="100%">
                    <v-card-title class="chat-header">
                        <v-avatar size="40">{{ selected ? avatarInitials(selected) : 'U' }}</v-avatar>
                        <div class="ml-3">
                            <div class="title">{{ selected ? selected.name : 'Sélectionnez une discussion' }}</div>
                            <div class="subtitle">{{ selected ? (selected.isGroup ? 'Groupe' : 'Privé') : '' }}</div>
                        </div>
                        <v-spacer></v-spacer>
                        <v-btn icon small>
                            <v-icon>mdi-dots-vertical</v-icon>
                        </v-btn>
                    </v-card-title>

                    <v-divider></v-divider>

                    <v-card-text class="messages-area" ref="messagesArea">
                        <div v-if="!selected" class="empty-chat">
                            Sélectionnez une conversation à gauche pour commencer.
                        </div>

                        <div v-else class="messages">
                            <div v-for="m in selected.messages" :key="m.id"
                                :class="['message-row', m.me ? 'message-me' : 'message-other']">
                                <div class="message-bubble">
                                    <div class="message-text">{{ m.text }}</div>
                                    <div class="message-time">{{ formatTime(m.time) }}</div>
                                </div>
                            </div>
                        </div>
                    </v-card-text>

                    <v-divider></v-divider>

                    <v-card-actions class="p-3">
                        <v-text-field v-model="newMessage" placeholder="Écrire un message" dense hide-details rounded
                            class="flex-grow-1" @keyup.enter="sendMessage" />
                        <v-btn icon color="green" @click="sendMessage">
                            <v-icon>mdi-send</v-icon>
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'

// Mock data
const chats = reactive([
    {
        id: 'c1',
        name: 'Famille',
        isGroup: true,
        lastMessage: 'On se voit ce soir ?',
        unread: 2,
        messages: [
            { id: 1, from: 'Alice', text: 'Salut tout le monde', time: Date.now() - 1000 * 60 * 60 * 5, me: false },
            { id: 2, from: 'Me', text: 'Oui à 20h', time: Date.now() - 1000 * 60 * 60 * 4, me: true },
            { id: 3, from: 'Bob', text: 'Parfait', time: Date.now() - 1000 * 60 * 10, me: false },
        ],
    },
    {
        id: 'c2',
        name: 'Claire',
        isGroup: false,
        lastMessage: 'Ok merci !',
        unread: 0,
        messages: [
            { id: 1, from: 'Claire', text: 'Tu viens demain ?', time: Date.now() - 1000 * 60 * 60 * 24, me: false },
            { id: 2, from: 'Me', text: 'Je pense que oui', time: Date.now() - 1000 * 60 * 60 * 23, me: true },
        ],
    },
    {
        id: 'c3',
        name: 'Projet X',
        isGroup: true,
        lastMessage: 'Merge request prête',
        unread: 1,
        messages: [
            { id: 1, from: 'Dev', text: 'J\'ai push', time: Date.now() - 1000 * 60 * 30, me: false },
        ],
    },
])

const filter = ref('')
const selected = ref(null)
const newMessage = ref('')
const messagesArea = ref(null)

// computed filtered list
const filteredChats = computed(() => {
    const q = filter.value.trim().toLowerCase()
    if (!q) return chats
    return chats.filter(c => c.name.toLowerCase().includes(q) || (c.lastMessage || '').toLowerCase().includes(q))
})

function selectChat(id) {
    const c = chats.find(x => x.id === id)
    if (c) {
        selected.value = c
        // mark as read
        c.unread = 0
        // scroll to bottom
        nextTick(() => scrollToBottom())
    }
}

function avatarInitials(c) {
    if (!c || !c.name) return 'U'
    return c.name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()
}

function sendMessage() {
    if (!selected.value || !newMessage.value.trim()) return
    const msg = {
        id: Date.now(),
        from: 'Me',
        text: newMessage.value.trim(),
        time: Date.now(),
        me: true,
    }
    selected.value.messages.push(msg)
    selected.value.lastMessage = msg.text
    newMessage.value = ''
    nextTick(() => scrollToBottom())
}

function formatTime(ts) {
    const d = new Date(ts)
    return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0')
}

function scrollToBottom() {
    const el = messagesArea.value
    if (!el) return
    // scroll to bottom
    el.scrollTop = el.scrollHeight + 100
}

onMounted(() => {
    // select first chat by default
    if (chats.length) selectChat(chats[0].id)
})
</script>

<style scoped>
/* filepath: /Users/sohkey/Dev/scool/whatsapp-front/src/views/Chat.vue (styles) */
.fill-height {
    min-height: 100vh;
    background: #ECE5DD;
}

.pl-5 {
    padding-left: 20px;
}

/* reuse whatsapp-card from Auth styles visually; redefine minimal for safety */
.whatsapp-card {
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    background: #fff;
}

/* left column */
.list-card {
    height: 100%;
}

/* headers */
.whatsapp-header,
.chat-header {
    background: #075E54;
    color: #fff;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
}

/* messages area */
.messages-area {
    height: calc(100vh - 220px);
    overflow-y: auto;
    padding: 16px;
    background-image: linear-gradient(180deg, rgba(0, 0, 0, 0.02), transparent);
}

/* message rows */
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
    /* outgoing color */
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

/* input area */
.chat-card .v-text-field {
    background: transparent;
}

/* active convo highlight */
.active-convo {
    background: rgba(7, 94, 84, 0.06);
}

/* small utilities */
.unread-count {
    font-size: 12px;
    color: #fff;
    padding: 2px 6px;
    background: #25D366;
    border-radius: 12px;
}

.empty-chat {
    padding: 40px;
    color: rgba(0, 0, 0, 0.6);
    text-align: center;
}

/* Ajoute une bordure à chaque élément de la liste de discussion */
.convo-list-item {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    margin-bottom: 8px;
    transition: background 0.15s;
    background: #fff;
}

/* Pour éviter que la bordure ne soit masquée par la couleur de sélection */
.active-convo.convo-list-item {
    background: rgba(7, 94, 84, 0.06);
    border-color: #25D366;
}
</style>
