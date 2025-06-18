import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { deleteRoomById } from '../models/roomModel.js';
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

const playersByRoom = {};// { salaId: { nome: playerData } }

game.on("connection", (socket) => {
  let salaId = null;
  let nome = null;

  socket.on("joinRoom", ({ salaId: sala, nome: playerName }) => {
    salaId = sala;
    nome = playerName;
    socket.join(salaId);
    socket.user = { nome: playerName, salaId: salaId }; // Armazena o nome e sala no socket
    if (!playersByRoom[salaId]) playersByRoom[salaId] = {};

    const existingPlayer = playersByRoom[salaId][nome];

    playersByRoom[salaId][nome] = {
      socketId: socket.id,
      x: existingPlayer ? existingPlayer.x : 400,
      y: existingPlayer ? existingPlayer.y : 400,
      nome: nome
    };

    // Envia os players já existentes para o novo player
    socket.emit("currentPlayers", playersByRoom[salaId]);

    // Notifica os outros players sobre o novo
    socket.to(salaId).emit("spawnPlayer", {
      nome: nome,
      x: playersByRoom[salaId][nome].x,
      y: playersByRoom[salaId][nome].y
    });
  });

  socket.on("playerMovement", (data) => {
    if (salaId && nome && playersByRoom[salaId][nome]) {
      playersByRoom[salaId][nome].x = data.x;
      playersByRoom[salaId][nome].y = data.y;
      playersByRoom[salaId][nome].anim = data.anim;
      socket.to(salaId).emit("playerMoved", {
        nome: nome,
        x: data.x,
        y: data.y,
        anim: data.anim
      });
    }
  });

  socket.on("disconnect", async () => {
    if (salaId && nome && playersByRoom[salaId]) {
      delete playersByRoom[salaId][nome];
      socket.to(salaId).emit("removePlayer", { nome: nome });

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
  let nome = null;
  socket.on('joinRoom', ({ salaId, }) => {
    socket.join(salaId);
    if (!chatMessagesByRoom[salaId]) chatMessagesByRoom[salaId] = [];
    socket.emit('previousMessages', chatMessagesByRoom[salaId]);
  });

  socket.on('chat message', ({ salaId, msg, nome: nome}) => {
    if (!chatMessagesByRoom[salaId]) chatMessagesByRoom[salaId] = [];

    const message = {
      nome: nome,
      user: socket.user.nome || 'Anônimo' ,
      msg
    };

    chatMessagesByRoom[salaId].push(message);
    chat.to(salaId).emit('chat message', message);
  });
});

httpServer.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});

async function apagarSalaDoBanco(salaId) {
  try {
    await deleteRoomById(Number(salaId));
    console.log(`Sala ${salaId} removida do banco de dados.`);
  } catch (err) {
    console.error("Erro ao apagar sala:", err);
  }
}
