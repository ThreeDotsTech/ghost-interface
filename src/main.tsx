import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import { NetworkProvider } from './context/NetworkContext.tsx'
import { SwapProvider } from './context/SwapContext.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'
import { ModalProvider } from './context/ModalContext.tsx'


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NetworkProvider>
      <SwapProvider>
        <ModalProvider>
          <HashRouter>
            <ThemeProvider>
              <App />
            </ThemeProvider>
          </HashRouter>
        </ModalProvider>
      </SwapProvider>
    </NetworkProvider>
  </React.StrictMode>,
)
