import { Sequelize, DataTypes, Model } from 'sequelize';
import {User} from './userModel.js';

const sequuelize = new Sequelize('praia', 'postgres', 'password', {
  host: 'localhost',
  dialect: 'postgres',
  port: 5432,
});
class Room extends Model {}

Room.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    // Outros campos da sala, por exemplo:
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    }
}, {
    sequelize: sequuelize,
    modelName: 'Room',
    tableName: 'rooms',
});

// Associação Many-to-Many entre Room e User

Room.belongsToMany(User, { through: 'RoomUsers', foreignKey: 'roomId' });
User.belongsToMany(Room, { through: 'RoomUsers', foreignKey: 'userId' });

export async function createRoom(name) {
    try {
        const room = await Room.create({ name });
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