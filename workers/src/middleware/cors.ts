import { Context } from 'hono';
import { Env } from '../db/index';

export function corsMiddleware(allowedOrigins: string) {
  return async (c: Context<{ Bindings: Env }>, next: () => Promise<void>) => {
    const origin = c.req.header('origin') || '';
    const origins = allowedOrigins.split(',').map(o => o.trim());
    
    if (origins.includes(origin) || origins.includes('*')) {
      c.header('Access-Control-Allow-Origin', origin);
      c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      c.header('Access-Control-Allow-Credentials', 'true');
    }

    if (c.req.method === 'OPTIONS') {
      return c.text('', 204);
    }

    await next();
  };
}
