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

export default function InteractiveAvatar({ autoStart = false }: { autoStart?: boolean }) {
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

  useEffect(() => {
    if (autoStart) {
      startSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

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
        avatarName: "Katya_Chair_Sitting_public",
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
    <div className="w-full max-w-md min-w-[320px] h-auto flex flex-col gap-4 p-6 md:p-8 bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 border border-gray-700 rounded-2xl shadow-2xl transition-all duration-300">
      <Card className="bg-gray-900/80 rounded-xl shadow-lg p-2 flex-1 flex flex-col justify-between">
        {stream ? (
          <div className="w-full h-[320px] rounded-lg overflow-hidden flex flex-col items-center">
            <video
              ref={mediaStream}
              autoPlay
              playsInline
              className="rounded-lg border-2 border-gray-600 shadow"
              style={{
                width: "100%",
                height: "90%",
                objectFit: "contain",
                background: "#222"
              }}
            >
              <track kind="captions" />
            </video>
            <div className="flex gap-2 justify-around w-full mt-2">
              <Button
                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700"
                size="md"
                onPress={handleInterrupt}
              >
                Interrupt
              </Button>
              <Button
                className="p-2 bg-red-500 hover:bg-red-700 text-white rounded-lg"
                size="md"
                onPress={endSession}
              >
                End Session
              </Button>
            </div>
          </div>
        ) : !isLoadingSession ? (
          <div className="w-full h-[320px] flex flex-col justify-center items-center gap-8 self-center">
            <Button
              className="p-2 px-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-bold shadow hover:scale-105 transition"
              size="md"
              onPress={startSession}
            >
              Start Avatar Session
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[320px]">
            <Spinner color="default" size="lg" />
          </div>
        )}
        {chatMode === "text_mode" ? (
          <div className="flex relative mt-2">
            {text && (
              <div className="absolute right-4 top-2 text-green-400 font-semibold animate-pulse">Listening...</div>
            )}
          </div>
        ) : (
          <div className="w-full text-center mt-2">
            <Button
              className="p-2 bg-green-500 text-white rounded hover:bg-green-700"
              size="md"
            >
              {isUserTalking ? "Listening" : "Voice Chat"}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}