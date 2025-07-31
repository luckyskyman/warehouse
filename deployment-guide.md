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

### 4. Vercel 배포 ✅
1. ✅ https://vercel.com 방문
2. ✅ GitHub 계정으로 로그인
3. ✅ "New Project" → GitHub 저장소 선택
4. ✅ 환경변수 설정: DATABASE_URL 입력
5. ✅ Deploy 성공 완료

### 5. 배포 후 설정 (진행 중)
- 🔄 서버리스 함수 설정 조정
- 🔄 API 라우팅 수정
- 🔄 데이터베이스 스키마 동기화

### 6. 테스트 비교 ✅
- **현재 운영**: warehouse-inventory-narae0008.replit.app (정상 운영 중)
- **테스트 버전**: warehouse-inventory-system-steel.vercel.app (배포 완료)

### 7. 서버리스 환경 수정 ✅
- ✅ 404 오류 진단 완료
- ✅ vercel.json 설정 수정
- ✅ api/index.ts 서버리스 환경에 맞게 수정
- ✅ @vercel/node 패키지 설치
- ✅ index.html 생성
- 🔄 GitHub 업데이트 (Git 권한 문제로 수동 업데이트 필요)

### 8. GitHub 파일 수정 진행상황
- ✅ **package.json**: @vercel/node 의존성 이미 추가됨
- ✅ **vercel.json**: API 라우팅 수정 완료
- ✅ **api/index.ts**: 서버리스 함수로 변경 완료
- 🔄 **index.html**: 루트 페이지 추가 (진행 중)

## 예상 결과
- 성능: Vercel이 더 빠를 가능성
- 안정성: 둘 다 안정적
- 비용: 둘 다 무료 (소규모 사용 시)

이렇게 하면 기존 시스템은 그대로 두고 새로운 플랫폼을 안전하게 테스트할 수 있습니다.