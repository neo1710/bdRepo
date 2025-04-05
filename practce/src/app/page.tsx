"use client"
import InteractiveAvatar from "@/components/AvatarInteractionComp";
import CameraComponent from "@/components/CameraComp";
import { useState } from "react";

export default function Home() {
  return (
    <div className="font-[family-name:var(--font-geist-sans)] flex">
      <CameraComponent/>
      <InteractiveAvatar/>
    </div>
  );
}
