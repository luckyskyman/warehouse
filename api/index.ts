// Simple serverless function without @vercel/node dependency
export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.url === '/api/health') {
    res.status(200).json({ status: 'healthy', message: 'API is working' });
    return;
  }
  
  // Redirect API requests to explain the setup
  res.status(200).json({ 
    message: 'Warehouse Management System API',
    note: 'This is a test deployment. Full functionality requires database setup.',
    endpoints: ['/api/health']
  });
}