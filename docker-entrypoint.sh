#!/bin/sh
set -e

echo "🚀 Starting application..."

# Run database migrations
echo "📦 Running database migrations..."
node migrate.js

# Start the Next.js application
echo "✅ Migrations complete. Starting Next.js..."
exec node server.js
