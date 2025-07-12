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