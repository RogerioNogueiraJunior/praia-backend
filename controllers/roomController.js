import{
  createRoom,
} from '../models/roomModel.js';

import Chat from '../models/chatModel.js';
import {User} from '../models/userModel.js';
import Room from '../models/roomModel.js';

export async function listarSalas(req, res) {
  let page = parseInt(req.query.page) || 1;
  let limit = parseInt(req.query.limit) || 10;
  let offset = (page - 1) * limit;

  try {
    const { count, rows } = await Room.findAndCountAll({
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'creator',               // Relacionamento com o alias 'creator'
          attributes: ['id', 'nome']    // Apenas os campos necessários
        }
      ]
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      salas: rows,
      page,
      totalPages,
      total: count,
    });
  } catch (error) {
    console.error('Erro ao listar salas:', error);
    res.status(500).json({ success: false, error: 'Erro ao listar salas' });
  }
}



export async function criarSala(req, res) {
  const { userId } = req.body;  // Front deve mandar o id do usuário que está criando

  if (!userId) {
    return res.status(400).json({ success: false, error: 'ID do usuário é obrigatório' });
  }

  try {
    const novoChat = await Chat.create();

    const sala = await createRoom(novoChat.id, userId);  // Agora passando userId do criador

    res.json({ success: true, sala });
  } catch (err) {
    console.error('Erro ao criar sala:', err);
    res.status(500).json({ success: false, error: 'Erro ao criar sala' });
  }
}