# Motors Gu — Site + Painel Admin (Full-stack)

O projeto agora é dividido em duas partes:

```
motorsgu-fullstack/
├── frontend/     → site público + painel admin (HTML/CSS/JS puro)
└── backend/      → API em Node.js + Express + banco de dados SQLite
```

O front-end **não guarda mais nada no navegador**. Toda a lista de veículos,
login e upload de fotos passam pela API do backend, que salva tudo em um
banco de dados de verdade (SQLite) no servidor.

---

## 1. Rodando o backend (API)

Pré-requisito: [Node.js](https://nodejs.org) instalado (versão 18 ou mais recente).

```bash
cd backend
npm install
cp .env.example .env
```

Abra o `.env` criado e troque o valor de `JWT_SECRET` por um texto longo e
aleatório (isso é o que garante que ninguém consiga forjar um login).

Crie o usuário administrador (troque usuário/senha pelos que quiser usar):

```bash
node create-admin.js admin "SuaSenhaForte123!"
```

A senha precisa ter pelo menos 8 caracteres. Você pode rodar esse comando de
novo a qualquer momento para trocar a senha.

Agora inicie o servidor:

```bash
npm start
```

A API vai subir em `http://localhost:3001`. Na primeira vez que rodar, ela
já cria o banco de dados (`backend/data/motorsgu.db`) com os 6 veículos de
demonstração.

## 2. Rodando o frontend (site)

O front-end é só HTML/CSS/JS puro — não tem build nem instalação. Mais
simples é abrir a pasta `frontend/` com a extensão **Live Server** do VS
Code, ou qualquer servidor estático simples, por exemplo:

```bash
cd frontend
npx serve .
```

Isso evita problemas de CORS que podem acontecer ao abrir o `.html`
diretamente com duplo clique.

Se o endereço do backend for diferente de `http://localhost:3001`, ajuste
isso em `frontend/config.js`.

## 3. Login no painel admin

Acesse `frontend/admin.html`, use o usuário e senha que você criou com
`create-admin.js`. O backend confere a senha (guardada com hash, nunca em
texto puro) e devolve um token, que fica guardado só durante a sessão do
navegador. Sem login válido, nenhuma rota de criar/editar/excluir veículo
funciona — mesmo que alguém tente chamar a API diretamente.

## 4. Fotos dos veículos

Ao cadastrar ou editar um veículo com foto, o arquivo é enviado para o
servidor e salvo em `backend/uploads/`. O backend serve essas imagens em
`/uploads/arquivo.jpg`. Isso significa que, ao contrário da versão anterior,
as fotos ficam salvas no servidor e aparecem para qualquer pessoa que acessar
o site — não dependem mais do navegador de quem cadastrou.

## 5. Publicando de verdade (produção)

Para publicar o site, você vai precisar de:

- Um servidor (ou serviço tipo Railway, Render, Fly.io) para rodar o
  `backend/` com Node.js.
- Hospedagem estática (Vercel, Netlify, GitHub Pages etc.) para o
  `frontend/`, ou pode servir o front-end pelo próprio backend, se preferir.
- Configurar as variáveis de ambiente do backend (`.env`) no serviço
  escolhido, com um `JWT_SECRET` forte e `CORS_ORIGIN` apontando para o
  domínio real do site.
- Atualizar `frontend/config.js` com a URL pública da API.
- Trocar o WhatsApp/Instagram em `frontend/script.js` (`SETTINGS`).

## Endpoints da API

| Método | Rota                  | Precisa login? | Descrição                          |
|--------|-----------------------|:--------------:|-------------------------------------|
| POST   | `/api/auth/login`     | não            | Login, retorna token                |
| GET    | `/api/vehicles`       | não            | Lista veículos (aceita filtros)     |
| GET    | `/api/vehicles/:id`   | não            | Detalhe de um veículo               |
| POST   | `/api/vehicles`       | sim            | Cria veículo (com upload de foto)   |
| PUT    | `/api/vehicles/:id`   | sim            | Edita veículo                       |
| DELETE | `/api/vehicles/:id`   | sim            | Exclui veículo                      |

Filtros aceitos em `GET /api/vehicles`: `model`, `year`, `color`,
`condition`, `maxPrice` (como parâmetros de URL, ex.:
`/api/vehicles?condition=Novo&maxPrice=100000`).
