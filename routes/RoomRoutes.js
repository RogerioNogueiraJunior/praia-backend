import express from 'express';
import {
  criarSala,
  apagarSalaDoBanco,
} from '../controllers/roomController.js';

const router = express.Router();

router.post('/criar_sala',  criarSala);
router.post('/deletar_sala', apagarSalaDoBanco);

export default router;
