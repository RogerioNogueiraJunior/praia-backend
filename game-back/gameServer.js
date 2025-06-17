import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { join, dirname} from "path";
import { fileURLToPath } from "url";
import { deleteRoomById } from '../models/roomModel.js'; // ajuste o caminho se necessário

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);  
const app = express();

// ADICIONE O MIDDLEWARE CORS ANTES DAS ROTAS

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


app.use(express.static(join(__dirname, "src", "public", "app"))); // Serve arquivos estáticos do frontend
app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});
app.get("/roomSelect", (req, res) => {
  res.sendFile(join(__dirname, "roomSelect.html")); 
});

const chatMessagesByRoom = {}; // { salaId: [ {id, msg} ] }

const playersByRoom = {}; // { salaId: { socketId: playerData } }

game.on("connection", (socket) => {
  let salaId = null;

  socket.on("joinRoom", ({ salaId: sala }) => {
    salaId = sala;
    socket.join(salaId);

    if (!playersByRoom[salaId]) playersByRoom[salaId] = {};
    playersByRoom[salaId][socket.id] = { 
      id: socket.id,
      x: 400, // posição inicial X
      y: 400  // posição inicial Y
    };

    // Envia só os jogadores da sala
    socket.emit("currentPlayers", playersByRoom[salaId]);
    socket.to(salaId).emit("spawnPlayer", { id: socket.id, x: 400, y: 400 });
  });

  socket.on("playerMovement", (data) => {
    if (salaId && playersByRoom[salaId] && playersByRoom[salaId][socket.id]) {
      playersByRoom[salaId][socket.id].x = data.x;
      playersByRoom[salaId][socket.id].y = data.y;
      playersByRoom[salaId][socket.id].anim = data.anim;
      socket.to(salaId).emit("playerMoved", { id: socket.id, x: data.x, y: data.y, anim: data.anim });
    }
  });

  socket.on("disconnect", async () => {
    if (salaId && playersByRoom[salaId]) {
      delete playersByRoom[salaId][socket.id];
      socket.to(salaId).emit("removePlayer", { id: socket.id });

      // Se não há mais jogadores na sala, apague do sistema
      if (Object.keys(playersByRoom[salaId]).length === 0) {
        delete playersByRoom[salaId];

        // Exemplo: apagar do banco de dados
        try {
          // Substitua pelo seu método de remoção de sala
          await apagarSalaDoBanco(salaId);
        } catch (err) {
          console.error("Erro ao apagar sala:", err);
        }
      }
    }
  });
});

chat.on("connection", (socket) => {
    socket.on('joinRoom', ({ salaId }) => {
        socket.join(salaId);
        if (!chatMessagesByRoom[salaId]) chatMessagesByRoom[salaId] = [];
        socket.emit('previousMessages', chatMessagesByRoom[salaId]);
    });

    socket.on('chat message', ({ salaId, msg }) => {
        // Garante que o array existe
        if (!chatMessagesByRoom[salaId]) chatMessagesByRoom[salaId] = [];
        const message = { id: socket.id, msg };
        chatMessagesByRoom[salaId].push(message);
        chat.to(salaId).emit('chat message', message);
    });
});

httpServer.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});

// Função para apagar sala do banco
async function apagarSalaDoBanco(salaId) {
  try {
    // salaId pode ser string, garanta que seja número se necessário
    await deleteRoomById(Number(salaId));
    console.log(`Sala ${salaId} removida do banco de dados.`);
  } catch (err) {
    console.error("Erro ao apagar sala:", err);
  }
}