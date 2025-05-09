import { useState } from 'react';
import { useAppContext } from '../context/AppContext.tsx';
import { api } from '../services/api.ts';
import { AI_ASSISTANT_WELCOME_MESSAGE } from '../content/aiAssistantWelcomeMessage.ts';
import { v4 as uuidv4 } from 'uuid';

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
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>(uuidv4());

  const sendChatMessage = async (message: string) => {
    try {
      const { annotations, lhsText, rhsText } = state.dataset;
      setChatError(null);
      setIsNewChat(false);
      setChatMessages(prev => [
        ...prev,
        { content: message, sender: "user" },
      ]);

      if (isNewChat) {
        setSessionId(uuidv4());
      }

      setIsLoading(true);
      const response = await api.chatAboutAnnotations({
        userInput: message,
        lhsText,
        rhsText,
        annotations,
        sessionId,
      });
      if ("error" in response) {
        throw new Error(response.error);
      }

      setChatMessages(prev => [
        ...prev,
        { content: response.data, sender: "assistant" },
      ]);
    } catch (err) {
      setChatError(err as Error);
    } finally {
      setIsLoading(false);
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
    isLoading,
  };
};