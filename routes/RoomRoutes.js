import express from 'express';
import {
  listarSalas,
  criarSala,
  deletarSala
} from '../controllers/roomController.js';

import Room from '../models/roomModel.js'

const router = express.Router();

router.delete('/room/:id', deletarSala);
router.get('/rooms', listarSalas);
router.post('/criar_sala',  criarSala);
router.post('/entrar_sala', async (req, res) => {
  const { idSala } = req.body;

  if (!idSala) {
    return res.status(400).json({ success: false, error: 'ID da sala não fornecido' });
  }

  try {
    const sala = await Room.findByPk(idSala);

    if (!sala) {
      return res.status(404).json({ success: false, error: 'Sala não encontrada' });
    }

    // Se chegou aqui, a sala existe
    return res.json({ success: true, sala });
  } catch (error) {
    console.error('Erro ao buscar sala:', error);
    return res.status(500).json({ success: false, error: 'Erro ao buscar sala' });
  }
});

export default router;
