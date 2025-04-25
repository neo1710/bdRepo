import { addMessage, updateMessage } from "@/store/slices/conversationReducer";
import { Button } from "@nextui-org/react"
import { useEffect, useState, useRef } from "react";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa6";
import { } from "react-icons/fa6";
import { useDispatch, useSelector } from "react-redux";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
/* eslint-disable */

export const VoiceHandler = () => {
    const [spokenContent, setSpokenContent] = useState("")
    const [microphoneHandle, setMicrophoneHandle] = useState<boolean>(false)
    const [text, setText] = useState<string>("");
    const [isSpeechComplete, setIsSpeechComplete] = useState(true);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const dispatch = useDispatch()
    const { messagesHistory } = useSelector((state: any) => state.conversation)

    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition,
    } = useSpeechRecognition();

    // Update text when speech recognition stops
    useEffect(() => {
        if (!listening && transcript && isSpeechComplete) {
            setText(prev => {
                const updatedText = prev.trim() ? `${prev.trim()} ${transcript}` : transcript;
                return updatedText;
            });
            resetTranscript();
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

    const onButtonPress = () => {
        if (microphoneHandle) {
            SpeechRecognition.stopListening();
        } else {
            SpeechRecognition.startListening({ continuous: true });
        }
        setMicrophoneHandle(!microphoneHandle);

        // Focus on textarea when activating mic
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    }

    const handleSend = async () => {
        // Stop listening if active
        if (microphoneHandle) {
            SpeechRecognition.stopListening();
            setMicrophoneHandle(false);
        }

        // Get the final text to send (combine textarea content and any pending transcript)
        const messageToSend = text.trim() || transcript;

        if (!messageToSend) return; // Don't send empty messages

        // Add user message to your state
        dispatch(addMessage({ role: "user", content: messageToSend }));

        try {
            // Create a message ID to track this specific AI message
            const messageId = Date.now().toString(); // Simple unique ID

            // Add initial empty AI message to the state
            dispatch(addMessage({ id: messageId, role: "AI", content: "" }));

            // Reset the input field
            setText("");
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
        }
    };

    console.log(messagesHistory, "messagesHistory")

    return (
        <div className="w-[100%] flex justify-center items-center">
            <div className="w-[80%] rounded-lg shadow-lg p-4">
                <div className="flex items-center justify-around mb-4">
                    <div className="mb-4 w-[85%] relative">
                        <textarea
                            ref={textareaRef}
                            className="w-full p-2 pl-12 text-gray-300 bg-gray-700 rounded-md mt-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={2}
                            value={listening ? `${text}${text ? ' ' : ''}${transcript}` : text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Start speaking or type here..."
                        />
                        <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                            <Button
                                className={`p-2 rounded-full text-white flex items-center justify-around ${microphoneHandle
                                        ? "bg-red-500 hover:bg-red-600"
                                        : "bg-blue-500 hover:bg-blue-600"
                                    }`}
                                onPress={onButtonPress}
                            >
                                {microphoneHandle ? <FaMicrophoneSlash size={16} /> : <FaMicrophone size={16} />}
                            </Button>
                        </div>
                    </div>
                    <div className="mb-4 w-[10%]">
                        <Button
                            className="w-[100%] p-4 text-white bg-blue-500 hover:bg-blue-600 rounded-md"
                            onPress={handleSend}
                        >
                            Send
                        </Button>
                    </div>
                </div>
                <div className="mb-4">
                    <p className="p-2 text-white text-lg font-semibold border-b border-gray-700">
                        AI Response:
                    </p>
                    <p className="p-2 text-gray-300 bg-gray-700 rounded-md mt-2">
                        {spokenContent || "AI response will appear here..."}
                    </p>
                </div>
            </div>
        </div>
    );
}