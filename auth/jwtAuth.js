import jwt from 'jsonwebtoken';

const SECRET = 'segredo_super_secreto'; // Use a chave igual à do userController.js

export function jwtAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, error: 'Token não fornecido' });
  }
  jwt.verify(token, SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
}

// Para uso no Socket.IO
export function autenticarSocket(socket, next) {
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
