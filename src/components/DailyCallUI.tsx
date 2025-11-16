import { DailyProvider, useCallFrame } from "@daily-co/daily-react";
import React, { useRef } from "react";

interface Props {
  dynamicRoomUrl: string;
  onClose: () => void;
}

export const DailyCallUI: React.FC<Props> = ({ dynamicRoomUrl, onClose }: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const callFrame = useCallFrame({
    parentElRef: containerRef as React.RefObject<HTMLDivElement>,
    options: {
      url: dynamicRoomUrl,
      iframeStyle: {
        position: "fixed",
        top: "0px",
        left: "0px",
        width: "100%",
        height: "100%",
        border: "0px",
      },
    },
  });

  React.useEffect(() => {
  if (!callFrame) return;

  console.log("CALLFRAME:", callFrame);
  
  
  callFrame
    .join()
    .then(() => console.log("Joined Daily room"))
    .catch((err) => console.error("Failed to join:", err));

  // Optional: event listeners
  callFrame.on("left-meeting", () => {
    console.log("Left meeting");
    onClose();
  });

}, [callFrame]);
  

  return (
    <DailyProvider callObject={callFrame}>
      <div className="fixed inset-0 bg-black z-50">
        <div ref={containerRef} className="w-full h-full" />
        <button
          onClick={() => {
            callFrame?.leave();
            onClose();
          }}
          className="absolute top-4 left-4 bg-red-600 px-4 py-2 rounded"
        >
          End Call
        </button>
      </div>
    </DailyProvider>
  );
}
