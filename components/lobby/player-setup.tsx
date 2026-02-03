"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { socket } from "@/lib/socket";

// Pre-loaded avatar images - replace these paths with actual uploaded images
const avatarImages = [
  "/avatars/detective-1.png",
  "/avatars/detective-2.png",
  "/avatars/detective-3.png",
  "/avatars/detective-4.png",
  "/avatars/detective-5.png",
  "/avatars/detective-6.png",
];

export function PlayerSetup() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"anonymous" | "registered">("anonymous");
  const [currentAvatarIndex, setCurrentAvatarIndex] = useState(0);
  const [errorNick, setErrorNick] = useState(false); // Error de apodo vacío
const [errorRoom, setErrorRoom] = useState("");    // Mensaje de "Sala no existe"
const [isShaking, setIsShaking] = useState(false); // Efecto visual de vibración

  const SALA_JOIN_KEY = "sala_join";

  useEffect(() => {
    // 1. Manejo cuando creas una sala
    const onRoomCreated = (code: string) => {
      try {
        const stored = sessionStorage.getItem(SALA_JOIN_KEY);
        const data = stored ? JSON.parse(stored) : {};
        sessionStorage.setItem(SALA_JOIN_KEY, JSON.stringify({ ...data, roomCode: code }));
      } catch (_) {}
      router.push(`/sala?code=${code}`);
    };
  
    // 2. Manejo cuando te unes con éxito (Persistencia F5)
    const onJoinSuccess = (code: string) => {
      try {
        const payload = { 
          roomCode: code, 
          nickname: nickname.trim(), 
          avatar: avatarImages[currentAvatarIndex] 
        };
        sessionStorage.setItem(SALA_JOIN_KEY, JSON.stringify(payload));
      } catch (_) {}
      router.push(`/sala?code=${code}`);
    };
  
    // 3. Manejo de error cuando el código no existe
    const onJoinError = (msg: string) => {
      console.log("MENSAJE RECIBIDO DEL SERVER:", msg); // <--- ESTO ES CLAVE
      setErrorRoom(msg); // Muestra "ESTA SALA NO EXISTE..."
      setIsShaking(true); // Hace vibrar el modal
      setTimeout(() => setIsShaking(false), 500);
    };
  
    // Suscripciones
    socket.on("room_created", onRoomCreated);
    socket.on("join_room_success", onJoinSuccess);
    socket.on("join_room_error", onJoinError);
  
    return () => {
      socket.off("room_created", onRoomCreated);
      socket.off("join_room_success", onJoinSuccess);
      socket.off("join_room_error", onJoinError);
    };
  }, [router, nickname, currentAvatarIndex]); // Dependencias necesarias para no guardar datos vacíos

  const handleCreateRoom = () => {
    if (!nickname.trim()) {
      setErrorNick(true);
      setIsShaking(true);
      setTimeout(() => {
        setErrorNick(false);
        setIsShaking(false);
      }, 3000); // El mensaje desaparece en 3 seg
      return;
    }
    const avatar = avatarImages[currentAvatarIndex];
    const nick = nickname.trim();
    try {
      sessionStorage.setItem(SALA_JOIN_KEY, JSON.stringify({ roomCode: "", nickname: nick, avatar }));
    } catch (_) {}
    socket.connect();
    socket.emit("create_room", { nickname: nick, avatar });
  };

  const handleOpenJoinModal = () => setShowJoinModal(true);
  const handleCloseJoinModal = () => setShowJoinModal(false);

  const handleConfirmJoinRoom = () => {
    const nick = nickname.trim();
    const code = roomCode.trim().toUpperCase();
    const avatar = avatarImages[currentAvatarIndex];
  
    // 1. Validaciones locales
    if (!nick) {
      setErrorNick(true);
      setIsShaking(true);
      handleCloseJoinModal();
      return;
    }
  
    if (code.length !== 5) {
      setErrorRoom("EL CÓDIGO TIENE 5 DÍGITOS");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }
  
    const payload = { roomCode: code, nickname: nick, avatar };
  
    // 2. Definición del envío y la escucha de respuesta
    const emitJoin = () => {
      console.log("Intentando unirse a:", code); // Log de control
      
      // Limpiamos errores previos antes de intentar
      setErrorRoom("");
  
      // ESCUCHA CRUCIAL: Si el servidor dice que no existe
      socket.once("join_room_error", (msg) => {
        console.log("Error recibido del server:", msg); // Log de control
        setErrorRoom(msg); 
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
      });
  
      socket.emit("join_room", payload);
    };
  
    // 3. Ejecución de la conexión
    if (socket.connected) {
      emitJoin();
    } else {
      console.log("Socket desconectado, conectando..."); // Log de control
      socket.connect();
      socket.once("connect", emitJoin);
    }
  };

  const cycleAvatar = () => {
    setCurrentAvatarIndex((prev) => (prev + 1) % avatarImages.length);
  };

  return (
    <div className="backdrop-blur-xl bg-card rounded-2xl border border-border p-6 md:p-8 w-full max-w-sm">
      {/* Tab Buttons */}
      <div className="flex justify-center gap-2 mb-8">
        <button
          type="button"
          onClick={() => setActiveTab("anonymous")}
          className={`px-5 py-2.5 rounded-full text-sm font-semibold tracking-wider transition-all ${
            activeTab === "anonymous"
              ? "bg-white text-black"
              : "bg-transparent border border-border text-white/70 hover:text-white"
          }`}
        >
          ANÓNIMO
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("registered")}
          className={`px-5 py-2.5 rounded-full text-sm font-semibold tracking-wider transition-all ${
            activeTab === "registered"
              ? "bg-white text-black"
              : "bg-transparent border border-border text-white/70 hover:text-white"
          }`}
        >
          REGISTRADO
        </button>
      </div>

      {activeTab === "anonymous" ? (
        <>
          {/* Avatar Section - Cyclic avatar selection */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              {/* Outer glow ring */}
              <div className="w-40 h-40 rounded-full bg-gradient-to-b from-primary/30 to-primary/10 p-1 shadow-[0_0_30px_rgba(74,222,128,0.3)]">
                {/* Inner circle with avatar image */}
                <div className="w-full h-full rounded-full bg-[#1a1a2e] border-2 border-primary flex items-center justify-center overflow-hidden">
                  {/* Avatar placeholder - shows silhouette until images are uploaded */}
                  <div className="relative w-full h-full flex items-center justify-center">
                    {/* Placeholder detective silhouette SVG - will be replaced by actual images */}
                    <img
  src={avatarImages[currentAvatarIndex]}
  alt={`Avatar ${currentAvatarIndex + 1}`}
  className="w-full h-full object-cover"
/>
                    {/* Avatar index indicator */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-primary/60">
                      {currentAvatarIndex + 1}/{avatarImages.length}
                    </div>
                  </div>
                </div>
              </div>
              {/* Cycle avatar button */}
              <button
                type="button"
                onClick={cycleAvatar}
                className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-[#2a2a4e] border border-border flex items-center justify-center hover:bg-[#3a3a5e] hover:border-primary/50 transition-all group"
                aria-label="Cambiar avatar"
              >
                <RefreshCw className="w-4 h-4 text-white/70 group-hover:text-primary transition-colors" />
              </button>
            </div>
          </div>

          {/* Nickname Input */}
          <div className={`mb-6 transition-all ${isShaking ? "animate-shake" : ""}`}>
  <label htmlFor="nickname" className="block text-sm font-semibold text-white uppercase tracking-wider mb-3">
    ELIGE UN APODO
  </label>
            <Input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Escribe un apodo"
              className="w-full h-12 bg-input border-border text-white placeholder:text-muted-foreground rounded-lg px-4 focus:ring-2 focus:ring-primary focus:border-transparent"
              maxLength={20}
            />
            {/* Mensaje de error debajo del input */}
  {errorNick && (
    <p className="text-destructive text-xs mt-2 font-bold animate-pulse flex items-center gap-1">
      <span className="w-1.5 h-1.5 bg-destructive rounded-full" />
      ¡INGRESA UN APODO PRIMERO!
    </p>
  )}
          </div>

          {/* Create Room Button */}
          <Button 
            onClick={handleCreateRoom}
            className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg uppercase tracking-wider rounded-full shadow-lg transition-all active:translate-y-0.5"
          >
            CREAR SALA
          </Button>

          {/* Join Room Button - abre modal */}
          <Button
            variant="outline"
            onClick={handleOpenJoinModal}
            className="w-full h-12 mt-4 bg-transparent border-2 border-primary/50 text-primary hover:bg-primary/10 font-semibold text-sm uppercase tracking-wider rounded-full transition-all"
          >
            UNIRSE A SALA
          </Button>

          {/* Modal neón para unirse a sala */}
{showJoinModal && (
  /* Este div es el fondo oscuro de toda la pantalla */
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
    <div className={`backdrop-blur-xl bg-card rounded-2xl border border-primary/50 p-6 md:p-8 w-full max-w-sm shadow-[0_0_30px_rgba(74,222,128,0.2)] transition-all ${
      isShaking ? "animate-shake" : ""
    }`}>
      
      <h3 className="text-lg font-bold text-white uppercase tracking-wider text-center mb-6">
        Código de sala
      </h3>
                <div className="mb-6">
  <label
    htmlFor="modal-roomCode"
    className="block text-sm font-semibold text-white uppercase tracking-wider mb-3"
  >
    CÓDIGO DE SALA
  </label>
  <Input
    id="modal-roomCode"
    type="text"
    value={roomCode}
    placeholder="Ej: ABC12"
    maxLength={5}
    className={`w-full h-12 bg-input text-white rounded-lg px-4 uppercase transition-all ${
      errorRoom 
        ? "border-destructive ring-1 ring-destructive shadow-[0_0_10px_rgba(239,68,68,0.3)]" 
        : "border-border focus:ring-primary"
    }`}
    onChange={(e) => {
      setRoomCode(e.target.value.toUpperCase());
      if (errorRoom) setErrorRoom(""); // Limpia el mensaje apenas el usuario vuelve a escribir
    }}
  />
  {errorRoom && (
    <p className="text-destructive text-xs mt-2 font-bold text-center italic animate-pulse">
      {errorRoom}
    </p>
  )}
</div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleCloseJoinModal}
                    className="flex-1 bg-transparent border-border text-white hover:bg-white/10 h-12 rounded-full"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleConfirmJoinRoom}
                    disabled={!roomCode.trim()}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Confirmar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Registered Tab Content - Same avatar design with cycle button */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              {/* Outer glow ring */}
              <div className="w-40 h-40 rounded-full bg-gradient-to-b from-primary/30 to-primary/10 p-1 shadow-[0_0_30px_rgba(74,222,128,0.3)]">
                {/* Inner circle with avatar image */}
                <div className="w-full h-full rounded-full bg-[#1a1a2e] border-2 border-primary flex items-center justify-center overflow-hidden">
                  {/* Avatar placeholder - shows silhouette until images are uploaded */}
                  <div className="relative w-full h-full flex items-center justify-center">
                    {/* Placeholder detective silhouette SVG - will be replaced by actual images */}
                    <img
  src={avatarImages[currentAvatarIndex]}
  alt={`Avatar ${currentAvatarIndex + 1}`}
  className="w-full h-full object-cover"
/>
                    {/* Avatar index indicator */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-primary/60">
                      {currentAvatarIndex + 1}/{avatarImages.length}
                    </div>
                  </div>
                </div>
              </div>
              {/* Cycle avatar button */}
              <button
                type="button"
                onClick={cycleAvatar}
                className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-[#2a2a4e] border border-border flex items-center justify-center hover:bg-[#3a3a5e] hover:border-primary/50 transition-all group"
                aria-label="Cambiar avatar"
              >
                <RefreshCw className="w-4 h-4 text-white/70 group-hover:text-primary transition-colors" />
              </button>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-center text-sm font-semibold text-white uppercase tracking-wider mb-6">
            Escoge un personaje e inicia sesión
          </h3>

          {/* Divider */}
          <div className="w-full flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Inicia sesión con</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Social Login Buttons */}
          <div className="w-full space-y-3">
            {/* Google Login */}
            <button
              type="button"
              className="w-full h-12 bg-white hover:bg-gray-100 text-gray-800 font-semibold rounded-full flex items-center justify-center gap-3 transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continuar con Google
            </button>

            {/* Discord Login */}
            <button
              type="button"
              className="w-full h-12 bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold rounded-full flex items-center justify-center gap-3 transition-all"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              Continuar con Discord
            </button>
          </div>
        </>
      )}
    </div>
  );
}
