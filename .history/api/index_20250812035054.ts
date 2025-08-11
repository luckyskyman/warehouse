import express from 'express';

const app = express();

// Simple test response
app.get('/', (req, res) => {
  res.json({ 
    message: 'Warehouse Inventory API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

export default app;
