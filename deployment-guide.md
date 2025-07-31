# Vercel + PlanetScale 테스트 배포 가이드

## 현재 상태
✅ Git 저장소 초기화 완료
✅ Vercel 배포 설정 파일 생성 완료
✅ 코드 커밋 완료

## 다음 단계

### 1. GitHub 저장소 생성
1. https://github.com 에서 새 저장소 생성
2. 저장소 이름: `warehouse-inventory-system`
3. Public 또는 Private 선택

### 2. 코드 푸시
```bash
git remote add origin https://github.com/YOUR_USERNAME/warehouse-inventory-system.git
git branch -M main
git push -u origin main
```

### 3. PlanetScale 데이터베이스 설정
1. https://planetscale.com 회원가입 (무료)
2. 새 데이터베이스 생성: `warehouse-inventory`
3. 연결 문자열 복사
4. 스키마 생성: `npm run db:push` 실행

### 4. Vercel 배포
1. https://vercel.com 방문
2. GitHub 계정으로 로그인
3. "New Project" → GitHub 저장소 선택
4. 환경변수 설정:
   - `DATABASE_URL`: PlanetScale 연결 문자열
   - `NODE_ENV`: `production`
5. Deploy 클릭

### 5. 테스트 비교
- **현재 운영**: warehouse-inventory-narae0008.replit.app
- **테스트 버전**: yourapp.vercel.app (배포 후 생성)

## 예상 결과
- 성능: Vercel이 더 빠를 가능성
- 안정성: 둘 다 안정적
- 비용: 둘 다 무료 (소규모 사용 시)

이렇게 하면 기존 시스템은 그대로 두고 새로운 플랫폼을 안전하게 테스트할 수 있습니다.