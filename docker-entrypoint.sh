#!/bin/sh
set -e

echo "🚀 Starting application..."

# Run Prisma migrations (canonical source of truth)
echo "📦 Applying Prisma migrations (migrate deploy)..."
npx prisma migrate deploy

# Ensure admin user exists (idempotent)
echo "👤 Ensuring admin user exists..."
node migrate.js

# Start the Next.js application
echo "✅ Startup tasks complete. Starting Next.js..."
exec node server.js
