import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import {
  inserirUsuarioDB,
  buscarUsuarioPorEmail,
  atualizarNomeUsuario
} from '../models/userModel.js';
import { json } from 'sequelize';

const SECRET = 'segredo_super_secreto'; // Use uma chave secreta forte e única

export async function inserirUsuario(req, res) {
  const { email, senha, nome, roomId } = req.body;
  if (!email || !senha) return res.status(400).json({ success: false, error: 'Email e senha obrigatórios' });

  try {
    const hash = await bcrypt.hash(senha, 10);
    // Agora aceita nome e roomId (opcional)
    const user = await inserirUsuarioDB(email, hash, nome, roomId);
    res.json({ success: true, user });
  } catch (err) {
    console.error('Erro ao inserir:', err);
    if (err.code === '23505') return res.status(400).json({ success: false, error: 'Email já cadastrado' });
    res.status(500).json({ success: false, error: 'Erro ao inserir no banco' });
  }
}

export async function loginUsuario(req, res) {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ success: false, error: 'Email e senha obrigatórios' });

  try {
    const user = await buscarUsuarioPorEmail(email);
    if (!user || !(await bcrypt.compare(senha, user.senha))) {
      return res.status(401).json({ success: false, error: 'Email ou senha inválidos' });
    }
    // Inclui roomId no payload e resposta
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        nome: user.nome,
        roomId: user.roomId,
        iat: Math.floor(Date.now() / 1000) // issued at timestamp
      },
      SECRET,
      { expiresIn: '1h' }
    );
    // Retorna o usuário sem a senha
    res.json({
      success: true,
      user: { id: user.id, nome: user.nome, email: user.email, roomId: user.roomId },
      token
    });
    return json({ success: true, user, token });
  } catch (err) {
    console.error('Erro ao fazer login:', err);
    res.status(500).json({ success: false, error: 'Erro interno no servidor' });
  }
}

export async function mudarNomeUsuario(req, res) {
  const { email, name } = req.body;
  if (!email || !name) {
    return res.status(400).json({ success: false, error: 'Email e nome obrigatórios' });
  }

  try {
    const user = await atualizarNomeUsuario(email, name);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
    }
    res.json({ success: true, user });
  } catch (err) {
    console.error('Erro ao mudar nome:', err);
    res.status(500).json({ success: false, error: 'Erro interno no servidor' });
  }
}