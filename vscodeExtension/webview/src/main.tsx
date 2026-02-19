import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Router from './Router.tsx'
import { MessagesProvider } from './MessageContext.tsx'
import { ActiveFileProvider } from './FileLoader.tsx'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <MessagesProvider>
            <ActiveFileProvider>
                <Router />
            </ActiveFileProvider>
        </MessagesProvider>
    </StrictMode>,
)
