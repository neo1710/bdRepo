import type { StartAvatarResponse } from "@heygen/streaming-avatar";
/* eslint-disable */

import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  TaskMode,
  TaskType,
  VoiceEmotion,
} from "@heygen/streaming-avatar";
import {
  Button,
  Card,
  Input,
  Select,
  Spinner,
  SelectItem,
} from "@nextui-org/react";
import { useEffect, useRef, useState } from "react";
import { AVATARS, STT_LANGUAGE_LIST } from "../app/lib/contants";

import InteractiveAvatarTextInput from "./InteractiveAvatarTextInput";
import { useSelector } from "react-redux";

export default function InteractiveAvatar() {
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isLoadingRepeat, setIsLoadingRepeat] = useState(false);
  const [stream, setStream] = useState<MediaStream>();
  const [debug, setDebug] = useState<string>();
  const [knowledgeId, setKnowledgeId] = useState<string>("");
  const [avatarId, setAvatarId] = useState<string>("");
  const [language, setLanguage] = useState<string>("en");
  const [previousChunk, setPreviousChunk] = useState<number>(0);

  const [data, setData] = useState<StartAvatarResponse>();
  const [text, setText] = useState<string>("");
  const mediaStream = useRef<HTMLVideoElement>(null);
  const avatar = useRef<StreamingAvatar | null>(null);
  const [chatMode, setChatMode] = useState("text_mode");
  const [isUserTalking, setIsUserTalking] = useState(false);
  const { messagesHistory } = useSelector((state: any) => state.conversation)

  useEffect(() => {
    handleSpeak();
  }, [messagesHistory])

  function baseApiUrl() {
    return process.env.NEXT_PUBLIC_BASE_API_URL;
  }

  async function fetchAccessToken() {
    try {
      const response = await fetch("api/get-access-token", {
        method: "POST",
      });
      const token = await response.text();

      console.log("Access Token:", token); // Log the token to verify

      return token;
    } catch (error) {
      console.error("Error fetching access token @@@@@@@@@:", error);
    }

    return "";
  }

  async function startSession() {
    setIsLoadingSession(true);
    const newToken = await fetchAccessToken();

    avatar.current = new StreamingAvatar({
      token: newToken,
      basePath: baseApiUrl(),
    });
    avatar.current.on(StreamingEvents.AVATAR_START_TALKING, (e) => {
      console.log("Avatar started talking", e);
    });
    avatar.current.on(StreamingEvents.AVATAR_STOP_TALKING, (e) => {
      console.log("Avatar stopped talking", e);
    });
    avatar.current.on(StreamingEvents.STREAM_DISCONNECTED, () => {
      console.log("Stream disconnected");
      endSession();
    });
    avatar.current?.on(StreamingEvents.STREAM_READY, (event) => {
      console.log(">>>>> Stream ready:", event.detail);
      setStream(event.detail);
    });
    // avatar.current?.on(StreamingEvents.USER_START, (event) => {
    //   console.log(">>>>> User started talking:", event);
    //   setIsUserTalking(true);
    // });
    // avatar.current?.on(StreamingEvents.USER_STOP, (event) => {
    //   console.log(">>>>> User stopped talking:", event);
    //   setIsUserTalking(false);
    // });
    try {
      const res = await avatar.current.createStartAvatar({
        quality: AvatarQuality.Low,
        avatarName: avatarId,
        knowledgeId: knowledgeId, // Or use a custom `knowledgeBase`.
        voice: {
          rate: 1.5, // 0.5 ~ 1.5
          emotion: VoiceEmotion.EXCITED,
          // elevenlabsSettings: {
          //   stability: 1,
          //   similarity_boost: 1,
          //   style: 1,
          //   use_speaker_boost: false,
          // },
        },
        language: language,
        disableIdleTimeout: true,
      });

      setData(res);
      // default to voice mode
      // await avatar.current?.startVoiceChat({
      //   useSilencePrompt: false,
      // });
      // setChatMode("voice_mode");
    } catch (error) {
      console.error("Error starting avatar session:", error);
    } finally {
      setIsLoadingSession(false);
    }
  }
  async function handleSpeak() {
    setIsLoadingRepeat(true);
    if (!avatar.current || !messagesHistory || messagesHistory.length === 0 || messagesHistory[messagesHistory.length - 1].role === "user") {
      setDebug("Avatar API not initialized");
      console.log("Messages history:", messagesHistory);
      return;
    }

    const speakableText =
      previousChunk === 0
        ? messagesHistory[messagesHistory.length - 1].content
        : messagesHistory[messagesHistory.length - 1].content.slice(
          previousChunk,
          messagesHistory[messagesHistory.length - 1].content.length,
        );
    // setiing the value of previous chunk to the length of the last message
    if (messagesHistory[messagesHistory.length - 1].role !== 'user') {
      setPreviousChunk(messagesHistory[messagesHistory.length - 1].content.length);
    }
    console.log("Avatar API initialized, speaking:", messagesHistory[messagesHistory.length - 1]);
    // speak({ text: text, task_type: TaskType.REPEAT })
    await avatar.current
      .speak({ text: speakableText, taskType: TaskType.REPEAT, taskMode: TaskMode.SYNC })
      .catch((e) => {
        setDebug(e.message);
      });
    setIsLoadingRepeat(false);
  }
  async function handleInterrupt() {
    if (!avatar.current) {
      setDebug("Avatar API not initialized");

      return;
    }
    await avatar.current.interrupt().catch((e) => {
      setDebug(e.message);
    });
  }
  async function endSession() {
    await avatar.current?.stopAvatar();
    setStream(undefined);
  }

  const handleChangeChatMode = async (v: any) => {
    if (v === chatMode) {
      return;
    }
    if (v === "text_mode") {
      avatar.current?.closeVoiceChat();
    } else {
      await avatar.current?.startVoiceChat();
    }
    setChatMode(v);
  };

  const previousText = (text);
  useEffect(() => {
    if (!previousText && text) {
      avatar.current?.startListening();
    } else if (previousText && !text) {
      avatar?.current?.stopListening();
    }
  }, [text, previousText]);

  useEffect(() => {
    return () => {
      endSession();
    };
  }, []);

  useEffect(() => {
    if (stream && mediaStream.current) {
      mediaStream.current.srcObject = stream;
      mediaStream.current.onloadedmetadata = () => {
        mediaStream.current!.play();
        setDebug("Playing");
      };
    }
  }, [mediaStream, stream]);

  return (
    <div className="w-[50%] h-[500px] flex flex-col gap-4 p-2 bg-gray-600 border border-left-1 border-black">
      <Card>
        {stream ? (
          <div className="w-full h-[400px] w-[400px] justify-center items-center flex rounded-lg overflow-hidden">
            <video
              ref={mediaStream}
              autoPlay
              playsInline
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
            >
              <track kind="captions" />
            </video>
            <div className="flex gap-2 bottom-3 right-3 w-full">
              <Button
                className="p-2 bg-green-500 text-white rounded-lg rounded hover:bg-green-700"
                size="md"
                onPress={handleInterrupt}
              >
                Interrupt task
              </Button>
              <Button
                className="p-2 bg-green-500 text-white rounded-lg rounded hover:bg-green-700"
                size="md"
                onPress={endSession}
              >
                End session
              </Button>
            </div>
          </div>
        ) : !isLoadingSession ? (
          <div className="w-full h-[500px] justify-center items-center flex flex-col gap-8 self-center">
            <Button
              className="p-2 bg-blue-500 text-white rounded hover:bg-blue-700"
              size="md"
              onPress={startSession}
            >
              Start session
            </Button>

          </div>
        ) : (
          <Spinner color="default" size="lg" />
        )}
        {chatMode === "text_mode" ? (
          <div className="flex relative">
            
            {text && (
              <div className="absolute right-16 top-3">Listening</div>
            )}
          </div>
        ) : (
          <div className="w-full text-center">
            <Button
              className="p-2 bg-green-500 text-white rounded hover:bg-green-700"
              size="md"
            >
              {isUserTalking ? "Listening" : "Voice chat"}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}