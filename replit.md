# VaxPredict Pro - Vaccine Design Platform

## Overview

VaxPredict Pro is a sophisticated bioinformatics web application that leverages machine learning and computational biology to design optimized vaccines. The platform analyzes protein sequences, predicts epitopes, simulates HLA binding affinities, and generates multi-epitope vaccine constructs with detailed safety and efficacy assessments.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript and Vite for fast development and optimized builds
- **UI Framework**: shadcn/ui components built on Radix UI primitives for accessible, modern interface
- **Styling**: Tailwind CSS with custom design system and iOS-inspired color palette
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **File Handling**: react-dropzone for drag-and-drop file uploads

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Database Provider**: Neon serverless PostgreSQL
- **File Processing**: Multer for handling file uploads (FASTA, GenBank formats)
- **Session Management**: PostgreSQL-based session storage with connect-pg-simple

### Machine Learning Integration
- **ML Framework**: TensorFlow.js for client-side and server-side machine learning
- **Bioinformatics**: Custom algorithms for epitope prediction, HLA binding simulation, and sequence optimization
- **Data Processing**: Custom parsers for biological sequence formats

## Key Components

### Data Models
- **Users**: Basic user management with username/password authentication
- **Vaccine Designs**: Comprehensive tracking of vaccine design projects with:
  - Input sequence data (protein/DNA/RNA)
  - Processing status and progress tracking
  - Results storage (optimized sequences, scores, epitope data)
  - JSON storage for complex analysis results

### Processing Pipeline
1. **Sequence Analysis**: Validates and processes input sequences
2. **Epitope Prediction**: Uses ML models to identify B-cell and T-cell epitopes
3. **HLA Binding Simulation**: Predicts MHC Class I/II binding affinities
4. **Vaccine Construction**: Assembles multi-epitope constructs with optimal linkers
5. **Sequence Optimization**: Performs codon optimization and safety analysis

### API Endpoints
- `POST /api/vaccine-designs`: Create new vaccine design with file upload support
- `GET /api/vaccine-designs/:id`: Retrieve design status and results
- `PUT /api/vaccine-designs/:id`: Update design progress and results

## Data Flow

1. **Input Stage**: Users upload sequence files (FASTA/GenBank) or paste sequences directly
2. **Validation**: System validates sequence format and biological validity
3. **Processing Queue**: Designs enter asynchronous processing pipeline
4. **Real-time Updates**: Frontend polls for progress updates every 2 seconds
5. **Results Display**: Comprehensive results with visualization and export options

## External Dependencies

### Core Libraries
- **Database**: `@neondatabase/serverless`, `drizzle-orm`, `drizzle-zod`
- **ML/AI**: `@tensorflow/tfjs` for machine learning computations
- **UI Components**: Full Radix UI suite for accessible components
- **File Processing**: `multer`, `react-dropzone`
- **PDF Generation**: `jspdf` for report generation
- **Validation**: `zod` for runtime type checking and validation

### Development Tools
- **Build System**: Vite with React plugin and TypeScript support
- **Code Quality**: ESLint, TypeScript strict mode
- **Development**: Hot module replacement, error overlay, Replit integration

## Deployment Strategy

### Development Environment
- **Local Development**: Uses Vite dev server with Express API proxy
- **Database**: Connects to Neon PostgreSQL via environment variables
- **File Storage**: In-memory storage for development, extensible to cloud storage

### Production Build
- **Frontend**: Static assets built and served from Express
- **Backend**: Bundled with esbuild for optimal performance
- **Database**: Production PostgreSQL with migration support via Drizzle Kit
- **Environment**: Configurable via DATABASE_URL environment variable

### Scalability Considerations
- **Storage**: Currently uses in-memory storage, designed for database persistence
- **Processing**: Async processing pipeline ready for queue system integration
- **Caching**: TanStack Query provides client-side caching for API responses

## Changelog

- June 29, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.