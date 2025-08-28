# eKahera Backend

## Requirements
- Node.js 18+
- PostgreSQL 13+

## Setup
1. Copy `.env.example` to `.env` and fill in values.
2. Install dependencies:
   - `npm install`
3. Start in dev mode:
   - `npm run dev`

## Environment Variables
- `PORT`: API port (default 5000)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`: PostgreSQL connection
- `JWT_SECRET`: Secret for JWT signing

## Endpoints
- `GET /health`: Health check
- `POST /api/auth/register`: Create user
- `POST /api/auth/login`: Login, returns JWT
- `GET /api/products`: List products
- `GET /api/products/:id`: Get product
- `POST /api/products`: Create product

## Database
On server start, tables are created if missing:
- `users`
- `products`

You can customize schemas in `src/config/initDb.js`. 