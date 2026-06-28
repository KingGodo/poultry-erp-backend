# Poultry ERP Backend

A comprehensive, enterprise-grade backend API for poultry farm management built with Node.js, Express, Prisma, and MySQL.

## Quick Start

### Prerequisites
- Node.js (v18+)
- MySQL (v8+)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/KingGodo/poultry-erp-backend.git

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Generate Prisma Client
npm run generate

# Run migrations
npm run migrate:dev -- --name init

# Seed the database
npm run db:seed

# Start development server
npm run dev
