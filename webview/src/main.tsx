import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { MessagesProvider } from './MessageContext.tsx'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <MessagesProvider>
            <App />
        </MessagesProvider>
    </StrictMode>,
)
