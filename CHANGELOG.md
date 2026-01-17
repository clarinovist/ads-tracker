# Meta Ads Tracker - Change Log

All notable changes to this project will be documented in this file.

## [3.0.0] - 2026-01-03

### Added
- **Single Business Analytics**: New dedicated page for deep-dive metrics per business
- **Dynamic Creative Support**: UI now handles multiple text and image variations for ads
- **Manual Sync Trigger**: Added "Sync Now" button in sidebar for immediate data refresh
- **Advanced Metrics**: Integrated CPM (Cost Per Mille) and CPC (Cost Per Click) across dashboard
- **Granular Lead Tracking**: Fixed WhatsApp, Instagram, and Messenger lead attribution

### Optimized
- **Sync Efficiency**: Now excludes archived campaigns and items with zero spend automatically
- **Dashboard Speed**: Improved data fetching logic for performance comparison
- **Docker Build**: Optimized image size and removed external font dependencies for faster, offline-capable builds

### Fixed
- **Serialization Error**: Resolved Next.js "Functions cannot be passed directly to Client Components" errors
- **Date Navigation**: Fixed bug where selecting date presets redirected users to the home page
- **Prerendering Issues**: Added Suspense boundaries to handle `useSearchParams` in client components during build
- **Prisma v7 Compatibility**: Finalized adapter configuration for stable PostgreSQL connections in Docker
- **Missing Imports**: Restored missing `cn` and `Link` imports in several dashboard pages

### Security
- **Secure Token Entry**: Improved masking and handling of per-business access tokens

## [2.1.0] - 2026-01-02

### ⚠️ Breaking Changes
- **Global Token Removed**: `META_ACCESS_TOKEN` has been removed from environment variables.
- **Mandatory Per-Business Tokens**: Every business MUST have its own access token.
- **API Update**: `POST /api/businesses` now requires `access_token`.

### Security
- **Token Masking**: Access tokens are now masked (e.g., `••••••••1234`) in the UI and API responses.
- **Secure Updates**: `PUT` endpoint only updates token if a new value is provided.

## [2.0.0] - 2026-01-02

### Added
- **Per-Business Access Tokens**: Each business can now have its own Meta API access token
  - Added `access_token` field to Business model
  - (Later removed) Businesses without a custom token previously could fall back to a global `META_ACCESS_TOKEN`\*
  - Useful for multi-client agencies or restricted permissions
  
- **Edit Business Functionality**: 
  - Added edit button (✏️) in business list
  - Can update business name, color, and access token
  - Ad Account ID is locked after creation (for data integrity)
  
- **Predefined Color Palette**:
  - Replaced hex input with 8 beautiful preset colors
  - Visual color picker with hover/selection states
  - No more manual hex code typing

- **Automatic Historical Backfill**:
  - New businesses automatically fetch 30 days of historical data
  - Runs in background without blocking UI
  - No manual sync needed for new businesses

- **Improved Leads Data Parsing**:
  - Now checks 4 different Meta lead action types
  - Correctly captures Messenger leads (`onsite_conversion.messaging_conversation_started_7d`)
  - Supports legacy and current Meta API formats

- **Manual Backfill API**: 
  - New endpoint: `POST /api/businesses/{id}/backfill`
  - Allows backfilling specific business with custom day range

### Fixed
- **Leads showing as 0**: Fixed action type parsing to support Messenger and on-site conversions
- **Duplicate records**: Implemented `startOfDay()` normalization to prevent duplicates
- **Permission errors**: Per-business tokens solve access permission issues

### Changed
- Updated Meta API client to accept optional access token parameter
- Updated sync services to use business-specific tokens with fallback
- Enhanced business API to accept and store access tokens (not exposed in GET)
- Improved error messages for permission issues

### Technical
- Added `Textarea` UI component
- Created `colors.ts` utility with predefined palette
- Updated database schema with `access_token` column
- Enhanced `BusinessList` component with edit dialog and color picker

\*Catatan: fallback global token dihapus di versi 2.1.0.

## [1.0.0] - 2026-01-02

### Initial Release
- Multi-business Meta Ads monitoring
- Automated sync (schedule configurable)
- Analytics dashboard with charts
- Date range filtering
- PostgreSQL data persistence
- Docker & Docker Compose setup
- Prisma v7 with PostgreSQL adapter
- Basic business management (add/delete)

---

## Migration Guide

### From 1.0.0 to 2.0.0

**Database Migration:**
Database changes are applied via Prisma migrations. In Docker deployment, migrations are applied automatically on startup using `npx prisma migrate deploy`.

**Existing Businesses:**
Global `META_ACCESS_TOKEN` is no longer used. Each business must have its own token stored in the `Business.access_token` field.

**Breaking Notes:**
- If a business has no token, sync will fail (token is required per business)

**New Capabilities:**
1. Add custom tokens to businesses that need them
2. Edit business details without deleting
3. Enjoy automatic backfill for new businesses
4. See accurate leads data with improved parsing
