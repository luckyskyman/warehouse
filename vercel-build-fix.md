# Vercel 빌드 오류 수정 가이드

## 발생한 문제들:
1. Node.js 18.x deprecated 경고
2. "npm run build" 스크립트 없음 오류

## 수정사항:

### 1. package.json 업데이트
```json
{
  "name": "warehouse-inventory-system",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "echo 'Build completed - static deployment' && exit 0",
    "start": "node api/index.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "pg": "^8.11.3"
  },
  "engines": {
    "node": "20.x"
  }
}
```

### 2. vercel.json 업데이트
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "builds": [
    {
      "src": "client/**/*",
      "use": "@vercel/static"
    },
    {
      "src": "api/**/*.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/client/$1"
    }
  ],
  "env": {
    "DATABASE_URL": "@database-url",
    "NODE_ENV": "production"
  }
}
```

## 변경사항:
- Node.js 버전: 18.x → 20.x (최신 LTS)
- build 스크립트 추가 (정적 배포용 더미 빌드)
- buildCommand 명시적 추가

이제 빌드 오류가 해결될 것입니다.