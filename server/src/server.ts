/**
 * Standalone HTTP Server (for local development)
 */

import { serve } from '@hono/node-server';
import app from './index';

const port = Number(process.env.PORT) || 3000;

console.log(`🚀 ShadowOS API Server running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

