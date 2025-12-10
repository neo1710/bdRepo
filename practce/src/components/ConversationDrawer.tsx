import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, User, Bot, Trash2, ChevronDown, Cpu, Zap } from 'lucide-react';
import { useDispatch, useSelector } from "react-redux";
import { addMessage, updateMessage } from "@/store/slices/conversationReducer";
import { Button } from "@nextui-org/react";
import MessageBubble from './CustomMarkdown';
/* eslint-disable */

const ConversationHistoryDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string>("");
  const [text, setText] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [streamedContent, setStreamedContent] = useState<string>("");
  const [clearing, setClearing] = useState(false);
  const [model, setModel] = useState<"default" | "groq" | "sonar">("default");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const { messagesHistory } = useSelector((state: any) => state.conversation)

  const models = [
    {
      value: "default",
      label: "Default",
      icon: <Cpu className="w-3 h-3" />,
      description: "Standard performance"
    },
    {
      value: "groq",
      label: "Groq",
      icon: <Zap className="w-3 h-3" />,
      description: "High-speed inference"
    },
    {
      value: "sonar",
      label: "Sonar Pro",
      icon: <Zap className="w-3 h-3" />,
      description: "Perplexity Sonar"
    }
  ];

  const selectedModel = models.find(m => m.value === model);

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(""), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Send message handler (similar to VoiceHandler)
  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);

    dispatch(addMessage({ role: "user", content: text.trim() }));

    try {
      const messageId = Date.now().toString();
      dispatch(addMessage({ id: messageId, role: "AI", content: "" }));
      setText("");
      setStreamedContent("");

      const response = await fetch("/api/get-gemini-response", {
        method: "POST",
        body: JSON.stringify({
          message: text.trim(),
          model: model
        })
      });

      if (!response.ok) throw new Error(`Error: ${response.status}`);

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Failed to get reader");

      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Append new chunks to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete lines from buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the last incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6); // Remove 'data: ' prefix
              if (jsonStr === '[DONE]') continue;

              const jsonData = JSON.parse(jsonStr);

              // Handle Perplexity's response format
              if (model === "sonar") {
                const content = jsonData.choices?.[0]?.delta?.content ??
                  jsonData.choices?.[0]?.text ??
                  jsonData.choices?.[0]?.delta?.text ?? '';

                if (content) {
                  accumulatedContent += content;
                  setStreamedContent(accumulatedContent);
                  dispatch(updateMessage({
                    id: messageId,
                    content: accumulatedContent
                  }));
                }
              } else {
                // Handle other models
                const content = jsonData.choices?.[0]?.delta?.content || '';
                if (content) {
                  accumulatedContent += content;
                  setStreamedContent(accumulatedContent);
                  dispatch(updateMessage({
                    id: messageId,
                    content: accumulatedContent
                  }));
                }
              }
            } catch (e) {
              // Handle parse errors silently for incomplete chunks
            }
          }
        }
      }

      // Process any remaining content in buffer
      if (buffer) {
        try {
          const jsonData = JSON.parse(buffer.replace('data: ', ''));
          const finalContent = model === "sonar"
            ? jsonData.choices?.[0]?.delta?.content ??
            jsonData.choices?.[0]?.text ??
            jsonData.choices?.[0]?.delta?.text ?? ''
            : jsonData.choices?.[0]?.delta?.content || '';

          if (finalContent) {
            accumulatedContent += finalContent;
            setStreamedContent(accumulatedContent);
            dispatch(updateMessage({
              id: messageId,
              content: accumulatedContent
            }));
          }
        } catch (e) {
          // Ignore parse errors for final chunk
        }
      }
    } catch (error) {
      dispatch(addMessage({ role: "AI", content: "Sorry, I encountered an error while generating a response." }));
    }
    setSending(false);
  };

  const handleClearChat = () => {
    setClearing(true);
    setTimeout(() => {
      dispatch({ type: "conversation/clearMessages" });
      setStreamedContent("");
      setCopiedMessageId("");
      setClearing(false);
    }, 600); // Animation duration
  };

  // Handle Enter key to send message
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-scroll while streaming, stop when not streaming
  useEffect(() => {
    if (streamedContent) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [streamedContent]);

  // Also scroll to bottom when a new message is added (user or AI)
  useEffect(() => {
    if (!streamedContent && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messagesHistory.length]);

  // const formatTime = (messageId:string) => {
  //   // Generate a realistic time based on message order
  //   const baseTime = new Date('2025-07-01T10:30:00Z');
  //   const messageIndex = messagesHistory.findIndex(msg => msg.id === messageId);
  //   const messageTime = new Date(baseTime.getTime() + messageIndex * 2 * 60000); // 2 minutes apart
  //   return messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  // };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-12 left-4 z-40 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-105"
      >
        <MessageCircle size={20} />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-full max-w-full sm:w-96 bg-gradient-to-br from-black via-gray-900 to-gray-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-blue-600 text-white shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <Bot size={20} />
            </div>
            <div>
              <h2 className="font-semibold">{"Chat Bot"}</h2>
              <p className="text-xs text-green-100">{messagesHistory.length} messages</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Model Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="inline-flex items-center justify-between w-auto px-2 py-1 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded border border-blue-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 transition-all duration-200"
              >
                <div className="flex items-center space-x-1">
                  <div className="text-blue-200">
                    {selectedModel?.icon}
                  </div>
                  {/* Responsive: hide label on small screens, show on sm+ */}
                  <span className="truncate hidden sm:inline">{selectedModel?.label}</span>
                </div>
                <ChevronDown
                  className={`w-3 h-3 text-blue-200 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''
                    }`}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute z-10 w-32 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 right-0">
                  <div className="py-1">
                    {models.map((modelOption) => (
                      <button
                        key={modelOption.value}
                        onClick={() => {
                          setModel(modelOption.value as "default" | "groq" | "sonar");
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left flex items-center space-x-2 hover:bg-gray-50 transition-colors duration-150 ${model === modelOption.value
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700'
                          }`}
                      >
                        <div className={`${model === modelOption.value ? 'text-blue-600' : 'text-gray-400'
                          }`}>
                          {modelOption.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate">
                            {modelOption.label}
                          </div>
                        </div>
                        {model === modelOption.value && (
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Backdrop to close dropdown when clicking outside */}
              {isDropdownOpen && (
                <div
                  className="fixed inset-0 z-0"
                  onClick={() => setIsDropdownOpen(false)}
                />
              )}
            </div>
            <button
              onClick={handleClearChat}
              className="p-2 hover:bg-red-600 rounded-full transition-colors duration-200"
              title="Clear Chat"
            >
              <Trash2 size={18} />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-green-700 rounded-full transition-colors duration-200"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Messages Container */}
        <div
          className={`relative flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-3 transition-all duration-500 custom-scrollbar`}
          style={{ height: 'calc(100vh - 180px)' }}
        >
          {/* Animated "clearing" message - absolutely centered */}
          {clearing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-50 pointer-events-none">
              <div className="w-12 h-12 mb-2 flex items-center justify-center">
                <Trash2 size={36} className="text-red-400 animate-bounce" />
              </div>
              <span className="text-red-300 text-lg font-semibold animate-pulse">Clearing chat...</span>
            </div>
          )}
          <div className={`transition-all duration-500 ${clearing ? "opacity-0 scale-95 blur-sm" : "opacity-100 scale-100 blur-0"}`}>
            {messagesHistory.map((message: any, index: number) => {
              const isUser = message.role === 'user';
              const isConsecutive = index > 0 && messagesHistory[index - 1].role === message.role;
              const isLastAIStreaming = !isUser && index === messagesHistory.length - 1 && streamedContent;
              return (
                <div
                  key={message.id || index}
                  className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} ${isConsecutive ? 'mt-1' : 'mt-4'}`}
                >
                  <div
                    className={`relative w-full max-w-full sm:max-w-xs md:max-w-sm lg:max-w-md flex ${isUser ? 'justify-end' : 'justify-start'}`}
                    style={{ overflow: "visible" }}
                  >
                    {/* Message Bubble with icon in top corner */}
                    <div className={`relative ${isUser ? 'ml-auto' : 'mr-auto'} max-w-[92vw] sm:max-w-[90%]`}>
                      {/* Icon in top corner (not inside MessageBubble) */}
                      {isUser ? (
                        <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 z-10">
                          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-md border-2 border-white">
                            <User size={12} className="sm:w-4 sm:h-4" />
                          </div>
                        </div>
                      ) : (
                        <div className="absolute -top-2 -left-2 sm:-top-3 sm:-left-3 z-10">
                          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-400 text-white rounded-full flex items-center justify-center shadow-md border-2 border-white">
                            <Bot size={12} className="sm:w-4 sm:h-4" />
                          </div>
                        </div>
                      )}
                      {/* Message Bubble (icon not inside) */}
                      <MessageBubble
                        message={isLastAIStreaming ? streamedContent : message.content}
                        isAI={!isUser}
                        onCopy={() => copyToClipboard(isLastAIStreaming ? streamedContent : message.content, message.id)}
                        copied={copiedMessageId === message.id}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            {/* Scroll anchor */}
            <div ref={messagesEndRef} id="messages-end" />
          </div>
        </div>
        {/* Input area for chat */}
        <div className="p-2 sm:p-4 border-t border-gray-700 bg-gray-900 flex items-center gap-2">
          <textarea
            ref={textareaRef}
            className="flex-1 p-2 text-gray-300 bg-gray-800 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={sending}
          />
          <Button
            className="px-3 py-2 sm:px-4 sm:py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-md text-sm sm:text-base"
            onPress={handleSend}
            isLoading={sending}
            disabled={sending || !text.trim()}
          >
            Send
          </Button>
        </div>
      </div>
      <style jsx global>{`
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #334155 #18181b;
  }
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
    background: #18181b;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #334155 40%, #2563eb 100%);
    border-radius: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, #2563eb 40%, #334155 100%);
  }
`}</style>
    </>
  );
};

export default ConversationHistoryDrawer;