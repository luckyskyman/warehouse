// Vercel용 개선된 인증 API
const users = [
  { id: 1, username: 'admin', password: 'password', role: 'admin' },
  { id: 2, username: 'viewer', password: 'password', role: 'viewer' }
];

export default function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: '사용자명과 비밀번호를 입력해주세요.' 
      });
    }

    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
      return res.status(200).json({
        success: true,
        user: { id: user.id, username: user.username, role: user.role }
      });
    } else {
      return res.status(401).json({
        success: false,
        message: '사용자명 또는 비밀번호가 올바르지 않습니다.'
      });
    }
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
}