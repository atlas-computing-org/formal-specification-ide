import { useEffect, useState } from "react";
import { goToFile, goToPosition, goToSelection } from "./extensionTools";



export type Message = {
    command: string
    id: string
    origin: string
    body?: any
}

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
    const [messages, setMessages] = useState<Message[]>([]);

    useEffect(() => {
        window.addEventListener('message', (event) => {
            setMessages(prev => [...prev, event.data as Message]);
        });
    }, []);

    const seenIds = new Set<string>();
    const messagesDeduplicated = messages
        .filter((message) => {
            if (seenIds.has(message.id)) return false;
            seenIds.add(message.id);
            return true;
        });
    
    const selections: Selection[] = messagesDeduplicated
        .filter(m => m.body && m.body.selection)
        .map(m => ({...m.body.selection, text: m.body.text, fileName: m.body.fileName}));

    return (
        <div>
            <h1>Spec Mapper</h1>

            <h2>Commands</h2>
            <ul>
                {messagesDeduplicated.map((message, index) => (
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
                {messagesDeduplicated.map((message, index) => (
                    <li key={index}>{JSON.stringify(message)}</li>
                ))}
            </ul>
        </div>
    )
}

export default App
