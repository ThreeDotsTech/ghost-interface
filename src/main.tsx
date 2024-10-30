import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import { NetworkProvider } from './context/NetworkContext.tsx'
import { SwapProvider } from './context/SwapContext.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'
import { ModalProvider } from './context/ModalContext.tsx'


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NetworkProvider>
      <HashRouter>
        <SwapProvider>
          <ModalProvider>
              <ThemeProvider>
                <App />
              </ThemeProvider>
          </ModalProvider>
        </SwapProvider>
      </HashRouter>
    </NetworkProvider>
  </StrictMode>,
)
