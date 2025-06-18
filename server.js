import express from 'express';
import cors from 'cors';
import path from 'path';
import userRoutes from './routes/UserRoutes.js';
import roomRoutes from './routes/RoomRoutes.js';

import tokenTransporter from './routes/tokenRoutes.js';




const app = express();
const port = 8081;
// Caminho do front-end vindo da variável de ambiente ou valor padrão
const publicPath = process.env.FRONTEND_PATH || 'public';

app.use(express.json());
app.use('/api', tokenTransporter);
// Configurações básicas
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:8081"], // coloque as portas que você usa no frontend
  credentials: true
}));
app.use(express.json());

// Serve arquivos estáticos do frontend
app.use(express.static(publicPath));
app.use('/imagens', express.static(path.join(publicPath, '/public', '/imagens')));

// Rotas para páginas específicas
app.get('/login', (req, res) => res.sendFile(path.join(publicPath, 'app/login/login.html')));
app.get('/signin', (req, res) => res.sendFile(path.join(publicPath, 'app/signin/signin.html')));
app.get('/about', (req, res) => res.sendFile(path.join(publicPath, 'app/about/about.html')));
app.get('/', (req, res) => res.sendFile(path.join(publicPath, 'app/index.html')));

// Rotas da API
app.use('/api', userRoutes);
app.use('/api/room', roomRoutes);

// Inicialização do servidor
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
  console.log(`Frontend files served from: ${publicPath}`);
});
