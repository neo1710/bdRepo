"use client";

import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { Button } from "@nextui-org/react";

const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/";

const CameraComponent = ({ autoStart = false }: { autoStart?: boolean }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [expression, setExpression] = useState<string>("");
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const loadModels = async () => {
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
    };

    loadModels();
  }, []);

  useEffect(() => {
    if (autoStart && !isCameraActive) {
      startCamera();
    }
    // If autoStart is false and camera is active, stop the camera
    if (!autoStart && isCameraActive) {
      stopCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const analyzeFace = async () => {
      if (videoRef.current && canvasRef.current) {
        const detections = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceExpressions();

        if (detections) {
          const expressions = detections.expressions;
          const maxValue = Math.max(...Object.values(expressions));
          const detectedExpression = Object.keys(expressions).find(
            (key) => expressions[key as keyof typeof expressions] === maxValue
          );
          setExpression(detectedExpression || "");
        }
      }
    };

    if (isCameraActive) {
      interval = setInterval(analyzeFace, 500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCameraActive]);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCamera = async () => {
    try {
      const userStream = await navigator.mediaDevices.getUserMedia({ video: {} });
      setStream(userStream);
      if (videoRef.current) {
        videoRef.current.srcObject = userStream;
      }
      setIsCameraActive(true);
    } catch (error) {
      // handle error
      console.error("Error accessing camera:", error);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsCameraActive(false);
    }
  };

  const toggleCamera = () => {
    if (isCameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  return (
    <div className="w-full max-w-md min-w-[320px] h-auto flex flex-col items-center justify-between bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-6 md:p-8 transition-all duration-300">
      <div className="relative w-full flex justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={`rounded-xl border-2 border-gray-600 shadow-lg transition-all duration-300 ${isCameraActive ? "block" : "hidden"
            }`}
          style={{ width: "100%", height: "320px", background: "#222" }}
        />
        <canvas ref={canvasRef} style={{ display: "none" }} />
        {!isCameraActive && (
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-gray-400 text-lg font-semibold">
            Camera is off
          </div>
        )}
      </div>
      <div className="flex flex-col items-center w-full mt-4 gap-3">
        <div className="px-4 py-2 bg-gray-900/80 rounded-lg border border-gray-600 text-blue-300 font-medium shadow text-center w-full">
          Expression:{" "}
          <span className="font-bold text-white">{expression || "N/A"}</span>
        </div>
        <Button
          onPress={toggleCamera}
          className="w-full py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg shadow hover:scale-105 transition"
        >
          {isCameraActive ? "Stop Camera" : "Start Camera"}
        </Button>
      </div>
    </div>
  );
};

export default CameraComponent;



