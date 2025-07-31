# Vercel + PlanetScale 테스트 배포 가이드

## 현재 상태
✅ Git 저장소 초기화 완료
✅ Vercel 배포 설정 파일 생성 완료
✅ 코드 커밋 완료

## 다음 단계 (GitHub 우회 방법)

### 1. 파일 다운로드
1. Replit 왼쪽 파일 탐색기에서 전체 선택
2. 우클릭 → Download
3. ZIP 파일 저장

### 2. GitHub 업로드
1. GitHub 저장소에서 "uploading an existing file" 클릭
2. ZIP 파일 드래그 앤 드롭
3. "Commit changes" 클릭

### 3. Supabase 데이터베이스 설정 ✅
1. ✅ Supabase 조직 생성: `warehouse-inventory`
2. ✅ 프로젝트 생성: `warehouse-inventory-db`
3. ✅ PostgreSQL 데이터베이스 활성화
4. 🔄 연결 문자열 복사 (진행 중)
5. 🔄 Vercel 환경변수 설정 (다음 단계)

### 4. Vercel 배포 (다음 단계)
1. https://vercel.com 방문
2. GitHub 계정으로 로그인
3. "New Project" → GitHub 저장소 선택
4. 환경변수 설정:
   - `DATABASE_URL`: Supabase 연결 문자열
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