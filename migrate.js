const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function runSQLMigrations() {
    console.log('📦 Running database migrations...');

    const migrations = `
-- Create UserRole enum type
DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create base Business table first
CREATE TABLE IF NOT EXISTS "Business" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ad_account_id" TEXT NOT NULL,
    "color_code" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "access_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Business_ad_account_id_key" ON "Business"("ad_account_id");
CREATE INDEX IF NOT EXISTS "Business_created_at_idx" ON "Business"("created_at");
CREATE INDEX IF NOT EXISTS "Business_is_active_idx" ON "Business"("is_active");

-- Create base DailyInsight table
CREATE TABLE IF NOT EXISTS "DailyInsight" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "spend" DOUBLE PRECISION NOT NULL,
    "impressions" INTEGER NOT NULL,
    "clicks" INTEGER NOT NULL,
    "reach" INTEGER NOT NULL,
    "frequency" DOUBLE PRECISION NOT NULL,
    "leads" INTEGER NOT NULL,
    "hook_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hold_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cpc" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cpl" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leads_instagram" INTEGER NOT NULL DEFAULT 0,
    "leads_messenger" INTEGER NOT NULL DEFAULT 0,
    "leads_whatsapp" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "cpm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ctr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cvr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "roas" DOUBLE PRECISION NOT NULL DEFAULT 0,
    CONSTRAINT "DailyInsight_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "DailyInsight_business_id_idx" ON "DailyInsight"("business_id");
CREATE INDEX IF NOT EXISTS "DailyInsight_date_idx" ON "DailyInsight"("date");
CREATE UNIQUE INDEX IF NOT EXISTS "DailyInsight_business_id_date_key" ON "DailyInsight"("business_id", "date");

ALTER TABLE "DailyInsight" DROP CONSTRAINT IF EXISTS "DailyInsight_business_id_fkey";
ALTER TABLE "DailyInsight" ADD CONSTRAINT "DailyInsight_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("id") ON DELETE CASCADE;

-- Create User table
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "password" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");

-- Create BusinessUser table
CREATE TABLE IF NOT EXISTS "BusinessUser" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BusinessUser_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "BusinessUser_business_id_user_id_key" ON "BusinessUser"("business_id", "user_id");
CREATE INDEX IF NOT EXISTS "BusinessUser_business_id_idx" ON "BusinessUser"("business_id");
CREATE INDEX IF NOT EXISTS "BusinessUser_user_id_idx" ON "BusinessUser"("user_id");

ALTER TABLE "BusinessUser" DROP CONSTRAINT IF EXISTS "BusinessUser_business_id_fkey";
ALTER TABLE "BusinessUser" ADD CONSTRAINT "BusinessUser_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("id") ON DELETE CASCADE;
ALTER TABLE "BusinessUser" DROP CONSTRAINT IF EXISTS "BusinessUser_user_id_fkey";
ALTER TABLE "BusinessUser" ADD CONSTRAINT "BusinessUser_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE;

-- Create Campaign table
CREATE TABLE IF NOT EXISTS "Campaign" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "objective" TEXT,
    "status" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Campaign_business_id_idx" ON "Campaign"("business_id");
CREATE INDEX IF NOT EXISTS "Campaign_status_idx" ON "Campaign"("status");

ALTER TABLE "Campaign" DROP CONSTRAINT IF EXISTS "Campaign_business_id_fkey";
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("id") ON DELETE CASCADE;

-- Create AdSet table
CREATE TABLE IF NOT EXISTS "AdSet" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdSet_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AdSet_campaign_id_idx" ON "AdSet"("campaign_id");
CREATE INDEX IF NOT EXISTS "AdSet_status_idx" ON "AdSet"("status");

ALTER TABLE "AdSet" DROP CONSTRAINT IF EXISTS "AdSet_campaign_id_fkey";
ALTER TABLE "AdSet" ADD CONSTRAINT "AdSet_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "Campaign"("id") ON DELETE CASCADE;

-- Create Ad table
CREATE TABLE IF NOT EXISTS "Ad" (
    "id" TEXT NOT NULL,
    "ad_set_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creative_type" TEXT,
    "creative_url" TEXT,
    "thumbnail_url" TEXT,
    "creative_body" TEXT,
    "creative_title" TEXT,
    "creative_dynamic_data" JSONB,
    CONSTRAINT "Ad_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Ad_ad_set_id_idx" ON "Ad"("ad_set_id");
CREATE INDEX IF NOT EXISTS "Ad_status_idx" ON "Ad"("status");
CREATE INDEX IF NOT EXISTS "Ad_creative_type_idx" ON "Ad"("creative_type");

ALTER TABLE "Ad" DROP CONSTRAINT IF EXISTS "Ad_ad_set_id_fkey";
ALTER TABLE "Ad" ADD CONSTRAINT "Ad_ad_set_id_fkey" FOREIGN KEY ("ad_set_id") REFERENCES "AdSet"("id") ON DELETE CASCADE;

-- Create CampaignDailyInsight table
CREATE TABLE IF NOT EXISTS "CampaignDailyInsight" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "spend" DOUBLE PRECISION NOT NULL,
    "impressions" INTEGER NOT NULL,
    "clicks" INTEGER NOT NULL,
    "leads" INTEGER NOT NULL,
    "cpc" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cpl" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leads_instagram" INTEGER NOT NULL DEFAULT 0,
    "leads_messenger" INTEGER NOT NULL DEFAULT 0,
    "leads_whatsapp" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "cpm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ctr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cvr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "roas" DOUBLE PRECISION NOT NULL DEFAULT 0,
    CONSTRAINT "CampaignDailyInsight_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CampaignDailyInsight_campaign_id_date_key" ON "CampaignDailyInsight"("campaign_id", "date");
CREATE INDEX IF NOT EXISTS "CampaignDailyInsight_campaign_id_idx" ON "CampaignDailyInsight"("campaign_id");
CREATE INDEX IF NOT EXISTS "CampaignDailyInsight_date_idx" ON "CampaignDailyInsight"("date");

ALTER TABLE "CampaignDailyInsight" DROP CONSTRAINT IF EXISTS "CampaignDailyInsight_campaign_id_fkey";
ALTER TABLE "CampaignDailyInsight" ADD CONSTRAINT "CampaignDailyInsight_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "Campaign"("id") ON DELETE CASCADE;

-- Create AdSetDailyInsight table
CREATE TABLE IF NOT EXISTS "AdSetDailyInsight" (
    "id" TEXT NOT NULL,
    "ad_set_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "spend" DOUBLE PRECISION NOT NULL,
    "impressions" INTEGER NOT NULL,
    "clicks" INTEGER NOT NULL,
    "leads" INTEGER NOT NULL,
    "cpc" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cpl" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leads_instagram" INTEGER NOT NULL DEFAULT 0,
    "leads_messenger" INTEGER NOT NULL DEFAULT 0,
    "leads_whatsapp" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "cpm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ctr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cvr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "roas" DOUBLE PRECISION NOT NULL DEFAULT 0,
    CONSTRAINT "AdSetDailyInsight_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AdSetDailyInsight_ad_set_id_date_key" ON "AdSetDailyInsight"("ad_set_id", "date");
CREATE INDEX IF NOT EXISTS "AdSetDailyInsight_ad_set_id_idx" ON "AdSetDailyInsight"("ad_set_id");
CREATE INDEX IF NOT EXISTS "AdSetDailyInsight_date_idx" ON "AdSetDailyInsight"("date");

ALTER TABLE "AdSetDailyInsight" DROP CONSTRAINT IF EXISTS "AdSetDailyInsight_ad_set_id_fkey";
ALTER TABLE "AdSetDailyInsight" ADD CONSTRAINT "AdSetDailyInsight_ad_set_id_fkey" FOREIGN KEY ("ad_set_id") REFERENCES "AdSet"("id") ON DELETE CASCADE;

-- Create AdDailyInsight table
CREATE TABLE IF NOT EXISTS "AdDailyInsight" (
    "id" TEXT NOT NULL,
    "ad_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "spend" DOUBLE PRECISION NOT NULL,
    "impressions" INTEGER NOT NULL,
    "clicks" INTEGER NOT NULL,
    "leads" INTEGER NOT NULL,
    "cpc" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cpl" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leads_instagram" INTEGER NOT NULL DEFAULT 0,
    "leads_messenger" INTEGER NOT NULL DEFAULT 0,
    "leads_whatsapp" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "cpm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ctr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cvr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "roas" DOUBLE PRECISION NOT NULL DEFAULT 0,
    CONSTRAINT "AdDailyInsight_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AdDailyInsight_ad_id_date_key" ON "AdDailyInsight"("ad_id", "date");
CREATE INDEX IF NOT EXISTS "AdDailyInsight_ad_id_idx" ON "AdDailyInsight"("ad_id");
CREATE INDEX IF NOT EXISTS "AdDailyInsight_date_idx" ON "AdDailyInsight"("date");

ALTER TABLE "AdDailyInsight" DROP CONSTRAINT IF EXISTS "AdDailyInsight_ad_id_fkey";
ALTER TABLE "AdDailyInsight" ADD CONSTRAINT "AdDailyInsight_ad_id_fkey" FOREIGN KEY ("ad_id") REFERENCES "Ad"("id") ON DELETE CASCADE;

-- Create SystemSettings table
CREATE TABLE IF NOT EXISTS "SystemSettings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("key")
);
    `;

    await prisma.$executeRawUnsafe(migrations);
    console.log('✅ Database migrations completed');
}

async function ensureAdminUser() {
    console.log('👤 Ensuring admin user exists...');

    const email = process.env.ADMIN_EMAIL || 'admin@example.com';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            password: hashedPassword,
            name: 'System Admin',
            role: 'ADMIN'
        },
        create: {
            email,
            name: 'System Admin',
            password: hashedPassword,
            role: 'ADMIN'
        }
    });

    console.log('✅ Admin user ready');
    console.log('   Email:', email);
    console.log('   Password:', password);
}

async function main() {
    console.log('🚀 Starting database setup...\n');

    try {
        await runSQLMigrations();
        await ensureAdminUser();

        console.log('\n✅ All migrations completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
