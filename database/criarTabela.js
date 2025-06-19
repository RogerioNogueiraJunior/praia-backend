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
      IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'nome_usuario'
      ) THEN
        CREATE DOMAIN nome_usuario AS VARCHAR(100) DEFAULT 'praieiro';
      END IF;
    END
    $$;
  `;

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS chats (
    id SERIAL PRIMARY KEY,
    createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
    updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    nome nome_usuario,
    email VARCHAR(150) UNIQUE NOT NULL,
    senha VARCHAR(100) NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT email_valido CHECK (
      email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    )
  );

  CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY,
    chatId INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    creatorUserId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
    updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
  );

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
    console.log('Domínio e tabelas criados (ou já existentes)');
  } catch (err) {
    console.error('Erro ao criar domínio ou tabelas:', err);
  }
};

criarTabela();