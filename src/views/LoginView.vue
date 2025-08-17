<template>
  <div class="login-container">
    <div class="login-card">
      <div class="logo-container">
        <img src="/logo.png" alt="Kipdesky POS Logo" class="logo" />
      </div>

      <h1 class="login-title">Welcome Back</h1>
      <p class="login-subtitle">Sign in with your Kipdesky POS account</p>

      <form @submit.prevent="handleSubmit" class="login-form" novalidate>
        <!-- Email -->
        <div class="form-group mb-4">
          <label for="email" class="sr-only">Email</label>
          <div class="input-container">
            <svg class="input-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
            </svg>
            <input
              id="email"
              type="email"
              class="form-control with-icon"
              v-model="credentials.email"
              placeholder="Enter your email"
              autocomplete="username"
              required
              inputmode="email"
            />
          </div>
        </div>

        <!-- Password -->
        <div class="form-group mb-4">
          <label for="password" class="sr-only">Password</label>
          <div class="input-container">
            <svg class="input-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z"/>
            </svg>
            <input
              id="password"
              type="password"
              class="form-control with-icon"
              v-model="credentials.password"
              placeholder="Enter your password"
              autocomplete="current-password"
              required
            />
          </div>
        </div>

        <!-- Options -->
        <div class="form-options">
          <label class="remember-me">
            <input id="remember" type="checkbox" v-model="rememberMe" />
            <span>Remember me</span>
          </label>
        </div>

        <!-- Error -->
        <div v-if="error" class="error-message" role="alert">
          <svg viewBox="0 0 24 24" class="error-icon" aria-hidden="true">
            <path fill="currentColor" d="M11,15H13V17H11V15M11,7H13V13H11V7M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20Z"/>
          </svg>
          {{ error }}
        </div>

        <!-- Submit -->
        <button type="submit" :disabled="loading" class="btn btn-primary btn-lg login-button">
          <span v-if="!loading">Sign In</span>
          <span v-else class="loading-spinner" aria-label="Loading"></span>
        </button>
      </form>

      <div class="signup-link mt-4 text-center">
        <a href="tel:+260777750789">Contact System Administrator</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useAuth } from '../composables/useAuth'

const { login, error, loading } = useAuth()

const credentials = reactive({ email: '', password: '' })
const rememberMe = ref(false)

const handleSubmit = () => {
  login(credentials)
}
</script>

<style scoped>
/* --- Layout --- */
.login-container {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 2rem;
  /* Subtle grid glow using theme tokens */
  background:
    radial-gradient(1000px 600px at 10% 10%, rgba(225,78,202,0.08), transparent 40%),
    radial-gradient(900px 500px at 90% 90%, rgba(29,140,248,0.08), transparent 40%);
}

.login-card {
  width: 100%;
  max-width: 440px;
  padding: 2.25rem 2rem;
  background: rgba(39,41,61,0.9); /* dark card on top of #1e1e2f */
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 1rem;
  box-shadow:
    0 10px 30px rgba(0,0,0,0.35),
    0 1px 0 rgba(255,255,255,0.02) inset;
  backdrop-filter: blur(6px);
}

/* --- Branding --- */
.logo-container {
  display: grid;
  place-items: center;
  margin-bottom: 1rem;
}
.logo {
  width: 84px;
  height: auto;
  filter: drop-shadow(0 4px 16px rgba(225,78,202,0.25));
}

/* --- Headings --- */
.login-title {
  margin: 0.25rem 0 0.25rem;
  color: var(--white);
  font-weight: 600;
  text-align: center;
}
.login-subtitle {
  margin: 0 0 1.5rem;
  color: hsla(0,0%,100%,0.65);
  text-align: center;
  font-size: 0.9rem;
}

/* --- Form --- */
.login-form { margin-top: 0.25rem; }

.input-container {
  position: relative;
  --icon-x: 0.9rem;   /* distance from left edge */
  --icon-size: 20px;  /* icon width/height */
  --icon-gap: 0.75rem;
}

.input-icon {
  position: absolute;
  left: 0.85rem;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  opacity: 0.8;
  color: var(--light);
  pointer-events: none;
  left: var(--icon-x);
  width: var(--icon-size);
  height: var(--icon-size);
}

.form-control.with-icon {
  /* ensure text starts after the icon + gap; !important beats any global .form-control padding */
  padding-left: calc(var(--icon-x) + var(--icon-size) + var(--icon-gap)) !important;
  width: 100%;
  box-sizing: border-box;
  font-size: 16px;
}

/* use your theme .form-control, but keep dark bg on focus */
.with-icon {
  padding-left: 2.5rem; /* room for icon */
}

.form-control {
    display: block;
    width: 100%;
    height: calc(2.25rem + 2px);
    padding: .5rem .7rem;
    font-size: .875rem;
    font-weight: 400;
    line-height: 1.428571;
    color: hsla(0, 0%, 100%, .8);
    background-color: transparent;
    background-clip: padding-box;
    border: 1px solid #1f4464;
    border-radius: .25rem;
    box-shadow: none;
    transition: all .2s cubic-bezier(.68,-.55,.265,1.55);
}
.form-control::placeholder { color: #adb5bd; }
.form-control:focus {
  background-color: transparent;                 /* override theme's white focus */
  border-color: var(--primary);
  box-shadow: 0 0 0 .2rem rgba(225,78,202,.15);
  color: hsla(0,0%,100%,0.95);
}

/* --- Options row --- */
.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin: 0.25rem 0 1rem;
}
.remember-me {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: hsla(0,0%,100%,0.8);
  font-size: 0.9rem;
}
.remember-me input { accent-color: var(--primary); }
.forgot-password {
  font-size: 0.9rem;
  color: var(--primary);
  opacity: 0.9;
}
.forgot-password:hover { opacity: 1; text-decoration: underline; }

/* --- Error --- */
.error-message {
  display: grid;
  grid-template-columns: 20px 1fr;
  gap: 0.5rem;
  align-items: center;
  margin: 0 0 0.75rem;
  padding: 0.6rem 0.75rem;
  border: 1px solid rgba(255,141,114,0.45);
  border-radius: 0.5rem;
  color: #ffb29e;
  background: rgba(255,141,114,0.08);
}
.error-icon { width: 20px; height: 20px; }

/* --- Button --- */
.login-button {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .5rem;
  letter-spacing: .2px;
}
.login-button:disabled {
  opacity: .65;
  cursor: not-allowed;
}

/* spinner */
@keyframes spin { to { transform: rotate(360deg); } }
.loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255,255,255,0.35);
  border-top-color: var(--neutral);
  border-radius: 50%;
  animation: spin .8s linear infinite;
}

/* --- A11y utility --- */
.sr-only {
  position: absolute !important;
  width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0,0,0,0); white-space: nowrap; border: 0;
}

/* --- Small screens --- */
@media (max-width: 420px) {
  .login-card { padding: 1.5rem 1.25rem; }
}
</style>
