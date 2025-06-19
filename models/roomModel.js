import { Sequelize, DataTypes, Model } from 'sequelize';
import { User } from './userModel.js';

const sequelize = new Sequelize('praia', 'postgres', 'password', {
  host: 'localhost',
  dialect: 'postgres',
  port: 5432,
});

class Room extends Model {}

Room.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      unique: true,
      allowNull: false,
    },
    chatId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'chats',
        key: 'id',
      },
      field: 'chatid',
    },
    creatorUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      field: 'creatoruserid',
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'createdat',
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updatedat',
    },
  },
  {
    sequelize,
    modelName: 'Room',
    tableName: 'rooms',
    timestamps: true,
  }
);

// Relacionamento: Uma sala foi criada por um usuário
Room.belongsTo(User, { foreignKey: 'creatorUserId', as: 'creator' });

export async function createRoom(chatId, creatorUserId) {
  let id;
  let exists = true;

  while (exists) {
    id = generateRoomId();
    exists = await Room.findOne({ where: { id } });
  }

  try {
    const room = await Room.create({ id, chatId, creatorUserId });
    return room;
  } catch (error) {
    console.error('Erro ao criar sala:', error);
    throw error;
  }
}

function generateRoomId() {
  return Math.floor(1000 + Math.random() * 9000);
}

export default Room;
