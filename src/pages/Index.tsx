import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ModeCard } from "@/components/ModeCard";
import { Rocket, Radio } from "lucide-react";
import rocketBg from "@/assets/rocket-launch-bg.jpg";
import { cn } from "@/lib/utils";

const Index = () => {
  const [selectedMode, setSelectedMode] = useState<"4G" | "5G" | null>(null);
  const [launching, setLaunching] = useState(false);

  const handleLaunch = () => {
    if (!selectedMode) return;
    setLaunching(true);
    // Simüle fırlatma - gerçek oyun mantığı buraya eklenecek
    setTimeout(() => {
      alert(`${selectedMode} modunda fırlatma başarılı! 🚀`);
      setLaunching(false);
    }, 2000);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${rocketBg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/80" />
      </div>

      {/* Animated Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.1)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-12 min-h-screen flex flex-col items-center justify-center">
        {/* Header */}
        <div className="text-center mb-12 space-y-4 animate-fade-in">
          <div className="inline-flex items-center gap-3 text-primary mb-4">
            <Radio className="w-8 h-8 animate-pulse-glow" />
            <h1 className="text-6xl md:text-7xl font-bold tracking-wider bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-shimmer bg-[length:200%_auto]">
              ROCKET LAUNCH
            </h1>
            <Rocket className="w-8 h-8 animate-float" />
          </div>
          <p className="text-xl text-muted-foreground">
            Select your connection mode and prepare for launch
          </p>
        </div>

        {/* Mode Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl mb-12">
          <ModeCard
            mode="5G"
            selected={selectedMode === "5G"}
            onSelect={() => setSelectedMode("5G")}
            className="animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          />
          <ModeCard
            mode="4G"
            selected={selectedMode === "4G"}
            onSelect={() => setSelectedMode("4G")}
            className="animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          />
        </div>

        {/* Launch Button */}
        <div className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <Button
            variant="cyber"
            size="lg"
            onClick={handleLaunch}
            disabled={!selectedMode || launching}
            className={cn(
              "text-xl px-12 py-6 h-auto font-bold tracking-wider relative overflow-hidden group",
              !selectedMode && "opacity-50 cursor-not-allowed",
              launching && "animate-pulse-glow"
            )}
          >
            {/* Hologram effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-foreground/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            
            <span className="relative z-10 flex items-center gap-3">
              <Rocket className={cn(
                "w-6 h-6",
                launching && "animate-float"
              )} />
              {launching ? "LAUNCHING..." : "START GAME"}
            </span>
          </Button>
        </div>

        {/* Status Info */}
        {selectedMode && (
          <div className="mt-8 animate-fade-in">
            <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-card/50 backdrop-blur-sm border border-border">
              <div className={cn(
                "w-3 h-3 rounded-full animate-pulse",
                selectedMode === "5G" ? "bg-speed-5g shadow-[var(--glow-green)]" : "bg-speed-4g shadow-[var(--glow-red)]"
              )} />
              <span className="text-sm font-medium">
                {selectedMode === "5G" 
                  ? "Connected to 5G Network - Maximum Performance"
                  : "Connected to 4G Network - Reduced Performance"
                }
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
