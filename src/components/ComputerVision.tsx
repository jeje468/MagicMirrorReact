import React, { useRef, useEffect, useState } from 'react';
import { X, Camera, Users, Smile, Eye } from 'lucide-react';

interface ComputerVisionProps {
  onClose: () => void;
}

export function ComputerVision({ onClose }: ComputerVisionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [detections, setDetections] = useState({
    faces: 0,
    emotion: 'neutral',
    gesture: 'none',
    objects: [] as string[]
  });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 }
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Start simulated processing
      startProcessing();
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Could not access camera. Please grant permissions.');
    }
  };

  const startProcessing = () => {
    setIsProcessing(true);
    
    // Simulate computer vision processing
    const processingInterval = setInterval(() => {
      // Mock detections - in production, use TensorFlow.js or similar
      setDetections({
        faces: Math.floor(Math.random() * 3),
        emotion: ['happy', 'neutral', 'surprised', 'focused'][Math.floor(Math.random() * 4)],
        gesture: ['wave', 'none', 'thumbs up', 'peace'][Math.floor(Math.random() * 4)],
        objects: ['person', 'phone', 'cup'].slice(0, Math.floor(Math.random() * 3) + 1)
      });

      // Draw on canvas
      drawDetections();
    }, 1000);

    return () => clearInterval(processingInterval);
  };

  const drawDetections = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Simulate face detection boxes
    if (detections.faces > 0) {
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 3;
      
      for (let i = 0; i < detections.faces; i++) {
        const x = Math.random() * (canvas.width - 200);
        const y = Math.random() * (canvas.height - 200);
        ctx.strokeRect(x, y, 200, 200);
        
        // Label
        ctx.fillStyle = '#00ff00';
        ctx.font = '16px Arial';
        ctx.fillText(`Face ${i + 1}`, x, y - 10);
      }
    }
  };

  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    onClose();
  };

  return (
    <div className="fixed top-20 right-8 w-[500px] bg-gray-900 rounded-lg overflow-hidden shadow-2xl z-40 border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold">Computer Vision</h3>
        </div>
        <button
          onClick={handleClose}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Video Feed */}
      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-64 object-cover bg-black mirror"
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full mirror"
        />
        
        {isProcessing && (
          <div className="absolute top-2 left-2 px-3 py-1 bg-green-600 rounded-full text-xs flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            Processing
          </div>
        )}
      </div>

      {/* Detections Panel */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
          <Users className="w-5 h-5 text-blue-400" />
          <div className="flex-1">
            <div className="text-sm text-gray-400">Faces Detected</div>
            <div className="text-xl">{detections.faces}</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
          <Smile className="w-5 h-5 text-yellow-400" />
          <div className="flex-1">
            <div className="text-sm text-gray-400">Emotion</div>
            <div className="text-lg capitalize">{detections.emotion}</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
          <Camera className="w-5 h-5 text-green-400" />
          <div className="flex-1">
            <div className="text-sm text-gray-400">Gesture</div>
            <div className="text-lg capitalize">{detections.gesture}</div>
          </div>
        </div>

        {detections.objects.length > 0 && (
          <div className="p-3 bg-gray-800 rounded-lg">
            <div className="text-sm text-gray-400 mb-2">Objects Detected</div>
            <div className="flex flex-wrap gap-2">
              {detections.objects.map((obj, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-700 rounded-full text-sm capitalize"
                >
                  {obj}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 text-center pt-2">
          In production: Integrate TensorFlow.js, Face-API.js, or ML5.js for real-time detection
        </div>
      </div>

      <style jsx>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
}
