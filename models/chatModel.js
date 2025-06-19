import { Sequelize, DataTypes, Model } from 'sequelize';
import { User } from './userModel.js';

// Conexão com o banco
const sequelize = new Sequelize('praia', 'postgres', 'password', {
  host: 'localhost',
  dialect: 'postgres',
  port: 5432,
});

class Chat extends Model {}
class Message extends Model {}

// Model Chat
Chat.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  }
}, {
  sequelize,
  modelName: 'Chat',
  tableName: 'chats',
  timestamps: true,
  createdAt: 'createdat',
  updatedAt: 'updatedat'
});

// Model Message
Message.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  chatId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Chat,
      key: 'id'
    },
    field: 'chatid'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    },
    field: 'userid'
  }
}, {
  sequelize,
  modelName: 'Message',
  tableName: 'messages',
  timestamps: true,
  createdAt: 'createdat',
  updatedAt: 'updatedat'
});

// Associações
Chat.hasMany(Message, { foreignKey: 'chatId' });
Message.belongsTo(Chat, { foreignKey: 'chatId' });

User.hasMany(Message, { foreignKey: 'userId' });
Message.belongsTo(User, { foreignKey: 'userId' });

export { Chat, Message };
export default Chat;
