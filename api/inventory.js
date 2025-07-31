import { Client } from 'pg';

// PostgreSQL 연결 설정
async function getDbClient() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  await client.connect();
  return client;
}

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const client = await getDbClient();
    
    if (req.method === 'GET') {
      // 재고 목록 조회
      const result = await client.query('SELECT * FROM inventory_items ORDER BY id DESC');
      res.status(200).json(result.rows);
    } else if (req.method === 'POST') {
      // 새 재고 추가
      const { code, name, category, quantity, minQuantity, location } = req.body;
      const result = await client.query(
        'INSERT INTO inventory_items (code, name, category, quantity, min_quantity, location) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [code, name, category, quantity, minQuantity, location]
      );
      res.status(201).json(result.rows[0]);
    }
    
    await client.end();
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
}