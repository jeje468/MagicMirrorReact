import React, { useEffect, useMemo, useState } from 'react';
import { Clock } from './components/Clock';
import { Weather } from './components/Weather';
import { Calendar } from './components/Calendar';
import { News } from './components/News';
import { Greeting } from './components/Greeting';
import { VoiceControl } from './components/VoiceControl';
import { VideoCall } from './components/VideoCall';
import { ComputerVision } from './components/ComputerVision';
import { getGeoInfo } from './lib/location';
import { estimateSunPosition, sunToScreenPosition } from './lib/sun';
import { Video, Camera } from "lucide-react";

export default function App() {
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showVision, setShowVision] = useState(false);

  const initialGreeting = useMemo(() => {
    const h = new Date().getHours();
    const slot = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
    return `${slot}! How can I assist you today?`;
  }, []);
  const [greeting, setGreeting] = useState(initialGreeting);

  const handleVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();

    if (lowerCommand.includes('video call') || lowerCommand.includes('start call')) {
      setShowVideoCall(true);
    } else if (lowerCommand.includes('end call') || lowerCommand.includes('close call')) {
      setShowVideoCall(false);
    } else if (lowerCommand.includes('camera') || lowerCommand.includes('vision')) {
      setShowVision(!showVision);
    } else if (lowerCommand.includes('hello') || lowerCommand.includes('hi mirror') || lowerCommand.includes('good ')) {
      setGreeting('Hello! How can I assist you today?');
    }
  };

  const handleTaskExecution = (task: string, parameters: Record<string, any>) => {
    console.log('Executing task:', task, 'with parameters:', parameters);
    
    switch (task) {
      case 'play_game':
        if (parameters.action === 'start') {
          setShowVision(true);
        } else if (parameters.action === 'stop') {
          setShowVision(false);
        }
        break;
        
      case 'make_call':
        setShowVideoCall(true);
        break;
        
      default:
        console.log('Unknown task:', task);
    }
  };

  const [mirrorMode, setMirrorMode] = useState(true);
  const timePhase = useMemo(() => {
    const h = new Date().getHours();
    if (h >= 5 && h < 11) return 'morning';
    if (h >= 11 && h < 16) return 'day';
    if (h >= 16 && h < 21) return 'evening';
    return 'night';
  }, []);
   const rootClass = useMemo(() => (
    `${mirrorMode ? 'mirror' : 'sky'} glare-${timePhase} relative w-screen h-screen text-white overflow-hidden`
  ), [mirrorMode, timePhase]);

  const [cssVars, setCssVars] = useState<React.CSSProperties>({});

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const geo = await getGeoInfo();
        if (!active) return;
        const { azimuth, elevation } = estimateSunPosition(geo.latitude, geo.longitude, new Date());
        const pos = sunToScreenPosition(azimuth, elevation);
        // Compute blinding opacity when flare is near center (hard to read)
        const cx = 50, cy = 42; // center hotspot target
        const dx = pos.xPercent - cx;
        const dy = pos.yPercent - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const R = 52; // falloff radius in percent units
        const core = 12; // fully blinding core radius
        const base = Math.max(0, 1 - dist / R);
        let blind = Math.pow(base, 1.4) * (pos.intensity * 2.4);
        if (dist < core) blind = Math.min(1, pos.intensity * 3);
        blind = Math.min(1, blind);
        setCssVars({
          ['--flare-x' as any]: `${pos.xPercent}%`,
          ['--flare-y' as any]: `${pos.yPercent}%`,
          ['--flare-opacity' as any]: pos.intensity.toFixed(3),
          ['--blind-opacity' as any]: blind.toFixed(3),
        });
      } catch {
        // Fallback defaults near top-right
        setCssVars({ ['--flare-x' as any]: '72%', ['--flare-y' as any]: '22%', ['--flare-opacity' as any]: '0.22', ['--blind-opacity' as any]: '0.0' });
      }
    })();
    const id = window.setInterval(() => {
        // Refresh roughly every 10 minutes to follow the sun
        (async () => {
          try {
            const geo = await getGeoInfo();
            if (!active) return;
          const { azimuth, elevation } = estimateSunPosition(geo.latitude, geo.longitude, new Date());
            const pos = sunToScreenPosition(azimuth, elevation);
          const cx = 50, cy = 42;
            const dx = pos.xPercent - cx;
            const dy = pos.yPercent - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const R = 52;
            const core = 12;
            const base = Math.max(0, 1 - dist / R);
          let blind = Math.pow(base, 1.4) * (pos.intensity * 2.4);
          if (dist < core) blind = Math.min(1, pos.intensity * 3);
            blind = Math.min(1, blind);
            setCssVars({
            ['--flare-x' as any]: `${pos.xPercent}%`,
            ['--flare-y' as any]: `${pos.yPercent}%`,
            ['--flare-opacity' as any]: pos.intensity.toFixed(3),
            ['--blind-opacity' as any]: blind.toFixed(3),
            });
          } catch {}
        })();
    }, 10 * 60 * 1000);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, []);


  return (
    <div className={rootClass} style={cssVars}>
      {mirrorMode && (
        <>
          <div className="mirror-clouds absolute inset-0 pointer-events-none" />
          <div className="mirror-flare absolute inset-0 pointer-events-none" />
          <div className="mirror-flare-circles absolute inset-0 pointer-events-none" />
          <div className="mirror-streak absolute inset-0 pointer-events-none" />
          <div className="mirror-glare absolute inset-0 pointer-events-none" />
          <div className="mirror-glare-warm absolute inset-0 pointer-events-none" />
          <div className="mirror-blind absolute inset-0 pointer-events-none" />
          <div className="mirror-speckle absolute inset-0 pointer-events-none" />
          <div className="mirror-frame absolute inset-2 pointer-events-none" />
          <div className="mirror-noise absolute inset-0 pointer-events-none" />
        </>
      )}
      {/* Main Mirror Interface */}
      <div className="mirror-content absolute inset-0 flex flex-col p-8">
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

        {/* Bottom: News */}
        <div className="mt-auto">
          <News />
        </div>
      </div>

      {/* Voice Control */}
      <VoiceControl 
        onCommand={handleVoiceCommand} 
        onTaskExecute={handleTaskExecution}
      />

      {/* Video Call Overlay */}
      {showVideoCall && (
        <VideoCall onClose={() => setShowVideoCall(false)} />
      )}

      {/* Computer Vision Panel */}
      {showVision && (
        <ComputerVision onClose={() => setShowVision(false)} />
      )}
    </div>
  );
}
