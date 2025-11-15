import { DailyProvider, useCallFrame } from "@daily-co/daily-react";
import { useRef } from "react";

interface Props {
  dynamicRoomUrl: string;
  onClose: () => void;
}

export function DailyCallUI({ dynamicRoomUrl, onClose }: Props) {
    //const containerRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null!) as React.MutableRefObject<HTMLDivElement>;
    const callFrame = useCallFrame({
    parentElRef: containerRef,
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

  return (
    <DailyProvider callObject={callFrame}>
      <div className="fixed inset-0 bg-black">
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
