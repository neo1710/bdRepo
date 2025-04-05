"use client"
import InteractiveAvatar from "@/components/AvatarInteractionComp";
import CameraComponent from "@/components/CameraComp";
import { VoiceHandler } from "@/components/VoiceHandler";
import { useState } from "react";

export default function Home() {
  return ( <div className="w-full">
    <div className="font-[family-name:var(--font-geist-sans)] flex w-full">
      <CameraComponent/>
      <InteractiveAvatar/>
    </div>
    <VoiceHandler/>
    </div>
  );
}
