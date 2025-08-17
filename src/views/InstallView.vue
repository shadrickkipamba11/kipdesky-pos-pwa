<template>
  <div class="install-wrap">
    <div class="bg-orbs" aria-hidden="true"></div>

    <div class="card">
      <div class="brand">
        <img src="/logo.png" alt="Kipdesky POS" class="logo">
        <h1 class="title">Kipdesky POS</h1>
        <p class="subtitle">Fast. Reliable. Offline-ready.</p>
      </div>

      <!-- Already installed -->
      <div v-if="isInstalled" class="state">
        <div class="state-icon ok">
          <i class="fas fa-check-circle"></i>
        </div>
        <h2 class="state-title">App Installed</h2>
        <p class="state-text">You’re good to go.</p>
        <button class="btn btn-primary" @click="launchApp">Open Application</button>
      </div>

      <!-- Not installed -->
      <div v-else class="content">
        <h2 class="headline">Install to Continue</h2>
        <p class="muted">
          Install Kipdesky POS to enable offline mode, faster startup, and a full-screen experience.
        </p>

        <!-- Android / Desktop: native prompt available -->
        <div v-if="showInstallButton && !isIOSDevice" class="cta">
          <button class="btn btn-primary" @click="installApp">
            <i class="fas fa-download"></i> Install Now
          </button>
          <p class="hint">If prompted by the browser, confirm “Install”.</p>
        </div>

        <!-- Android / Desktop: no prompt available (fallback how-to) -->
        <div v-else-if="!isIOSDevice" class="guide">
          <div class="guide-step">
            <div class="badge">1</div>
            <div class="step-text">
              Open the browser menu <span class="muted">(⋮ or ⋯)</span>
            </div>
          </div>
          <div class="guide-step">
            <div class="badge">2</div>
            <div class="step-text">Choose <strong>Install app</strong> or <strong>Add to Home screen</strong></div>
          </div>
          <div class="guide-step">
            <div class="badge">3</div>
            <div class="step-text">Return and tap <strong>Open Application</strong></div>
          </div>
          <button class="btn btn-ghost" @click="checkInstallation">Open Application</button>
        </div>

        <!-- iOS instruction (no native prompt) -->
        <div v-if="isIOSDevice" class="ios">
          <h3><i class="fas fa-mobile-screen"></i> iOS (Safari)</h3>
          <ol class="ios-steps">
            <li>
              Tap the <strong>Share</strong> button <span class="icon">🔗</span>
            </li>
            <li>Select <strong>Add to Home Screen</strong></li>
            <li>Return here and tap <strong>Open Application</strong></li>
          </ol>

          <div class="ios-actions">
            <button v-if="showIOSRefresh" class="btn btn-ghost" @click="checkInstallation">
              Open Application
            </button>
          </div>
        </div>
      </div>

      <!-- Error toast -->
      <transition name="fade">
        <div v-if="installError" class="toast" role="status" aria-live="polite">
          <i class="fas fa-circle-exclamation"></i>
          <span>{{ errorMessage }}</span>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { isIOS as detectIOS } from '@/utils/pwa-utils'

const router = useRouter()

const deferredPrompt = ref(null)
const showInstallButton = ref(false)
const installError = ref(false)
const errorMessage = ref('')
const isInstalled = ref(false)
const isIOSDevice = detectIOS()
const showIOSRefresh = ref(false)

const isPwaInstalled = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true ||
  document.referrer.includes('android-app://')

const redirectIfInstalled = () => {
  if (isPwaInstalled()) {
    isInstalled.value = true
    router.replace('/login')
  }
}

const checkInstallation = () => {
  isInstalled.value = isPwaInstalled()
  if (isInstalled.value) router.replace('/login')
}

const beforeInstallPromptHandler = (e) => {
  // Chrome/Edge: capture the event to trigger later
  e.preventDefault()
  deferredPrompt.value = e
  showInstallButton.value = true
}

const appInstalledHandler = () => {
  isInstalled.value = true
  router.replace('/login')
}

onMounted(() => {
  redirectIfInstalled()

  // iOS: show the "Open" button after brief delay (since no event fires)
  if (isIOSDevice) {
    setTimeout(() => { showIOSRefresh.value = true }, 800)
  }

  window.addEventListener('beforeinstallprompt', beforeInstallPromptHandler)
  window.addEventListener('appinstalled', appInstalledHandler)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeinstallprompt', beforeInstallPromptHandler)
  window.removeEventListener('appinstalled', appInstalledHandler)
})

const installApp = async () => {
  installError.value = false
  errorMessage.value = ''

  if (!deferredPrompt.value) {
    installError.value = true
    errorMessage.value = 'Install prompt not available. Use your browser menu to Add to Home Screen.'
    return
  }
  try {
    deferredPrompt.value.prompt()
    const choice = await deferredPrompt.value.userChoice
    deferredPrompt.value = null
    showInstallButton.value = false

    if (choice?.outcome === 'accepted') {
      isInstalled.value = true
      router.replace('/login')
    } else {
      installError.value = true
      errorMessage.value = 'Installation cancelled. You can install later from your browser menu.'
    }
  } catch (err) {
    installError.value = true
    errorMessage.value = 'Installation failed. Please try again.'
    console.error('PWA install failed:', err)
  }
}

const launchApp = () => {
  // Go straight to login; router replace to avoid going back to install page
  router.replace('/login')
}
</script>

<style scoped>
:root {
  --card-bg: rgba(26, 28, 44, 0.72);
  --border: rgba(255,255,255,.08);
  --text: #f7f8fc;
  --muted: rgba(255,255,255,.72);
  --primary: #4f46e5;   /* indigo-600 */
  --primary-2: #7c3aed; /* violet-600 */
  --accent: #14b8a6;    /* teal-500 */
  --danger: #ff7b6b;
}

.install-wrap {
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: radial-gradient(1100px 600px at 10% 8%, rgba(124,58,237,.18), transparent 40%),
              radial-gradient(900px 500px at 90% 92%, rgba(79,70,229,.18), transparent 40%),
              #0b0e1a;
  position: relative;
  overflow: hidden;
}

/* floating blurred orbs */
.bg-orbs::before,
.bg-orbs::after {
  content: "";
  position: absolute;
  width: 520px; height: 520px;
  border-radius: 50%;
  filter: blur(80px);
  opacity: .18;
}
.bg-orbs::before {
  left: -120px; top: -80px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
}
.bg-orbs::after {
  right: -140px; bottom: -120px;
  background: linear-gradient(135deg, var(--primary-2), var(--primary));
}

.card {
  width: min(560px, 100%);
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow:
    0 10px 30px rgba(0,0,0,.35),
    0 1px 0 rgba(255,255,255,.02) inset;
  backdrop-filter: blur(8px);
  padding: 22px 20px;
  color: var(--text);
  position: relative;
}

.brand {
  display: grid;
  justify-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.logo {
  width: 80px;
  height: 80px;
  object-fit: contain;
  border-radius: 16px;
  background: rgba(255,255,255,.04);
  border: 1px solid var(--border);
  box-shadow: 0 8px 24px rgba(124,58,237,.25);
}
.title {
  margin: 0;
  font-weight: 800;
  letter-spacing: .2px;
}
.subtitle {
  margin: 0;
  color: var(--muted);
  font-size: .95rem;
}

/* installed state */
.state {
  display: grid;
  justify-items: center;
  gap: 10px;
  padding: 8px 4px 4px;
}
.state-icon {
  font-size: 48px;
  line-height: 1;
}
.state-icon.ok { color: #22c55e; }
.state-title { margin: 4px 0 0; }
.state-text { margin: 0 0 8px; color: var(--muted); }

/* not installed */
.content { display: grid; gap: 12px; }
.headline { margin: 6px 0 0; }
.muted { color: var(--muted); }

/* CTA */
.cta { display: grid; gap: 8px; justify-items: center; }

/* generic button */
.btn {
  outline: none;
  border: none;
  cursor: pointer;
  padding: 12px 16px;
  border-radius: 12px;
  font-weight: 700;
  letter-spacing: .2px;
}
.btn-primary {
  color: #fff;
  background: linear-gradient(135deg, var(--primary), var(--primary-2));
  box-shadow: 0 10px 24px rgba(79,70,229,.35);
}
.btn-primary:hover { filter: brightness(.98); }
.btn-ghost {
  background: rgba(255,255,255,.06);
  color: var(--text);
  border: 1px solid var(--border);
}
.btn-ghost:hover { background: rgba(255,255,255,.08); }

/* fallback guide */
.guide { display: grid; gap: 8px; }
.guide-step {
  display: grid;
  grid-template-columns: 28px 1fr;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(255,255,255,.04);
  border: 1px solid var(--border);
  border-radius: 12px;
}
.badge {
  width: 28px; height: 28px; border-radius: 50%;
  display: grid; place-items: center;
  background: rgba(79,70,229,.16);
  border: 1px solid rgba(79,70,229,.35);
  font-weight: 800;
}
.step-text { font-weight: 600; }

/* iOS box */
.ios { margin-top: 4px; }
.ios h3 { margin: 2px 0 8px; display: flex; align-items: center; gap: 8px; font-size: 1rem; }
.ios-steps {
  margin: 0; padding-left: 18px; color: var(--text);
}
.ios-steps li { margin: 6px 0; }
.share-icon { width: 18px; height: 18px; vertical-align: middle; margin-left: 6px; opacity: .9; }
.ios-actions { margin-top: 10px; display: grid; justify-items: start; }

/* toast */
.toast {
  position: absolute;
  left: 16px; right: 16px; bottom: -12px;
  transform: translateY(100%);
  background: rgba(255, 123, 107, .12);
  color: #ffb29e;
  border: 1px solid rgba(255, 123, 107, .35);
  border-radius: 12px;
  padding: 10px 12px;
  display: flex; align-items: center; gap: 8px;
  backdrop-filter: blur(6px);
  font-weight: 600;
}
.fade-enter-active, .fade-leave-active { transition: opacity .2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* small screens */
@media (max-width: 420px) {
  .card { padding: 18px 14px; border-radius: 14px; }
  .logo { width: 68px; height: 68px; border-radius: 14px; }
  .btn { width: 100%; }
}
</style>
