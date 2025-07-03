"use client"
import InteractiveAvatar from "@/components/AvatarInteractionComp";
import CameraComponent from "@/components/CameraComp";
import ConversationHistoryDrawer from "@/components/ConversationDrawer";
import { Nav } from "@/components/Nav";
import { VoiceHandler } from "@/components/VoiceHandler";
import { store } from "@/store";
import { Provider } from "react-redux";
import { useState } from "react";
import { Button } from "@nextui-org/react";

export default function Home() {
  const [showInteraction, setShowInteraction] = useState(false);
  const [showCamera, setShowCamera] = useState(true);
  const [showAvatar, setShowAvatar] = useState(true);
  const [startCamera, setStartCamera] = useState(false);
  const [startAvatar, setStartAvatar] = useState(false);

  const handleStart = () => {
    setShowInteraction(true);
    setShowCamera(true);
    setShowAvatar(true);
    setStartCamera(true);
    setStartAvatar(true);
  };

  const handleCloseCamera = () => {
    setShowCamera(false);
    setStartCamera(false);
  };
  const handleCloseAvatar = () => {
    setShowAvatar(false);
    setStartAvatar(false);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700">
      <Provider store={store}>
        <Nav />
        <ConversationHistoryDrawer />
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-2">
          {!showInteraction && (
            <Button
              size="lg"
              className="mb-8 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition"
              onPress={handleStart}
            >
              Start Interactive Session
            </Button>
          )}
          {showInteraction && (
            <div className="flex flex-col md:flex-row gap-6 md:gap-10 bg-gray-800/90 rounded-2xl shadow-2xl p-4 md:p-10 border border-gray-700 w-full max-w-5xl transition-all duration-300">
              {showCamera && (
                <div className="relative flex-1 flex justify-center items-center min-w-[320px] max-w-full mb-4 md:mb-0">
                  <Button
                    isIconOnly
                    size="sm"
                    className="absolute top-3 right-3 z-10 bg-red-500 text-white rounded-full shadow hover:bg-red-700"
                    onPress={handleCloseCamera}
                    aria-label="Close Camera"
                  >
                    ×
                  </Button>
                  <CameraComponent autoStart={startCamera} />
                </div>
              )}
              {showAvatar && (
                <div className="relative flex-1 flex justify-center items-center min-w-[320px] max-w-full">
                  <Button
                    isIconOnly
                    size="sm"
                    className="absolute top-3 right-3 z-10 bg-red-500 text-white rounded-full shadow hover:bg-red-700"
                    onPress={handleCloseAvatar}
                    aria-label="Close Avatar"
                  >
                    ×
                  </Button>
                  <InteractiveAvatar autoStart={startAvatar} />
                </div>
              )}
              {!showCamera && !showAvatar && (
                <div className="flex flex-col items-center justify-center min-h-[200px] w-full">
                  <span className="text-gray-300 mb-4">Both panels closed.</span>
                  <Button
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition"
                    onPress={handleStart}
                  >
                    Restart Session
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
        <VoiceHandler />
      </Provider>
    </div>
  );
}
