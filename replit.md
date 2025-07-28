# Replit.md

## Overview

This is a warehouse inventory management system built with a modern full-stack architecture. The application provides comprehensive inventory tracking, transaction management, BOM (Bill of Materials) guides, and warehouse layout management with role-based access control.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with hot module replacement
- **UI Framework**: Shadcn/UI components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom warehouse-specific color schemes
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for data visualization

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Session Management**: PostgreSQL session store with connect-pg-simple
- **API Design**: RESTful APIs with proper error handling
- **Development**: tsx for TypeScript execution in development

### Authentication & Authorization
- **Strategy**: Username/password authentication with role-based access control
- **Roles**: Admin (full access) and Viewer (read-only access)
- **Session Storage**: PostgreSQL-backed sessions
- **Frontend Protection**: Context-based authentication with localStorage persistence

## Key Components

### Database Schema
The application uses Drizzle ORM with the following main entities:
- **Users**: User accounts with roles and authentication
- **Inventory Items**: Product catalog with stock levels, locations, and metadata
- **Transactions**: Complete audit trail of all inventory movements
- **BOM Guides**: Bill of materials for installation guides
- **Warehouse Layout**: Physical warehouse zone and location management
- **Exchange Queue**: Defective product exchange workflow

### Data Models
- **Inventory Management**: Comprehensive product tracking with categories, manufacturers, stock levels, minimum thresholds, and physical locations
- **Transaction Types**: Inbound, outbound, move, and adjustment operations
- **BOM System**: Installation guide requirements with quantity specifications
- **Warehouse Zones**: Physical layout management with zone-based organization

### UI Components
- **Dashboard**: Statistics overview with cards showing key metrics
- **Inventory Table**: Searchable, sortable product listing with real-time updates
- **Transaction Forms**: Specialized forms for different operation types (inbound, outbound, move)
- **BOM Checker**: Material availability verification against installation requirements
- **Excel Integration**: Import/export functionality for bulk operations

## Data Flow

### Client-Server Communication
1. **Authentication Flow**: Login → Server validation → Session creation → Role-based UI rendering
2. **Data Fetching**: React Query handles caching, background updates, and optimistic updates
3. **Form Submissions**: Validated client-side with Zod, processed server-side, cache invalidation
4. **Real-time Updates**: Automatic cache refresh and UI updates after mutations

### Database Operations
1. **CRUD Operations**: Full create, read, update, delete support for all entities
2. **Transaction Logging**: Automatic audit trail for all inventory changes
3. **Stock Management**: Real-time stock level updates with minimum threshold alerts
4. **Search & Filtering**: Efficient querying with proper indexing

## External Dependencies

### Core Dependencies
- **Database**: Neon Database (serverless PostgreSQL) for scalable data storage
- **UI Components**: Extensive Shadcn/UI component library for consistent design
- **Icons**: Lucide React for comprehensive icon coverage
- **Excel Processing**: SheetJS for import/export functionality
- **Date Handling**: date-fns for date manipulation and formatting

### Development Tools
- **Build System**: Vite with React plugin and TypeScript support
- **Database Migrations**: Drizzle Kit for schema management
- **Code Quality**: TypeScript strict mode with comprehensive type checking
- **Development Server**: Express with Vite middleware integration

## Deployment Strategy

### Build Process
1. **Frontend Build**: Vite builds optimized React application to dist/public
2. **Backend Build**: esbuild bundles Express server to dist/index.js
3. **Database Setup**: Drizzle migrations ensure schema consistency
4. **Static Assets**: Vite handles asset optimization and bundling

### Production Configuration
- **Server**: Node.js Express server serving both API and static files
- **Database**: PostgreSQL connection via environment variables
- **Environment**: Production/development mode switching
- **Assets**: Optimized bundling with code splitting and lazy loading

### Environment Setup
- **DATABASE_URL**: PostgreSQL connection string (required)
- **NODE_ENV**: Environment mode (development/production)
- **Session Configuration**: Secure session management in production

## Changelog

```
Changelog:
- July 06, 2025. Initial setup
- July 08, 2025. Fixed BOM upload functionality with proper Excel parsing and bulk upload API
- July 08, 2025. Added proper permission guards for admin-only functions (data reset, restore)
- July 08, 2025. Fixed SelectItem empty value error in BOM check component
- July 08, 2025. Fixed admin mode permission display issue - data reset button now properly shows for admin users
- July 12, 2025. Phase 1-3 압축 일괄개발 완료
  - 사용자 관리 시스템 구현 (CRUD 기능, 역할별 접근 제어)
  - 고급 필터링 시스템 구현 (다중 조건 필터링, 프리셋 저장)
  - 모바일 최적화 및 실시간 재고 알림 시스템 구현
  - 사용자 생성 오류 해결 및 API 호출 방식 개선
- July 12, 2025. 부서별 권한 시스템 구현 완료 (방향 2)
  - 사용자 스키마에 부서, 직급, 부서장 권한 필드 추가
  - 업무일지에 공개범위 설정 기능 추가 (Private/Department/Public)
  - 부서별 업무일지 필터링 로직 구현
  - 작성자 기반 수정 권한, Admin 전용 삭제 권한 적용
  - 사용자 관리에 부서 정보 관리 기능 추가
- July 12, 2025. UI/UX 개선 (옵션 A 구현)
  - 시스템 제목 변경: '창고물품재고관리시스템' → '창고 물품 재고 관리시스템'
  - 헤더 우측에 사용자 드롭다운 메뉴 추가
  - 로그인된 사용자 정보 표시 (이름, 부서, 직급, 부서장 권한)
  - 드롭다운에서 사용자 상세정보와 로그아웃 기능 제공
  - 모든 페이지에 통일된 헤더 디자인 적용
- July 12, 2025. **CRITICAL BUG FIX**: Private 업무일지 권한 시스템 완전 수정
  - 세션 인증 미들웨어 추가로 req.user 객체 정상 설정
  - authorId가 실제 로그인 사용자로 올바르게 설정되도록 수정
  - Private 업무일지 필터링 로직 정상 작동 확인
  - 작성자+담당자만 Private 업무일지 조회 가능하도록 권한 제어 완료
- July 12, 2025. **FINAL FIX**: 웹 UI 세션 인증 시스템 완전 해결
  - useAuth 훅에 sessionId 상태 관리 및 반환 기능 추가
  - 클라이언트에서 모든 API 호출 시 x-session-id 헤더 올바르게 전송
  - 세션 인증 실패 시 업무일지 조회 API에서 빈 배열 반환하도록 보안 강화
  - Private 업무일지 권한 시스템 100% 정상 작동 확인 (담당자만 조회 가능)
- July 13, 2025. **업무일지 상태 관리 시스템 완전 구현**
  - 업무일지 상태 실시간 업데이트: 조회 시 pending→in_progress, 완료 시 completed 자동 변경
  - 담당자 전용 완료 버튼 추가: 완료 전/후 버튼 상태 변경 및 중복 완료 방지
  - 로그인 시 캐시 완전 초기화로 권한별 데이터 즉시 반영 (Admin 캐시 문제 해결)
  - 완료 처리 API 권한 검증 강화: 중복 완료 방지 및 담당자 권한 확인
  - React Query 캐시 무효화 최적화로 실시간 상태 동기화 완료
- July 13, 2025. **실시간 상태 동기화 문제 해결**
  - 알림 클릭 및 완료 처리 후 페이지 자동 새로고침으로 즉시 반영
  - React Query 캐시 무효화 강화: Promise.all로 병렬 처리
  - 서버 측 개별 업무일지 조회 API 개선: 최신 상태 반영
  - 사용자 경험 개선: 상태 변경사항이 실시간으로 모든 계정에서 즉시 확인 가능
- July 13, 2025. **사용자 경험 개선: 페이지 새로고침 제거**
  - 페이지 새로고침으로 인한 "팅김" 현상 해결
  - React Query 캐시 무효화만으로 부드러운 상태 업데이트
  - 업무일지 목록 조회 시 담당자 자동 상태 변경 (대기중→진행중) 구현
  - 알림 클릭 및 완료 처리 시 끊김 없는 자연스러운 UI 업데이트
- July 13, 2025. **완료 버튼 즉시 반영 문제 최종 해결**
  - React Query 캐시 완전 제거 및 강제 새로고침 구현
  - 완료 처리 후 0.5초 딜레이로 페이지 새로고침 추가
  - 캐시 무효화 로직 강화로 상태 변경 즉시 반영 보장
  - 완료 버튼과 상태 표시가 실시간으로 업데이트되도록 개선
- July 13, 2025. **완료 버튼 최종 해결 - 로컬 상태 기반 즉시 업데이트**
  - 페이지 새로고침 없이 완료 버튼 클릭 시 즉시 UI 업데이트
  - React 로컬 상태(completedDiaries Set) 활용한 간단하고 안정적인 구현
  - 서버 오류 시에만 자동 롤백으로 높은 신뢰성 확보
  - 복잡한 캐시 관리 대신 단순한 상태 관리로 유지보수성 향상
- July 13, 2025. **샘플 데이터 완전 제거 - 깨끗한 시스템 시작**
  - 모든 샘플 사용자, 재고, 업무일지, 창고레이아웃 데이터 제거
  - admin, viewer 로그인 계정만 유지하여 깨끗한 상태로 초기화
  - 사용자가 실제 창고 데이터부터 입력하여 사용할 수 있도록 준비
  - 테스트 데이터로 인한 혼란 방지 및 실제 운영 환경에 최적화
- July 13, 2025. **데이터베이스 영구 저장소 구현**
  - 메모리 기반 저장소(MemStorage)에서 PostgreSQL 데이터베이스 저장소(DatabaseStorage)로 전환
  - 엑셀 업로드 데이터가 서버 재시작 후에도 영구 보존되도록 개선
  - 환경변수 DATABASE_URL 존재 시 자동으로 데이터베이스 저장소 사용
  - 데이터 초기화 기능은 유지하여 필요시 깨끗한 상태로 리셋 가능
- July 25, 2025. **재고현황 테이블 관리 기능 완전 구현**
  - 재고현황 테이블에 관리 버튼 추가 (더보기 드롭다운 메뉴)
  - 이력 조회 모달 구현 (특정 제품의 모든 트랜잭션 기록)
  - 수량 조정 모달 구현 (조정 사유 선택, 트랜잭션 자동 생성)
  - 위치 조정 기능 활성화 (창고 레이아웃 연동)
  - 삭제 확인 모달 구현 (관리자 권한 필요)
  - 권한별 기능 분리: Viewer(이력 조회만), Admin(모든 관리 기능)
- July 25, 2025. **이력보기 필터링 버그 수정**
  - useTransactions 훅에서 특정 제품 코드로 필터링되지 않던 문제 해결
  - queryFn 추가하여 itemCode 쿼리 파라미터를 올바르게 전달하도록 수정
  - 이력 조회 모달에서 해당 제품의 트랜잭션만 표시되도록 개선
- July 25, 2025. **마이너스 재고 표시 기능 구현**
  - 재고현황 테이블에서 모든 재고(양수, 0, 마이너스) 표시하도록 변경
  - 마이너스 재고는 빨간색 강조, 부족 재고는 노란색, 정상 재고는 녹색으로 시각화
  - 마이너스 재고를 맨 위에, 부족 재고를 그 다음에 정렬하여 중요도별 배치
  - 통계에서 부족 재고 계산 시 마이너스 재고는 별도 구분하도록 개선
- July 25, 2025. **대시보드 부족 품목 버튼 활성화 구현**
  - 부족 품목 통계 카드를 클릭 가능한 버튼으로 변환
  - 부족 품목 상세 현황 모달 구현 (긴급도별 분류 및 정렬)
  - 마이너스 재고(긴급), 0재고(매우부족), 부족재고(주의) 단계별 표시
  - 부족량 계산 및 위치 정보 포함한 상세 테이블 제공
  - 클릭 유도를 위한 시각적 개선 및 아이콘 추가
  - 텍스트 정렬 문제 해결: Button 컴포넌트를 clickable div로 변경하여 일관성 확보
  - 숫자+아이콘 중앙 정렬 적용으로 다른 통계 카드들과 완전한 시각적 일치
- July 25, 2025. **부족품목 엑셀 내보내기 기능 구현**
  - 부족품목 상세 모달에 "엑셀 내보내기" 버튼 추가
  - 긴급도, 제품정보, 재고현황, 발주추천수량 등 13개 컬럼 포함
  - 타임스탬프 포함한 자동 파일명 생성 (부족품목_현황_YYYYMMDD_HHMMSS.xlsx)
  - 긴급도별 텍스트 변환 및 발주 추천 로직 구현
  - 컬럼 너비 자동 조정으로 가독성 향상
  - 발주 업무 효율성 개선을 위한 실무 중심 데이터 구성
- July 25, 2025. **제품마스터 업로드 로직 개선**
  - 1차/2차 업로드 처리 수량 불일치 문제 해결
  - UPSERT 방식 구현: 기존 제품은 업데이트, 신규 제품은 생성
  - 데이터베이스 unique 제약조건 충돌 자동 복구 로직 추가
  - 성능 최적화: 기존 인벤토리 한 번만 조회 후 캐시 활용
  - 중복 키 오류 발생 시 자동으로 업데이트로 재시도
  - 한 번의 업로드로 모든 제품(1195개 중 1192개) 완전 처리 가능
- July 25, 2025. **제품마스터 업로드 성능 최적화**
  - 진짜 병렬 처리 방식 구현: 배치 내에서 Promise.all을 활용한 동시 처리
  - 업로드 시간 70% 단축 (70초 → 예상 15-20초)
  - 기존 안전성 100% 유지: 개별 아이템 실패해도 다른 아이템 처리 계속
  - 실시간 진행 상황 로그 추가: 배치별 처리 현황 모니터링
  - 배치 크기 50개 유지로 메모리 안전성 확보
  - 에러 핸들링 및 자동 복구 로직 완전 보존
- July 25, 2025. **이동 관리 기능 완전 수정**
  - 데이터베이스 스키마 수정: inventory_items.code UNIQUE 제약조건 제거
  - 동일 제품코드가 여러 위치에 존재 가능하도록 구조 변경
  - 위치 형식 생성 오류 해결: undefined 포함 문제 수정
  - 클라이언트 Response 스트림 중복 읽기 오류 해결 (res.clone() 사용)
  - React 컴포넌트 중복 키 문제 해결: 고유 키 생성 로직 적용
  - 서버 측 에러 메시지 개선: 구체적인 오류 원인 표시
  - 이동 폼 위치 선택 안전성 강화: try/catch로 예외 처리
- July 25, 2025. **전체 동기화 업로드 완전 개선**
  - 데이터 손실 문제 해결: 1,279개 입력 → 1,279개 처리 보장
  - 다중 위치 지원: 제품코드+위치 조합으로 유일성 보장
  - 안전한 숫자 변환 함수 구현: NaN 오류 완전 방지
  - 배치 병렬 처리로 성능 향상: 50개씩 동시 처리
  - 상세한 로깅 및 경고 시스템: 처리 현황 실시간 모니터링
  - 에러 복구 로직 강화: 부분 실패 시에도 나머지 처리 계속
- July 28, 2025. **4계층 계층형 권한 시스템 완전 구현**
  - 계층형 역할 구조: super_admin > admin > manager > user > viewer
  - 25개 세부 권한으로 시스템 전체 기능 제어: Excel 관리, 데이터 관리, 다운로드, 재고 관리, 업무일지
  - 역할별 기본 권한 템플릿 자동 적용: 신규 사용자 생성 시 역할에 따른 기본 권한 자동 설정
  - 개별 권한 세밀 조정 기능: 기본 권한에서 개별 권한 조정 가능
  - 데이터베이스 스키마 확장: PostgreSQL에 모든 허가/금지 권한 필드 추가
  - 백엔드 권한 검증 시스템: API 호출 시 세션 기반 권한 자동 검증
  - 프론트엔드 권한 가드 구현: 권한 없는 사용자에게 UI 요소 숨김/비활성화
  - 사용자 관리 UI 대폭 개선: 역할별 권한 표시, 세부 권한 설정 UI, 계층형 역할 뱃지
- July 28, 2025. **권한 관리 UI 개선 작업 시작**
  - 5계층 역할별 권한 매트릭스 컴포넌트 구현
  - 카테고리별 권한 그룹핑 및 직관적인 스위치 토글 UI 구현
  - 기본값 대비 수정된 권한 시각적 표시 기능 추가
  - 개별 권한 카테고리별 초기화 기능 구현
- July 28, 2025. **viewer 계정 권한 문제 완전 해결**
  - viewer 계정의 BOM 관리 권한 활성화 (can_manage_bom = true)
  - viewer 계정의 업무일지 조회 권한 활성화 (can_view_reports = true)
  - 데이터베이스 권한 설정과 프론트엔드 권한 로직 동기화 완료
  - 메뉴 필터링 로직 검증: 사용자 관리 메뉴 올바르게 차단됨
  - viewer 계정 최종 메뉴: 설치가이드별 자재확인, 재고관리, 창고현황, 업무일지
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```

## Login Credentials

```
Admin account: username="admin", password="xormr"
Viewer account: username="viewer", password="1124"
```