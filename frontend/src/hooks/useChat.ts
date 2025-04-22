import { useState } from 'react';
import { useAppContext } from '../context/AppContext.tsx';
import { api } from '../services/api.ts';
import { AI_ASSISTANT_WELCOME_MESSAGE } from '../aiAssistantWelcomeMessage.ts';

type ChatUser = "user" | "assistant" | "system";

interface ChatMessage {
  content: string;
  sender: ChatUser;
}

const initialChatMessages: ChatMessage[] = [{ content: AI_ASSISTANT_WELCOME_MESSAGE, sender: "system" }];

export const useChat = () => {
  const { state } = useAppContext();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialChatMessages);
  const [isNewChat, setIsNewChat] = useState(true);
  const [chatError, setChatError] = useState<Error | null>(null);

  const sendChatMessage = async (message: string) => {
    try {
      const { annotations, lhsText, rhsText } = state.dataset;
      setChatError(null);
      const response = await api.chatAboutAnnotations({
        userInput: message,
        lhsText,
        rhsText,
        annotations,
        reset: isNewChat,
      });
      if ("error" in response) {
        throw new Error(response.error);
      }

      // Add user message and assistant response to chat history
      setChatMessages(prev => [
        ...prev,
        { content: message, sender: "user" },
        { content: response.data, sender: "assistant" },
      ]);

      setIsNewChat(false);
    } catch (err) {
      setChatError(err as Error);
    }
  };

  const resetChat = () => {
    setChatMessages(initialChatMessages);
    setIsNewChat(true);
    setChatError(null);
  };

  return {
    chatMessages,
    chatError,
    sendChatMessage,
    resetChat,
  };
};