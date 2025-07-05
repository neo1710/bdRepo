import { addMessage, updateMessage } from "@/store/slices/conversationReducer";
import { Button } from "@nextui-org/react"
import { useEffect, useState, useRef } from "react";
import { FaMicrophone, FaMicrophoneSlash, FaVolumeUp, FaWaveSquare, FaRegPlayCircle } from "react-icons/fa";
import { useDispatch } from "react-redux";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import MessageBubble from './CustomMarkdown';
/* eslint-disable */

export const VoiceHandler = () => {
    const [spokenContent, setSpokenContent] = useState("")
    const [microphoneHandle, setMicrophoneHandle] = useState<boolean>(false)
    const [isSpeechComplete, setIsSpeechComplete] = useState(true);
    const [pendingSpokenText, setPendingSpokenText] = useState<string>("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [model, setModel] = useState<"default" | "groq">("default");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const dispatch = useDispatch();

    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition,
    } = useSpeechRecognition();

    const models = [
        {
            value: "default",
            label: "Default",
            icon: <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M8 12h8" /></svg>,
            description: "Standard performance"
        },
        {
            value: "groq",
            label: "Groq",
            icon: <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8L21 10h-9l1-8z" /></svg>,
            description: "High-speed inference"
        }
    ];
    const selectedModel = models.find(m => m.value === model);

    // When speech recognition stops and transcript is available, auto-send the message
    useEffect(() => {
        if (!listening && transcript && isSpeechComplete && microphoneHandle) {
            setPendingSpokenText(""); // Clear the pending text after sending
            handleSend(transcript);
            setMicrophoneHandle(false);
        }
    }, [listening, transcript, isSpeechComplete]);

    // Track when speech recognition is active
    useEffect(() => {
        if (listening) {
            setIsSpeechComplete(false);
        } else {
            // Small delay to ensure transcript is final
            const timer = setTimeout(() => {
                setIsSpeechComplete(true);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [listening]);

    // Show spoken text while listening
    useEffect(() => {
        if (listening) {
            setPendingSpokenText(transcript);
        }
    }, [transcript, listening]);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        if (isDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isDropdownOpen]);

    const onMicButtonPress = () => {
        if (microphoneHandle) {
            SpeechRecognition.stopListening();
            setMicrophoneHandle(false);
        } else {
            SpeechRecognition.startListening({ continuous: false });
            setMicrophoneHandle(true);
        }
    }

    // Accepts optional override for message (for voice input)
    const handleSend = async (overrideMessage?: string) => {
        // Stop listening if active
        if (microphoneHandle) {
            SpeechRecognition.stopListening();
            setMicrophoneHandle(false);
        }

        const messageToSend = overrideMessage?.trim();

        if (!messageToSend) return; // Don't send empty messages

        setIsProcessing(true);

        // Add user message to your state
        dispatch(addMessage({ role: "user", content: messageToSend }));

        try {
            // Create a message ID to track this specific AI message
            const messageId = Date.now().toString(); // Simple unique ID

            // Add initial empty AI message to the state
            dispatch(addMessage({ id: messageId, role: "AI", content: "" }));

            // Reset the input field
            resetTranscript();

            // Make the request with streaming enabled
            const response = await fetch("/api/get-gemini-response", {
                method: "POST",
                body: JSON.stringify({
                    message: messageToSend,
                    ...(model === "groq" ? { groq: true } : {})
                })
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            // Get the reader from the response body stream
            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error("Failed to get reader from response body");
            }

            const decoder = new TextDecoder();
            let accumulatedContent = ""; // Keep track of the full content so far

            // Read the stream
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                // Decode the chunk and process it
                const chunk = decoder.decode(value, { stream: true });

                // For Mistral API, we need to parse the SSE format
                const lines = chunk.split("\n");
                for (const line of lines) {
                    if (line.startsWith("data: ") && line !== "data: [DONE]") {
                        try {
                            // Parse the JSON in the data line
                            const jsonData = JSON.parse(line.substring(6));

                            // Extract the content delta (the new piece of text)
                            if (jsonData.choices && jsonData.choices[0].delta.content) {
                                const newContent = jsonData.choices[0].delta.content;

                                // Update our accumulated content
                                accumulatedContent += newContent;

                                // Update the spoken content for speech synthesis if you're using it
                                setSpokenContent(accumulatedContent);

                                // Update the existing message in Redux
                                dispatch(updateMessage({
                                    id: messageId,
                                    content: accumulatedContent
                                }));
                            }
                        } catch (e) {
                            console.error("Error parsing SSE data:", e);
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error with streaming response:", error);
            dispatch(addMessage({ role: "AI", content: "Sorry, I encountered an error while generating a response." }));
        } finally {
            setIsProcessing(false);
        }
    };

    // Speech Synthesis for AI response
    const speakAIResponse = () => {
        if (!spokenContent) return;
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        const utterance = new window.SpeechSynthesisUtterance(spokenContent);
        utterance.lang = "en-US";
        utterance.rate = 1;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
    };

    if (!browserSupportsSpeechRecognition) {
        return (
            <div className="w-full flex justify-center items-center min-h-[400px]">
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-8 shadow-2xl">
                    <div className="text-center">
                        <div className="text-red-400 text-6xl mb-4">⚠️</div>
                        <h3 className="text-xl font-semibold text-white mb-2">Speech Recognition Not Supported</h3>
                        <p className="text-gray-400">Your browser doesn't support speech recognition. Please use a modern browser like Chrome or Firefox.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full flex justify-center items-center p-2 sm:p-4 md:p-6">
            <div className="w-full max-w-4xl">
                {/* Main Voice Interface Card */}
                <div className="rounded-3xl p-4 sm:p-6 md:p-8">

                    {/* Header */}
                    <div className="text-center mb-6 sm:mb-8">
                        <div className="flex items-center justify-center mb-2 sm:mb-3">
                            <FaWaveSquare className="text-blue-400 text-xl sm:text-2xl mr-2 sm:mr-3" />
                            <h2 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                AI Voice Assistant
                            </h2>
                        </div>
                        <p className="text-gray-400 text-xs sm:text-sm">Press the microphone to start speaking</p>
                        {/* Model Dropdown */}
                        <div className="flex justify-center mt-3">
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsDropdownOpen(v => !v)}
                                    className="inline-flex items-center justify-between w-28 px-2 py-1 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded border border-blue-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 transition-all duration-200"
                                >
                                    <div className="flex items-center space-x-1">
                                        <span className="text-blue-200">{selectedModel?.icon}</span>
                                        <span className="truncate">{selectedModel?.label}</span>
                                    </div>
                                    <svg className={`w-3 h-3 ml-1 text-blue-200 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg>
                                </button>
                                {isDropdownOpen && (
                                    <div className="absolute z-10 w-32 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 right-0">
                                        <div className="py-1">
                                            {models.map((modelOption) => (
                                                <button
                                                    key={modelOption.value}
                                                    onClick={() => {
                                                        setModel(modelOption.value as "default" | "groq");
                                                        setIsDropdownOpen(false);
                                                    }}
                                                    className={`w-full px-3 py-2 text-left flex items-center space-x-2 hover:bg-gray-50 transition-colors duration-150 ${model === modelOption.value
                                                        ? 'bg-blue-50 text-blue-700'
                                                        : 'text-gray-700'
                                                        }`}
                                                >
                                                    <span className={`${model === modelOption.value ? 'text-blue-600' : 'text-gray-400'}`}>{modelOption.icon}</span>
                                                    <span className="text-xs font-medium truncate">{modelOption.label}</span>
                                                    {model === modelOption.value && (
                                                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Voice Control Section */}
                    <div className="flex flex-col items-center justify-center mb-6 sm:mb-8">
                        <div className="relative mb-4 sm:mb-6">
                            {/* Pulse Animation Ring */}
                            {listening && (
                                <div className="absolute inset-0 rounded-full border-4 border-green-400 animate-ping opacity-75"></div>
                            )}
                            {listening && (
                                <div className="absolute inset-0 rounded-full border-2 border-green-400 animate-pulse"></div>
                            )}

                            {/* Microphone Button */}
                            <Button
                                className={`relative p-6 sm:p-8 rounded-full text-white flex items-center justify-center transition-all duration-300 transform hover:scale-105 ${microphoneHandle
                                    ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/25"
                                    : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/25"
                                    }`}
                                onPress={onMicButtonPress}
                                disabled={isProcessing}
                            >
                                {microphoneHandle ? <FaMicrophoneSlash size={28} className="sm:size-9" /> : <FaMicrophone size={28} className="sm:size-9" />}
                            </Button>
                        </div>

                        {/* Status Indicator */}
                        <div className="text-center min-h-[40px] sm:min-h-[60px] flex flex-col items-center justify-center">
                            {listening && (
                                <div className="flex flex-col items-center animate-fade-in">
                                    <div className="flex items-center mb-2 sm:mb-3">
                                        <div className="flex space-x-1 mr-2 sm:mr-3">
                                            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        </div>
                                        <span className="text-green-400 text-base sm:text-lg font-semibold">Listening...</span>
                                    </div>
                                </div>
                            )}
                            {isProcessing && (
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent mr-2 sm:mr-3"></div>
                                    <span className="text-blue-400 text-base sm:text-lg font-semibold">Processing...</span>
                                </div>
                            )}
                            {!listening && !isProcessing && (
                                <span className="text-gray-500 text-sm sm:text-base">Ready to listen</span>
                            )}
                        </div>
                    </div>

                    {/* Speech Input Display */}
                    {listening && (
                        <div className="mb-6 sm:mb-8 animate-fade-in">
                            <div className="bg-gradient-to-r from-gray-700 to-gray-800 border border-gray-600 rounded-2xl p-4 sm:p-6 shadow-lg">
                                <div className="flex items-center mb-2 sm:mb-3">
                                    <FaMicrophone className="text-green-400 text-base sm:text-lg mr-1 sm:mr-2" />
                                    <span className="text-green-400 font-semibold text-sm sm:text-base">Your Speech</span>
                                </div>
                                <div className="bg-gray-900 rounded-lg p-2 sm:p-4 min-h-[40px] sm:min-h-[60px] flex items-center">
                                    <p className="text-white text-base sm:text-lg leading-relaxed break-words">
                                        {pendingSpokenText || (
                                            <span className="text-gray-500 italic">Start speaking...</span>
                                        )}
                                        {pendingSpokenText && (
                                            <span className="inline-block w-2 h-6 bg-green-400 ml-1 animate-pulse"></span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* AI Response Section */}
                    <div className="bg-gradient-to-r from-gray-700 to-gray-800 border border-gray-600 rounded-2xl p-4 sm:p-6 shadow-lg">
                        <div className="flex items-center mb-3 sm:mb-4">
                            <FaVolumeUp className="text-blue-400 text-base sm:text-lg mr-1 sm:mr-2" />
                            <span className="text-blue-400 font-semibold text-base sm:text-lg">AI Response</span>
                            {/* Speaker Button */}
                            <button
                                className="ml-3 sm:ml-4 p-1 rounded-full bg-blue-500 hover:bg-blue-600 transition-colors text-white flex items-center"
                                title="Speak AI Response"
                                onClick={speakAIResponse}
                                disabled={!spokenContent}
                                style={{ opacity: spokenContent ? 1 : 0.5 }}
                            >
                                <FaRegPlayCircle size={22} />
                            </button>
                            {isProcessing && (
                                <div className="ml-2 sm:ml-3 flex space-x-1">
                                    <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"></div>
                                    <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                            )}
                        </div>
                        <div className="bg-gray-900 rounded-lg p-3 sm:p-6 min-h-[60px] sm:min-h-[120px] flex items-start">
                            <div className="w-full">
                                <MessageBubble
                                    message={spokenContent || "AI response will appear here..."}
                                    isAI={true}
                                />
                                {isProcessing && spokenContent && (
                                    <span className="inline-block w-2 h-5 bg-blue-400 ml-1 animate-pulse"></span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer Instructions */}
                    <div className="mt-4 sm:mt-6 text-center">
                        <p className="text-gray-500 text-xs sm:text-sm">
                            💡 Tip: Speak clearly and wait for the response. The AI will automatically process your speech when you stop talking.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}