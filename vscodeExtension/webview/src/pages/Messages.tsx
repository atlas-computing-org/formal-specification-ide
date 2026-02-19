import { useMessages } from "../MessageContext"

const MessagesPage = () => {
    const {messages} = useMessages()
    return (
        <div>
            <h1>Messages</h1>

            <ul>
                {messages
                    .map((message) => (
                        <li key={message.id}>{JSON.stringify(message)}</li>
                    ))
                    .reverse()
                }
            </ul>
        </div>
    )
}

export default MessagesPage