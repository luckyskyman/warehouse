# Replit.md

## Overview

This project is a comprehensive warehouse inventory management system designed to streamline inventory tracking, transaction management, Bill of Materials (BOM) guidance, and warehouse layout organization. The system supports multi-user access with role-based permissions, real-time inventory alerts, Excel integration for bulk operations, and a work diary feature for team collaboration. It includes both Korean and English interfaces, with mobile-responsive design for warehouse floor operations.

## Project Structure

### Main Systems
- **Replit Warehouse System**: `/replit-warehouse-system/` - Complete React + Node.js + PostgreSQL system
- **Vercel Deployment**: `/vercel-deployment/` - Standalone HTML version for Vercel hosting
- **Archive**: `/archive/` - Development and test files for reference

### Current Status (2025-08-01)
- Replit main system operational at warehouse-inventory-narae0008.replit.app
- Vercel deployment files ready for GitHub upload
- Project files successfully organized and separated

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and ES modules
- **Build Tool**: Vite with HMR (Hot Module Replacement)
- **UI Components**: Shadcn/UI component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query for server state and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation schemas
- **Charts**: Recharts for data visualization
- **Mobile Support**: Responsive design with mobile-specific components

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL
- **API Design**: RESTful endpoints with CORS support
- **Authentication**: Session-based with PostgreSQL storage
- **File Processing**: SheetJS for Excel import/export operations
- **Session Management**: In-memory session store with persistence

### Core Data Models
- **Users**: Role-based system (super_admin, admin, manager, user, viewer) with 25 granular permissions
- **Inventory Items**: Product codes, names, categories, stock levels, locations, and metadata
- **Transactions**: Inbound, outbound, move, and adjustment operations with full audit trail
- **BOM Guides**: Bill of Materials with component relationships and quantities
- **Warehouse Layout**: Physical zone and location management
- **Work Diary**: Team collaboration with comments, priorities, and notifications
- **Exchange Queue**: Product exchange and defect management workflow

### Key Features
- **Inventory Management**: Real-time stock tracking with negative inventory support, visual alerts for low/critical stock levels, and multi-location support for single product codes
- **Transaction Processing**: Comprehensive inbound/outbound/move operations with automatic stock calculations and history tracking
- **BOM Integration**: Bill of Materials checker with component availability verification and assembly guidance
- **Excel Operations**: Bulk import/export with templates for inventory synchronization, BOM uploads, and master data management
- **Work Diary System**: Team communication with priority levels, status tracking, comment threads, and notification system
- **Warehouse Layout**: Visual zone management with customizable location hierarchies and automated location parsing
- **Permission System**: Hierarchical role-based access control with department-specific permissions and critical operation safeguards
- **Notification System**: Real-time alerts with optional voice notifications and mobile-friendly display

### Technical Patterns
- **Component Architecture**: Modular React components with TypeScript interfaces
- **Data Fetching**: Query-based approach with optimistic updates and cache invalidation
- **Error Handling**: Comprehensive error boundaries with user-friendly messages
- **Performance**: Code splitting, lazy loading, and efficient re-rendering strategies
- **Accessibility**: ARIA labels, keyboard navigation, and screen reader support

## External Dependencies

### Database & Infrastructure
- **Neon Database**: Serverless PostgreSQL with connection pooling
- **Drizzle Kit**: Database migrations and schema management

### UI & User Experience
- **Shadcn/UI**: Pre-built component library with accessibility features
- **Radix UI**: Headless UI primitives for complex interactions
- **Lucide React**: Consistent icon library
- **Tailwind CSS**: Utility-first CSS framework

### Data Processing & Integration
- **SheetJS (xlsx)**: Excel file processing for import/export operations
- **date-fns**: Date manipulation and formatting utilities
- **TanStack Query**: Server state management with caching and synchronization

### Development & Build Tools
- **Vite**: Fast development server and build tool
- **esbuild**: JavaScript bundler for production builds
- **TypeScript**: Static type checking and enhanced development experience
- **React Hook Form**: Form state management with validation
- **Zod**: Runtime type validation and schema definition

### Authentication & Security
- **bcryptjs**: Password hashing for user authentication
- **Express Sessions**: Session management with PostgreSQL storage
- **CORS**: Cross-origin resource sharing configuration