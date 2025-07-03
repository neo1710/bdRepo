import { addMessage, updateMessage } from "@/store/slices/conversationReducer";
import { Button } from "@nextui-org/react"
import { useEffect, useState } from "react";
import { FaMicrophone, FaMicrophoneSlash, FaVolumeUp, FaWaveSquare } from "react-icons/fa";
import { useDispatch } from "react-redux";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
/* eslint-disable */

export const VoiceHandler = () => {
    const [spokenContent, setSpokenContent] = useState("")
    const [microphoneHandle, setMicrophoneHandle] = useState<boolean>(false)
    const [isSpeechComplete, setIsSpeechComplete] = useState(true);
    const [pendingSpokenText, setPendingSpokenText] = useState<string>("");
    const [isProcessing, setIsProcessing] = useState(false);
    const dispatch = useDispatch();

    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition,
    } = useSpeechRecognition();

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
                    message: messageToSend
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
        <div className="w-full flex justify-center items-center p-6">
            <div className="w-full max-w-4xl">
                {/* Main Voice Interface Card */}
                <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black border border-gray-700 rounded-3xl p-8 shadow-2xl backdrop-blur-lg">

                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="flex items-center justify-center mb-3">
                            <FaWaveSquare className="text-blue-400 text-2xl mr-3" />
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                AI Voice Assistant
                            </h2>
                        </div>
                        <p className="text-gray-400 text-sm">Press the microphone to start speaking</p>
                    </div>

                    {/* Voice Control Section */}
                    <div className="flex flex-col items-center justify-center mb-8">
                        <div className="relative mb-6">
                            {/* Pulse Animation Ring */}
                            {listening && (
                                <div className="absolute inset-0 rounded-full border-4 border-green-400 animate-ping opacity-75"></div>
                            )}
                            {listening && (
                                <div className="absolute inset-0 rounded-full border-2 border-green-400 animate-pulse"></div>
                            )}

                            {/* Microphone Button */}
                            <Button
                                className={`relative p-8 rounded-full text-white flex items-center justify-center transition-all duration-300 transform hover:scale-105 ${microphoneHandle
                                        ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/25"
                                        : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/25"
                                    }`}
                                onPress={onMicButtonPress}
                                disabled={isProcessing}
                            >
                                {microphoneHandle ? <FaMicrophoneSlash size={36} /> : <FaMicrophone size={36} />}
                            </Button>
                        </div>

                        {/* Status Indicator */}
                        <div className="text-center min-h-[60px] flex flex-col items-center justify-center">
                            {listening && (
                                <div className="flex flex-col items-center animate-fade-in">
                                    <div className="flex items-center mb-3">
                                        <div className="flex space-x-1 mr-3">
                                            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        </div>
                                        <span className="text-green-400 text-lg font-semibold">Listening...</span>
                                    </div>
                                </div>
                            )}
                            {isProcessing && (
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent mr-3"></div>
                                    <span className="text-blue-400 text-lg font-semibold">Processing...</span>
                                </div>
                            )}
                            {!listening && !isProcessing && (
                                <span className="text-gray-500 text-base">Ready to listen</span>
                            )}
                        </div>
                    </div>

                    {/* Speech Input Display */}
                    {listening && (
                        <div className="mb-8 animate-fade-in">
                            <div className="bg-gradient-to-r from-gray-700 to-gray-800 border border-gray-600 rounded-2xl p-6 shadow-lg">
                                <div className="flex items-center mb-3">
                                    <FaMicrophone className="text-green-400 text-lg mr-2" />
                                    <span className="text-green-400 font-semibold">Your Speech</span>
                                </div>
                                <div className="bg-gray-900 rounded-lg p-4 min-h-[60px] flex items-center">
                                    <p className="text-white text-lg leading-relaxed">
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
                    <div className="bg-gradient-to-r from-gray-700 to-gray-800 border border-gray-600 rounded-2xl p-6 shadow-lg">
                        <div className="flex items-center mb-4">
                            <FaVolumeUp className="text-blue-400 text-lg mr-2" />
                            <span className="text-blue-400 font-semibold text-lg">AI Response</span>
                            {isProcessing && (
                                <div className="ml-3 flex space-x-1">
                                    <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"></div>
                                    <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                            )}
                        </div>
                        <div className="bg-gray-900 rounded-lg p-6 min-h-[120px] flex items-start">
                            <p className="text-gray-300 text-base leading-relaxed whitespace-pre-wrap">
                                {spokenContent || (
                                    <span className="text-gray-500 italic">AI response will appear here...</span>
                                )}
                                {isProcessing && spokenContent && (
                                    <span className="inline-block w-2 h-5 bg-blue-400 ml-1 animate-pulse"></span>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Footer Instructions */}
                    <div className="mt-6 text-center">
                        <p className="text-gray-500 text-sm">
                            💡 Tip: Speak clearly and wait for the response. The AI will automatically process your speech when you stop talking.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}