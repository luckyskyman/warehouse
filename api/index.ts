import { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { registerRoutes } from '../server/routes.js';

let app: express.Express | null = null;

async function getApp() {
  if (!app) {
    app = express();
    await registerRoutes(app);
  }
  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const expressApp = await getApp();
  return new Promise((resolve) => {
    expressApp(req as any, res as any, resolve);
  });
}