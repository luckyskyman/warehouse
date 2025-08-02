# Replit.md

## Overview

This project is a comprehensive warehouse inventory management system designed to streamline inventory tracking, transaction management, Bill of Materials (BOM) guidance, and warehouse layout organization. It features robust role-based access control and aims to provide an efficient solution for managing warehouse operations, improving data accuracy, and optimizing inventory levels. The system offers capabilities for detailed product tracking, real-time stock level updates, and audit trails for all inventory movements.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Components**: Shadcn/UI (built on Radix UI)
- **Styling**: Tailwind CSS with custom themes
- **State Management**: TanStack Query
- **Routing**: Wouter
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ES modules)
- **Database**: PostgreSQL with Drizzle ORM
- **API Design**: RESTful
- **Authentication**: Username/password with role-based access control (Admin, Viewer, and a 4-tier hierarchical system: super_admin, admin, manager, user, viewer with 25 granular permissions)
- **Session Management**: PostgreSQL-backed sessions

### Core Features & Design
- **Data Models**: Inventory Items (categorization, stock, locations), Transactions (inbound, outbound, move, adjustment), BOM Guides, Warehouse Zones, Users.
- **UI/UX**: Dashboard with key metrics, searchable/sortable inventory tables, specialized transaction forms, BOM checker, Excel import/export.
- **Workflow**: Client-server communication handles authentication, data fetching (with caching and optimistic updates), form submissions, and real-time UI updates. Database operations include full CRUD, transaction logging, stock level management with alerts, and efficient search/filtering.
- **Warehouse Layout**: Management of physical zones and locations, allowing a single product code to exist in multiple locations.
- **Inventory Management**: Support for negative inventory display, visual cues for stock levels (red for negative, yellow for low, green for normal), and prioritized sorting.
- **Alerts**: Modern notification system with visual and optional auditory cues, indicating stock status (e.g., critical, very low, warning).

## External Dependencies

- **Database**: Neon Database (serverless PostgreSQL)
- **UI Components**: Shadcn/UI
- **Icons**: Lucide React
- **Excel Processing**: SheetJS
- **Date Handling**: date-fns
- **Build Tools**: Vite, esbuild, Drizzle Kit

## System Status (2025-08-02)

### ✅ 스마트파일관리시스템 복원 2025-08-02
- **복원 시점**: 실시간 중복 파일 관리 및 스마트 선택 기능 완성 상태
- **주요 구현사항**:
  - **실시간 통계 업데이트**: 파일 삭제 후 시스템 개요, 중복 파일, 카테고리별 분포 즉시 반영
  - **스마트 중복 파일 선택**: 증거자료 탭에서 중복 파일만 정확히 선택하는 "중복 파일 선택" 버튼 추가
  - **개선된 시스템 개요**: 5개 카드 레이아웃으로 중복률(89%), 고유 파일 수, 절약 가능 용량 명확 표시
  - **정확한 카테고리 분포**: 각 카테고리별 중복 파일 개수와 절약 가능 용량 실시간 계산
  - **완벽한 캐시 동기화**: 파일 삭제/정리 시 모든 관련 API 캐시 자동 무효화
- **기술적 구현**: React Query 캐시 무효화 개선, 실시간 UI 업데이트, 정확한 중복 파일 매칭
- **복원 기준점**: 스마트파일관리시스템 복원 2025-08-02

### ✅ Phase3자동화시스템완성+중복파일관리개선 2025-08-02
- **복원 시점**: Phase 3 파일 자동화 관리 시스템 + 정확한 중복 파일 관리 완성 상태
- **주요 구현사항**:
  - **시스템 개요 대시보드**: 전체 파일 현황, 용량, 중복 파일, 카테고리별 분포 실시간 조회
  - **자동화 관리 시스템**: 조건 기반 자동 정리, 미리보기 모드, 정확한 중복 파일 자동 감지
  - **스마트 파일 분류**: 6개 카테고리 자동 분류 (증거자료, BOM, 백업, 임시, 마스터, 동기화)
  - **정확한 중복 파일 관리**: 90% 유사도 기준, 개별/일괄 선택 삭제, 최신 파일 자동 보존
  - **백엔드 자동화 엔진**: FileManager 클래스로 자동 정리, 중복 감지, 백업 기능 구현
  - **사용자 친화적 UI**: 8탭 구조, 실시간 통계, 스마트 알림, 드래그앤드롭 지원
- **기술적 구현**: server/file-manager.ts 자동화 엔진, 개선된 중복 감지 알고리즘, React Query 통합
- **복원 기준점**: Phase3자동화시스템완성+중복파일관리개선 2025-08-02

### ✅ 스마트설정모달완성 2025-08-02
- **복원 시점**: 스마트 설정 모달 및 접근성 문제 해결 완성 상태
- **주요 개선사항**: 
  - 알림 센터 톱니바퀴 아이콘을 클릭 가능한 설정 버튼으로 변경
  - 재고 알림 설정 접근성 문제 완전 해결 (상태와 관계없이 항상 접근 가능)
  - 탭 구조로 음성/재고/시스템 알림 설정 통합 관리
  - 사용자 탭 전환 컨텍스트 유지 (설정 변경 시 현재 탭 유지)
  - 스마트 기본 탭 선택 (문제 상황 자동 감지)
- **기술적 구현**: 상황별 스마트 설정 모달, 사용자 상호작용 추적 시스템
- **복원 기준점**: 스마트설정모달완성 2025-08-02

### ✅ 음성알림완성시점복원 2025-08-01
- **이전 복원 시점**: 음성 알림 기능 포함 최신 완성 상태
- **제거 완료**: Vercel 배포 관련 모든 파일 및 폴더 제거
- **보존 완료**: 핵심 React 창고관리시스템 100% 보존

### 🎯 보존된 핵심 기능
- React 18 + TypeScript 웹 애플리케이션
- 로그인/인증 시스템 (admin/xormr, viewer/viewer123)
- 재고 관리 (입출고, 이동, 조정)
- BOM 체커
- 업무일지 관리
- 사용자 및 권한 관리
- Excel 데이터 처리
- 창고 레이아웃 관리
- **음성 알림 시스템** (최신 기능)
- 보고서 및 분석 기능
- PostgreSQL 데이터베이스 완전 보존