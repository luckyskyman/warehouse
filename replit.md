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