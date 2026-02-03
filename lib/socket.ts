import { io } from "socket.io-client";

// Usamos el puerto 3000 que es el que vi en tu código de Node.js
const URL = "https://juego-impostor-backend-v2.onrender.com";

export const socket = io(URL, {
  autoConnect: false, // Importante: No conectar hasta que el usuario elija Nick y Avatar
});