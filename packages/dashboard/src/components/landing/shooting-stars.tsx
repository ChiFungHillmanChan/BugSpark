"use client";

import { useMemo } from "react";

interface Star {
  id: number;
  top: string;
  left: string;
  delay: string;
  duration: string;
  size: "sm" | "md" | "lg";
  angle: number;
}

const STAR_COUNT = 14;

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

export function ShootingStars() {
  const stars = useMemo<Star[]>(() => {
    return Array.from({ length: STAR_COUNT }, (_, i) => {
      const r1 = seededRandom(i + 1);
      const r2 = seededRandom(i + 100);
      const r3 = seededRandom(i + 200);
      const r4 = seededRandom(i + 300);
      const r5 = seededRandom(i + 400);

      const sizes: Star["size"][] = ["sm", "md", "lg"];
      return {
        id: i,
        top: `${r1 * 80}%`,
        left: `${20 + r2 * 80}%`,
        delay: `${r3 * 10}s`,
        duration: `${1.5 + r4 * 2}s`,
        size: sizes[Math.floor(r5 * 3)],
        angle: 30 + seededRandom(i + 500) * 25,
      };
    });
  }, []);

  const sizeMap = {
    sm: { width: 60, tailOpacity: 0.35 },
    md: { width: 100, tailOpacity: 0.5 },
    lg: { width: 150, tailOpacity: 0.7 },
  };

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((star) => {
        const { width, tailOpacity } = sizeMap[star.size];
        return (
          <div
            key={star.id}
            className="absolute"
            style={{
              top: star.top,
              left: star.left,
              transform: `rotate(${star.angle}deg)`,
            }}
          >
            <div
              className="shooting-star"
              style={{
                width: `${width}px`,
                height: "2px",
                opacity: 0,
                animationDelay: star.delay,
                animationDuration: star.duration,
                ["--star-opacity" as string]: tailOpacity,
              }}
            >
              {/* Head glow */}
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full"
                style={{
                  width: "4px",
                  height: "4px",
                  background: `rgba(255, 255, 255, ${tailOpacity})`,
                  boxShadow: `0 0 6px 2px rgba(255, 255, 255, ${tailOpacity * 0.5}), 0 0 12px 4px rgba(233, 69, 96, ${tailOpacity * 0.3})`,
                }}
              />
              {/* Tail streak */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `linear-gradient(90deg, rgba(255,255,255,${tailOpacity}) 0%, rgba(233,69,96,${tailOpacity * 0.3}) 40%, transparent 100%)`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
