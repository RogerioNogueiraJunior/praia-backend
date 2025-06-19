import { Sequelize, DataTypes, Model } from 'sequelize';

const sequelize = new Sequelize('praia', 'postgres', 'password', {
  host: 'localhost',
  dialect: 'postgres',
  port: 5432,
});

class User extends Model {}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    senha: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    nome: {
      type: DataTypes.STRING,
      allowNull: true,
    }
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: false,
  }
);

export async function inserirUsuarioDB(email, senhaHash, nome = null) {
  const userData = { email, senha: senhaHash };

  if (nome !== null && nome !== undefined) {
    userData.nome = nome;
  }
  return await User.create(userData);
}

export async function buscarUsuarioPorEmail(email) {
  return await User.findOne({ where: { email } });
}

export async function atualizarNomeUsuario(email, nome) {
  const [updatedRows, [updatedUser]] = await User.update(
    { nome },
    {
      where: { email },
      returning: true,
      individualHooks: true,
    }
  );
  return updatedUser;
}

export { sequelize, User };
