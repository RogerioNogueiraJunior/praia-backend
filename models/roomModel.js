import { Sequelize, DataTypes, Model } from 'sequelize';
import { User } from './userModel.js';

// Ajuste a conexão conforme seu ambiente
const sequelize = new Sequelize('praia', 'postgres', 'password', {
  host: 'localhost',
  dialect: 'postgres',
  port: 5432,
});

class Room extends Model {}

Room.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    unique: true,
    allowNull: false,
    // Não autoincrementa, será gerado manualmente
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  chatId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'chats', // nome da tabela de chat
      key: 'id'
    }
  }
}, {
  sequelize,
  modelName: 'Room',
  tableName: 'rooms',
  timestamps: true,
});

// Relação: vários usuários para uma sala
User.belongsTo(Room, { foreignKey: 'roomId' });
Room.hasMany(User, { foreignKey: 'roomId' });

// Função para gerar id de 4 dígitos aleatório
function generateRoomId() {
  return Math.floor(1000 + Math.random() * 9000);
}

// Criação de sala com id aleatório
export async function createRoom(name, chatId) {
  let id;
  let exists = true;
  // Garante que o id não exista
  while (exists) {
    id = generateRoomId();
    exists = await Room.findOne({ where: { id } });
  }
  try {
    const room = await Room.create({ id, name, chatId });
    return room;
  } catch (error) {
    console.error('Erro ao criar sala:', error);
    throw error;
  }
}

export async function deleteRoomById(roomId) {
  try {
    const deleted = await Room.destroy({ where: { id: roomId } });
    return deleted;
  } catch (error) {
    console.error('Erro ao deletar sala:', error);
    throw error;
  }
}

export default Room;