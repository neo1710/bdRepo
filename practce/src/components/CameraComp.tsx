"use client"; // Required for Next.js App Router

import { useEffect, useRef, useState } from "react";

const CameraComponent = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [motionDetected, setMotionDetected] = useState(false);
  let prevFrame: ImageData | null = null;
  
  useEffect(() => {
    return () => stopCamera(); // Ensure camera stops when component unmounts
  }, []);
  
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
      setIsCameraOn(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };
console.log(stream);
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsCameraOn(false);
    }
  };
  const detectMotion = () => {
    if (!canvasRef.current || !videoRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
    const frame = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);

    if (prevFrame) {
      let diff = 0;
      for (let i = 0; i < frame.data.length; i += 4) {
        const rDiff = Math.abs(frame.data[i] - prevFrame.data[i]);
        const gDiff = Math.abs(frame.data[i + 1] - prevFrame.data[i + 1]);
        const bDiff = Math.abs(frame.data[i + 2] - prevFrame.data[i + 2]);

        if (rDiff + gDiff + bDiff > 50) diff++;
      }

      setMotionDetected(diff > 5000); // Adjust threshold as needed
    }

    prevFrame = frame;
    requestAnimationFrame(detectMotion);
  };

  useEffect(() => {
    if (isCameraOn) {
      setTimeout(() => detectMotion(), 500); // Start motion detection
    }
  }, [isCameraOn]);



  return (
    <div className="flex flex-col items-center space-y-4 p-3 border border-gray-700">
      <video ref={videoRef} autoPlay playsInline className="w-[40%] max-w-md rounded-lg shadow-lg" />
      <canvas ref={canvasRef} className="hidden" width={300} height={200} />

      <div className="flex space-x-4">
        {!isCameraOn ? (
          <button onClick={startCamera} className="px-4 py-2 bg-green-500 hover:bg-green-700 transition duration-500 text-white rounded-lg">
            Start Camera
          </button>
        ) : (
          <button onClick={stopCamera} className="px-4 py-2 bg-red-500 hover:bg-red-700 transition duration-500 text-white rounded-lg">
            Stop Camera
          </button>
        )}
      </div>
    </div>
  );
};

export default CameraComponent;
