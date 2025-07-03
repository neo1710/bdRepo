import React, { useState, useRef } from 'react';
import { MessageCircle, X, User, Bot, Menu, Copy, Check } from 'lucide-react';
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dispatch = useDispatch();
  const { messagesHistory } = useSelector((state: any) => state.conversation)

  // Single conversation with messages based on your structure
  const conversation = {
    id: '1751343736934',
    title: 'Current Chat',
    messages: [
      { id: '1751343736934', role: 'user', content: 'hey' },
      { id: '1751343925477', role: 'AI', content: "Hey! 😊 How's it going? What's up?" },
      { id: '1751343925478', role: 'user', content: 'I need help with creating a conversation drawer component' },
      { id: '1751343925479', role: 'AI', content: "I'd be happy to help you create a conversation drawer component! What specific features would you like it to have? For example, do you want it to slide in from the side, show message history, have search functionality, or any particular styling?" },
      { id: '1751343925480', role: 'user', content: 'Yes, make it like WhatsApp with message bubbles and copy functionality' },
      { id: '1751343925481', role: 'AI', content: "Perfect! I'll create a WhatsApp-style conversation drawer with message bubbles and copy functionality. The user messages will appear on the right with a different color, AI messages on the left, and each message will have a copy button that appears on hover." },
      { id: '1751343925482', role: 'user', content: 'That sounds great!' },
      { id: '1751343925483', role: 'AI', content: "Awesome! Let me build that for you right now. It'll have smooth animations, proper message grouping, timestamps, and a clean WhatsApp-inspired design." }
    ]
  };

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

    // Add user message
    dispatch(addMessage({ role: "user", content: text.trim() }));

    try {
      const messageId = Date.now().toString();
      dispatch(addMessage({ id: messageId, role: "AI", content: "" }));
      setText("");
      setStreamedContent("");

      const response = await fetch("/api/get-gemini-response", {
        method: "POST",
        body: JSON.stringify({
          message: text.trim()
        })
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Failed to get reader from response body");

      const decoder = new TextDecoder();
      let accumulatedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const jsonData = JSON.parse(line.substring(6));
              if (jsonData.choices && jsonData.choices[0].delta.content) {
                const newContent = jsonData.choices[0].delta.content;
                accumulatedContent += newContent;
                setStreamedContent(accumulatedContent);
                dispatch(updateMessage({
                  id: messageId,
                  content: accumulatedContent
                }));
              }
            } catch (e) {
              // ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      dispatch(addMessage({ role: "AI", content: "Sorry, I encountered an error while generating a response." }));
    }
    setSending(false);
  };

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
        className="fixed top-4 left-4 z-40 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-105"
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
        className={`fixed top-0 left-0 h-full w-96 bg-gradient-to-br from-black via-gray-900 to-gray-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
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
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-green-700 rounded-full transition-colors duration-200"
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ height: 'calc(100vh - 180px)' }}>
          {messagesHistory.map((message: any, index: number) => {
            const isUser = message.role === 'user';
            const isConsecutive = index > 0 && messagesHistory[index - 1].role === message.role;
            const isLastAIStreaming = !isUser && index === messagesHistory.length - 1 && streamedContent;
            return (
              <div
                key={message.id || index}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${isConsecutive ? 'mt-1' : 'mt-4'
                  }`}
              >
                <div className={`group relative max-w-xs lg:max-w-md ${isUser ? 'order-2' : 'order-1'}`}>
                  {/* Avatar (only show if not consecutive) */}
                  {!isConsecutive && (
                    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-1`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${isUser ? 'bg-blue-500 text-white' : 'bg-gray-400 text-white'
                        }`}>
                        {isUser ? <User size={12} /> : <Bot size={12} />}
                      </div>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <MessageBubble
                    message={isLastAIStreaming ? streamedContent : message.content}
                    isAI={!isUser}
                    onCopy={() => copyToClipboard(isLastAIStreaming ? streamedContent : message.content, message.id)}
                    copied={copiedMessageId === message.id}
                  />

                  {/* Message Tail */}
                  <div
                    className={`absolute top-0 w-3 h-3 ${isUser
                        ? 'right-0 transform translate-x-1'
                        : 'left-0 transform -translate-x-1'
                      } ${!isConsecutive ? 'block' : 'hidden'}`}
                  >
                    <div
                      className={`w-full h-full transform rotate-45 ${isUser ? 'bg-green-500' : 'bg-white border-l border-b border-gray-200'
                        }`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
          {/* Scroll anchor */}
          <div id="messages-end" />
        </div>
        {/* Input area for chat */}
        <div className="p-4 border-t border-gray-700 bg-gray-900 flex items-center gap-2">
          <textarea
            ref={textareaRef}
            className="flex-1 p-2 text-gray-300 bg-gray-800 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your message..."
            disabled={sending}
          />
          <Button
            className="px-4 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-md"
            onPress={handleSend}
            isLoading={sending}
            disabled={sending || !text.trim()}
          >
            Send
          </Button>
        </div>
      </div>
    </>
  );
};

export default ConversationHistoryDrawer;