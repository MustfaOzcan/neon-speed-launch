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

    // Draw rocket
    ctx.save();
    ctx.translate(rocket.x + rocket.width / 2, rocket.y + rocket.height / 2);
    
    // Rocket body
    ctx.fillStyle = gameMode === "5G" ? "#22c55e" : "#ef4444";
    ctx.beginPath();
    ctx.moveTo(-15, -25);
    ctx.lineTo(15, -25);
    ctx.lineTo(15, 20);
    ctx.lineTo(0, 30);
    ctx.lineTo(-15, 20);
    ctx.closePath();
    ctx.fill();

    // Rocket window
    ctx.fillStyle = "#60a5fa";
    ctx.beginPath();
    ctx.arc(0, -10, 6, 0, Math.PI * 2);
    ctx.fill();

    // Rocket flame (animated)
    if (state.frameCount % 4 < 2) {
      ctx.fillStyle = "#f97316";
      ctx.beginPath();
      ctx.moveTo(-10, 20);
      ctx.lineTo(0, 35);
      ctx.lineTo(10, 20);
      ctx.closePath();
      ctx.fill();
    }

    // Glow effect for 5G
    if (gameMode === "5G") {
      ctx.shadowColor = "#22c55e";
      ctx.shadowBlur = 20;
    }

    ctx.restore();

    // Draw obstacles
    obstacles.forEach((obstacle) => {
      ctx.save();
      ctx.translate(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);

      if (obstacle.type === "meteor") {
        // Draw meteor
        ctx.fillStyle = "#78716c";
        ctx.beginPath();
        ctx.arc(0, 0, obstacle.width / 2, 0, Math.PI * 2);
        ctx.fill();

        // Crater details
        ctx.fillStyle = "#57534e";
        ctx.beginPath();
        ctx.arc(-5, -5, 3, 0, Math.PI * 2);
        ctx.arc(5, 3, 4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Draw satellite
        ctx.fillStyle = "#94a3b8";
        ctx.fillRect(-15, -10, 30, 20);
        
        // Solar panels
        ctx.fillStyle = "#1e40af";
        ctx.fillRect(-25, -8, 8, 16);
        ctx.fillRect(17, -8, 8, 16);

        // Antenna
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(0, -20);
        ctx.stroke();
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
