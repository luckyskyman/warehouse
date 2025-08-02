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