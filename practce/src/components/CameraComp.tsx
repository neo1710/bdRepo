"use client";

import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { Button } from "@nextui-org/react";

const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/";

const CameraComponent = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [expression, setExpression] = useState<string>("");
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const loadModels = async () => {
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      console.log("TinyFaceDetector model loaded");
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      console.log("FaceLandmark68Net model loaded");
      await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
      console.log("FaceExpressionNet model loaded");
    };

    loadModels();
  }, []);

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

  const startCamera = async () => {
    try {
      const userStream = await navigator.mediaDevices.getUserMedia({ video: {} });
      setStream(userStream);
      if (videoRef.current) {
        videoRef.current.srcObject = userStream;
        videoRef.current.onloadedmetadata = () => {
          console.log("Video metadata loaded");
        };
        videoRef.current.onerror = (error) => {
          console.error("Video error:", error);
        };
      }
      setIsCameraActive(true);
    } catch (error) {
      console.error("Error accessing webcam:", error);
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
      console.log("Webcam stream stopped");
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
    <div className="w-[50%] h-[500px]">
      <video ref={videoRef} autoPlay playsInline style={{ width: 400, height: 300, display: isCameraActive ? "block" : "none" }} />
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <p>Expression: {expression}</p>
      <Button onPress={toggleCamera} className="p-2 bg-green-500 text-white rounded hover:bg-green-700">
        {isCameraActive ? "Stop Camera" : "Start Camera"}
      </Button>
    </div>
  );
};

export default CameraComponent;
