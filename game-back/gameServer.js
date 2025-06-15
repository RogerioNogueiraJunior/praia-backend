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


app.use(express.static(join(__dirname, "src", "public")));
app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

const players = {};

io.on("connection", (socket) => {
  console.log("Novo cliente conectado:", socket.id);
  players[socket.id] = { id: socket.id, x: 400, y: 400 };
  // Envia para o novo cliente todos os jogadores já conectados
  socket.emit("currentPlayers", players);
  // Informa todos os outros clientes sobre o novo jogador
  socket.broadcast.emit("spawnPlayer", { id: socket.id, x: 400, y: 400 });
  // Informa o próprio cliente para criar seu personagem
  socket.emit("spawnPlayer", { id: socket.id, x: 400, y: 400 });

  // Recebe movimentação do cliente
  socket.on("playerMovement", (data) => {
    if (players[socket.id]) {
      players[socket.id].x = data.x;
      players[socket.id].y = data.y;
      players[socket.id].anim = data.anim;
      // Repassa para todos menos o próprio
      socket.broadcast.emit("playerMoved", { id: socket.id, x: data.x, y: data.y, anim: data.anim });
    }
  });

  socket.on("disconnect", () => {
    console.log("Cliente desconectado:", socket.id);
    delete players[socket.id];
    io.emit("removePlayer", { id: socket.id });
  });
});

httpServer.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});