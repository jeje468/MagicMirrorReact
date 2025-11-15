import React, { useRef, useEffect } from 'react';
import { DailyProvider, useCallFrame } from '@daily-co/daily-react';
import type { DailyCall } from '@daily-co/daily-js'; // Import DailyCall type from daily-js for clarity

//FILE NOT USED NOR USEFUL

interface DailyVideoCallProps {
  roomUrl: string;
  onClose: () => void;
}

export const DailyVideoCall: React.FC<DailyVideoCallProps> = ({ roomUrl, onClose }) => {
  //const callRef = useRef<HTMLDivElement>(null);
  const callRef = useRef<HTMLDivElement>(null!) as React.MutableRefObject<HTMLDivElement>;
  // 1. Use useCallFrame with roomUrl and parentElRef
  const callFrame = useCallFrame({
    parentElRef: callRef,
    options: {
      url: roomUrl, // Use the roomUrl from props
      showLeaveButton: true,
      iframeStyle: {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        border: 'none', // Added for better fullscreen appearance
      },
    },
    // shouldCreateInstance: () => !!callRef.current, // often not needed if parentElRef is used
  });

  useEffect(() => {
    // 2. The callFrame might be null initially while the instance is being created
    if (!callFrame) return;

    // 3. Instead of callFrame.join(), use callFrame.load() or rely on the URL in options
    // If you provided the URL in `useCallFrame` options (which you did), 
    // the call should be loaded automatically when the instance is created.
    // Explicitly calling join() *after* load() is often necessary for prebuilt.
    // However, if the URL is set in options, using callFrame.join() is sufficient 
    // and is a common pattern for immediate connection.
    callFrame.join({ url: roomUrl });

    // Listen for leaving the call
    const leaveHandler = () => onClose();
    callFrame.on('left-meeting', leaveHandler);

    return () => {
      // 4. Cleanup: Remove the event listener, leave, and destroy
      callFrame.off('left-meeting', leaveHandler);
      callFrame.leave();
      callFrame.destroy();
    };
  }, [callFrame, roomUrl, onClose]); // Added roomUrl to dependency array

  // 5. Render the DailyProvider and the ref container
  return (
    <DailyProvider callObject={callFrame as DailyCall}>
      <div 
        ref={callRef} 
        style={{ width: '100vw', height: '100vh', overflow: 'hidden' }} // Ensure container fills viewport
      />
    </DailyProvider>
  );
};


// import React, { useRef, useEffect } from 'react';
// import { DailyProvider, useCallFrame, DailyCall } from '@daily-co/daily-react';

// interface DailyVideoCallProps {
//   roomUrl: string;
//   onClose: () => void;
// }

// export const DailyVideoCall: React.FC<DailyVideoCallProps> = ({ roomUrl, onClose }) => {
//   const callRef = useRef<HTMLDivElement>(null);

//   // Create Daily call frame
//   const callFrame: DailyCall = useCallFrame({
//     parentElRef: callRef,
//     options: {
//       url: roomUrl, // room URL from backend
//       showLeaveButton: true,
//       iframeStyle: {
//         position: 'fixed',
//         top: 0,
//         left: 0,
//         width: '100%',
//         height: '100%',
//       },
//     },
//     shouldCreateInstance: () => !!callRef.current, // wait for ref
//   });

//   useEffect(() => {
//     if (!callFrame) return;

//     // Automatically join the room
//     callFrame.join();

//     // Listen for leaving the call
//     const leaveHandler = () => onClose();
//     callFrame.on('left-meeting', leaveHandler);

//     return () => {
//       callFrame.off('left-meeting', leaveHandler);
//       callFrame.leave();
//       callFrame.destroy();
//     };
//   }, [callFrame, onClose]);

//   return (
//     <DailyProvider callObject={callFrame}>
//       <div ref={callRef} />
//     </DailyProvider>
//   );
// };







// // import React, { useEffect, useRef } from "react";
// // import { DailyProvider, useCallFrame } from "@daily-co/daily-react";

// // interface DailyVideoCallProps {
// //   roomUrl: string;
// //   onLeave: () => void;
// // }

// // export const DailyVideoCall: React.FC<DailyVideoCallProps> = ({ roomUrl, onLeave }) => {
// //   const containerRef = useRef<HTMLDivElement>(null);

// //   //const callFrame = useCallFrame({ url: roomUrl, showLeaveButton: true }, () => !!containerRef.current);
// //   const callFrame = useCallFrame({ url: roomUrl,showLeaveButton: true, container: containerRef.current || undefined,});

// //   useEffect(() => {
// //     if (!callFrame) return;
// //     callFrame.join();
// //     callFrame.on("left-meeting", () => onLeave());
// //     return () => { callFrame.leave(); callFrame.destroy(); };
// //   }, [callFrame, onLeave]);

// //   return <div ref={containerRef} style={{ width: "100%", height: "100%", position: "relative" }} />;
// // };
