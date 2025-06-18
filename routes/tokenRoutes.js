import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();
const SECRET = 'segredo_super_secreto';

// Rota para transportar o token JWT para o frontend usar no WebSocket


router.get('/transportar-token', (req, res) => {
  const token = req.query.token;

  if (!token) {
    return res.status(400).json({ error: 'Token não fornecido.' });
  }

  try {
    const decoded = jwt.verify(token, SECRET); // decodifica e verifica o token
    return res.json({ token, user: decoded.nome });
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido.' });
  }
});


export default router;