export const dynamic = "force-dynamic";

import { Header } from "@/components/lobby/header";
import { PlayerSetup } from "@/components/lobby/player-setup";
import { HowToPlay } from "@/components/lobby/how-to-play";
import { Footer } from "@/components/lobby/footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#1a1a2e] via-[#2d1f4e] to-[#1a1a2e] overflow-x-hidden">
      {/* Constellation Background with more visible stars */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            {/* Glow filter for stars */}
            <filter id="starGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            {/* Constellation pattern */}
            <pattern id="constellation" x="0" y="0" width="300" height="300" patternUnits="userSpaceOnUse">
              {/* Bright stars */}
              <circle cx="50" cy="40" r="2" fill="rgba(255,255,255,0.8)" filter="url(#starGlow)" />
              <circle cx="150" cy="80" r="1.5" fill="rgba(255,255,255,0.7)" filter="url(#starGlow)" />
              <circle cx="250" cy="30" r="2" fill="rgba(255,255,255,0.6)" filter="url(#starGlow)" />
              <circle cx="100" cy="150" r="2.5" fill="rgba(255,255,255,0.8)" filter="url(#starGlow)" />
              <circle cx="200" cy="200" r="1.5" fill="rgba(255,255,255,0.7)" filter="url(#starGlow)" />
              <circle cx="280" cy="150" r="2" fill="rgba(255,255,255,0.6)" filter="url(#starGlow)" />
              <circle cx="30" cy="220" r="1.5" fill="rgba(255,255,255,0.7)" filter="url(#starGlow)" />
              <circle cx="180" cy="280" r="2" fill="rgba(255,255,255,0.8)" filter="url(#starGlow)" />
              
              {/* Small background stars */}
              <circle cx="80" cy="90" r="1" fill="rgba(255,255,255,0.4)" />
              <circle cx="220" cy="120" r="1" fill="rgba(255,255,255,0.3)" />
              <circle cx="40" cy="180" r="1" fill="rgba(255,255,255,0.4)" />
              <circle cx="260" cy="250" r="1" fill="rgba(255,255,255,0.3)" />
              <circle cx="120" cy="260" r="1" fill="rgba(255,255,255,0.4)" />
              <circle cx="170" cy="60" r="0.8" fill="rgba(255,255,255,0.3)" />
              <circle cx="90" cy="290" r="0.8" fill="rgba(255,255,255,0.3)" />
              
              {/* Constellation lines */}
              <line x1="50" y1="40" x2="100" y2="150" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
              <line x1="100" y1="150" x2="150" y2="80" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
              <line x1="150" y1="80" x2="250" y2="30" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
              <line x1="200" y1="200" x2="280" y2="150" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
              <line x1="100" y1="150" x2="200" y2="200" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
              <line x1="30" y1="220" x2="100" y2="150" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
              <line x1="180" y1="280" x2="200" y2="200" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
              <line x1="150" y1="80" x2="200" y2="200" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#constellation)" />
        </svg>
      </div>

      {/* Ambient glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-[80px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <Header />

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-stretch justify-center w-full max-w-3xl">
            {/* Left Panel - Player Setup */}
            <PlayerSetup />

            {/* Right Panel - How to Play */}
            <HowToPlay />
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
