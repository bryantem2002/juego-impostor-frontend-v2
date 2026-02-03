"use client";

import { Search } from "lucide-react";

export function Header() {
  return (
    <header className="w-full py-8 px-4 text-center">
      <div className="flex items-center justify-center gap-5">
        {/* Logo Icon - Simple magnifying glass */}
        <div className="relative w-16 h-16">
          <Search className="w-full h-full text-white stroke-[1.5]" />
        </div>

        {/* Title */}
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-wide">
            <span className="text-primary">IMPOSTOR</span>{" "}
            <span className="text-white">GAMES</span>
          </h1>
          <p className="text-white/80 text-sm md:text-base tracking-[0.3em] uppercase mt-1">
            EL JUEGO DEL ENGAÑO
          </p>
        </div>
      </div>
    </header>
  );
}
