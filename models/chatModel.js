import { Sequelize, DataTypes, Model } from 'sequelize';
import { User } from './userModel.js';

// Ajuste a conexão conforme seu ambiente
const sequelize = new Sequelize('praia', 'postgres', 'password', {
  host: 'localhost',
  dialect: 'postgres',
  port: 5432,
});

class Chat extends Model {}
class Message extends Model {}

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
});

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
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  }
}, {
  sequelize,
  modelName: 'Message',
  tableName: 'messages',
  timestamps: true,
});

// Associações
Chat.hasMany(Message, { foreignKey: 'chatId' });
Message.belongsTo(Chat, { foreignKey: 'chatId' });

User.hasMany(Message, { foreignKey: 'userId' });
Message.belongsTo(User, { foreignKey: 'userId' });

export { Chat, Message };
export default Chat;