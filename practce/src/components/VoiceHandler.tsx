import { addMessage, updateMessage } from "@/store/slices/conversationReducer";
import { Button } from "@nextui-org/react"
import { useState } from "react";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa6";
import { } from "react-icons/fa6";
import { useDispatch, useSelector } from "react-redux";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
/* eslint-disable */


export const VoiceHandler = () => {
    const [spokenContent, setSpokenContent] = useState("")
    const [microphoneHandle, setMicrophoneHandle] = useState<boolean>(false)
    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition,
    } = useSpeechRecognition();
    const dispatch = useDispatch()
    const { messagesHistory } = useSelector((state: any) => state.conversation)

    const onButtonPress = () => {
        if (microphoneHandle) {
            SpeechRecognition.stopListening();
        } else {
            SpeechRecognition.startListening({ continuous: true });
        }
        setMicrophoneHandle(!microphoneHandle)
    }

    const mistralResponse = async () => {
        // Add user message to your state
        dispatch(addMessage({ role: "user", content: transcript }));

        try {
            // Create a message ID to track this specific AI message
            const messageId = Date.now().toString(); // Simple unique ID

            // Add initial empty AI message to the state
            dispatch(addMessage({ id: messageId, role: "AI", content: "" }));

            // Make the request with streaming enabled
            const response = await fetch("/api/get-gemini-response", {
                method: "POST",
                body: JSON.stringify({
                    message: transcript // or any other message you want to send
                })
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            // Get the reader from the response body stream
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            let accumulatedContent = ""; // Keep track of the full content so far

            // Read the stream
            if (!reader) {
                throw new Error("Failed to get reader from response body");
            }
            while (true) {
                const { done, value } = await reader?.read();
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
            resetTranscript(); // Reset the transcript after sending the message
            setMicrophoneHandle(false); // Reset the microphone state
        } catch (error) {
            console.error("Error with streaming response:", error);
            dispatch(addMessage({ role: "AI", content: "Sorry, I encountered an error while generating a response." }));
        }
    };
    console.log(messagesHistory, "messagesHistory")
    return <div className="w-full flex flex-col justify-center items-center h-1/2">
        <p className="p-2 bg-black text-white">
            {transcript}
        </p>
        <button className="text-white" onClick={mistralResponse}> send </button>
        <p className="p-2 bg-black text-white">
            {spokenContent}
        </p>
        <Button className={`p-2 ${microphoneHandle ? "bg-red-500 hover:bg-red-700" : "bg-blue-500 hover:bg-blue-700"}`}
            onPress={onButtonPress} >
            {microphoneHandle ? <FaMicrophoneSlash /> : <FaMicrophone />}
        </Button>
    </div>
}