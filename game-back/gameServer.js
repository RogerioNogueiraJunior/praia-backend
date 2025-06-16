import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { join, dirname} from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);  
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const game = io.of("/game");
const chat = io.of("/chat");


app.use(express.static(join(__dirname, "src", "public")));
app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

const players = {};

const chatMessages = [];

game.on("connection", (socket) => {
  players[socket.id] = { id: socket.id, x: 400, y: 400 };
  socket.emit("currentPlayers", players);
  socket.broadcast.emit("spawnPlayer", { id: socket.id, x: 400, y: 400 });
  socket.emit("spawnPlayer", { id: socket.id, x: 400, y: 400 });

  socket.on("playerMovement", (data) => {
    if (players[socket.id]) {
      players[socket.id].x = data.x;
      players[socket.id].y = data.y;
      players[socket.id].anim = data.anim;
      socket.broadcast.emit("playerMoved", { id: socket.id, x: data.x, y: data.y, anim: data.anim });
    }
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    game.emit("removePlayer", { id: socket.id });
  });
});

chat.on("connection", (socket) => {
  // Envie todas as mensagens anteriores para o novo usuário
  socket.emit('previousMessages', chatMessages);

  socket.on('chat message', (msg) => {
    const messageObj = { id: socket.id, msg };
    chatMessages.push(messageObj);
    (chatMessages.length > 100) 
    chatMessages.shift();// Salva no array global
    chat.emit('chat message', messageObj); // Envia para todos
  });
});

httpServer.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});