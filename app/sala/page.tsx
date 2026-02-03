"use client";

import { useState, useRef, useEffect, useCallback,Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Crown, User, X, Volume2, VolumeX, Link2, Play, Send, LogOut, Users, Clock, ChevronDown, ChevronUp, Minus, Plus, AlertTriangle, MessageCircle, Vote, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MatchCountdown } from "@/components/game/match-countdown";
import { socket } from "@/lib/socket";
import { cn } from "@/lib/utils";


interface Player {
  id: string;
  nickname: string;
  avatar: string;
  isHost: boolean;
}

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  isSystem: boolean;
  timestamp: Date;
}

type GameState = "lobby" | "playing" | "voting" | "results";

const timeOptions = [30, 60, 90, 120];

export default function SalaPage() {
  return (
    <Suspense fallback={
      <div className="h-screen bg-[#0f0f1a] flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    }>
      <SalaContent /> 
    </Suspense>
  );
}
function SalaContent() { 
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomCode = searchParams.get("code") || "";

  const [players, setPlayers] = useState<Player[]>([]);
  const [hostId, setHostId] = useState<string | null>(null);
  const [copiedToast, setCopiedToast] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: `${Date.now()}-BOT`, sender: "BOT", message: "Bienvenido a la sala. Espera a que se unan mas jugadores.", isSystem: true, timestamp: new Date() },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedTime, setSelectedTime] = useState(60);
  const [customTime, setCustomTime] = useState("");
  const [isCustomTime, setIsCustomTime] = useState(false);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [playersExpanded, setPlayersExpanded] = useState(true);
  
  // Game State
  const [gameState, setGameState] = useState<GameState>("lobby");
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [secretWord] = useState("DETECTIVE");
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [showCountdown, setShowCountdown] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const isHost = hostId !== null && socket.id === hostId;

  const SALA_JOIN_KEY = "sala_join";

  // Al inicio de tu componente
const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

useEffect(() => {
  const rawData = sessionStorage.getItem(SALA_JOIN_KEY);
  
  if (!rawData) {
    setIsAuthorized(false); // Detenemos cualquier renderizado
    router.replace("/");    // Expulsión
    return;
  }

  try {
    const parsed = JSON.parse(rawData);
    if (!parsed.nickname) {
      setIsAuthorized(false);
      router.replace("/");
      return;
    }
    setIsAuthorized(true); // Solo aquí se permite el paso
  } catch {
    setIsAuthorized(false);
    router.replace("/");
  }
}, [router]);

  //f5
  // BLOQUE UNIFICADO: Seguridad, Unión y Escucha
useEffect(() => {
  // BLOQUEO CRÍTICO: Si no hay autorización real o no hay código, el socket se ignora.
  if (!roomCode || isAuthorized !== true) return;

  // 1. Limpieza preventiva total de cualquier escucha anterior
  socket.removeAllListeners();

  const raw = sessionStorage.getItem(SALA_JOIN_KEY);
  const stored = raw ? JSON.parse(raw) : null;

  // 2. Definición de Handlers (Tu lógica completa)
  const onUpdatePlayers = (data: { players: any[]; hostId: string }) => {
    setHostId(data.hostId);
    setPlayers(data.players.map((p) => ({
      id: p.id,
      nickname: p.nickname,
      avatar: p.avatar || "/avatars/detective-1.png",
      isHost: p.id === data.hostId,
    })));
  };

  const onRoomSettingsUpdated = (data: { timer: number; maxPlayers: number }) => {
    setSelectedTime(data.timer);
    setMaxPlayers(data.maxPlayers);
    setIsCustomTime(false);
    setCustomTime("");
  };

  const onReceiveMessage = (data: { nickname: string; message: string }) => {
    setChatMessages((prev) => [
      ...prev,
      { 
        id: `${Date.now()}-${data.nickname}-${Math.random().toString(36).substr(2, 5)}`, 
        sender: data.nickname, 
        message: data.message, 
        isSystem: data.nickname === "BOT", 
        timestamp: new Date() 
      },
    ]);
  };

  // 3. Registro de Eventos ANTES de emitir join_room
  socket.on("update_players", onUpdatePlayers);
  socket.on("room_settings_updated", onRoomSettingsUpdated);
  socket.on("receive_message", onReceiveMessage);
  socket.on("room_terminated", () => router.push("/"));

  // 4. Lógica de Unión (F5 / Entrada inicial autorizada)
  const handleJoin = () => {
    if (stored?.nickname) {
      socket.emit("join_room", {
        roomCode,
        nickname: stored.nickname,
        avatar: stored.avatar || "/avatars/detective-1.png",
      });
    } else {
      router.replace("/");
    }
  };

  if (socket.connected) {
    handleJoin();
  } else {
    socket.connect();
    socket.once("connect", handleJoin);
  }

  // 5. Cleanup al desmontar el componente
  return () => {
    socket.removeAllListeners();
  };
}, [roomCode, isAuthorized, router]); // Dependencias correctas

  useEffect(() => {
    const scrollContainer = chatEndRef.current?.parentElement;
    if (scrollContainer) {
      // Usamos setTimeout para esperar al renderizado de los mensajes
      const timer = setTimeout(() => {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [chatMessages]);

  // Timer logic
  useEffect(() => {
    if (gameState === "playing" && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setShowTimeUpModal(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, timeRemaining]);

  const sendMessage = () => {
    if (!newMessage.trim() || !roomCode) return;
    const me = players.find((p) => p.id === socket.id);
    socket.emit("send_message", {
      roomCode,
      nickname: me?.nickname ?? "Anónimo",
      message: newMessage.trim(),
    });
    setNewMessage("");
  };

  const copyRoomCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  const handleLeaveRoom = () => {
    socket.disconnect();
    router.push("/");
  };

  const handleCloseRoom = () => {
    if (isHost && roomCode) socket.emit("terminate_game", roomCode);
  };

  const handleStartGame = () => {
    setShowSettingsModal(true);
  };

  const confirmStartGame = () => {
    const finalTime = isCustomTime ? parseInt(customTime) || 60 : selectedTime;
    
    // 1. Validación de seguridad
    if (finalTime < 10) return;
  
    // 2. Avisamos al servidor (Solo si eres Host)
    if (roomCode && isHost) {
      socket.emit("update_room_settings", { roomCode, timer: finalTime, maxPlayers });
    }
  
    // 3. Cerramos el modal de ajustes
    setShowSettingsModal(false);
  
    // 4. ACTIVAMOS EL CONTEO (3, 2, 1...)
    // Importante: Quitamos setGameState("playing") de aquí
    setShowCountdown(true); 
  
    // 5. Mensaje del BOT (Opcional: puedes dejarlo aquí o moverlo al onComplete)
    setChatMessages((prev) => [
      ...prev,
      { 
        id: `${Date.now()}-BOT-${Math.random().toString(36).substr(2, 5)}`, 
        sender: "BOT", 
        message: "¡Prepárate! La partida está por comenzar...", 
        isSystem: true, 
        timestamp: new Date() 
      },
    ]);
  }; 

  const handleTimeSelect = (time: number) => {
    setSelectedTime(time);
    setIsCustomTime(false);
    setCustomTime("");
    if (roomCode && isHost) {
      socket.emit("update_room_settings", { roomCode, timer: time, maxPlayers });
    }
  };

  const handleCustomTimeChange = (value: string) => {
    const num = value.replace(/\D/g, "");
    setCustomTime(num);
    setIsCustomTime(true);
  };

  const getFinalTime = () => {
    if (isCustomTime && customTime) {
      return parseInt(customTime);
    }
    return selectedTime;
  };

  const incrementPlayers = () => {
    if (maxPlayers < 10 && gameState === "lobby") {
      const next = maxPlayers + 1;
      setMaxPlayers(next);
      if (roomCode && isHost) {
        socket.emit("update_room_settings", { roomCode, timer: getFinalTime(), maxPlayers: next });
      }
    }
  };

  const decrementPlayers = () => {
    if (maxPlayers > 3 && gameState === "lobby") {
      const next = maxPlayers - 1;
      setMaxPlayers(next);
      if (roomCode && isHost) {
        socket.emit("update_room_settings", { roomCode, timer: getFinalTime(), maxPlayers: next });
      }
    }
  };

  const handleMoreDebate = () => {
    setShowTimeUpModal(false);
    setTimeRemaining(30);
  };

  const handleVoteNow = () => {
    setShowTimeUpModal(false);
    setGameState("voting");
  };

  const handleAccuse = (playerId: string) => {
    setSelectedVote(playerId);
  };

  const confirmVote = () => {
    if (selectedVote) {
      setGameState("results");
      setChatMessages((prev) => [
        ...prev,
        { 
          // Generamos ID único con milisegundos y cadena aleatoria
          id: `${Date.now()}-BOT-${Math.random().toString(36).substr(2, 5)}`, 
          sender: "BOT", 
          message: `Votación completada. El jugador acusado fue ${players.find(p => p.id === selectedVote)?.nickname}. ¡Que la suerte los acompañe!`, 
          isSystem: true, 
          timestamp: new Date() 
        },
      ]);
    }
  };

  const endGame = () => {
    setGameState("lobby");
    setTimeRemaining(0);
    setSelectedVote(null);
    setShowTimeUpModal(false);
    if (timerRef.current) clearInterval(timerRef.current);
  
    setChatMessages((prev) => [
      ...prev,
      { 
        // Agregamos el sufijo aleatorio para que la llave sea única
        id: `${Date.now()}-BOT-${Math.random().toString(36).substr(2, 5)}`, 
        sender: "BOT", 
        message: "La partida ha terminado. Configura una nueva partida.", 
        isSystem: true, 
        timestamp: new Date() 
      },
    ]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimerColor = () => {
    if (timeRemaining <= 10) return "text-destructive";
    if (timeRemaining <= 30) return "text-yellow-500";
    return "text-primary";
  };


  if (isAuthorized !== true) {
    return (
      <div className="h-screen bg-[#0f0f1a] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="font-bold uppercase tracking-widest text-sm">
            {isAuthorized === false ? "Acceso denegado..." : "Verificando identidad..."}
          </span>
        </div>
      </div>
    );
  }

  return (

    <div className="h-screen flex flex-col bg-[#0f0f1a] overflow-hidden p-2 md:p-4">
      {/* Constellation Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <svg className="w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#4ade80" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
            </radialGradient>
          </defs>
          {Array.from({ length: 50 }).map((_, i) => (
            <circle
              key={`star-${i}`}
              cx={`${Math.random() * 100}%`}
              cy={`${Math.random() * 100}%`}
              r={Math.random() * 2 + 1}
              fill="url(#starGlow)"
              className="animate-pulse"
              style={{ animationDelay: `${Math.random() * 3}s` }}
            />
          ))}
          {Array.from({ length: 15 }).map((_, i) => (
            <line
              key={`line-${i}`}
              x1={`${Math.random() * 100}%`}
              y1={`${Math.random() * 100}%`}
              x2={`${Math.random() * 100}%`}
              y2={`${Math.random() * 100}%`}
              stroke="#4ade80"
              strokeWidth="0.5"
              strokeOpacity="0.2"
            />
          ))}
        </svg>
      </div>

      {/* Top Navigation */}
      <header className="flex-none mb-2 md:mb-4">
        <div className="flex items-center gap-2 md:gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLeaveRoom}
            className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 gap-1 md:gap-2 text-xs md:text-sm"
          >
            <LogOut className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline">SALIR</span>
          </Button>
          {isHost && gameState !== "lobby" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={endGame}
              className="text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10 gap-1 md:gap-2 text-xs md:text-sm"
            >
              <StopCircle className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">TERMINAR</span>
            </Button>
          )}
          {isHost && gameState === "lobby" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCloseRoom}
              className="text-muted-foreground hover:text-white gap-1 md:gap-2 text-xs md:text-sm"
            >
              <X className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">CERRAR SALA</span>
            </Button>
          )}
        </div>

        {/* Logo */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 md:gap-3">
          <div className="w-6 h-6 md:w-8 md:h-8 text-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          <span className="text-sm md:text-xl font-bold tracking-wider text-white">
            <span className="hidden sm:inline">IMPOSTOR </span>
            <span className="text-primary">GAMES</span>
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMuted(!isMuted)}
          className="text-white/70 hover:text-white"
        >
          {isMuted ? <VolumeX className="w-4 h-4 md:w-5 md:h-5" /> : <Volume2 className="w-4 h-4 md:w-5 md:h-5" />}
        </Button>
      </header>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row gap-3 md:gap-4 p-3 md:p-4 overflow-hidden">
        
        {/* Mobile: Players Section */}
        <div className="lg:hidden flex flex-col gap-3">
          {/* Player Count Selector - Mobile (solo Host puede ajustar) */}
          <div className="backdrop-blur-xl bg-card/80 rounded-xl border border-border p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-white uppercase tracking-wider">Jugadores</span>
              </div>
              {isHost ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={decrementPlayers}
                    disabled={maxPlayers <= 3 || gameState !== "lobby"}
                    className="w-8 h-8 rounded-lg bg-muted/50 border border-border flex items-center justify-center text-white hover:bg-muted/70 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className={`w-12 h-10 rounded-lg flex items-center justify-center ${gameState !== "lobby" ? "bg-muted/30 border-2 border-border" : "bg-primary/20 border-2 border-primary"}`}>
                    <span className={`text-lg font-bold ${gameState !== "lobby" ? "text-muted-foreground" : "text-primary"}`}>{maxPlayers}</span>
                  </div>
                  <button
                    type="button"
                    onClick={incrementPlayers}
                    disabled={maxPlayers >= 10 || gameState !== "lobby"}
                    className="w-8 h-8 rounded-lg bg-muted/50 border border-border flex items-center justify-center text-white hover:bg-muted/70 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="w-12 h-10 rounded-lg flex items-center justify-center bg-muted/30 border-2 border-border">
                  <span className="text-lg font-bold text-muted-foreground">{maxPlayers}</span>
                </div>
              )}
            </div>
            {gameState !== "lobby" && isHost && (
              <p className="text-xs text-muted-foreground mt-2 text-center">Bloqueado durante la partida</p>
            )}
          </div>

          {/* Collapsible Players List */}
          <button
            type="button"
            onClick={() => setPlayersExpanded(!playersExpanded)}
            className="backdrop-blur-xl bg-card/80 rounded-xl border border-border p-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
  <div className="flex -space-x-2">
    {/* Usamos una función autoejecutada para limpiar la lista una sola vez */}
    {(() => {
      const uniquePlayers = Array.from(new Map(players.map(p => [p.id, p])).values());
      const extraCount = uniquePlayers.length - 3;
      const totalUnique = uniquePlayers.length;

      return (
        <>
          {/* 1. Avatares únicos */}
          {uniquePlayers.slice(0, 3).map((player) => (
            <div
              key={player.id}
              className="w-7 h-7 rounded-full bg-[#1a1a2e] border-2 border-primary/50 flex items-center justify-center overflow-hidden"
            >
              <img 
                src={player.avatar} 
                alt={player.nickname} 
                className="w-full h-full object-cover" 
              />
            </div>
          ))}

          {/* 2. Burbuja de extra (+X) */}
          {extraCount > 0 && (
            <div className="w-7 h-7 rounded-full bg-muted/50 border-2 border-border flex items-center justify-center">
              <span className="text-xs text-white">+{extraCount}</span>
            </div>
          )}

          {/* 3. Contador de texto (Sincronizado con la lista limpia) */}
          {/* Lo movemos dentro para aprovechar la variable totalUnique */}
          <span className="text-white font-medium text-sm ml-3">
            {totalUnique}/{maxPlayers} en sala
          </span>
        </>
      );
    })()}
  </div>
</div>
            {playersExpanded ? (
              <ChevronUp className="w-5 h-5 text-white/70" />
            ) : (
              <ChevronDown className="w-5 h-5 text-white/70" />
            )}
          </button>
          
          {/* Expanded Players Grid Mobile */}
          {playersExpanded && (
            <div className={cn("backdrop-blur-xl bg-card/80 rounded-xl border border-border p-3 max-h-[40vh] overflow-y-auto")}>
              <div className="grid grid-cols-5 gap-2">
                {(() => {
                  const uniquePlayers = Array.from(new Map(players.map(p => [p.id, p])).values());
                  const emptySlots = Math.max(0, maxPlayers - uniquePlayers.length);

                  return (
                    <>
                      {uniquePlayers.map((player) => (
                        <div key={player.id} className="flex flex-col items-center gap-1">
                          <div
                            className={`relative w-12 h-12 rounded-full flex items-center justify-center overflow-hidden ${
                              player.isHost
                                ? "bg-primary/20 border-2 border-primary shadow-[0_0_10px_rgba(74,222,128,0.3)]"
                                : "bg-[#1a1a2e] border-2 border-border"
                            }`}
                          >
                            <img 
                              src={player.avatar} 
                              alt={player.nickname} 
                              className="w-full h-full object-cover" 
                            />
                            {player.isHost && (
                              <Crown className="absolute -top-1 -right-1 w-4 h-4 text-yellow-500 z-10" />
                            )}
                          </div>
                          <span className="text-[10px] text-white truncate w-full text-center">{player.nickname}</span>
                        </div>
                      ))}

                      {Array.from({ length: emptySlots }).map((_, i) => (
                        <div key={`empty-mobile-${i}`} className="flex flex-col items-center gap-1">
                          <div className="w-12 h-12 rounded-full border-2 border-dashed border-border/50 flex items-center justify-center">
                            <User className="w-5 h-5 text-muted-foreground/30" />
                          </div>
                          <span className="text-[10px] text-muted-foreground/50">Vacio</span>
                        </div>
                      ))}
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div> {/* ESTE CIERRA LA SECCIÓN MÓVIL (lg:hidden) */}

        {/* Desktop: Sidebar - Players */}
        <aside className="hidden lg:flex w-[280px] xl:w-[320px] backdrop-blur-xl bg-card/80 rounded-2xl border border-border p-4 flex-col flex-none">
          {/* Header with Player Count Selector (solo Host puede ajustar) */}
          <div className="mb-4">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              JUGADORES
            </h2>
            
            {/* Player Count Stepper */}
            <div className={cn("flex items-center justify-between rounded-xl p-3 border", gameState !== "lobby" ? "bg-muted/20 border-border/50" : "bg-muted/30 border-border")}>
              <span className="text-sm text-muted-foreground">Maximo:</span>
              {isHost ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={decrementPlayers}
                    disabled={maxPlayers <= 3 || gameState !== "lobby"}
                    className="w-9 h-9 rounded-lg bg-muted/50 border border-border flex items-center justify-center text-white hover:bg-muted/70 hover:border-primary/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className={cn("w-14 h-10 rounded-lg flex items-center justify-center", gameState !== "lobby" ? "bg-muted/30 border-2 border-border" : "bg-primary/20 border-2 border-primary")}>
                    <span className={cn("text-xl font-bold", gameState !== "lobby" ? "text-muted-foreground" : "text-primary")}>{maxPlayers}</span>
                  </div>
                  <button
                    type="button"
                    onClick={incrementPlayers}
                    disabled={maxPlayers >= 10 || gameState !== "lobby"}
                    className="w-9 h-9 rounded-lg bg-muted/50 border border-border flex items-center justify-center text-white hover:bg-muted/70 hover:border-primary/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="w-14 h-10 rounded-lg flex items-center justify-center bg-muted/30 border-2 border-border">
                  <span className="text-xl font-bold text-muted-foreground">{maxPlayers}</span>
                </div>
              )}
            </div>
            {gameState !== "lobby" && isHost && (
              <p className="text-xs text-muted-foreground mt-2 text-center">Bloqueado durante la partida</p>
            )}
            
            {/* Progress indicator */}
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">En sala:</span>
              <span className="font-bold text-primary">
    {Array.from(new Map(players.map(p => [p.id, p])).values()).length}/{maxPlayers}
  </span>
            </div>
            <div className="mt-1 h-2 bg-muted/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${(Array.from(new Map(players.map(p => [p.id, p])).values()).length / maxPlayers) * 100}%` }}
  />
            </div>
          </div>
          
          {/* Players List */}
          {/* Players List */}
<div className="flex-1 min-h-0 max-h-[40vh] overflow-y-auto space-y-2 pr-2 scrollbar-thin">
  {/* 1. Definimos la lista de jugadores únicos una sola vez */}
  {(() => {
    const uniquePlayers = Array.from(new Map(players.map(p => [p.id, p])).values());
    const emptySlots = maxPlayers - uniquePlayers.length;

    return (
      <>
        {/* Renderizado de jugadores reales (Sin duplicados) */}
        {uniquePlayers.map((player) => (
          <div
            key={player.id}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl transition-all",
              player.isHost ? "bg-primary/10 border border-primary/30" : "bg-muted/50 border border-border"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center overflow-hidden",
              player.isHost ? "bg-primary/20 border-2 border-primary" : "bg-[#1a1a2e] border border-border"
            )}>
              <img src={player.avatar} alt={player.nickname} className="w-full h-full object-cover" />
            </div>
            <span className="text-white font-medium flex-1 truncate">{player.nickname}</span>
            {player.isHost && <Crown className="w-5 h-5 text-yellow-500" />}
          </div>
        ))}

        {/* 2. Renderizado de espacios vacíos basado en la lista ÚNICA */}
        {Array.from({ length: Math.max(0, emptySlots) }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-border/50"
          >
            <div className="w-10 h-10 rounded-full bg-muted/20 flex items-center justify-center">
              <User className="w-5 h-5 text-muted-foreground/30" />
            </div>
            <span className="text-muted-foreground/50 font-medium">Esperando...</span>
          </div>
        ))}
      </>
    );
  })()}
</div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-h-0 gap-3 overflow-hidden">
          
          {/* Lobby State: Game Mode Selection */}
          {gameState === "lobby" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3">
              <button
                type="button"
                className="p-3 md:p-4 rounded-xl text-center font-semibold uppercase tracking-wider transition-all text-xs md:text-sm bg-primary/20 border-2 border-primary shadow-[0_0_20px_rgba(74,222,128,0.3)] text-white"
              >
                JUEGO IMPOSTOR
              </button>
              <button
                type="button"
                disabled
                className="p-3 md:p-4 rounded-xl text-center font-semibold uppercase tracking-wider transition-all text-xs md:text-sm bg-muted/30 border border-border/30 text-muted-foreground/50 cursor-not-allowed"
              >
                NUEVO JUEGO PRONTO
              </button>
              <button
                type="button"
                disabled
                className="p-3 md:p-4 rounded-xl text-center font-semibold uppercase tracking-wider transition-all text-xs md:text-sm bg-muted/30 border border-border/30 text-muted-foreground/50 cursor-not-allowed"
              >
                NUEVO JUEGO PRONTO
              </button>
            </div>
          )}

          {/* Playing/Voting State: Game Header */}
          {(gameState === "playing" || gameState === "voting" || gameState === "results") && (
            <div className="backdrop-blur-xl bg-card/80 rounded-xl md:rounded-2xl border border-border p-4 md:p-6">
              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
                {/* Circular Timer */}
                <div className="relative w-24 h-24 md:w-32 md:h-32 shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-muted/30"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${(timeRemaining / getFinalTime()) * 283} 283`}
                      className={`transition-all duration-1000 ${getTimerColor()}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-2xl md:text-3xl font-bold ${getTimerColor()}`}>
                      {formatTime(timeRemaining)}
                    </span>
                  </div>
                </div>

                {/* Secret Info Card */}
                <div className="flex-1 w-full backdrop-blur-sm bg-card/50 rounded-xl border-2 border-dashed border-primary/50 p-4 md:p-6">
                  <h3 className="text-sm md:text-base font-semibold text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Informacion Secreta
                  </h3>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Image placeholder */}
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl bg-muted/30 border border-border flex items-center justify-center shrink-0">
                      <span className="text-muted-foreground text-xs text-center px-2">Imagen</span>
                    </div>
                    {/* Word */}
                    <div className="text-center sm:text-left">
                      <p className="text-sm text-muted-foreground mb-1">La palabra es:</p>
                      <p className="text-2xl md:text-3xl font-bold text-white tracking-wider">{secretWord}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Voting Grid */}
          {gameState === "voting" && (
            <div className="backdrop-blur-xl bg-card/80 rounded-xl md:rounded-2xl border border-border p-4 md:p-6">
              <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Vote className="w-5 h-5 text-primary" />
                Vota por el Impostor
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {players.filter(p => !p.isHost || players.length <= 2).map((player) => (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => handleAccuse(player.id)}
                    className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${
                      selectedVote === player.id
                        ? "bg-destructive/20 border-2 border-destructive shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                        : "bg-muted/50 border border-border hover:border-destructive/50"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      selectedVote === player.id ? "bg-destructive/30 border-2 border-destructive" : "bg-[#1a1a2e] border border-border"
                    }`}>
                      <User className={`w-6 h-6 ${selectedVote === player.id ? "text-destructive" : "text-white/70"}`} />
                    </div>
                    <span className="text-sm font-medium text-white truncate w-full text-center">{player.nickname}</span>
                    <span className={`text-xs uppercase tracking-wider ${selectedVote === player.id ? "text-destructive" : "text-muted-foreground"}`}>
                      {selectedVote === player.id ? "Acusado" : "Acusar"}
                    </span>
                  </button>
                ))}
              </div>
              {selectedVote && (
                <div className="mt-4 flex justify-center">
                  <Button
                    onClick={confirmVote}
                    className="bg-destructive hover:bg-destructive/90 text-white font-bold uppercase px-8 py-3"
                  >
                    Confirmar Voto
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Chat System */}
{/* 1. Contenedor con altura fija para forzar el scroll interno */}
<div className="flex-1 min-h-0 flex flex-col backdrop-blur-xl bg-white/95 rounded-xl md:rounded-2xl border border-border overflow-hidden shadow-lg">  
  {/* 2. Contenedor de mensajes con scroll obligatorio */}
  <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 md:space-y-3 scrollbar-thin scrollbar-thumb-gray-300">
    {chatMessages.map((msg) => (
      <div key={msg.id} className={msg.isSystem ? "text-center text-gray-500 text-xs italic" : "text-left"}>
        {msg.isSystem ? (
          <span>BOT: {msg.message}</span>
        ) : (
          <div className="text-sm md:text-base">
            <span className="font-bold text-primary">{msg.sender}: </span>
            <span className="text-gray-800">{msg.message}</span>
          </div>
        )}
      </div>
    ))}
    <div ref={chatEndRef} className="h-1" />
  </div>
            {/* Chat Input */}
            <div className="flex-none p-2 md:p-3 border-t border-gray-200 flex gap-2 bg-white">
            <Input
      value={newMessage}
      onChange={(e) => setNewMessage(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && sendMessage()}
      placeholder="MENSAJE..."
      className="flex-1 bg-gray-100 border-gray-200 text-gray-800 h-10 md:h-11"
    />
    <Button onClick={sendMessage} size="sm" className="bg-primary hover:bg-primary/90 h-10 md:h-11 px-4">
      <Send className="w-4 h-4" />
    </Button>
  </div>
</div>
        </main>
      </div>

      {/* Bottom Action Bar */}
      <footer className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 p-3 md:p-4 border-t border-border/50">
        <div className="relative flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={copyRoomCode}
            className={cn("w-full sm:w-auto bg-transparent border-2 border-border text-white hover:bg-white/10 gap-2 px-4 md:px-6 h-10 md:h-11", !roomCode && "opacity-50 pointer-events-none")}
          >
            <Link2 className="w-4 h-4" />
            CODIGO: {roomCode || "—"}
          </Button>
          {copiedToast && (
            <span className={cn("absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground shadow-lg whitespace-nowrap animate-in fade-in duration-200")}>
              ¡Copiado!
            </span>
          )}
        </div>
        {gameState === "lobby" && isHost && (
          <Button
            onClick={handleStartGame}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase px-6 md:px-8 py-4 md:py-6 text-base md:text-lg gap-2 rounded-full shadow-lg shadow-primary/30"
          >
            <Play className="w-4 h-4 md:w-5 md:h-5" />
            INICIAR PARTIDA
          </Button>
        )}
        {gameState !== "lobby" && isHost && (
          <Button
            onClick={endGame}
            variant="outline"
            className="w-full sm:w-auto bg-transparent border-2 border-yellow-500 text-yellow-500 hover:bg-yellow-500/10 font-bold uppercase px-6 md:px-8 py-4 md:py-6 text-base md:text-lg gap-2 rounded-full"
          >
            <StopCircle className="w-4 h-4 md:w-5 md:h-5" />
            TERMINAR PARTIDA
          </Button>
        )}
      </footer>

      {/* Game Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="backdrop-blur-xl bg-card/95 rounded-2xl border border-border p-5 md:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl md:text-2xl font-bold text-white uppercase tracking-wider text-center mb-6">
              CONFIGURAR PARTIDA
            </h3>
            
            {/* Time Section */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-primary" />
                <h4 className="text-base md:text-lg font-semibold text-white uppercase tracking-wider">
                  Tiempo por Ronda
                </h4>
              </div>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {timeOptions.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => handleTimeSelect(time)}
                    className={`p-3 rounded-xl font-bold text-sm md:text-base transition-all ${
                      !isCustomTime && selectedTime === time
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                        : "bg-muted/50 text-white hover:bg-muted/70 border border-border"
                    }`}
                  >
                    {time}s
                  </button>
                ))}
              </div>
              
              {/* Custom Time Input */}
              <div className="bg-muted/20 rounded-xl p-4 border border-border">
                <label className="block text-sm text-muted-foreground mb-3 text-center font-medium">
                  Personalizado (min. 10s)
                </label>
                <div className="flex items-center gap-3 justify-center">
                  <Input
                    type="text"
                    value={customTime}
                    onChange={(e) => handleCustomTimeChange(e.target.value)}
                    placeholder="45"
                    className={`w-24 bg-muted/50 border text-white placeholder:text-muted-foreground text-center text-xl font-bold h-12 ${
                      isCustomTime && customTime
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-border"
                    }`}
                  />
                  <span className="text-white font-medium">segundos</span>
                </div>
                {isCustomTime && customTime && parseInt(customTime) < 10 && (
                  <p className="text-destructive text-xs mt-3 text-center">
                    El tiempo minimo es 10 segundos
                  </p>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-primary/10 rounded-xl p-4 mb-6 border border-primary/30">
              <div className="flex justify-between items-center text-white">
                <span className="text-muted-foreground">Jugadores:</span>
                <span className="font-bold text-primary text-lg">{maxPlayers}</span>
              </div>
              <div className="flex justify-between items-center text-white mt-2">
                <span className="text-muted-foreground">Tiempo:</span>
                <span className="font-bold text-primary text-lg">{getFinalTime()}s</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowSettingsModal(false)}
                className="flex-1 bg-transparent border-border text-white hover:bg-white/10 h-12"
              >
                CANCELAR
              </Button>
              <Button
                onClick={confirmStartGame}
                disabled={isCustomTime && (!customTime || parseInt(customTime) < 10)}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                INICIAR
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Time Up Modal */}
      {showTimeUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="backdrop-blur-xl bg-card/95 rounded-2xl border border-border p-6 md:p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <Clock className="w-8 h-8 md:w-10 md:h-10 text-yellow-500" />
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-wider mb-2">
              Tiempo Terminado
            </h3>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Que decide la mayoria?
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleMoreDebate}
                variant="outline"
                className="flex-1 bg-transparent border-2 border-border text-white hover:bg-white/10 h-14 text-lg font-bold uppercase gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Mas Debate
              </Button>
              <Button
                onClick={handleVoteNow}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-14 text-lg uppercase gap-2"
              >
                <Vote className="w-5 h-5" />
                Votar Ahora
              </Button>
            </div>
          </div>
        </div>
      )}

{showCountdown && (
        <MatchCountdownEffect 
          onComplete={() => {
            setShowCountdown(false);
            setGameState("playing");
            const finalTime = isCustomTime ? parseInt(customTime) || 60 : selectedTime;
            setTimeRemaining(finalTime);
          }} 
        />
      )}
    </div> // Cierra el div principal del return
  );
} // <--- ESTA LLAVE DEBE SER LA ÚNICA QUE CIERRA SalaPage

function MatchCountdownEffect({ onComplete }: { onComplete: () => void }) {
  const [count, setCount] = useState(3);

  useEffect(() => {
    const playSound = (freq: number) => {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } catch (e) { console.log("Audio no disponible"); }
    };

    if (count > 0) {
      playSound(440);
      // VIBRACIÓN CORTA (50ms) para el 3, 2, 1
      if ("vibrate" in navigator) navigator.vibrate(50);
      
      const timer = setTimeout(() => setCount(count - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      playSound(880);
      // VIBRACIÓN LARGA (200ms) para el inicio de partida
      if ("vibrate" in navigator) navigator.vibrate(200);
      
      const timer = setTimeout(onComplete, 1000);
      return () => clearTimeout(timer);
    }
  }, [count, onComplete]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-xl">
      <div className={cn(
        "relative flex flex-col items-center",
        count === 0 && "animate-shake" // <--- LA PANTALLA VIBRA VISUALMENTE AQUÍ
      )}>
        <div className="w-48 h-48 rotate-45 border-4 border-primary bg-[#1a1a2e] flex items-center justify-center shadow-[0_0_60px_rgba(74,222,128,0.6)]">
          <span className="text-8xl font-black text-white -rotate-45 drop-shadow-2xl">
            {count > 0 ? count : "!"}
          </span>
        </div>
        <h2 className="mt-12 text-2xl font-black text-white tracking-[0.4em] uppercase">
          {count > 0 ? "Preparados" : "¡YA!"}
        </h2>
      </div>
    </div>
  );
}