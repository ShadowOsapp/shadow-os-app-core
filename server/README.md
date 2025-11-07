# ShadowOS Backend API Server

Serverless-compatible API server for ShadowOS core functionality.

## Features

- ✅ RESTful API endpoints for all ShadowOS features
- ✅ Serverless-ready (Vercel, AWS Lambda, Cloudflare Workers)
- ✅ TypeScript with full type safety
- ✅ CORS enabled
- ✅ Request logging
- ✅ Error handling

## API Endpoints

### Stealth Payments

- `POST /api/v1/stealth/payment` - Create a stealth payment
- `POST /api/v1/stealth/proof` - Generate zero-knowledge proof
- `POST /api/v1/stealth/verify` - Verify a proof
- `GET /api/v1/stealth/root` - Get Merkle root

### Reputation Engine

- `POST /api/v1/reputation/identity` - Create identity shadow
- `POST /api/v1/reputation/update` - Update reputation
- `POST /api/v1/reputation/proof` - Generate reputation proof
- `POST /api/v1/reputation/verify` - Verify reputation proof
- `GET /api/v1/reputation/:pseudonym` - Get identity info

### Merchant Bridge

- `POST /api/v1/merchant/register` - Register merchant
- `POST /api/v1/merchant/invoice` - Create invoice
- `POST /api/v1/merchant/payment` - Process payment
- `POST /api/v1/merchant/verify` - Verify receipt
- `GET /api/v1/merchant/root` - Get payment root

## Local Development

```bash
# Install dependencies
bun install

# Run development server
bun run server:dev

# Or start production server
bun run server:start
```

Server will run on `http://localhost:3000` by default.

## Deployment

### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

The `vercel.json` configuration is already set up.

### AWS Lambda (Serverless Framework)

```bash
# Install Serverless Framework
npm install -g serverless

# Deploy
serverless deploy
```

### Cloudflare Workers

```bash
# Install Wrangler CLI
npm install -g wrangler

# Deploy
wrangler publish
```

## Environment Variables

Create a `.env` file for local development:

```env
PORT=3000
NODE_ENV=development
```

## API Examples

### Create Stealth Payment

```bash
curl -X POST http://localhost:3000/api/v1/stealth/payment \
  -H "Content-Type: application/json" \
  -d '{
    "stealthAddress": "a1b2c3d4e5f6...",
    "amount": "1000000"
  }'
```

### Generate Reputation Proof

```bash
curl -X POST http://localhost:3000/api/v1/reputation/proof \
  -H "Content-Type: application/json" \
  -d '{
    "pseudonym": "abc123...",
    "minScore": 3.0
  }'
```

### Create Merchant Invoice

```bash
curl -X POST http://localhost:3000/api/v1/merchant/invoice \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "merchant-001",
    "amount": "5000000",
    "expirationSeconds": 3600
  }'
```

## Notes

- In production, you should use a database to persist state
- Current implementation uses in-memory storage (resets on restart)
- Add authentication/authorization for production use
- Consider rate limiting for public APIs

