import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Rocket, Zap, SignalHigh, SignalLow } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModeCardProps {
  mode: "4G" | "5G";
  selected: boolean;
  onSelect: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export function ModeCard({ mode, selected, onSelect, className, style }: ModeCardProps) {
  const is5G = mode === "5G";
  
  return (
    <Card
      onClick={onSelect}
      style={style}
      className={cn(
        "relative overflow-hidden cursor-pointer transition-all duration-500 border-2 p-8",
        is5G 
          ? "bg-card/40 border-speed-5g/50 hover:border-speed-5g hover:shadow-[var(--glow-green)]"
          : "bg-card/40 border-speed-4g/50 hover:border-speed-4g hover:shadow-[var(--glow-red)]",
        selected && (is5G ? "border-speed-5g shadow-[var(--glow-green)]" : "border-speed-4g shadow-[var(--glow-red)] animate-glitch"),
        className
      )}
    >
      {/* Background Animation */}
      <div className={cn(
        "absolute inset-0 opacity-10",
        is5G ? "animate-data-stream" : ""
      )}>
        {is5G && (
          <>
            <div className="absolute top-0 left-1/4 w-1 h-full bg-gradient-to-b from-transparent via-speed-5g to-transparent" style={{ animationDelay: "0s" }} />
            <div className="absolute top-0 left-1/2 w-1 h-full bg-gradient-to-b from-transparent via-speed-5g to-transparent" style={{ animationDelay: "0.3s" }} />
            <div className="absolute top-0 left-3/4 w-1 h-full bg-gradient-to-b from-transparent via-speed-5g to-transparent" style={{ animationDelay: "0.6s" }} />
          </>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Signal Icon */}
        <div className={cn(
          "p-4 rounded-full transition-all duration-500",
          is5G 
            ? "bg-speed-5g/20 animate-pulse-glow"
            : "bg-speed-4g/20"
        )}>
          {is5G ? (
            <SignalHigh className={cn(
              "w-12 h-12",
              is5G ? "text-speed-5g" : "text-speed-4g"
            )} />
          ) : (
            <SignalLow className={cn(
              "w-12 h-12 animate-glitch",
              "text-speed-4g"
            )} />
          )}
        </div>

        {/* Mode Title */}
        <div className="text-center space-y-2">
          <h3 className={cn(
            "text-4xl font-bold tracking-wider",
            is5G ? "text-speed-5g" : "text-speed-4g"
          )}>
            {mode} MODE
          </h3>
          <p className="text-muted-foreground text-sm">
            {is5G ? "Ultra Speed Connected" : "Limited Connection"}
          </p>
        </div>

        {/* Features */}
        <div className="w-full space-y-3 text-left">
          <div className="flex items-center gap-2">
            <Zap className={cn(
              "w-4 h-4",
              is5G ? "text-speed-5g" : "text-speed-4g"
            )} />
            <span className="text-sm">
              {is5G ? "Zero lag - Buttery smooth" : "Frequent lags & freezes"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Rocket className={cn(
              "w-4 h-4",
              is5G ? "text-speed-5g" : "text-speed-4g"
            )} />
            <span className="text-sm">
              {is5G ? "Instant launch sequence" : "Loading screens galore"}
            </span>
          </div>
        </div>

        {/* Select Button */}
        <Button
          variant={is5G ? "neon-5g" : "neon-4g"}
          size="lg"
          className="w-full text-base font-semibold"
        >
          {selected ? "SELECTED" : "SELECT MODE"}
        </Button>

        {/* Loading indicator for 4G */}
        {!is5G && selected && (
          <div className="flex items-center gap-2 text-xs text-speed-4g animate-pulse">
            <div className="w-2 h-2 rounded-full bg-speed-4g animate-ping" />
            Loading...
          </div>
        )}
      </div>
    </Card>
  );
}
