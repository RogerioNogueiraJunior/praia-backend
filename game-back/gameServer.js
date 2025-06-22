import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import tk from "../routes/tokenRoutes.js";
import jwt from "jsonwebtoken";
import Room from '../models/roomModel.js';  // importar model para buscar sala real

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
const adminsByRoom = {};  // { salaId: userIdAdmin }

game.on("connection", (socket) => {
  let salaId = null;
  let nome = null;
  let userId = null;

  socket.on("joinRoom", async ({ salaId: sala, nome: playerName, userId: uid }) => {
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

    // Define admin se ainda não tiver
    try {
      const salaDb = await Room.findByPk(salaId);
      if (salaDb) {
        adminsByRoom[salaId] = salaDb.creatorUserId;
      } else {
        adminsByRoom[salaId] = null;
      }
    } catch (err) {
      console.error('Erro ao buscar sala no banco:', err);
      adminsByRoom[salaId] = null;
    }

    const isAdmin = adminsByRoom[salaId] === parseInt(userId);

    socket.emit('adminStatus', {
      isAdmin: isAdmin,
      adminUserId: adminsByRoom[salaId] ? adminsByRoom[salaId].toString() : null
    });

    socket.emit("currentPlayers", playersByRoom[salaId]);

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

  socket.on('removePlayerRequest', ({ targetUserId }) => {
    if (adminsByRoom[salaId] !== parseInt(userId)) {
      socket.emit('errorMessage', 'Você não tem permissão para remover jogadores');
      return;
    }

    const targetPlayer = playersByRoom[salaId]?.[targetUserId];
    if (targetPlayer) {
      // Manda o jogador alvo desconectar
      game.to(targetPlayer.socketId).emit('forceDisconnect');

      // Remove o jogador da memória do servidor
      delete playersByRoom[salaId][targetUserId];

      // Manda para todos da sala (incluindo admin) remover o personagem no front
      game.to(salaId).emit('removePlayer', { userId: targetUserId });
    }
  });

  // Novo: cliente avisa que está saindo (ex: ao ser kickado)
  socket.on('playerLeaving', async ({ salaId: sala, userId: uid }) => {
    if (playersByRoom[sala] && playersByRoom[sala][uid]) {
      delete playersByRoom[sala][uid];
      game.to(sala).emit('removePlayer', { userId: uid });

      console.log(`Jogador ${uid} saiu da sala ${sala}`);

      if (Object.keys(playersByRoom[sala]).length === 0) {
        delete playersByRoom[sala];
        delete adminsByRoom[sala];
        try {
          await apagarSalaDoBanco(sala);
        } catch (err) {
          console.error('Erro ao apagar sala:', err);
        }
      }
    }
  });

  socket.on("disconnect", async () => {
    if (salaId && userId && playersByRoom[salaId] && playersByRoom[salaId][userId]) {
      delete playersByRoom[salaId][userId];
      game.to(salaId).emit("removePlayer", { userId: userId });

      console.log(`Jogador ${userId} desconectou da sala ${salaId}`);

      if (Object.keys(playersByRoom[salaId]).length === 0) {
        delete playersByRoom[salaId];
        delete adminsByRoom[salaId];
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

  socket.on('chat message', ({ salaId, msg,}) => {
    if (!chatMessagesByRoom[salaId]) chatMessagesByRoom[salaId] = [];

    const message = {
      nome: socket.user.nome,
      userId: socket.user.id || socket.user.userId, // id do token
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
