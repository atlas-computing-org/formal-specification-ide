import { useEffect, useState } from "react";

const sendMessageToExtension = (message: string) => {
    window.parent.postMessage({
        command: 'alert',
        text: message,
        origin: 'webview'
    }, '*');
}

const App = () => {
    const [messages, setMessages] = useState<string[]>([]);

    useEffect(() => {
        window.addEventListener('message', (event) => {
            setMessages(prev => [...prev, JSON.stringify(event.data)]);
        });
    }, []);

    return (
        <div>
            <h1>Hello World</h1>
            <ul>
                {messages.map((message, index) => (
                    <li key={index}>{message}</li>
                ))}
            </ul>
            <button onClick={() => {
                sendMessageToExtension('Hello from the webview');
            }}>Send Message</button>
        </div>
    )
}

export default App
