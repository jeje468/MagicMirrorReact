import React, { useRef, useEffect, useState } from 'react';
import { X, Camera, Play } from 'lucide-react';

interface ComputerVisionProps {
  onClose: () => void;
}

interface Obstacle {
  id: number;
  x: number;
  width: number;
  height: number;
}

export function ComputerVision({ onClose }: ComputerVisionProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null); // hidden small canvas for detection
  const gameCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const [dinoY, setDinoY] = useState(0);
  const dinoYRef = useRef(0);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [motionDetected, setMotionDetected] = useState(false);
  const [motionLevel, setMotionLevel] = useState(0);

  const previousFrameRef = useRef<ImageData | null>(null);
  const detectionLoopRef = useRef<number | null>(null);
  const obstacleIdRef = useRef(0);
  const velocityRef = useRef(0);
  const gameSpeedRef = useRef(5);
  const gameLoopRef = useRef<number | null>(null);
  const spawnIntervalRef = useRef<number | null>(null);
  const spawnDelayRef = useRef<number>(4000);

  // Compute spawn delay based on score (caps at 1400ms)
  const computeSpawnDelay = (currentScore: number) => {
    if (currentScore >= 2000) return 1400;
    if (currentScore >= 1500) return 1700;
    if (currentScore >= 1000) return 2000;
    if (currentScore >= 700) return 2400;
    if (currentScore >= 400) return 2800;
    if (currentScore >= 200) return 3200;
    return 4000; // initial easy pacing
  };
  const scoreIntervalRef = useRef<number | null>(null);

  // Game constants
  const GROUND_Y = 300;
  const DINO_X = 80;
  const DINO_WIDTH = 40;
  const DINO_HEIGHT = 50;
  // dinoY is positive upwards. Gravity should decrease upward velocity (negative value).
  const GRAVITY = -0.8; // acceleration (negative because up is positive)
  const JUMP_POWER = 15; // positive initial velocity (up)
  const GAME_WIDTH = 800;

  useEffect(() => {
    startCamera();
    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Game intervals & initial spawn setup
  useEffect(() => {
    if (gameStarted && !gameOver) {
      gameLoopRef.current = window.setInterval(updateGame, 20);
      scoreIntervalRef.current = window.setInterval(() => setScore(s => s + 1), 100);

      // Set initial spawn interval
      spawnDelayRef.current = computeSpawnDelay(0);
      spawnIntervalRef.current = window.setInterval(spawnObstacle, spawnDelayRef.current);

      return () => {
        if (gameLoopRef.current) clearInterval(gameLoopRef.current);
        if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
        if (scoreIntervalRef.current) clearInterval(scoreIntervalRef.current);
      };
    }
  }, [gameStarted, gameOver]);

  // Dynamically adjust obstacle spawn rate as score increases
  useEffect(() => {
    if (!gameStarted || gameOver) return;
    const newDelay = computeSpawnDelay(score);
    if (newDelay !== spawnDelayRef.current) {
      spawnDelayRef.current = newDelay;
      if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
      spawnIntervalRef.current = window.setInterval(spawnObstacle, spawnDelayRef.current);
    }
  }, [score, gameStarted, gameOver]);

  // redraw on state changes
  useEffect(() => {
    if (gameStarted) drawGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dinoY, obstacles, gameStarted, gameOver, score]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        if (dinoYRef.current === 0 && gameStarted && !gameOver) jump();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gameStarted, gameOver]);

  const cleanup = () => {
    if (stream) stream.getTracks().forEach(t => t.stop());
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
    if (scoreIntervalRef.current) clearInterval(scoreIntervalRef.current);
    if (detectionLoopRef.current) cancelAnimationFrame(detectionLoopRef.current);
    previousFrameRef.current = null;
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Could not access camera. Please grant permissions.');
    }
  };
  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setDinoY(0);
    dinoYRef.current = 0;
    setObstacles([]);
    obstacleIdRef.current = 0;
    gameSpeedRef.current = 5;
    velocityRef.current = 0;
    previousFrameRef.current = null;
    startDetection();
  };
  const jump = () => {
    // dinoYRef.current === 0 means on the ground; set positive upward velocity
    if (dinoYRef.current === 0 && !gameOver && gameStarted) {
      setIsJumping(true);
      velocityRef.current = JUMP_POWER;
      setTimeout(() => setIsJumping(false), 300);
    }
  };

  const spawnObstacle = () => {
    if (!gameStarted || gameOver) return;
    const newObstacle: Obstacle = {
      id: obstacleIdRef.current++,
      x: GAME_WIDTH,
      width: 20 + Math.random() * 20,
      height: 40 + Math.random() * 30
    };
    setObstacles(prev => [...prev, newObstacle]);
  };
  
  const updateGame = () => {
    if (!gameStarted || gameOver) return;

    // dino physics (dinoY positive = up)
    velocityRef.current += GRAVITY; // gravity reduces upward velocity
    let newY = dinoYRef.current + velocityRef.current;
    if (newY <= 0) {
      newY = 0;
      velocityRef.current = 0;
    }
    setDinoY(newY);
    dinoYRef.current = newY;

    // obstacles
    setObstacles((prev: Obstacle[]) => {
      const updated = prev.map((o: Obstacle) => ({ ...o, x: o.x - gameSpeedRef.current }));
      for (const obs of updated) {
        // Check horizontal collision
        const horizontalCollision = obs.x < DINO_X + DINO_WIDTH && obs.x + obs.width > DINO_X;

        // Check vertical collision (use the latest dinoY from ref)
        const dinoBottom = GROUND_Y - dinoYRef.current;
        const obstacleTop = GROUND_Y - obs.height;

        // Collision happens if dino bottom touches or goes below obstacle top (didn't jump high enough)
        const verticalCollision = dinoBottom >= obstacleTop;

        if (horizontalCollision && verticalCollision) {
          setGameOver(true);
          setGameStarted(false);
          if (score > highScore) setHighScore(score);
          break;
        }
      }
      return updated.filter((o: Obstacle) => o.x > -50);
    });

    if (score > 0 && score % 500 === 0) gameSpeedRef.current += 0.5;
  };

  const drawGame = () => {
    const canvas = gameCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#f7f7f7';
    ctx.fillRect(0, 0, GAME_WIDTH, 400);

    // ground
    ctx.strokeStyle = '#535353';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(GAME_WIDTH, GROUND_Y);
    ctx.stroke();

    // dino (dinoY positive moves it up)
    ctx.fillStyle = '#535353';
    ctx.fillRect(DINO_X, GROUND_Y - DINO_HEIGHT - dinoY, DINO_WIDTH, DINO_HEIGHT);

    // eye
    ctx.fillStyle = '#fff';
    ctx.fillRect(DINO_X + 25, GROUND_Y - DINO_HEIGHT - dinoY + 10, 5, 5);

    // legs
    const legOffset = Math.floor(Date.now() / 100) % 2 === 0 ? 0 : 5;
    ctx.fillStyle = '#535353';
    ctx.fillRect(DINO_X + 5, GROUND_Y - 10 - dinoY, 8, 10);
    ctx.fillRect(DINO_X + 25 + legOffset, GROUND_Y - 10 - dinoY, 8, 10);

    // obstacles
    obstacles.forEach(obs => {
      ctx.fillStyle = '#535353';
      ctx.fillRect(obs.x, GROUND_Y - obs.height, obs.width, obs.height);
      ctx.fillRect(obs.x - 5, GROUND_Y - obs.height + 10, 5, 15);
      ctx.fillRect(obs.x + obs.width, GROUND_Y - obs.height + 15, 5, 15);
    });
  };

  // --- Simple motion detection using frame differencing ---
  const startDetection = () => {
    if (!videoRef.current) return;
    if (!canvasRef.current) {
      const c = document.createElement('canvas');
      c.width = 160; // small for speed
      c.height = 120;
      canvasRef.current = c;
    }
    previousFrameRef.current = null;
    if (detectionLoopRef.current) cancelAnimationFrame(detectionLoopRef.current);
    detectionLoopRef.current = requestAnimationFrame(detectFrame);
  };

  const detectFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const prev = previousFrameRef.current;
    let motion = 0;
    let sumY = 0;
    let count = 0;

    if (prev) {
      for (let i = 0; i < frame.data.length; i += 4) {
        const r = frame.data[i];
        const g = frame.data[i + 1];
        const b = frame.data[i + 2];
        const gray = (r + g + b) / 3;

        const pr = prev.data[i];
        const pg = prev.data[i + 1];
        const pb = prev.data[i + 2];
        const pgray = (pr + pg + pb) / 3;

        const diff = Math.abs(gray - pgray);
        if (diff > 25) {
          motion += diff;
          const pixelIndex = i / 4;
          const y = Math.floor(pixelIndex / canvas.width);
          sumY += y;
          count += 1;
        }
      }

      setMotionLevel(Math.min(Math.round(motion), 3000));
      setMotionDetected(motion > 1000);

      const prevCentroidY = (prev as any).meta?.centroidY ?? null;
      const centroidY = count > 0 ? sumY / count : null;

      if (centroidY !== null && prevCentroidY !== null) {
        // in video coords y increases downward; centroidY decreasing => upward motion
        const dy = prevCentroidY - centroidY; // positive = moved up on camera
        if (dy > 6 && dinoYRef.current === 0 && !gameOver && gameStarted) {
          jump();
        }
      }

      (frame as any).meta = { centroidY };
    } else {
      setMotionLevel(0);
      setMotionDetected(false);
      (frame as any).meta = { centroidY: null };
    }

    previousFrameRef.current = frame;
    detectionLoopRef.current = requestAnimationFrame(detectFrame);
  };

  const handleClose = () => {
    cleanup();
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if ((e.code === 'Space' || e.key === ' ') && dinoYRef.current === 0 && gameStarted && !gameOver) {
      e.preventDefault();
      jump();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-white z-50 flex items-center justify-center p-4"
      onKeyDown={handleKeyPress}
      tabIndex={0}
    >
      {/* hidden canvas for detection */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className="w-full max-w-5xl bg-white rounded-lg overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 bg-gray-800 text-white">
          <div className="flex items-center gap-3">
            <Camera className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl">Dino Jump Game</h2>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-700 rounded transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex justify-between items-center p-4 bg-gray-100 border-b">
          <div className="text-gray-600">HI: <span className="text-2xl text-gray-800 ml-2">{highScore.toString().padStart(5, '0')}</span></div>
          <div className="text-gray-600">SCORE: <span className="text-2xl text-gray-800 ml-2">{score.toString().padStart(5, '0')}</span></div>
        </div>

        <div className="flex gap-4 p-4 bg-white">
          <div className="flex-1 relative">
            <canvas ref={gameCanvasRef} width={GAME_WIDTH} height={400} className="border-2 border-gray-300 rounded-lg w-full" />

            {gameOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-10 text-center max-w-md mx-auto border-4 border-red-500 transform scale-100 animate-in">
                  <div className="mb-4">
                    <div className="text-6xl mb-2">💥</div>
                    <h3 className="text-5xl font-bold text-white mb-2 drop-shadow-lg">Game Over!</h3>
                    <div className="w-20 h-1 bg-red-500 mx-auto mb-4"></div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4 mb-6">
                    <p className="text-gray-300 text-sm mb-1">Your Score</p>
                    <p className="text-4xl font-bold text-white">{score}</p>
                    {score > highScore && <p className="text-yellow-400 text-sm mt-2">🎉 New High Score!</p>}
                  </div>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={startGame}
                      className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl text-lg transition-all transform hover:scale-105 flex items-center gap-2 shadow-lg"
                    >
                      <Play className="w-5 h-5" /> Retry
                    </button>
                    <button
                      onClick={handleClose}
                      className="px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl text-lg transition-all transform hover:scale-105 flex items-center gap-2 shadow-lg"
                    >
                      <X className="w-5 h-5" /> Exit
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!gameStarted && !gameOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90">
                <div className="text-center">
                  <h3 className="text-4xl text-gray-800 mb-4">Chrome Dino Game</h3>
                  <p className="text-xl text-gray-600 mb-6 max-w-md">
                    Move your hand or jump to make the dino jump!<br />
                    Or press SPACE to jump.
                  </p>
                  <button onClick={startGame} className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xl transition-colors flex items-center gap-2 mx-auto">
                    <Play className="w-6 h-6" /> Start Game
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="w-64">
            <div className="text-sm text-gray-600 mb-2 text-center">Motion Detection Active</div>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full rounded-lg border-2 border-gray-300"
              style={{ transform: 'scaleX(-1)' }}
            />

            <div className="mt-2 space-y-2">

              <div className="p-2 bg-gray-100 border border-gray-300 rounded">
                <div className="text-xs text-gray-600 mb-1">Motion Level: {motionLevel} / 3000</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-100"
                    style={{ width: `${Math.min((motionLevel / 3000) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-3 text-xs text-gray-500 text-center">
              💡 Move your arms up or wave to make the dino jump!
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-100 border-t text-center">
          <p className="text-gray-700">
            <strong>How to play:</strong> Move your hand in the upper part of the camera view or press SPACE to make the dinosaur jump over obstacles.
          </p>
        </div>
      </div>
    </div>
  );
}