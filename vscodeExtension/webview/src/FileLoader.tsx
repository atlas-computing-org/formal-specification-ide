import { createContext, useContext, useState } from "react"
import { useMessages } from "./MessageContext"

const ActiveFileContext = createContext<{
    fileName: string | null
    text: string | null
}>({
    fileName: null,
    text: null
})

export const ActiveFileProvider = ({children}: {children: React.ReactNode}) => {
    const [fileName, setFileName] = useState<string | null>(null)
    const [text, setText] = useState<string | null>(null)

    useMessages((message) => {
        if (message.command === "loadFile") {
            setFileName(message.body.fileName)
            setText(message.body.text)
        }
    })

    return (
        <ActiveFileContext.Provider value={{fileName, text}}>
            {children}
        </ActiveFileContext.Provider>
    )
}

export const useActiveFile = () => {
    return useContext(ActiveFileContext)
}