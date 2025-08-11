import express from 'express';

const app = express();

// Enable CORS for all requests with more permissive settings
app.use((req, res, next) => {
  const origin = req.headers.origin;
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-session-id, Cache-Control, Pragma, Expires');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// 대용량 엑셀 파일 처리를 위해 요청 크기 제한 증가 (50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Try to import routes with error handling
try {
  const { registerRoutes } = await import('../server/routes');
  registerRoutes(app);
  console.log('Routes registered successfully');
} catch (error) {
  console.error('Failed to import routes:', error);
  app.get('/api/error', (req, res) => {
    res.json({ error: 'Routes not loaded', details: error.message });
  });
}

export default app;
