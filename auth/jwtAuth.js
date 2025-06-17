import jwt from 'jsonwebtoken';

export function jwtAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Token não fornecido' });
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, 'sua_chave_secreta');
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
  }
}