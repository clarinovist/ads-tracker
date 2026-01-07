# Meta Ads Monitoring Webapp

A modular, industrial-standard web application for monitoring Meta Ads across multiple businesses. Built with Next.js 16, PostgreSQL, Prisma v7, and Docker.

## Features
- **Dynamic Multi-Tenancy**: Support for multiple businesses with distinct ad accounts
- **Per-Business Access Tokens**: Each business can use its own Meta API token
- **Daily Automated Sync**: Fetches data from Meta Graph API every day at 01:00 AM
- **Automatic Historical Backfill**: New businesses automatically get 30 days of historical data
- **Data Persistence**: Stores historical data in local PostgreSQL for fast access
- **Analytics Dashboard**: View Spend, Leads, Impressions, CPM, CPC, and customized metrics (Hook Rate, Hold Rate)
- **Single Business Analytics**: Deep-dive reporting for individual businesses
- **Date Filtering**: Robust date range picker (Today, Yesterday, Last 7 Days, Last 30 Days, Custom)
- **Manual Data Sync**: Instant "Sync Now" button in the sidebar
- **Edit Functionality**: Update business name, color, and access token
- **Predefined Colors**: Choose from 8 beautiful preset colors

## Tech Stack
- **Framework**: Next.js 16.1.1 (App Router with Turbopack)
- **Database**: PostgreSQL 15
- **ORM**: Prisma v7.2.0 (with PostgreSQL driver adapter)
- **UI**: Shadcn UI + Tailwind CSS v4
- **Charts**: Recharts
- **Containerization**: Docker & Docker Compose

## Getting Started

### Prerequisites
- **Docker & Docker Compose** (Recommended for easiest setup)
- **Node.js 20+** (only if running locally without Docker)

### Quick Start with Docker (Recommended)

**This is the easiest way to run the application!** Just run:

```bash
docker-compose up -d --build
```

The app will be available at [http://localhost:3000](http://localhost:3000).

> **Note**: Make sure you have `.env` file configured. You can copy from `.env.example`:
> ```bash
> cp .env.example .env
> # Then edit .env and configure your settings
> ```

### Production Deployment

For production deployment with a custom domain (e.g., ads.nugrohopramono.my.id):

1. **Quick Deployment**: Use the automated deployment script:
   ```bash
   ./deploy.sh
   ```

2. **Manual Deployment**: See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions including:
   - SSL/TLS certificate setup with Let's Encrypt
   - Nginx reverse proxy configuration
   - Environment variable configuration
   - Database backup and maintenance
   - Security recommendations

The production setup includes:
- Nginx reverse proxy with SSL/TLS support
- PostgreSQL database with persistent volumes
- Automatic HTTPS redirect
- Optimized caching for static assets
- Security headers and best practices

### Alternative: Run Locally (Dev Mode)

If you prefer to run without Docker:

1. **Start PostgreSQL**: `docker-compose up -d postgres` (or use your own PostgreSQL)
2. **Install dependencies**: `npm install`
3. **Install Prisma PostgreSQL adapter**: `npm install @prisma/adapter-pg`
4. **Generate Prisma Client**: `npx prisma generate`
5. **Run migrations**: `npx prisma migrate dev`
6. **Start app**: `npm run dev`

### Usage

1. **Add a Business**
   - Go to `/businesses`
   - Click "Add Business"
   - Enter Name, Ad Account ID (e.g., `act_12345678`)
   - Choose a color from the 8 presets
   - **Optional**: Provide a custom Meta access token for this business
   - **Data is automatically fetched!** The system will backfill the last 30 days in the background
   - Refresh the dashboard in ~10-20 seconds to see your data

2. **Edit a Business**
   - Go to `/businesses`
   - Click the edit icon (✏️) next to any business
   - Update Name, Color, or Access Token
   - Note: Ad Account ID cannot be changed

3. **View Data**
   - Data automatically appears on the dashboard at `/`
   - Use date range picker to view different time periods (Today, Yesterday, etc.)
   - Click on any business to see its **Single Business Analytics** report
   - Charts show Spend, Leads, Impressions, CPM, CPC, and other metrics

4. **Manual Data Sync**
   
   **Via UI**:
   - Locat the **"Sync Now"** button at the bottom of the sidebar.
   - Click it to fetch the latest data for all active businesses immediately.
   
   **Via API (CLI)**:
   - **Sync all businesses (yesterday's data)**:
   ```bash
   curl -X POST http://localhost:3000/api/sync
   ```
   
   **Backfill all businesses (last 30 days)**:
   ```bash
   curl -X POST http://localhost:3000/api/backfill -H "Content-Type: application/json" -d '{"days": 30}'
   ```
   
   **Backfill specific business**:
   ```bash
   curl -X POST http://localhost:3000/api/businesses/{business-id}/backfill -H "Content-Type: application/json" -d '{"days": 30}'
   ```

1.  **Add a Business**
    - Go to `/businesses`
    - Click "Add Business"
    - Enter Name, Ad Account ID (e.g., `act_12345678`)
    - Choose a color from the 8 presets
    - **Provide a custom Meta access token for this business**
    - **Data is automatically fetched!** The system will backfill the last 30 days in the background
    - Refresh the dashboard in ~10-20 seconds to see your data

2.  **Edit a Business**
    - Go to `/businesses`
    - Click the edit icon (✏️) next to any business
    - Update Name, Color, or Access Token
    - Note: Ad Account ID cannot be changed

3.  **View Data**
    - Data automatically appears on the dashboard at `/`
    - Use date range picker to view different time periods
    - Charts show Spend, Leads, Impressions, and other metrics

4.  **Manual Data Sync** (Optional)

    **Sync all businesses (yesterday's data)**:
    ```bash
    curl -X POST http://localhost:3000/api/sync
    ```

    **Backfill all businesses (last 30 days)**:
    ```bash
    curl -X POST http://localhost:3000/api/backfill -H "Content-Type: application/json" -d '{"days": 30}'
    ```

    **Backfill specific business**:
    ```bash
    curl -X POST http://localhost:3000/api/businesses/{business-id}/backfill -H "Content-Type: application/json" -d '{"days": 30}'
    ```

5.  **Automatic Sync**
    - Runs daily at 01:00 AM automatically
    - Fetches previous day's data for all active businesses

## Project Structure
- `/src/app`: Next.js App Router pages and API routes
- `/src/components`: UI components (Shadcn + Custom)
- `/src/lib`: Utilities, Environment validation, Meta Client, Color palette
- `/src/services`: Business logic (Sync Service, Backfill Service)
- `/prisma`: Database schema and migrations

## Features Deep Dive

### Per-Business Access Tokens

Each business MUST have its own Meta API access token. This ensures better security and permission management.

**How it works:**
1. When adding a business, you MUST provide a valid Meta access token.
2. This token is stored securely and used for all data syncing operations for that business.
3. You can update the token at any time by editing the business.

### Predefined Color Palette

Choose from 8 beautiful preset colors:
- 🔵 Blue
- 🟣 Purple
- 🩷 Pink
- 🟢 Green
- 🟠 Orange
- 🔴 Red
- 🔷 Teal
- 🟣 Indigo

No more typing hex codes manually!

### Leads Data Tracking

The system automatically detects leads from multiple Meta action types and attribution paths:
- `lead` - Facebook Lead Ads
- `onsite_conversion.lead_grouped` - On-site lead forms
- `onsite_conversion.messaging_conversation_started_7d` - Messenger leads
- `whatsapp_conversation` / `instagram_messaging_lead` - Enhanced attribution tracking

All lead types are aggregated to provide accurate CPL (Cost Per Lead) calculations.

## Troubleshooting

### Common Issues

- **No data after adding business**:
  - Wait 10-20 seconds for background backfill to complete
  - Check logs: `docker-compose logs web --tail=50`
  - If you see permission errors, see below

- **Permission Error** (`#200 Ad account owner has NOT grant ads_management or ads_read permission`):
  - The business's access token doesn't have permission for this ad account
  - Required permissions: `ads_read` or `ads_management`
  - Solutions:
    1. Ad account owner must grant access in Meta Business Settings
    2. Regenerate token with correct permissions
    3. Update the business with the new token

- **Sync Fails**: 
  - Check the business's access token validity
  - Check logs: `docker-compose logs web`
  
- **Database Connection**: 
  - Ensure `postgres` container is healthy: `docker-compose ps postgres`

- **Duplicate Records**:
  - Should not happen with current version (uses `startOfDay()` normalization)
  - If you see duplicates, report as a bug

### Prisma v7 Specific

This project uses **Prisma v7.2.0**, which requires a database driver adapter. The required adapter is already configured:

- **Adapter**: `@prisma/adapter-pg` for PostgreSQL connections
- **Configuration**: See `src/lib/prisma.ts` for the `PrismaPg` adapter setup

If you encounter `PrismaClientInitializationError`:
1. Ensure `@prisma/adapter-pg` is installed: `npm install @prisma/adapter-pg`
2. Verify `DATABASE_URL` is set in your `.env` file
3. Regenerate Prisma Client: `npx prisma generate`

### Environment Variables

Required environment variables:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ads_tracker?schema=public"
```

**Note**: `META_ACCESS_TOKEN` has been removed. You must provide a token for each business via the UI.

## API Endpoints

### Businesses
- `GET /api/businesses` - List all businesses
- `POST /api/businesses` - Create a new business (auto-triggers 30-day backfill)
- `PUT /api/businesses/{id}` - Update a business
- `DELETE /api/businesses/{id}` - Delete a business

### Data Sync
- `POST /api/sync` - Manually sync yesterday's data for all businesses
- `POST /api/backfill` - Backfill historical data for all businesses
- `POST /api/businesses/{id}/backfill` - Backfill historical data for specific business

## Recent Updates

### Latest Features (January 2026)
- ✅ **Single Business Analytics**: Deep-dive reporting per business
- ✅ **Manual Sync Button**: One-click data refresh in UI
- ✅ **CPM & CPC Metrics**: Integrated into all tables and charts
- ✅ **Dynamic Creative Support**: Detailed UI for multiple ad variations
- ✅ Per-business access tokens & masking
- ✅ Automatic backfill on business creation
- ✅ Improved leads data parsing (including WhatsApp & Messenger)
- ✅ Optimized sync (excludes archived/zero-spend items)

### Bug Fixes
- ✅ Fixed leads showing as 0 (now checks multiple action types)
- ✅ Fixed duplicate records issue (date normalization)
- ✅ Fixed permission errors with per-business tokens

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License - feel free to use this project for your own purposes.
