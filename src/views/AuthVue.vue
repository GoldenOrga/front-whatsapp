<template>
    <v-container class="fill-height" fluid>
        <v-row align="center" justify="center">
            <v-col cols="12" sm="8" md="6" lg="4">
                <!-- Card styled for WhatsApp look -->
                <v-card class="whatsapp-card">
                    <!-- Updated header with WhatsApp colors + logo -->
                    <div class="whatsapp-header">
                        <v-avatar class="logo-avatar" size="40">WA</v-avatar>
                        <div>
                            <div class="title">WhatsApp Clone</div>
                            <div class="subtitle">Connexion / Inscription</div>
                        </div>
                    </div>

                    <v-tabs v-model="tab" background-color="transparent" grow>
                        <v-tab key="login">Connexion</v-tab>
                        <v-tab key="register">Inscription</v-tab>
                    </v-tabs>

                    <v-divider></v-divider>

                    <!-- Remplacement : n'affiche qu'un formulaire à la fois selon `tab` -->
                    <div v-if="tab === 0">
                        <!-- Connexion -->
                        <v-card-text>
                            <v-form ref="loginForm" @submit.prevent="submitLogin">
                                <v-text-field v-model="login.email" label="Email" type="email"
                                    :rules="[rules.required, rules.email]" dense required />
                                <v-text-field v-model="login.password" label="Mot de passe" type="password"
                                    :rules="[rules.required, rules.min(6)]" dense required />

                                <!-- Boutons : primary full-width + lien secondaire -->
                                <v-row class="mt-4" no-gutters>
                                    <v-col cols="12">
                                        <v-btn class="primary-whatsapp whatsapp-btn" block
                                            @click="() => $refs.loginForm.validate().then(valid => valid && submitLogin())">
                                            Se connecter
                                        </v-btn>
                                    </v-col>
                                </v-row>
                            </v-form>
                        </v-card-text>
                    </div>

                    <div v-if="tab === 1">
                        <!-- Inscription -->
                        <v-card-text>
                            <v-form ref="registerForm" @submit.prevent="submitRegister">
                                <v-text-field v-model="register.name" label="Nom complet" :rules="[rules.required]"
                                    dense required />
                                <v-text-field v-model="register.email" label="Email" type="email"
                                    :rules="[rules.required, rules.email]" dense required />
                                <v-text-field v-model="register.password" label="Mot de passe" type="password"
                                    :rules="[rules.required, rules.min(6)]" dense required />

                                <!-- Boutons : primary full-width + lien secondaire -->
                                <v-row class="mt-4" no-gutters>
                                    <v-col cols="12">
                                        <v-btn class="primary-whatsapp whatsapp-btn" block
                                            @click="() => $refs.registerForm.validate().then(valid => valid && submitRegister())">
                                            S'inscrire
                                        </v-btn>
                                    </v-col>

                                </v-row>
                            </v-form>
                        </v-card-text>
                    </div>

                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup>
import { ref, reactive } from 'vue'

const tab = ref(0) // 0 = login, 1 = register

const login = reactive({
    email: '',
    password: '',
})

const register = reactive({
    name: '',
    email: '',
    password: '',
})

const rules = {
    required: v => (!!v && v.toString().trim().length > 0) || 'Champ requis',
    email: v => /.+@.+\..+/.test(v || '') || 'Email invalide',
    min: len => v => (v && v.length >= len) || `Minimum ${len} caractères`,
}

function submitLogin() {
    // Remplacer par appel API réel
    console.log('Login:', { ...login })
}

function submitRegister() {
    // Remplacer par appel API réel
    console.log('Register:', { ...register })
}
</script>

<style scoped>
/* filepath: /Users/sohkey/Dev/scool/whatsapp-front/src/views/Auth.vue (styles) */
.fill-height {
    min-height: 100vh;
    background: #ECE5DD;
    /* WhatsApp chat background */
}

/* Card */
.whatsapp-card {
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    background: #ffffff;
}

/* Header (dark green) */
.whatsapp-header {
    background: #075E54;
    color: #fff;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
}

/* Avatar/logo */
.logo-avatar {
    background: #25D366 !important;
    color: #fff !important;
    font-weight: 700;
}

/* Title/subtitle */
.title {
    font-weight: 700;
    font-size: 16px;
}

.subtitle {
    font-size: 12px;
    opacity: 0.9;
}

/* Primary action (green) */
.primary-whatsapp {
    background-color: #25D366 !important;
    color: #fff !important;
    border-radius: 8px;
    text-transform: none;
}

/* Hover shade */
.primary-whatsapp:hover {
    background-color: #128C7E !important;
}

/* Text buttons (link style in dark green) */
.text-btn {
    color: #075E54 !important;
    text-transform: none;
}

/* Subtle input focus color (Vuetify internals may vary by version) */
.v-input--dense .v-field__outline {
    border-color: rgba(7, 94, 84, 0.12);
}

.whatsapp-btn {
    /* Ajuster la hauteur/padding pour correspondre aux inputs denses */
    min-height: 44px;
    padding-top: 10px;
    padding-bottom: 10px;
    padding-left: 14px;
    padding-right: 14px;
    font-size: 15px;
    box-shadow: none;
}

/* Si besoin d'un léger ajustement visuel pour inputs denses */
.v-text-field--dense .v-field {
    min-height: 44px;
}
</style>
