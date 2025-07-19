import React, { useState, useEffect, useRef } from "react";
import { ChatInterfaceProps, ExtendedMessage } from "../lib/types";
import apiClient, {
  ChatThread,
  ChatMessage,
  SendMessageRequest,
} from "../lib/utils/apiClient";
import logger from "../lib/utils/logger";
import theme from "../lib/utils/theme";

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  baseUrl,
  agentName,
  onToggleViewMode,
  viewMode = "chat",
}) => {
  const [messages, setMessages] = useState<ExtendedMessage[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [chatThread, setChatThread] = useState<ChatThread | null>(null);
  const [initializingChat, setInitializingChat] = useState<boolean>(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Add message history navigation state
  const [messageHistory, setMessageHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  logger.component("mounted", "ChatInterface", { baseUrl, agentName });

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Handle updates to message state
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize chat thread when agent changes
  useEffect(() => {
    if (agentName) {
      logger.info(
        "Initializing chat for agent",
        { agentName },
        "ChatInterface.useEffect"
      );
      initializeChatThread();
    }
  }, [agentName]);

  const initializeChatThread = async () => {
    logger.info(
      "Starting chat thread initialization",
      { agentName },
      "ChatInterface.initializeChatThread"
    );
    setInitializingChat(true);

    try {
      // First, try to get existing chat threads for this agent
      const threads = await apiClient.getChatThreads(agentName);
      logger.info(
        "Retrieved chat threads",
        { agentName, threadCount: threads.length },
        "ChatInterface.initializeChatThread"
      );

      let currentThread: ChatThread;

      if (threads.length > 0) {
        // Use the most recent thread
        currentThread = threads[0];
        logger.info(
          "Using existing chat thread",
          { agentName, threadId: currentThread.id },
          "ChatInterface.initializeChatThread"
        );
      } else {
        // Create a new thread
        logger.info(
          "Creating new chat thread",
          { agentName },
          "ChatInterface.initializeChatThread"
        );
        currentThread = await apiClient.createChatThread(agentName);
        logger.info(
          "Created new chat thread",
          { agentName, threadId: currentThread.id },
          "ChatInterface.initializeChatThread"
        );
      }

      setChatThread(currentThread);

      // Load existing messages for this thread
      await loadChatMessages(currentThread.id);
    } catch (error: any) {
      logger.error(
        "Failed to initialize chat thread",
        { agentName, error: error.message },
        "ChatInterface.initializeChatThread"
      );
      console.error("Error initializing chat thread:", error);
    } finally {
      setInitializingChat(false);
    }
  };

  const loadChatMessages = async (threadId: string) => {
    logger.info(
      "Loading chat messages",
      { agentName, threadId },
      "ChatInterface.loadChatMessages"
    );
    try {
      const messagesResponse = await apiClient.getChatMessages(
        agentName,
        threadId
      );
      const chatMessages = messagesResponse.data || [];

      logger.info(
        "Chat messages loaded",
        { agentName, threadId, messageCount: chatMessages.length },
        "ChatInterface.loadChatMessages"
      );

      // Convert ChatMessage to ExtendedMessage format
      const extendedMessages: ExtendedMessage[] = chatMessages.map(
        (msg: ChatMessage) => ({
          id: msg.id,
          content: msg.message,
          sender: msg.author_type,
          timestamp: msg.created_at || new Date().toISOString(),
          skillCalls: msg.skill_calls || [],
        })
      );

      setMessages(extendedMessages);
    } catch (error: any) {
      logger.error(
        "Failed to load chat messages",
        { agentName, threadId, error: error.message },
        "ChatInterface.loadChatMessages"
      );
      console.error("Error loading chat messages:", error);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || !chatThread || loading) {
      logger.warn(
        "Message send blocked",
        {
          hasInput: !!inputValue.trim(),
          hasThread: !!chatThread,
          isLoading: loading,
        },
        "ChatInterface.sendMessage"
      );
      return;
    }

    const messageContent = inputValue.trim();
    logger.info(
      "Sending message",
      {
        agentName,
        threadId: chatThread.id,
        messageLength: messageContent.length,
      },
      "ChatInterface.sendMessage"
    );

    setLoading(true);

    // Add user message to UI immediately
    const userMessage: ExtendedMessage = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      sender: "user",
      timestamp: new Date().toISOString(),
      skillCalls: [],
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    // Add to message history for navigation
    setMessageHistory((prev) => [messageContent, ...prev.slice(0, 19)]); // Keep last 20
    setHistoryIndex(-1);

    try {
      const messageRequest: SendMessageRequest = {
        message: messageContent,
      };

      const responseMessages = await apiClient.sendMessage(
        agentName,
        chatThread.id,
        messageRequest
      );

      logger.info(
        "Message sent successfully",
        {
          agentName,
          threadId: chatThread.id,
          responseCount: responseMessages.length,
        },
        "ChatInterface.sendMessage"
      );

      // Remove the temporary user message and add all response messages
      setMessages((prev) => {
        const withoutTemp = prev.filter((msg) => msg.id !== userMessage.id);
        const newMessages = responseMessages.map((msg) => ({
          id: msg.id,
          content: msg.message,
          sender: msg.author_type as "user" | "agent" | "system",
          timestamp: msg.created_at || new Date().toISOString(),
          skillCalls: msg.skill_calls || [],
        }));
        return [...withoutTemp, ...newMessages];
      });
    } catch (error: any) {
      logger.error(
        "Failed to send message",
        {
          agentName,
          threadId: chatThread.id,
          error: error.message,
        },
        "ChatInterface.sendMessage"
      );

      console.error("Error sending message:", error);

      // Remove the temporary message and show error
      setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id));

      const errorMessage: ExtendedMessage = {
        id: `error-${Date.now()}`,
        content: `Error: ${error.message || "Failed to send message"}`,
        sender: "system",
        timestamp: new Date().toISOString(),
        skillCalls: [],
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      logger.debug(
        "Enter key pressed, sending message",
        { agentName },
        "ChatInterface.handleKeyDown"
      );
      sendMessage();
    } else if (e.key === "ArrowUp" && messageHistory.length > 0) {
      e.preventDefault();
      const newIndex = Math.min(historyIndex + 1, messageHistory.length - 1);
      setHistoryIndex(newIndex);
      setInputValue(messageHistory[newIndex]);
      logger.debug(
        "Message history navigation up",
        { newIndex, agentName },
        "ChatInterface.handleKeyDown"
      );
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInputValue(messageHistory[newIndex]);
        logger.debug(
          "Message history navigation down",
          { newIndex, agentName },
          "ChatInterface.handleKeyDown"
        );
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputValue("");
        logger.debug(
          "Message history cleared",
          { agentName },
          "ChatInterface.handleKeyDown"
        );
      }
    }
  };

  const renderTypingIndicator = () => (
    <div className="flex justify-start mb-4">
      <div className="bg-[#21262d] text-[#c9d1d9] border border-[#30363d] rounded-lg px-4 py-2 max-w-xs">
        <div className="flex items-center space-x-1">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-[#58a6ff] rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-[#58a6ff] rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-[#58a6ff] rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
          <span className="text-sm text-[#8b949e] ml-2">
            Agent is typing...
          </span>
        </div>
      </div>
    </div>
  );

  const renderMessage = (message: ExtendedMessage, index: number) => {
    const isUser = message.sender === "user";
    const isSystem = message.sender === "system";

    return (
      <div
        key={message.id}
        className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}
      >
        <div
          className={`max-w-[85%] sm:max-w-[70%] rounded-lg px-3 sm:px-4 py-2 ${
            isUser
              ? "bg-[#0969da] text-white"
              : isSystem
              ? "bg-[#f85149]/10 border border-[#f85149]/20 text-[#f85149]"
              : "bg-[#21262d] text-[#c9d1d9] border border-[#30363d]"
          }`}
        >
          <div className="whitespace-pre-wrap break-words text-sm sm:text-base">
            {message.content}
          </div>

          {/* Skill calls display */}
          {message.skillCalls && message.skillCalls.length > 0 && (
            <div className="mt-2 pt-2 border-t border-[#30363d]">
              <div className="text-xs text-[#8b949e] mb-1">Skills used:</div>
              {message.skillCalls.map((skill: any, skillIndex: number) => (
                <div
                  key={skillIndex}
                  className="text-xs bg-[#0d1117] rounded px-2 py-1 mb-1"
                >
                  <span className="text-[#58a6ff] font-medium">
                    {skill.name}
                  </span>
                  {skill.success ? (
                    <span className="text-[#238636] ml-2">✓</span>
                  ) : (
                    <span className="text-[#f85149] ml-2">✗</span>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="text-xs text-[#8b949e] mt-1 opacity-70">
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
    );
  };

  if (initializingChat) {
    return (
      <div
        className={`bg-[${theme.colors.background.primary}] sm:rounded-xl sm:border border-[${theme.colors.border.primary}] flex flex-col h-full overflow-hidden`}
      >
        <div
          className={`p-2 sm:p-3 bg-[${theme.colors.background.primary}] text-[${theme.colors.text.primary}] border-b border-[${theme.colors.border.primary}] flex justify-between items-center`}
        >
          <div>
            <h2 className="text-base sm:text-lg font-semibold">
              Chat with {agentName}
            </h2>
          </div>
          {onToggleViewMode && (
            <button
              onClick={onToggleViewMode}
              className={`inline-flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm py-1.5 sm:py-2 px-2 sm:px-4 bg-[${theme.colors.background.tertiary}] text-[${theme.colors.text.secondary}] rounded-lg border border-[${theme.colors.border.secondary}] hover:bg-[${theme.colors.border.secondary}]/50 hover:border-[${theme.colors.border.tertiary}] transition-all duration-200`}
            >
              <svg
                className="w-3 h-3 sm:w-4 sm:h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="hidden sm:inline">
                {viewMode === "chat" ? "View Details" : "Back to Chat"}
              </span>
              <span className="sm:hidden">
                {viewMode === "chat" ? "Details" : "Chat"}
              </span>
            </button>
          )}
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div
              className={`animate-spin rounded-full h-8 w-8 border-2 border-[${theme.colors.border.secondary}] border-t-[${theme.colors.primary.main}] mb-4 mx-auto`}
            ></div>
            <p className={`text-[${theme.colors.text.tertiary}]`}>
              Initializing chat...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-[${theme.colors.background.primary}] sm:rounded-xl sm:border border-[${theme.colors.border.primary}] flex flex-col h-full overflow-hidden`}
    >
      <div
        className={`p-2 sm:p-3 bg-[${theme.colors.background.primary}] text-[${theme.colors.text.primary}] border-b border-[${theme.colors.border.primary}] flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0`}
      >
        <div className="flex-1 min-w-0">
          <h2 className="text-base sm:text-lg font-semibold truncate">
            Chat with {agentName}
          </h2>
          {chatThread && (
            <p
              className={`text-xs text-[${theme.colors.text.tertiary}] truncate`}
            >
              Thread: {chatThread.id.slice(0, 8)}...
            </p>
          )}
        </div>
        {onToggleViewMode && (
          <button
            onClick={onToggleViewMode}
            className={`inline-flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm py-1.5 sm:py-2 px-2 sm:px-4 bg-[${theme.colors.background.tertiary}] text-[${theme.colors.text.secondary}] rounded-lg border border-[${theme.colors.border.secondary}] hover:bg-[${theme.colors.border.secondary}]/50 hover:border-[${theme.colors.border.tertiary}] transition-all duration-200 whitespace-nowrap`}
          >
            <svg
              className="w-3 h-3 sm:w-4 sm:h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="hidden sm:inline">
              {viewMode === "chat" ? "View Details" : "Back to Chat"}
            </span>
            <span className="sm:hidden">
              {viewMode === "chat" ? "Details" : "Chat"}
            </span>
          </button>
        )}
      </div>
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-2 sm:p-3 sm:p-4 space-y-3 min-h-0"
      >
        {messages.length === 0 && !loading && (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-lg font-medium text-[#c9d1d9] mb-2">
                Start chatting with {agentName}
              </h3>
              <p className="text-sm text-[#8b949e]">
                Type a message below to begin the conversation
              </p>
            </div>
          </div>
        )}
        {messages.map((message, index) => renderMessage(message, index))}
        {loading && renderTypingIndicator()}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t border-[#30363d] p-2 sm:p-3 flex-shrink-0">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 p-3 sm:p-2 bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9] text-sm focus:outline-none focus:ring-1 focus:ring-[#58a6ff] focus:border-[#58a6ff]"
            disabled={loading || !chatThread}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !inputValue.trim() || !chatThread}
            className="px-4 py-3 sm:py-2 bg-[#238636] text-white rounded hover:bg-[#2ea043] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium whitespace-nowrap"
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
        {messageHistory.length > 0 && (
          <div className="text-xs text-[#8b949e] mt-1 hidden sm:block">
            Use ↑↓ arrows to navigate message history
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
