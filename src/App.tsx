import React, { useState } from 'react';
import { Clock } from './components/Clock';
import { Weather } from './components/Weather';
import { Calendar } from './components/Calendar';
import { News } from './components/News';
import { Greeting } from './components/Greeting';
import { VoiceControl } from './components/VoiceControl';
import { VideoCall } from './components/VideoCall';
import { ComputerVision } from './components/ComputerVision';
import { DailyVideoCall } from "./components/DailyVideoCall";
import { DailyCallUI } from "./components/DailyCallUI";



export default function App() {
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showVision, setShowVision] = useState(false);
  const [greeting, setGreeting] = useState('Hey there sexy!');
  const [showCall, setShowCall] = useState(false);
  const [dynamicRoomUrl, setDynamicRoomUrl] = useState("");

  // const handleVoiceCommand = (command: string) => {
  //   const lowerCommand = command.toLowerCase();
    
  //   if (lowerCommand.includes('video call') || lowerCommand.includes('start call')) {
  //     setShowVideoCall(true);
  //   } else if (lowerCommand.includes('end call') || lowerCommand.includes('close call')) {
  //     setShowVideoCall(false);
  //   } else if (lowerCommand.includes('camera') || lowerCommand.includes('vision')) {
  //     setShowVision(!showVision);
  //   } else if (lowerCommand.includes('hello') || lowerCommand.includes('hi mirror')) {
  //     setGreeting('Hello! How can I help you?');
  //   }
  // };

  const handleStartTestCall = async () => {
    try {
      // Simple GET request to the server endpoint.
      // Note: server must accept GET at this route. If server only accepts POST,
      // either change server or use POST from the client.
      const res = await fetch("http://localhost:3001/create-room");

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server returned ${res.status}: ${text}`);
      }

      // Server currently returns { roomUrl: string }
      const { roomUrl } = await res.json();
      setDynamicRoomUrl(roomUrl);
      console.log("URL:", roomUrl);
      setShowVideoCall(true);
      window.location.href = roomUrl;
      document.addEventListener("DOMContentLoaded", () => {
        const spans = [...document.querySelectorAll("span")];
        const joinSpan = spans.find(s => s.textContent?.includes("Join"));
        joinSpan?.click();
      });
      //*[@id="haircheck-join"]/span
      // const result = document.evaluate(
      //   "//*[@id='haircheck-join']/span",
      //   document,
      //   null,
      //   XPathResult.FIRST_ORDERED_NODE_TYPE,
      //   null
      // );

      // const span = result.singleNodeValue as HTMLElement | null;
      // console.log("Span:", span);

      // if (span) {
      //   span.click();
      // }

    } catch (error) {
      console.error("Failed to start test call:", error);
    }
  };

  // const handleVoiceCall = async (calleeName: string) => {
  //   const res = await fetch("http://localhost:3001/create-room", {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({ caller: "Alice", callee: calleeName }),
  //   });
  //   const { roomUrl } = await res.json();
  //   setDynamicRoomUrl(roomUrl);
  //   setShowCall(true);

  //   // Notify callee via Firebase/WebSocket with same roomUrl
  // };

  return (
    <div className="relative w-screen h-screen bg-black text-white overflow-hidden">
      {/* Main Mirror Interface */}
      <div className="absolute inset-0 flex flex-col p-8">
        {/* Top Section */}
        <div className="flex justify-between items-start mb-8">
          {/* Left: Clock and Calendar */}
          <div className="flex flex-col gap-6">
            <Clock />
            <Calendar />
          </div>

          {/* Right: Weather */}
          <div>
            <Weather />
          </div>
        </div>

        {/* Center: Greeting */}
        <div className="flex-1 flex items-center justify-center">
          <Greeting message={greeting} />
        </div>
        <button
          onClick={() => setShowVideoCall(true)}
          className="absolute bottom-10 right-10 bg-blue-600 px-6 py-3 rounded-xl text-white"
        >
          Start Jitsi Call
        </button>

        <button
          className="absolute top-4 right-4 bg-blue-600 px-4 py-2 rounded"
          onClick={handleStartTestCall}
        >
          Start Daily Call
        </button>


        {/* Bottom: News */}
        <div className="mt-auto">
          <News />
        </div>
      </div>

      {/* Voice Control */}
      {/* <VoiceControl onCommand={handleVoiceCommand} /> */}

      {/* Video Call Overlay
      {showVideoCall && (
        <VideoCall onClose={() => setShowVideoCall(false)} />
      )} */}

      {/* Computer Vision Panel */}
      {showVision && (
        <ComputerVision onClose={() => setShowVision(false)} />
      )}

      {/* {showCall && dynamicRoomUrl && (
        <div className="fixed inset-0 bg-black z-50">
          <DailyVideoCall roomUrl={dynamicRoomUrl} onClose={() => setShowCall(true)} />
        </div>
      )} */}
      {showVideoCall && dynamicRoomUrl && (
        <DailyCallUI
          dynamicRoomUrl={dynamicRoomUrl}
          onClose={() => {
            setShowVideoCall(false);
            setDynamicRoomUrl("");
          }}
        />
      )}

    </div>
  );
}
