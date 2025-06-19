import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'praia',
  password: 'password',
  port: 5432,
});

const criarTabela = async () => {
  const createDomainQuery = `
    DO $$
      BEGIN
        PERFORM 1 FROM pg_type WHERE typname = 'nome_usuario';
        IF NOT FOUND THEN
          EXECUTE 'CREATE DOMAIN nome_usuario AS VARCHAR(100) DEFAULT ''praieiro''';
        END IF;
      END
      $$;
  `;

  const createTableQuery = `
      -- Domínio para nome de usuário (se ainda não existir)
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'nome_usuario'
        ) THEN
          CREATE DOMAIN nome_usuario AS VARCHAR(100) DEFAULT 'praieiro';
        END IF;
      END
      $$;

      -- Tabela de usuários
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        nome nome_usuario,
        email VARCHAR(30) UNIQUE NOT NULL,
        senha VARCHAR(100) NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Tabela de chats
      CREATE TABLE IF NOT EXISTS chats (
        id SERIAL PRIMARY KEY,
        createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
        updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
      );

      -- Tabela de rooms (salas)
      CREATE TABLE IF NOT EXISTS rooms (
        id INTEGER PRIMARY KEY, -- 4 dígitos, gerado manualmente
        name VARCHAR(255) NOT NULL,
        chatId INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
        createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
        updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
      );

      -- Adiciona coluna roomId em users para relação N:1 (vários usuários para uma sala)
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS roomId INTEGER REFERENCES rooms(id) ON DELETE SET NULL;

      -- Tabela de mensagens
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        chatId INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
        userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
        updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
      );
  `;

  try {
    await pool.query(createDomainQuery);
    await pool.query(createTableQuery);
    console.log('Domain e tabela users criados (ou já existentes)');
  } catch (err) {
    console.error('Erro ao criar domínio ou tabela:', err);
  }
};

criarTabela();

