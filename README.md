# Praia

Projeto de autenticação de usuários com Node.js, Express, PostgreSQL e Docker.

## Pré-requisitos

- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/) (geralmente já vem com o Node.js)
- [Docker](https://www.docker.com/) (para rodar o banco de dados PostgreSQL)

## Instalação

1. **Clone o repositório:**
   ```sh
   git clone <url-do-seu-repositorio>
   cd "praia new repository/praia"
   ```

2. **Instale as dependências:**
   ```sh
   npm install
   ```

3. **Configure o banco de dados:**

   - Se você usa Docker, crie um container PostgreSQL:
     ```sh
     docker run --name praia-postgres -e POSTGRES_PASSWORD=suasenha -e POSTGRES_DB=praia -p 5432:5432 -d postgres
     ```
   - Altere as credenciais de conexão em `models/userModel.js` se necessário.

4. **Crie as tabelas no banco:**

   - Dentro da pasta `database` há um arquivo SQL para criar a tabela `users`.
   - Execute o script usando um cliente PostgreSQL ou via terminal:
     ```sh
     psql -U postgres -d praia -f database/create_users_table.sql
     ```
     *(Ajuste o nome do arquivo conforme o que está na sua pasta)*

   - **Ou** execute o script Node.js para criar a tabela:
     ```sh
     cd database
     node criarTabela.js
     ```

## Como rodar o projeto

1. **Inicie o servidor:**
   ```sh
   npm run dev
   ```
   Ou, se não houver script no `package.json`:
   ```sh
   node server.js
   ```

2. **Acesse no navegador:**
   ```
   http://localhost:8081/
   ```

## Estrutura de Pastas

```
praia/
├── app/                # Frontend (HTML, CSS, JS)
├── controllers/        # Lógica dos controllers (UserController.js)
├── database/           # Scripts SQL e JS para criação de tabelas
├── models/             # Acesso ao banco de dados (userModel.js)
├── public/             # Imagens e arquivos estáticos
├── routes/             # Rotas da API (UserRoutes.js)
└── server.js           # Arquivo principal do servidor
```

## Rotas principais

- `POST /api/inserir` — Cadastro de usuário
- `POST /api/entrar` — Login de usuário
- `POST /api/name_change` — Alterar nome do usuário

# Praia Backend

## Configuração do Caminho do Front-End

Este backend pode servir arquivos estáticos (HTML, CSS, JS, imagens) de qualquer pasta do seu computador, inclusive de um repositório diferente do backend.

### Como configurar o caminho do front-end

1. **Defina a variável de ambiente `FRONTEND_PATH`** com o caminho absoluto da pasta do seu front-end antes de iniciar o servidor.

#### No Windows (PowerShell)

```powershell
$env:FRONTEND_PATH="C:\Users\rogério\Desktop\praia new repository\praia"
npm run dev
```

#### No Windows (Prompt de Comando - cmd.exe)

```cmd
set FRONTEND_PATH=C:\Users\rogério\Desktop\praia new repository\praia
npm run dev
```

#### No Linux/macOS

```bash
export FRONTEND_PATH="/caminho/absoluto/para/pasta/do/front"
npm run dev
```

2. **Estrutura esperada da pasta do front-end**

A pasta definida em `FRONTEND_PATH` deve conter os arquivos e subpastas do seu front-end, por exemplo:

```
praia/
├── app/
│   ├── index.html
│   ├── login/
│   │   └── login.html
│   └── signin/
│       └── signin.html
├── imagens/
│   └── exemplo.jpg
├── css/
│   └── style.css
└── js/
    └── script.js
```

3. **Referencie arquivos estáticos no HTML**

Use caminhos relativos à raiz, por exemplo:

```html
<img src="/imagens/exemplo.jpg" />
<link rel="stylesheet" href="/css/style.css" />
<script src="/js/script.js"></script>
```

4. **Acesse as páginas no navegador**

- `http://localhost:8081/` → `app/index.html`
- `http://localhost:8081/login` → `app/login/login.html`
- `http://localhost:8081/signin` → `app/signin/signin.html`
- `http://localhost:8081/about` → `app/about/about.html`

---

**Observação:**  
Se não definir a variável `FRONTEND_PATH`, o backend tentará servir arquivos da pasta `public` dentro do próprio projeto.

## Observações

- Certifique-se de que o Docker e o container do PostgreSQL estejam rodando antes de iniciar o servidor.
- Os logs do servidor aparecem no terminal onde você rodou o Node.js.
- Para criar a tabela via script, acesse o diretório `database` e digite `node criarTabela.js` no terminal.