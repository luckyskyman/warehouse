# GitHub 업로드 가이드

## 1단계: Replit에서 파일 다운로드

1. **왼쪽 파일 탐색기에서 프로젝트 루트 폴더 우클릭**
2. **"Download" 선택**
3. **ZIP 파일을 컴퓨터에 저장**

## 2단계: GitHub에 업로드

1. **GitHub 저장소 페이지에서 "Add file" 버튼 클릭**
2. **"Upload files" 선택**
3. **다운로드한 ZIP 파일을 드래그 앤 드롭**
4. **"Commit changes" 버튼 클릭**

## 3단계: 압축 해제 (필요시)

GitHub에서 ZIP 파일이 자동으로 압축 해제되지 않으면:
1. ZIP 파일을 로컬에서 압축 해제
2. 개별 파일들을 GitHub에 업로드

## 중요한 파일들

반드시 업로드해야 하는 핵심 파일들:
- `package.json` - 의존성 정보
- `vercel.json` - Vercel 배포 설정
- `client/` 폴더 - 프론트엔드 코드
- `server/` 폴더 - 백엔드 코드
- `shared/` 폴더 - 공통 코드
- `api/index.ts` - Vercel API 엔트리포인트

## 업로드 후 확인사항

업로드 완료 후 GitHub 저장소에서 다음 파일들이 있는지 확인:
✅ package.json
✅ vercel.json  
✅ client/ 폴더
✅ server/ 폴더
✅ shared/ 폴더
✅ api/ 폴더

모든 파일이 업로드되면 Vercel 배포 단계로 진행합니다.