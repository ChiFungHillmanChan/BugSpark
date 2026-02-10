interface CosmicBackgroundProps {
  variant: "full" | "top-only";
}

export function CosmicBackground({ variant }: CosmicBackgroundProps) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Starfield via CSS radial-gradient dots */}
      <div
        className="absolute inset-0 dark:opacity-60 opacity-0"
        style={{
          backgroundImage: `
            radial-gradient(1px 1px at 10% 15%, rgba(255,255,255,0.4) 50%, transparent 50%),
            radial-gradient(1px 1px at 20% 35%, rgba(255,255,255,0.3) 50%, transparent 50%),
            radial-gradient(1.5px 1.5px at 30% 8%, rgba(255,255,255,0.5) 50%, transparent 50%),
            radial-gradient(1px 1px at 40% 55%, rgba(255,255,255,0.3) 50%, transparent 50%),
            radial-gradient(1px 1px at 50% 22%, rgba(255,255,255,0.4) 50%, transparent 50%),
            radial-gradient(1.5px 1.5px at 60% 45%, rgba(255,255,255,0.3) 50%, transparent 50%),
            radial-gradient(1px 1px at 70% 12%, rgba(255,255,255,0.5) 50%, transparent 50%),
            radial-gradient(1px 1px at 80% 38%, rgba(255,255,255,0.3) 50%, transparent 50%),
            radial-gradient(1.5px 1.5px at 90% 65%, rgba(255,255,255,0.4) 50%, transparent 50%),
            radial-gradient(1px 1px at 15% 72%, rgba(255,255,255,0.3) 50%, transparent 50%),
            radial-gradient(1px 1px at 25% 88%, rgba(255,255,255,0.4) 50%, transparent 50%),
            radial-gradient(1.5px 1.5px at 35% 62%, rgba(255,255,255,0.3) 50%, transparent 50%),
            radial-gradient(1px 1px at 45% 78%, rgba(255,255,255,0.5) 50%, transparent 50%),
            radial-gradient(1px 1px at 55% 92%, rgba(255,255,255,0.3) 50%, transparent 50%),
            radial-gradient(1.5px 1.5px at 65% 75%, rgba(255,255,255,0.4) 50%, transparent 50%),
            radial-gradient(1px 1px at 75% 85%, rgba(255,255,255,0.3) 50%, transparent 50%),
            radial-gradient(1px 1px at 85% 52%, rgba(255,255,255,0.5) 50%, transparent 50%),
            radial-gradient(1.5px 1.5px at 95% 28%, rgba(255,255,255,0.3) 50%, transparent 50%),
            radial-gradient(1px 1px at 5% 48%, rgba(255,255,255,0.4) 50%, transparent 50%),
            radial-gradient(1px 1px at 12% 32%, rgba(255,255,255,0.3) 50%, transparent 50%),
            radial-gradient(1.5px 1.5px at 22% 58%, rgba(255,255,255,0.5) 50%, transparent 50%),
            radial-gradient(1px 1px at 32% 42%, rgba(255,255,255,0.3) 50%, transparent 50%),
            radial-gradient(1px 1px at 42% 18%, rgba(255,255,255,0.4) 50%, transparent 50%),
            radial-gradient(1.5px 1.5px at 52% 68%, rgba(255,255,255,0.3) 50%, transparent 50%),
            radial-gradient(1px 1px at 62% 32%, rgba(255,255,255,0.5) 50%, transparent 50%),
            radial-gradient(1px 1px at 72% 58%, rgba(255,255,255,0.3) 50%, transparent 50%),
            radial-gradient(1.5px 1.5px at 82% 22%, rgba(255,255,255,0.4) 50%, transparent 50%),
            radial-gradient(1px 1px at 92% 48%, rgba(255,255,255,0.3) 50%, transparent 50%),
            radial-gradient(1px 1px at 8% 82%, rgba(255,255,255,0.5) 50%, transparent 50%),
            radial-gradient(1.5px 1.5px at 18% 95%, rgba(255,255,255,0.3) 50%, transparent 50%),
            radial-gradient(1px 1px at 28% 75%, rgba(255,255,255,0.4) 50%, transparent 50%),
            radial-gradient(1px 1px at 38% 88%, rgba(255,255,255,0.3) 50%, transparent 50%),
            radial-gradient(1.5px 1.5px at 48% 5%, rgba(255,255,255,0.5) 50%, transparent 50%),
            radial-gradient(1px 1px at 58% 15%, rgba(255,255,255,0.3) 50%, transparent 50%),
            radial-gradient(1px 1px at 68% 92%, rgba(255,255,255,0.4) 50%, transparent 50%),
            radial-gradient(1.5px 1.5px at 78% 48%, rgba(255,255,255,0.3) 50%, transparent 50%),
            radial-gradient(1px 1px at 88% 72%, rgba(255,255,255,0.5) 50%, transparent 50%),
            radial-gradient(1px 1px at 98% 82%, rgba(255,255,255,0.3) 50%, transparent 50%),
            radial-gradient(1.5px 1.5px at 3% 28%, rgba(255,255,255,0.4) 50%, transparent 50%),
            radial-gradient(1px 1px at 37% 52%, rgba(255,255,255,0.3) 50%, transparent 50%)
          `,
        }}
      />

      {/* Gradient orb — top-left cosmic purple */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-cosmic-purple/20 blur-[80px] animate-pulse-glow dark:opacity-100 opacity-0" />

      {/* Gradient orb — center-right accent */}
      {variant === "full" && (
        <div className="absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-accent/15 blur-[80px] animate-pulse-glow dark:opacity-100 opacity-0" />
      )}

      {/* Gradient orb — bottom-left accent */}
      {variant === "full" && (
        <div className="absolute -bottom-20 left-1/4 w-72 h-72 rounded-full bg-cosmic-purple/15 blur-[80px] animate-pulse-glow dark:opacity-100 opacity-0" />
      )}
    </div>
  );
}
