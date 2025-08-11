import express from 'express';

const app = express();

// Simple HTML response for root path
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>창고재고물품관리시스템</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                margin: 0;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .container {
                text-align: center;
                background: rgba(255, 255, 255, 0.1);
                padding: 40px;
                border-radius: 20px;
                backdrop-filter: blur(10px);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            }
            h1 {
                font-size: 2.5em;
                margin-bottom: 20px;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
            }
            .status {
                background: rgba(76, 175, 80, 0.2);
                padding: 15px;
                border-radius: 10px;
                margin: 20px 0;
                border: 1px solid rgba(76, 175, 80, 0.3);
            }
            .timestamp {
                font-size: 0.9em;
                opacity: 0.8;
                margin-top: 10px;
            }
            .features {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-top: 30px;
            }
            .feature {
                background: rgba(255, 255, 255, 0.1);
                padding: 20px;
                border-radius: 10px;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            .feature h3 {
                margin-top: 0;
                color: #ffd700;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🏭 창고재고물품관리시스템</h1>
            
            <div class="status">
                ✅ <strong>시스템 정상 작동 중</strong>
                <div class="timestamp">배포 시간: ${new Date().toLocaleString('ko-KR')}</div>
            </div>
            
            <div class="features">
                <div class="feature">
                    <h3>📦 재고 관리</h3>
                    <p>실시간 재고 현황 추적 및 관리</p>
                </div>
                <div class="feature">
                    <h3>📊 데이터 분석</h3>
                    <p>재고 통계 및 분석 리포트</p>
                </div>
                <div class="feature">
                    <h3>🔄 자동화</h3>
                    <p>입출고 자동 기록 및 알림</p>
                </div>
            </div>
            
            <div style="margin-top: 30px; opacity: 0.7;">
                <p>🚀 Vercel + Neon Database로 무료 호스팅</p>
                <p>💡 비용 절감을 위한 클라우드 최적화 솔루션</p>
            </div>
        </div>
    </body>
    </html>
  `);
});

// API endpoint for health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Warehouse Inventory API is running!',
    timestamp: new Date().toISOString(),
    environment: 'production'
  });
});

export default app;
