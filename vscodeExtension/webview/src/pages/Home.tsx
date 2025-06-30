import { useRouter } from "../Router"

const HomePage = () => {
    const { setPage } = useRouter()
    return (
        <div className="flex flex-col gap-4">
            <button
                onClick={() => setPage("Documentation")}
                className="text-sm cursor-pointer border border-gray-300 rounded-md px-2 py-1">
                Open Documentation Viewer
            </button>

            <button
                onClick={() => setPage("Settings")}
                className="text-sm cursor-pointer border border-gray-300 rounded-md px-2 py-1">
                Settings
            </button>

            <button
                onClick={() => setPage("Help")}
                className="text-sm cursor-pointer border border-gray-300 rounded-md px-2 py-1">
                Help
            </button>
        </div>
    )
}

export default HomePage