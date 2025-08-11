# 창고재고물품관리시스템

## 🚀 무료 호스팅 가이드

### Vercel + Neon Database (추천)

#### 1. Neon Database 설정
1. [Neon Console](https://console.neon.tech)에서 계정 생성
2. 새 프로젝트 생성
3. 데이터베이스 URL 복사

#### 2. Vercel 배포
1. [Vercel](https://vercel.com)에서 계정 생성
2. GitHub 저장소 연결
3. 환경변수 설정:
   - `DATABASE_URL`: Neon 데이터베이스 URL
   - `NODE_ENV`: production

#### 3. 배포 명령어
```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel --prod
```

### Railway + Supabase (대안)

#### 1. Supabase 설정
1. [Supabase](https://supabase.com)에서 프로젝트 생성
2. PostgreSQL 데이터베이스 설정
3. 연결 정보 복사

#### 2. Railway 배포
1. [Railway](https://railway.app)에서 계정 생성
2. GitHub 저장소 연결
3. 환경변수 설정

### Render + Supabase (대안)

#### 1. Render 설정
1. [Render](https://render.com)에서 계정 생성
2. Web Service 생성
3. GitHub 저장소 연결

## 🔧 로컬 개발

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 데이터베이스 마이그레이션
npm run db:push
```

## 📁 프로젝트 구조

- `client/`: React 프론트엔드
- `server/`: Express 백엔드
- `shared/`: 공유 스키마 및 유틸리티
- `api/`: Vercel 서버리스 함수

## 🔒 보안 고려사항

1. **환경변수 관리**: 민감한 정보는 환경변수로 관리
2. **HTTPS**: 모든 무료 호스팅 서비스에서 자동 제공
3. **데이터 백업**: 정기적인 데이터베이스 백업 권장
4. **접근 제어**: 적절한 인증 및 권한 관리

## 💰 비용 비교

| 서비스 | 무료 티어 | 제한사항 |
|--------|-----------|----------|
| Vercel | 월 100GB 대역폭 | 서버리스 함수 실행 시간 제한 |
| Neon | 3GB 저장공간 | 월 10억 요청 |
| Railway | 월 $5 크레딧 | 사용량 초과 시 과금 |
| Render | 월 750시간 | 15분 비활성 시 슬립 |
| Supabase | 500MB 저장공간 | 월 50,000 요청 |

## 🚨 주의사항

1. **무료 티어 한계**: 사용량이 많아지면 유료 플랜 고려 필요
2. **데이터 백업**: 정기적인 백업으로 데이터 손실 방지
3. **모니터링**: 서비스 상태 및 사용량 모니터링 권장
4. **확장성**: 트래픽 증가 시 유료 플랜으로 업그레이드 준비
