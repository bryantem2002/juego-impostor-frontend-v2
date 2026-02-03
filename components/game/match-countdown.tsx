"use client";

import React from "react"

import { useState, useEffect, useCallback } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  angle: number;
  speed: number;
  size: number;
  shape: "triangle" | "diamond" | "square";
  color: string;
  opacity: number;
}

interface MatchCountdownProps {
  onComplete: () => void;
}

export function MatchCountdown({ onComplete }: MatchCountdownProps) {
  const [count, setCount] = useState(3);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showFlash, setShowFlash] = useState(false);
  const [scale, setScale] = useState(1);

  const colors = ["#4ade80", "#22c55e", "#86efac", "#bbf7d0", "#166534"];
  const shapes: Particle["shape"][] = ["triangle", "diamond", "square"];

  const createParticles = useCallback(() => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 30; i++) {
      newParticles.push({
        id: Date.now() + i,
        x: 50,
        y: 50,
        angle: (Math.PI * 2 * i) / 30 + Math.random() * 0.5,
        speed: 3 + Math.random() * 5,
        size: 8 + Math.random() * 16,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: 1,
      });
    }
    setParticles(newParticles);
  }, []);

  // Animate particles
  useEffect(() => {
    if (particles.length === 0) return;

    const interval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + Math.cos(p.angle) * p.speed,
            y: p.y + Math.sin(p.angle) * p.speed,
            opacity: p.opacity - 0.03,
            size: p.size * 0.98,
          }))
          .filter((p) => p.opacity > 0)
      );
    }, 30);

    return () => clearInterval(interval);
  }, [particles.length]);

  // Countdown logic
  useEffect(() => {
    if (count > 0) {
      // Trigger scale animation
      setScale(1.3);
      setTimeout(() => setScale(1), 150);
      
      // Create particles on each count change
      createParticles();

      const timer = setTimeout(() => {
        setCount((prev) => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (count === 0) {
      // Show flash and complete
      setShowFlash(true);
      setTimeout(() => {
        onComplete();
      }, 300);
    }
  }, [count, createParticles, onComplete]);

  const renderShape = (particle: Particle) => {
    const style: React.CSSProperties = {
      position: "absolute",
      left: `${particle.x}%`,
      top: `${particle.y}%`,
      transform: "translate(-50%, -50%)",
      opacity: particle.opacity,
      transition: "all 0.03s linear",
    };

    switch (particle.shape) {
      case "triangle":
        return (
          <div
            key={particle.id}
            style={{
              ...style,
              width: 0,
              height: 0,
              borderLeft: `${particle.size / 2}px solid transparent`,
              borderRight: `${particle.size / 2}px solid transparent`,
              borderBottom: `${particle.size}px solid ${particle.color}`,
            }}
          />
        );
      case "diamond":
        return (
          <div
            key={particle.id}
            style={{
              ...style,
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              transform: `translate(-50%, -50%) rotate(45deg)`,
            }}
          />
        );
      case "square":
        return (
          <div
            key={particle.id}
            style={{
              ...style,
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
            }}
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
      {/* White flash effect */}
      {showFlash && (
        <div className="absolute inset-0 bg-white animate-pulse z-50" />
      )}

      {/* Particles container */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => renderShape(particle))}
      </div>

      {/* Central Diamond */}
      <div
        className="relative transition-transform duration-150 ease-out"
        style={{ transform: `scale(${scale})` }}
      >
        {/* Outer glow layers */}
        <div className="absolute inset-0 blur-3xl">
          <div
            className="w-48 h-48 md:w-64 md:h-64 bg-primary/40"
            style={{
              transform: "rotate(45deg)",
              borderRadius: "12px",
            }}
          />
        </div>
        <div className="absolute inset-0 blur-xl">
          <div
            className="w-48 h-48 md:w-64 md:h-64 bg-primary/60"
            style={{
              transform: "rotate(45deg)",
              borderRadius: "12px",
            }}
          />
        </div>

        {/* Main diamond shape */}
        <div
          className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center"
          style={{
            transform: "rotate(45deg)",
          }}
        >
          {/* Diamond border with neon glow */}
          <div
            className="absolute inset-0 rounded-xl border-4 border-primary"
            style={{
              boxShadow: `
                0 0 20px rgba(74, 222, 128, 0.8),
                0 0 40px rgba(74, 222, 128, 0.6),
                0 0 60px rgba(74, 222, 128, 0.4),
                inset 0 0 30px rgba(74, 222, 128, 0.2)
              `,
            }}
          />

          {/* Inner background */}
          <div className="absolute inset-2 rounded-lg bg-gradient-to-br from-[#1a1a2e] to-[#0a0a15]" />

          {/* Number */}
          <div
            className="relative z-10"
            style={{
              transform: "rotate(-45deg)",
            }}
          >
            {count > 0 ? (
              <span
                className="text-7xl md:text-9xl font-black text-primary tracking-tighter"
                style={{
                  textShadow: `
                    0 0 20px rgba(74, 222, 128, 0.8),
                    0 0 40px rgba(74, 222, 128, 0.5),
                    0 0 60px rgba(74, 222, 128, 0.3)
                  `,
                  fontFamily: "'Arial Black', 'Helvetica', sans-serif",
                }}
              >
                {count}
              </span>
            ) : (
              <span
                className="text-3xl md:text-5xl font-black text-primary tracking-wider uppercase"
                style={{
                  textShadow: `
                    0 0 20px rgba(74, 222, 128, 0.8),
                    0 0 40px rgba(74, 222, 128, 0.5)
                  `,
                }}
              >
                GO!
              </span>
            )}
          </div>
        </div>

        {/* Corner decorations */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full shadow-[0_0_15px_rgba(74,222,128,0.8)]" />
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full shadow-[0_0_15px_rgba(74,222,128,0.8)]" />
        <div className="absolute top-1/2 -left-4 -translate-y-1/2 w-3 h-3 bg-primary rounded-full shadow-[0_0_15px_rgba(74,222,128,0.8)]" />
        <div className="absolute top-1/2 -right-4 -translate-y-1/2 w-3 h-3 bg-primary rounded-full shadow-[0_0_15px_rgba(74,222,128,0.8)]" />
      </div>

      {/* Text below */}
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 text-center">
        <p className="text-xl md:text-2xl font-bold text-white/80 uppercase tracking-[0.3em]">
          Preparate
        </p>
      </div>
    </div>
  );
}
