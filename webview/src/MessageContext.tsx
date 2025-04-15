import {useEffect, useState, createContext, useContext} from "react"
import { notifyVscode, webViewIsLoaded } from "./extensionTools"
import { generateRandomString } from "./utils"

export type Message = {
    command: string
    id: string
    origin: string
    body?: any
}

type MessagesContextType = {
    messages: Message[]
    addSubscriber: (callback: (message: Message) => void) => () => void
}

const MessagesContext = createContext<MessagesContextType>({
    messages: [],
    addSubscriber: () => () => {}
});

export const MessagesProvider = ({children}: {children: React.ReactNode}) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [subscribers, setSubscribers] = useState<Record<string, (message: Message) => void>>({});

    const addSubscriber = (callback: (message: Message) => void) => {
        const id = generateRandomString()
        setSubscribers(prev => ({...prev, [id]: callback}))
        return () => {
            setSubscribers(prev => {
                const newSubscribers = {...prev}
                delete newSubscribers[id]
                return newSubscribers
            })
        }
    }

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const message = event.data as Message
            setMessages(prev => {
                if (prev.find(m => m.id === message.id)) {
                    return prev
                }
                return [...prev, message]
            })
            for (const callback of Object.values(subscribers)) {
                try {
                    callback(message)
                } catch (error) {
                    notifyVscode(JSON.stringify({error}, null, 2), "error")
                }
            }
        }

        window.addEventListener('message', handleMessage);
        return () => {
            window.removeEventListener('message', handleMessage)
        }
    }, [subscribers])

    useEffect(() => {
        webViewIsLoaded()
    }, [])

    return (
        <MessagesContext.Provider value={{messages, addSubscriber}}>
            {children}
        </MessagesContext.Provider>
    )
}

export const useMessages = (onNewMessage?: (message: Message) => void) => {
    const {messages, addSubscriber} = useContext(MessagesContext)

    useEffect(() => {
        if (onNewMessage) {
            const unsubscribe = addSubscriber(onNewMessage)
            return unsubscribe
        }
    }, [onNewMessage])

    return { messages }
}