import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Home, RotateCcw, Trophy } from "lucide-react";
import { toast } from "sonner";

type GameMode = "4G" | "5G";

interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

interface Obstacle extends GameObject {
  type: "meteor" | "satellite";
}

const Game = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  const [gameMode] = useState<GameMode>((location.state?.mode as GameMode) || "5G");
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem(`highScore-${gameMode}`);
    return saved ? parseInt(saved) : 0;
  });

  // Game state refs
  const gameStateRef = useRef({
    rocket: { x: 100, y: 300, width: 40, height: 60, speed: 5 },
    obstacles: [] as Obstacle[],
    keys: {} as Record<string, boolean>,
    score: 0,
    frameCount: 0,
    lastObstacleFrame: 0,
    // 4G mode effects
    lagFrames: 0,
    shouldFreeze: false,
    freezeCounter: 0,
  });

  useEffect(() => {
    if (!gameMode) {
      navigate("/");
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;

    // Keyboard handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      gameStateRef.current.keys[e.key.toLowerCase()] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      gameStateRef.current.keys[e.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Game loop
    const gameLoop = () => {
      if (gameOver) return;

      const state = gameStateRef.current;
      const { rocket, obstacles, keys } = state;
      
      state.frameCount++;

      // 4G Mode: Add lag effects
      if (gameMode === "4G") {
        // Random freeze every 2-3 seconds
        if (state.frameCount % 120 === 0 && Math.random() > 0.5) {
          state.shouldFreeze = true;
          state.freezeCounter = 15; // Freeze for ~15 frames
          toast.error("Connection lag...", { duration: 500 });
        }

        if (state.shouldFreeze && state.freezeCounter > 0) {
          state.freezeCounter--;
          // Don't update game during freeze
          drawFrame(ctx, canvas, state);
          gameLoopRef.current = requestAnimationFrame(gameLoop);
          return;
        } else {
          state.shouldFreeze = false;
        }
      }

      // Move rocket
      const moveSpeed = gameMode === "5G" ? 6 : 4;
      if (keys["w"] || keys["arrowup"]) {
        rocket.y = Math.max(0, rocket.y - moveSpeed);
      }
      if (keys["s"] || keys["arrowdown"]) {
        rocket.y = Math.min(canvas.height - rocket.height, rocket.y + moveSpeed);
      }
      if (keys["a"] || keys["arrowleft"]) {
        rocket.x = Math.max(0, rocket.x - moveSpeed);
      }
      if (keys["d"] || keys["arrowright"]) {
        rocket.x = Math.min(canvas.width - rocket.width, rocket.x + moveSpeed);
      }

      // Spawn obstacles
      const spawnRate = gameMode === "5G" ? 60 : 50; // 5G: more frequent
      if (state.frameCount - state.lastObstacleFrame > spawnRate) {
        const obstacleType = Math.random() > 0.5 ? "meteor" : "satellite";
        const size = obstacleType === "meteor" ? 30 : 40;
        obstacles.push({
          x: canvas.width,
          y: Math.random() * (canvas.height - size),
          width: size,
          height: size,
          speed: gameMode === "5G" ? 4 : 3,
          type: obstacleType,
        });
        state.lastObstacleFrame = state.frameCount;
      }

      // Move and remove obstacles
      for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= obstacles[i].speed;
        
        // Remove if off screen
        if (obstacles[i].x + obstacles[i].width < 0) {
          obstacles.splice(i, 1);
          state.score += 10;
          setScore(state.score);
        }
      }

      // Collision detection
      for (const obstacle of obstacles) {
        if (checkCollision(rocket, obstacle)) {
          setGameOver(true);
          if (state.score > highScore) {
            setHighScore(state.score);
            localStorage.setItem(`highScore-${gameMode}`, state.score.toString());
            toast.success("New High Score! 🏆");
          }
          return;
        }
      }

      // Draw frame
      drawFrame(ctx, canvas, state);

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameMode, gameOver, highScore, navigate]);

  const drawFrame = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    state: typeof gameStateRef.current
  ) => {
    // Clear canvas
    ctx.fillStyle = "#0a0f1e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw stars background
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    for (let i = 0; i < 50; i++) {
      const x = (state.frameCount * 2 + i * 50) % canvas.width;
      const y = (i * 37) % canvas.height;
      ctx.fillRect(x, y, 2, 2);
    }

    // 4G Mode: Add glitch effect
    if (gameMode === "4G" && state.frameCount % 30 < 3) {
      ctx.fillStyle = "rgba(255, 0, 0, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    const { rocket, obstacles } = state;

    // Draw rocket with advanced graphics
    ctx.save();
    ctx.translate(rocket.x + rocket.width / 2, rocket.y + rocket.height / 2);
    
    // Glow aura
    if (gameMode === "5G") {
      ctx.shadowColor = "#22c55e";
      ctx.shadowBlur = 30;
    } else {
      ctx.shadowColor = "#ef4444";
      ctx.shadowBlur = 15;
    }

    // Rocket body - metallic gradient
    const bodyGradient = ctx.createLinearGradient(-15, -25, 15, 30);
    if (gameMode === "5G") {
      bodyGradient.addColorStop(0, "#34d399");
      bodyGradient.addColorStop(0.5, "#10b981");
      bodyGradient.addColorStop(1, "#059669");
    } else {
      bodyGradient.addColorStop(0, "#f87171");
      bodyGradient.addColorStop(0.5, "#ef4444");
      bodyGradient.addColorStop(1, "#dc2626");
    }
    
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.moveTo(-15, -25);
    ctx.lineTo(15, -25);
    ctx.lineTo(15, 20);
    ctx.lineTo(0, 30);
    ctx.lineTo(-15, 20);
    ctx.closePath();
    ctx.fill();

    // Metallic highlights
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.beginPath();
    ctx.moveTo(-12, -22);
    ctx.lineTo(-8, -22);
    ctx.lineTo(-8, 15);
    ctx.lineTo(-12, 15);
    ctx.closePath();
    ctx.fill();

    // Side fins
    ctx.fillStyle = gameMode === "5G" ? "#065f46" : "#991b1b";
    ctx.beginPath();
    ctx.moveTo(-15, 10);
    ctx.lineTo(-25, 25);
    ctx.lineTo(-15, 20);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(15, 10);
    ctx.lineTo(25, 25);
    ctx.lineTo(15, 20);
    ctx.closePath();
    ctx.fill();

    // Cockpit window - with reflection
    const windowGradient = ctx.createRadialGradient(0, -10, 2, 0, -10, 8);
    windowGradient.addColorStop(0, "#60a5fa");
    windowGradient.addColorStop(0.7, "#3b82f6");
    windowGradient.addColorStop(1, "#1e40af");
    ctx.fillStyle = windowGradient;
    ctx.beginPath();
    ctx.arc(0, -10, 8, 0, Math.PI * 2);
    ctx.fill();

    // Window highlight
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.beginPath();
    ctx.arc(-2, -12, 3, 0, Math.PI * 2);
    ctx.fill();

    // Nose cone detail
    ctx.strokeStyle = gameMode === "5G" ? "#10b981" : "#ef4444";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-15, -20);
    ctx.lineTo(15, -20);
    ctx.stroke();

    // Engine nozzle
    ctx.fillStyle = "#1f2937";
    ctx.beginPath();
    ctx.arc(0, 25, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;

    // Advanced rocket flame with particles
    const flamePhase = state.frameCount % 8;
    const flameIntensity = Math.sin(state.frameCount * 0.3) * 0.3 + 0.7;
    
    // Main flame core
    const flameGradient = ctx.createRadialGradient(0, 30, 0, 0, 30, 25 * flameIntensity);
    flameGradient.addColorStop(0, "#ffffff");
    flameGradient.addColorStop(0.2, "#fef08a");
    flameGradient.addColorStop(0.4, "#fb923c");
    flameGradient.addColorStop(0.7, "#f97316");
    flameGradient.addColorStop(1, "rgba(239, 68, 68, 0)");
    
    ctx.fillStyle = flameGradient;
    ctx.beginPath();
    ctx.moveTo(-8, 25);
    ctx.quadraticCurveTo(-10, 30 + 15 * flameIntensity, -5 + Math.sin(flamePhase) * 3, 40 + 20 * flameIntensity);
    ctx.quadraticCurveTo(0, 45 + 25 * flameIntensity, 5 + Math.cos(flamePhase) * 3, 40 + 20 * flameIntensity);
    ctx.quadraticCurveTo(10, 30 + 15 * flameIntensity, 8, 25);
    ctx.closePath();
    ctx.fill();

    // Flame particles
    for (let i = 0; i < 5; i++) {
      const particleOffset = (state.frameCount + i * 10) % 30;
      const particleX = (Math.sin(state.frameCount * 0.1 + i) * 8);
      const particleY = 30 + particleOffset * 2;
      const particleSize = (1 - particleOffset / 30) * 4;
      
      if (particleSize > 0) {
        ctx.fillStyle = `rgba(251, 146, 60, ${1 - particleOffset / 30})`;
        ctx.beginPath();
        ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Speed lines for 5G mode
    if (gameMode === "5G" && state.frameCount % 3 === 0) {
      ctx.strokeStyle = "rgba(34, 197, 94, 0.3)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const lineY = -20 + i * 15;
        ctx.beginPath();
        ctx.moveTo(-30, lineY);
        ctx.lineTo(-20, lineY);
        ctx.stroke();
      }
    }

    ctx.restore();

    // Draw obstacles with advanced graphics
    obstacles.forEach((obstacle) => {
      ctx.save();
      ctx.translate(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);

      if (obstacle.type === "meteor") {
        // Meteor glow
        ctx.shadowColor = "#ef4444";
        ctx.shadowBlur = 15;

        // Main meteor body with gradient
        const meteorGradient = ctx.createRadialGradient(-5, -5, 0, 0, 0, obstacle.width / 2);
        meteorGradient.addColorStop(0, "#a8a29e");
        meteorGradient.addColorStop(0.5, "#78716c");
        meteorGradient.addColorStop(1, "#44403c");
        ctx.fillStyle = meteorGradient;
        ctx.beginPath();
        ctx.arc(0, 0, obstacle.width / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        // Crater details with depth
        ctx.fillStyle = "#292524";
        ctx.beginPath();
        ctx.arc(-8, -6, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = "#1c1917";
        ctx.beginPath();
        ctx.arc(-7, -7, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#292524";
        ctx.beginPath();
        ctx.arc(6, 4, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#1c1917";
        ctx.beginPath();
        ctx.arc(7, 3, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#292524";
        ctx.beginPath();
        ctx.arc(0, 8, 3, 0, Math.PI * 2);
        ctx.fill();

        // Rough edges
        ctx.strokeStyle = "#57534e";
        ctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const innerRadius = obstacle.width / 2 - 2;
          const outerRadius = obstacle.width / 2 + Math.random() * 2;
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius);
          ctx.lineTo(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius);
          ctx.stroke();
        }

        // Fire trail
        const trailGradient = ctx.createLinearGradient(0, 0, 20, 0);
        trailGradient.addColorStop(0, "rgba(251, 146, 60, 0.6)");
        trailGradient.addColorStop(1, "rgba(251, 146, 60, 0)");
        ctx.fillStyle = trailGradient;
        ctx.beginPath();
        ctx.arc(obstacle.width / 3, 0, 8, 0, Math.PI * 2);
        ctx.fill();

      } else {
        // Satellite with advanced details
        ctx.shadowColor = "#3b82f6";
        ctx.shadowBlur = 10;

        // Main body gradient
        const bodyGradient = ctx.createLinearGradient(-15, -10, 15, 10);
        bodyGradient.addColorStop(0, "#cbd5e1");
        bodyGradient.addColorStop(0.5, "#94a3b8");
        bodyGradient.addColorStop(1, "#64748b");
        ctx.fillStyle = bodyGradient;
        ctx.fillRect(-15, -10, 30, 20);

        ctx.shadowBlur = 0;

        // Panel details
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 1;
        for (let i = -10; i < 15; i += 5) {
          ctx.beginPath();
          ctx.moveTo(i, -10);
          ctx.lineTo(i, 10);
          ctx.stroke();
        }

        // Solar panels with gradient
        const solarGradient = ctx.createLinearGradient(-25, 0, -17, 0);
        solarGradient.addColorStop(0, "#1e3a8a");
        solarGradient.addColorStop(0.5, "#1e40af");
        solarGradient.addColorStop(1, "#2563eb");
        ctx.fillStyle = solarGradient;
        ctx.fillRect(-25, -8, 8, 16);
        ctx.fillRect(17, -8, 8, 16);

        // Solar panel cells
        ctx.fillStyle = "rgba(59, 130, 246, 0.5)";
        for (let i = -7; i < 8; i += 3) {
          ctx.fillRect(-24, i, 6, 2);
          ctx.fillRect(18, i, 6, 2);
        }

        // Solar panel glow
        ctx.shadowColor = "#3b82f6";
        ctx.shadowBlur = 8;
        ctx.strokeStyle = "#60a5fa";
        ctx.lineWidth = 1;
        ctx.strokeRect(-25, -8, 8, 16);
        ctx.strokeRect(17, -8, 8, 16);
        
        ctx.shadowBlur = 0;

        // Antenna with detail
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(0, -20);
        ctx.stroke();

        // Antenna dish
        ctx.fillStyle = "#cbd5e1";
        ctx.beginPath();
        ctx.arc(0, -20, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#3b82f6";
        ctx.beginPath();
        ctx.arc(0, -20, 2, 0, Math.PI * 2);
        ctx.fill();

        // Blinking light
        if (state.frameCount % 30 < 15) {
          ctx.fillStyle = "#ef4444";
          ctx.shadowColor = "#ef4444";
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(10, 0, 2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Body highlights
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.fillRect(-13, -8, 8, 3);
        
        ctx.shadowBlur = 0;
      }

      ctx.restore();
    });

    // Draw score
    ctx.fillStyle = gameMode === "5G" ? "#22c55e" : "#ef4444";
    ctx.font = "bold 24px Arial";
    ctx.fillText(`Score: ${state.score}`, 20, 40);
    ctx.fillText(`High: ${highScore}`, 20, 70);

    // Draw mode indicator
    ctx.font = "bold 20px Arial";
    ctx.fillText(`${gameMode} MODE`, canvas.width - 120, 40);

    // 4G Mode: Show loading indicator occasionally
    if (gameMode === "4G" && state.shouldFreeze) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#ef4444";
      ctx.font = "bold 36px Arial";
      ctx.textAlign = "center";
      ctx.fillText("LOADING...", canvas.width / 2, canvas.height / 2);
      ctx.textAlign = "left";
    }
  };

  const checkCollision = (rect1: GameObject, rect2: GameObject) => {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  };

  const handleRestart = () => {
    setGameOver(false);
    setScore(0);
    gameStateRef.current = {
      rocket: { x: 100, y: 300, width: 40, height: 60, speed: 5 },
      obstacles: [],
      keys: {},
      score: 0,
      frameCount: 0,
      lastObstacleFrame: 0,
      lagFrames: 0,
      shouldFreeze: false,
      freezeCounter: 0,
    };
  };

  if (!gameMode) return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
            <Home className="w-4 h-4" />
            Main Menu
          </Button>
          <div className={cn(
            "px-4 py-2 rounded-lg border-2 font-bold",
            gameMode === "5G" 
              ? "border-speed-5g text-speed-5g bg-speed-5g/10"
              : "border-speed-4g text-speed-4g bg-speed-4g/10"
          )}>
            {gameMode} MODE
          </div>
        </div>

        {/* Game Canvas */}
        <Card className="p-4 bg-card/50 backdrop-blur-sm border-2 border-border">
          <div className="relative">
            <canvas
              ref={canvasRef}
              className="w-full border-2 border-primary/20 rounded-lg shadow-[var(--glow-blue)]"
            />
            
            {/* Game Over Overlay */}
            {gameOver && (
              <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center rounded-lg">
                <Card className="p-8 space-y-6 text-center border-2 border-primary max-w-md">
                  <div className="space-y-2">
                    <h2 className="text-4xl font-bold text-primary">GAME OVER</h2>
                    <p className="text-muted-foreground">
                      {gameMode === "4G" 
                        ? "Connection issues caused the crash!"
                        : "Nice try, pilot!"
                      }
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-4 py-3 bg-muted rounded-lg">
                      <span className="font-medium">Final Score:</span>
                      <span className="text-2xl font-bold text-primary">{score}</span>
                    </div>
                    
                    {score === highScore && score > 0 && (
                      <div className="flex items-center justify-center gap-2 text-accent">
                        <Trophy className="w-5 h-5" />
                        <span className="font-bold">NEW HIGH SCORE!</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between px-4 py-2 bg-muted/50 rounded-lg">
                      <span className="text-sm">High Score ({gameMode}):</span>
                      <span className="text-lg font-bold">{highScore}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="cyber"
                      onClick={handleRestart}
                      className="flex-1 gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Play Again
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/")}
                      className="flex-1 gap-2"
                    >
                      <Home className="w-4 h-4" />
                      Menu
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </Card>

        {/* Controls Info */}
        <Card className="p-4 bg-card/30 backdrop-blur-sm border border-border">
          <div className="grid md:grid-cols-3 gap-4 text-center text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Controls</p>
              <p className="font-bold">WASD or Arrow Keys</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Objective</p>
              <p className="font-bold">Avoid obstacles!</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Current Score</p>
              <p className="font-bold text-primary text-lg">{score}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

// cn utility
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}

export default Game;
