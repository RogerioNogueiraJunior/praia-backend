import{
  createRoom,
  deleteRoomById
} from '../models/roomModel.js';


export async function criarSala(req, res) {
    const { nomeSala, userId } = req.body;
    if (!nomeSala || !userId) {
        return res.status(400).json({ success: false, error: 'Nome da sala e ID do usuário são obrigatórios' });
    }

    try {
      const sala = await createRoom(nomeSala);
      await sala.addUser(userId);// Adiciona o usuário à sala
      res.json({ success: true, sala });
      const roomId = sala.id;
    }catch (err) {
        console.error('Erro ao criar sala:', err);
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ success: false, error: 'Sala já existe' });
        }
        res.status(500).json({ success: false, error: 'Erro ao criar sala' });
    }
}

export async function apagarSalaDoBanco(salaId) {
  try {
    console.log('Tentando apagar sala do banco:', salaId);
    await deleteRoomById(Number(salaId));
    console.log(`Sala ${salaId} removida do banco de dados.`);
  } catch (err) {
    console.error("Erro ao apagar sala:", err);
  }
}
