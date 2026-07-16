import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import OrdersApp from './App'
import './styles.css'

registerSW({ immediate: true })

createRoot(document.getElementById('orders-root')!).render(
  <StrictMode>
    <OrdersApp />
  </StrictMode>
)
