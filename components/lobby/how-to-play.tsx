"use client";

import { useState, useEffect } from "react";

const instructions = [
  {
    number: "1.",
    title: "IDENTIFICA AL INÚTIL",
    description: "Deja de mirar nopor y concéntrate. Hay un impostor infiltrado que no tiene ni la más mínima idea de qué estamos hablando. Si no lo encuentras rápido, el estúpido vas a ser tú",
    image: "/instructions/identifica.gif",
  },
  {
    number: "2.",
    title: "OBSERVA SUS MENTIRAS",
    description: "Analiza cada palabra, no te dejes engañar asi como que te engaño ella o el. Si alguien titubea o lanza una descripción, ¡votalo! El impostor está intentando encajar ",
    image: "/instructions/observa.gif",
  },
  {
    number: "3.",
    title: "COMUNICA (CON CEREBRO)",
    description: "No seas tan obvio, pedazo de animal. Describe tu palabra de forma que los que saben entiendan, pero no le regales el juego al impostor.",
    image: "/instructions/comunica.gif",
  },
  {
    number: "4.",
    title: "VOTA Y HUMILLALO",
    description: "Llegó la hora de la verdad. Si ya sabes quién es el infiltrado, lánzale el voto encima sin piedad. No me vengas con dudas ahora; señala al mentiroso",
    image: "/instructions/vota.gif",
  },
];

export function HowToPlay() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<"left" | "right">("right");

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setDirection("right");
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % instructions.length);
        setIsAnimating(false);
      }, 300);
    }, 10000);

    return () => clearInterval(timer);
  }, []);

  const goToSlide = (index: number) => {
    if (index === currentIndex) return;
    setDirection(index > currentIndex ? "right" : "left");
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsAnimating(false);
    }, 300);
  };

  return (
    <div className="backdrop-blur-xl bg-card rounded-2xl border border-border p-6 md:p-8 w-full max-w-sm">
      {/* Header */}
      <h2 className="text-xl font-bold text-white uppercase tracking-wider mb-6 text-center">
        CÓMO JUGAR
      </h2>

      {/* Image/GIF placeholder area */}
<div className="relative w-full h-40 mb-6 overflow-hidden rounded-lg bg-secondary/30 border border-border/50">
  <div
    className={`absolute inset-0 transition-all duration-300 ease-in-out ${
      isAnimating
        ? direction === "right"
          ? "-translate-x-full opacity-0"
          : "translate-x-full opacity-0"
        : "translate-x-0 opacity-100"
    }`}
  >
    {/* Imagen o GIF Real */}
    <img 
      src={instructions[currentIndex].image} 
      alt={instructions[currentIndex].title}
      className="w-full h-full object-cover" // object-cover llena el espacio, object-contain muestra la imagen completa
    />
  </div>
</div>

      {/* Instruction Card */}
      <div className="relative overflow-hidden mb-6 min-h-[100px]">
        <div
          className={`bg-secondary/50 rounded-xl p-5 border border-border transition-all duration-300 ease-in-out ${
            isAnimating
              ? direction === "right"
                ? "-translate-x-full opacity-0"
                : "translate-x-full opacity-0"
              : "translate-x-0 opacity-100"
          }`}
        >
          <div className="flex items-start gap-4">
            {/* Number circle */}
            <div className="w-10 h-10 rounded-full border-2 border-primary flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-bold text-sm">
                {instructions[currentIndex].number}
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white uppercase tracking-wide mb-1">
                {instructions[currentIndex].title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {instructions[currentIndex].description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination Dots */}
      <div className="flex justify-center gap-2">
        {instructions.map((_, index) => (
          <button
            type="button"
            key={`instruction-dot-${index}`}
            onClick={() => goToSlide(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "bg-white w-6"
                : "bg-primary/60 hover:bg-primary/80"
            }`}
            aria-label={`Ir a instrucción ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
