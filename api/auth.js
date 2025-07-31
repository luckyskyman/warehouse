import bcrypt from 'bcryptjs';

// 간단한 사용자 저장소 (실제로는 데이터베이스 사용)
const users = [
  { id: 1, username: 'admin', password: '$2a$10$xyz...', role: 'admin' },
  { id: 2, username: 'viewer', password: '$2a$10$abc...', role: 'viewer' }
];

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    const { username, password } = req.body;
    
    // 사용자 인증 로직
    const user = users.find(u => u.username === username);
    if (user && await bcrypt.compare(password, user.password)) {
      res.status(200).json({ 
        success: true, 
        user: { id: user.id, username: user.username, role: user.role },
        token: 'jwt-token-here'
      });
    } else {
      res.status(401).json({ success: false, message: '로그인 실패' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}