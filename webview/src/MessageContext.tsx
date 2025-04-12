import {useEffect, useState, createContext, useContext} from "react"
import { webViewIsLoaded } from "./extensionTools"

export type Message = {
    command: string
    id: string
    origin: string
    body?: any
}

type MessagesContextType = {
    messages: Message[]
    // useSubscription: (callback: (message: Message) => void) => void
}

const MessagesContext = createContext<MessagesContextType>({messages: []});

export const MessagesProvider = ({children}: {children: React.ReactNode}) => {
    const [messages, setMessages] = useState<Message[]>([]);

    useEffect(() => {
        // tell the extension that we're ready to receive messages
        webViewIsLoaded()
    }, []);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const message = event.data as Message
            setMessages(prev => {
                if (prev.find(m => m.id === message.id)) {
                    return prev
                }
                return [...prev, message]
            })
        }

        window.addEventListener('message', handleMessage);
        return () => {
            window.removeEventListener('message', handleMessage)
        }
    }, [])

    return (
        <MessagesContext.Provider value={{messages}}>
            {children}
        </MessagesContext.Provider>
    )
}

export const useMessages = () => {
    return useContext(MessagesContext)
}