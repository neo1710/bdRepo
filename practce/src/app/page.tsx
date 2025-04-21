"use client"
import InteractiveAvatar from "@/components/AvatarInteractionComp";
import CameraComponent from "@/components/CameraComp";
import { Nav } from "@/components/Nav";
import { VoiceHandler } from "@/components/VoiceHandler";
import { store } from "@/store";
import { Provider } from "react-redux";

export default function Home() {
  return (<div className="w-full">
    <Provider store={store}>
      <Nav />
      <div className="font-[family-name:var(--font-geist-sans)] flex w-[90%] m-auto">
        <CameraComponent />
        <InteractiveAvatar />
      </div>
      <VoiceHandler />
    </Provider>
  </div>
  );
}
