/**
 * Cloudflare Workers Serverless Adapter
 */

import app from './src/index';

export default {
  fetch: app.fetch,
};

