import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import tk from "../routes/tokenRoutes.js";
import jwt from "jsonwebtoken";

const SECRET = 'segredo_super_secreto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:8081"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

const game = io.of("/game");
const chat = io.of("/chat");

app.use('/api/token', tk);
app.use(express.static(join(__dirname, "src", "public", "app")));

app.get("/", (req, res) => res.sendFile(join(__dirname, "index.html")));
app.get("/roomSelect", (req, res) => res.sendFile(join(__dirname, "roomSelect.html")));

function autenticarSocket(socket, next) {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Token ausente"));
  try {
    const decoded = jwt.verify(token, SECRET);
    socket.user = decoded;
    next();
  } catch {
    next(new Error("Token inválido"));
  }
}

game.use(autenticarSocket);
chat.use(autenticarSocket);

const playersByRoom = {}; // { salaId: { userId: playerData } }

game.on("connection", (socket) => {
  let salaId = null;
  let nome = null;
  let userId = null;

  socket.on("joinRoom", ({ salaId: sala, nome: playerName, userId: uid }) => {
    salaId = sala;
    nome = playerName;
    userId = uid;

    socket.join(salaId);
    socket.user = { nome: playerName, salaId: salaId, userId: userId };

    if (!playersByRoom[salaId]) playersByRoom[salaId] = {};

    const existingPlayer = playersByRoom[salaId][userId];

    playersByRoom[salaId][userId] = {
      socketId: socket.id,
      x: existingPlayer ? existingPlayer.x : 400,
      y: existingPlayer ? existingPlayer.y : 400,
      nome: nome,
      userId: userId
    };

    // Envia todos os jogadores atuais da sala
    socket.emit("currentPlayers", playersByRoom[salaId]);

    // Notifica os outros que chegou um novo
    socket.to(salaId).emit("spawnPlayer", {
      userId: userId,
      nome: nome,
      x: playersByRoom[salaId][userId].x,
      y: playersByRoom[salaId][userId].y
    });
  });

  socket.on("playerMovement", (data) => {
    if (salaId && userId && playersByRoom[salaId] && playersByRoom[salaId][userId]) {
      playersByRoom[salaId][userId].x = data.x;
      playersByRoom[salaId][userId].y = data.y;
      playersByRoom[salaId][userId].anim = data.anim;

      socket.to(salaId).emit("playerMoved", {
        userId: userId,
        nome: nome,
        x: data.x,
        y: data.y,
        anim: data.anim
      });
    }
  });

  socket.on("disconnect", async () => {
    if (salaId && userId && playersByRoom[salaId] && playersByRoom[salaId][userId]) {
      delete playersByRoom[salaId][userId];
      socket.to(salaId).emit("removePlayer", { nome: nome, userId: userId });

      if (Object.keys(playersByRoom[salaId]).length === 0) {
        delete playersByRoom[salaId];
        try {
          await apagarSalaDoBanco(salaId);
        } catch (err) {
          console.error("Erro ao apagar sala:", err);
        }
      }
    }
  });
});

// ---------------- CHAT ----------------

const chatMessagesByRoom = {};

chat.on("connection", (socket) => {
  socket.on('joinRoom', ({ salaId }) => {
    socket.join(salaId);
    if (!chatMessagesByRoom[salaId]) chatMessagesByRoom[salaId] = [];
    socket.emit('previousMessages', chatMessagesByRoom[salaId]);
  });

  socket.on('chat message', ({ salaId, msg, nome }) => {
    if (!chatMessagesByRoom[salaId]) chatMessagesByRoom[salaId] = [];

    const message = {
      nome: nome,
      user: socket.user.nome || 'Anônimo',
      msg
    };

    chatMessagesByRoom[salaId].push(message);
    chat.to(salaId).emit('chat message', message);
  });
});

httpServer.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});

// Função mock de apagar sala (substitua pela sua lógica real de banco)
async function apagarSalaDoBanco(salaId) {
  console.log(`Apagando sala ${salaId} do banco...`);
  // Aqui você faz o delete no banco, se quiser
}
