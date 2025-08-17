<template>
  <div v-if="showInstallPrompt" class="install-prompt-overlay">
    <div class="install-prompt">
      <div class="prompt-header">
        <h3>Install Kipdesky POS</h3>
        <button class="close-btn" @click="dismissPrompt">×</button>
      </div>
      <div class="prompt-body">
        <p>Get the full app experience. Install to your home screen!</p>
        <div class="prompt-buttons">
          <button class="install-btn" @click="installApp">
            Install Now
          </button>
          <button class="later-btn" @click="dismissPrompt">
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const deferredPrompt = ref(null)
const showInstallPrompt = ref(false)
const isIOS = ref(false)
const isSafari = ref(false)

onMounted(() => {
  // Detect iOS
  isIOS.value = /iPad|iPhone|iPod/.test(navigator.userAgent)
  isSafari.value = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt.value = e
    // Only show if not previously dismissed
    if (!localStorage.getItem('pwa-prompt-dismissed')) {
      setTimeout(() => {
        showInstallPrompt.value = true
      }, 5000)
    }
  })

  window.addEventListener('appinstalled', () => {
    showInstallPrompt.value = false
  })
})

const installApp = async () => {
  if (deferredPrompt.value) {
    deferredPrompt.value.prompt()
    const { outcome } = await deferredPrompt.value.userChoice
    if (outcome === 'accepted') {
      localStorage.setItem('pwa-installed', 'true')
    }
    showInstallPrompt.value = false
  }
}

const dismissPrompt = () => {
  showInstallPrompt.value = false
  localStorage.setItem('pwa-prompt-dismissed', 'true')
}
</script>

<style scoped>
.install-prompt-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.install-prompt {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.prompt-header {
  padding: 16px;
  background-color: #4CAF50;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.prompt-header h3 {
  margin: 0;
  font-size: 1.2rem;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0 8px;
}

.prompt-body {
  padding: 20px;
  text-align: center;
}

.prompt-body p {
  margin-bottom: 20px;
  color: #555;
}

.prompt-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.install-btn, .later-btn {
  padding: 10px 20px;
  border-radius: 6px;
  border: none;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.install-btn {
  background-color: #4CAF50;
  color: white;
}

.install-btn:hover {
  background-color: #3e8e41;
}

.later-btn {
  background-color: #f1f1f1;
  color: #333;
}

.later-btn:hover {
  background-color: #ddd;
}
</style>