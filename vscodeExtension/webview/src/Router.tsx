import { useMessages } from "./MessageContext";
import { createContext, useContext, useState } from "react";

import HomePage from "./pages/Home";
import DocumentationPage from "./pages/Documentation";
import HelpPage from "./pages/Help";
import MessagesPage from "./pages/Messages";
import SettingsPage from "./pages/Settings";

const pages = ["Home", "Documentation", "Help", "Messages", "Settings"] as const
type Page = typeof pages[number]

type RouterContextType = {
    page: Page
    setPage: (page: Page) => void
}

const RouterContext = createContext<RouterContextType>({
    page: "Home",
    setPage: () => { }
})

const Router = () => {
    const [page, setPage] = useState<Page>("Home")

    useMessages((message) => {
        if (message.command === "navigate") {
            const newPage = message.body?.page
            if (newPage && pages.includes(newPage)) {
                setPage(newPage)
            }
        }
    })

    return (
        <RouterContext.Provider value={{ page, setPage }}>
            <div className="flex flex-col gap-4 p-2 max-w-11/12">
                <div>
                    {pages.map((p) => (
                        <button style={{ marginRight: "10px" }} key={p} onClick={() => setPage(p)}>{p}</button>
                    ))}
                </div>

                <h1 className="text-2xl font-bold">{page}</h1>

                <div className="flex flex-col gap-4">
                    {page === "Home" && <HomePage />}
                    {page === "Documentation" && <DocumentationPage />}
                    {page === "Help" && <HelpPage />}
                    {page === "Messages" && <MessagesPage />}
                    {page === "Settings" && <SettingsPage />}
                </div>
            </div>
        </RouterContext.Provider>
    )
}

export const useRouter = () => {
    return useContext(RouterContext)
}

export default Router
