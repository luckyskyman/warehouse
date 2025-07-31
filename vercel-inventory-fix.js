// Vercel용 개선된 재고 API
let inventory = [
  {
    id: 1,
    code: 'ITEM001',
    name: '테스트 제품 1',
    category: '전자제품',
    quantity: 50,
    min_quantity: 10,
    location: 'A-1-1'
  },
  {
    id: 2,
    code: 'ITEM002', 
    name: '테스트 제품 2',
    category: '부품',
    quantity: 5,
    min_quantity: 20,
    location: 'B-2-1'
  },
  {
    id: 3,
    code: 'ITEM003',
    name: '부족 재고 샘플',
    category: '소모품',
    quantity: 0,
    min_quantity: 15,
    location: 'C-3-2'
  }
];

export default function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      return res.status(200).json(inventory);
    } 
    
    if (req.method === 'POST') {
      const { code, name, category, quantity, minQuantity, location } = req.body;
      
      const newItem = {
        id: inventory.length + 1,
        code: code || `ITEM${String(inventory.length + 1).padStart(3, '0')}`,
        name: name || '새 제품',
        category: category || '일반',
        quantity: parseInt(quantity) || 0,
        min_quantity: parseInt(minQuantity) || 0,
        location: location || 'A-1-1'
      };
      
      inventory.push(newItem);
      return res.status(201).json(newItem);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Inventory error:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}