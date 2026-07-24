import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from '@/stores/authStore'
import { getSupabaseEnvError } from '@/lib/supabaseClient'
import './style.css'

function renderFatalError(message: string) {
  const root = document.getElementById('app')
  if (!root) {
    return
  }

  root.innerHTML = `
    <div style="max-width:28rem;margin:3rem auto;padding:1.25rem;font-family:Segoe UI,PingFang TC,Noto Sans TC,sans-serif;line-height:1.6;color:#2c2a28">
      <h1 style="font-size:1.35rem;margin:0 0 0.75rem">無法啟動應用程式</h1>
      <p style="margin:0 0 1rem;color:#6b6560">${message}</p>
      <ol style="margin:0 0 1rem;padding-left:1.25rem;color:#6b6560">
        <li>開啟專案根目錄的 <code>.env</code></li>
        <li>填入 Supabase 的 URL 與 Publishable Key</li>
        <li>儲存後重新執行 <code>npm run dev</code></li>
      </ol>
      <pre style="margin:0;padding:0.85rem;background:#f3f0ea;border-radius:10px;overflow:auto;font-size:0.85rem">VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=你的_publishable_key</pre>
    </div>
  `
}

async function bootstrap() {
  const envError = getSupabaseEnvError()
  if (envError) {
    renderFatalError(envError)
    return
  }

  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)

  const authStore = useAuthStore()
  await authStore.initialize()

  app.use(router)
  app.mount('#app')
}

void bootstrap()
