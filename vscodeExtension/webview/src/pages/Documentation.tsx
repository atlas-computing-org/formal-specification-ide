import { goToFile } from "../extensionTools"
import { useActiveFile } from "../FileLoader"

const DocumentationPage = () => {
    const { fileName } = useActiveFile()

    return (
        <div>
            {!fileName && <div>No file selected</div>}
            {fileName &&
                <div>
                    <div>file path:</div>
                    <div
                        onClick={() => fileName && goToFile(fileName)}
                        className="text-sm text-blue-500 underline font-bold cursor-pointer">
                        {fileName}
                    </div>
                    <div className="flex gap-2 my-2">
                        <button
                            onClick={() => fileName && goToFile(fileName)}
                            className="text-sm cursor-pointer border border-gray-300 rounded-md px-2 py-1">
                            Open file
                        </button>
                        <button
                            onClick={() => fileName && goToFile(fileName)}
                            className="text-sm cursor-pointer border border-gray-300 rounded-md px-2 py-1">
                            Split File
                        </button>
                    </div>
                </div>}
        </div>
    )
}

export default DocumentationPage