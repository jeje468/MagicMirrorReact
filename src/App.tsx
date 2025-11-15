import React, { useEffect, useMemo, useState } from 'react';
import { Clock } from './components/Clock';
import { Weather } from './components/Weather';
import { Calendar } from './components/Calendar';
import { News } from './components/News';
import { Greeting } from './components/Greeting';
import { VoiceControl } from './components/VoiceControl';
import { VideoCall } from './components/VideoCall';
import { ComputerVision } from './components/ComputerVision';
import { Sparkles } from 'lucide-react';
import { getGeoInfo } from './lib/location';
import { estimateSunPosition, sunToScreenPosition } from './lib/sun';

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
        setCssVars({
          ['--flare-x' as any]: `${pos.xPercent}%`,
          ['--flare-y' as any]: `${pos.yPercent}%`,
          ['--flare-opacity' as any]: pos.intensity.toFixed(3),
        });
      } catch {
        // Fallback defaults near top-right
        setCssVars({ ['--flare-x' as any]: '72%', ['--flare-y' as any]: '22%', ['--flare-opacity' as any]: '0.22' });
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
          setCssVars({
            ['--flare-x' as any]: `${pos.xPercent}%`,
            ['--flare-y' as any]: `${pos.yPercent}%`,
            ['--flare-opacity' as any]: pos.intensity.toFixed(3),
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
      <VoiceControl onCommand={handleVoiceCommand} />

      {/* Video Call Overlay */}
      {showVideoCall && (
        <VideoCall onClose={() => setShowVideoCall(false)} />
      )}

      {/* Computer Vision Panel */}
      {showVision && (
        <ComputerVision onClose={() => setShowVision(false)} />
      )}

      {/* Mirror Mode Toggle */}
      <button
        onClick={() => setMirrorMode((m) => !m)}
        className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full border border-gray-800/50 bg-black/35 backdrop-blur-md hover:bg-black/55 transition-colors flex items-center gap-2 ${mirrorMode ? 'text-white' : 'text-gray-200'}`}
        title="Toggle Mirror Mode"
      >
        <Sparkles className="w-4 h-4" />
        <span className="text-sm">{mirrorMode ? 'Mirror On' : 'Mirror Off'}</span>
      </button>
    </div>
  );
}
