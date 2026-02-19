# BizMetrics API

Backend RESTful para o Dashboard de Vendas.

## Setup

```bash
cd bizmetrics-api
npm install
cp .env.example .env   # editar com suas chaves
npm run dev
```

## Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `JWT_SECRET` | Sim | String aleatória (min 32 chars) |
| `JWT_REFRESH_SECRET` | Sim | String aleatória diferente (min 32 chars) |
| `OPENAI_API_KEY` | Sim | Chave da API OpenAI |
| `DATABASE_URL` | Não | Caminho SQLite (default: `./data.db`) |
| `PORT` | Não | Porta do servidor (default: `3001`) |
| `CORS_ORIGIN` | Não | Origem permitida (default: `http://localhost:5173`) |

## Seed (dados demo)

```bash
npm run db:seed
# Login: demo@bizmetrics.com / Demo1234
```

## Endpoints

### Auth
- `POST /api/auth/register` — Criar conta
- `POST /api/auth/login` — Login
- `POST /api/auth/refresh` — Renovar token
- `POST /api/auth/logout` — Logout

### Sales (autenticado)
- `POST /api/sales/upload` — Upload CSV
- `GET /api/sales` — Listar vendas (filtros + paginação)
- `GET /api/sales/batches` — Histórico de uploads
- `DELETE /api/sales/batch/:id` — Remover batch

### Analytics (autenticado)
- `GET /api/analytics/summary` — KPIs + gráficos
- `GET /api/analytics/kpis` — Apenas KPIs
- `GET /api/analytics/daily-revenue` — Faturamento diário
- `GET /api/analytics/top-products` — Top produtos
- `GET /api/analytics/weekday-distribution` — Distribuição semanal

### AI (autenticado, rate limited)
- `POST /api/ai/analyze` — Análise por IA
- `GET /api/ai/history` — Histórico de análises

### Health
- `GET /api/health` — Status do servidor
