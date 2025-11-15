import React, { useEffect, useRef } from "react";
interface JitsiMeetAPIProps {
  roomName: string;
}

const JitsiMeetAPI: React.FC<JitsiMeetAPIProps> = ({ roomName }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.JitsiMeetExternalAPI) return;

    const domain = "meet.jit.si";
    const options = {
      roomName: roomName,
      parentNode: containerRef.current,
      width: "100%",
      height: "100%",
      configOverwrite: {
        prejoinPageEnabled: false,
        //enableLobby: false,    
        lobby: {
          enabled: false,
          autoKnock: false,
          enableChat: false
        },
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        startAudioMuted: 0,
        startVideoMuted: 0
      },
      userInfo: {
        displayName: "Sofia"
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [
          "microphone",
          "camera",
          "hangup",
          "chat",
          "fullscreen",
        ],
        MOBILE_APP_PROMO: false,
        //TILE_VIEW_MAX_COLUMNS: 1,
      },
    };

  
    const api = new window.JitsiMeetExternalAPI(domain, options);

    return () => api.dispose(); // cleanup on unmount
  }, [roomName]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
};

export default JitsiMeetAPI;
