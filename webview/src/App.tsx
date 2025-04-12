import { goToFile, goToPosition, goToSelection, notifyVscode } from "./extensionTools";
import { useMessages } from "./MessageContext";

export type Position = {
    line: number
    character: number
}

export type Selection = {
    start: Position
    end: Position
    active: Position
    anchor: Position
    text?: string
    fileName?: string
}

const App = () => {
    const {messages} = useMessages()
    
    const selections: Selection[] = messages
        .filter(m => m.body && m.body.selection)
        .map(m => ({...m.body.selection, text: m.body.text, fileName: m.body.fileName}));

    return (
        <div>
            <h1>Spec Mapper</h1>

            <button onClick={() => notifyVscode("Hello from the webview", "info")}>Notify VSCode</button>
            <button onClick={() => notifyVscode("Be careful", "warning")}>Warn VSCode</button>
            <button onClick={() => notifyVscode("oops", "error")}>Error VSCode</button>

            <h2>Commands</h2>
            <ul>
                {messages.map((message, index) => (
                    <li key={index}>{message.command}</li>
                ))}
            </ul>

            <h2>Selections</h2>
            <ul>
                {selections.map((selection, index) => (
                    <li key={index}>
                        {selection.text}
                        <br />
                        {selection.fileName}
                        <br />
                        {selection.start.line}:{selection.start.character} - {selection.end.line}:{selection.end.character}
                        <br />
                        <button onClick={() => selection.fileName && goToPosition(selection.fileName, selection.start)}>Go to position</button>
                        <button onClick={() => selection.fileName && goToSelection(selection.fileName, selection)}>Go to selection</button>
                        <button onClick={() => selection.fileName && goToFile(selection.fileName)}>Go to file</button>
                    </li>
                ))}
            </ul>

            <h2>Messages</h2>
            <ul>
                {messages.map((message, index) => (
                    <li key={index}>{JSON.stringify(message)}</li>
                ))}
            </ul>
        </div>
    )
}

export default App
