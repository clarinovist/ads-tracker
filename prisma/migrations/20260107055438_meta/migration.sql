-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MEDIA_BUYER', 'VIEWER');

-- DropForeignKey
ALTER TABLE "DailyInsight" DROP CONSTRAINT "DailyInsight_business_id_fkey";

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "access_token" TEXT;

-- AlterTable
ALTER TABLE "DailyInsight" ADD COLUMN     "conversions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "cpm" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "ctr" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "cvr" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "leads_instagram" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "leads_messenger" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "leads_whatsapp" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "roas" DOUBLE PRECISION NOT NULL DEFAULT 0,
ALTER COLUMN "hook_rate" SET DEFAULT 0,
ALTER COLUMN "hold_rate" SET DEFAULT 0,
ALTER COLUMN "cpc" SET DEFAULT 0,
ALTER COLUMN "cpl" SET DEFAULT 0;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
    "password" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessUser" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "objective" TEXT,
    "status" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdSet" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ad" (
    "id" TEXT NOT NULL,
    "ad_set_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "creative_type" TEXT,
    "creative_url" TEXT,
    "thumbnail_url" TEXT,
    "creative_body" TEXT,
    "creative_title" TEXT,
    "creative_dynamic_data" JSONB,

    CONSTRAINT "Ad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignDailyInsight" (
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

-- CreateTable
CREATE TABLE "AdSetDailyInsight" (
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

-- CreateTable
CREATE TABLE "AdDailyInsight" (
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

-- CreateTable
CREATE TABLE "SystemSettings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "BusinessUser_business_id_idx" ON "BusinessUser"("business_id");

-- CreateIndex
CREATE INDEX "BusinessUser_user_id_idx" ON "BusinessUser"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessUser_business_id_user_id_key" ON "BusinessUser"("business_id", "user_id");

-- CreateIndex
CREATE INDEX "Campaign_business_id_idx" ON "Campaign"("business_id");

-- CreateIndex
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");

-- CreateIndex
CREATE INDEX "AdSet_campaign_id_idx" ON "AdSet"("campaign_id");

-- CreateIndex
CREATE INDEX "AdSet_status_idx" ON "AdSet"("status");

-- CreateIndex
CREATE INDEX "Ad_ad_set_id_idx" ON "Ad"("ad_set_id");

-- CreateIndex
CREATE INDEX "Ad_status_idx" ON "Ad"("status");

-- CreateIndex
CREATE INDEX "Ad_creative_type_idx" ON "Ad"("creative_type");

-- CreateIndex
CREATE INDEX "CampaignDailyInsight_campaign_id_idx" ON "CampaignDailyInsight"("campaign_id");

-- CreateIndex
CREATE INDEX "CampaignDailyInsight_date_idx" ON "CampaignDailyInsight"("date");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignDailyInsight_campaign_id_date_key" ON "CampaignDailyInsight"("campaign_id", "date");

-- CreateIndex
CREATE INDEX "AdSetDailyInsight_ad_set_id_idx" ON "AdSetDailyInsight"("ad_set_id");

-- CreateIndex
CREATE INDEX "AdSetDailyInsight_date_idx" ON "AdSetDailyInsight"("date");

-- CreateIndex
CREATE UNIQUE INDEX "AdSetDailyInsight_ad_set_id_date_key" ON "AdSetDailyInsight"("ad_set_id", "date");

-- CreateIndex
CREATE INDEX "AdDailyInsight_ad_id_idx" ON "AdDailyInsight"("ad_id");

-- CreateIndex
CREATE INDEX "AdDailyInsight_date_idx" ON "AdDailyInsight"("date");

-- CreateIndex
CREATE UNIQUE INDEX "AdDailyInsight_ad_id_date_key" ON "AdDailyInsight"("ad_id", "date");

-- CreateIndex
CREATE INDEX "Business_is_active_idx" ON "Business"("is_active");

-- AddForeignKey
ALTER TABLE "BusinessUser" ADD CONSTRAINT "BusinessUser_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessUser" ADD CONSTRAINT "BusinessUser_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdSet" ADD CONSTRAINT "AdSet_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ad" ADD CONSTRAINT "Ad_ad_set_id_fkey" FOREIGN KEY ("ad_set_id") REFERENCES "AdSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyInsight" ADD CONSTRAINT "DailyInsight_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignDailyInsight" ADD CONSTRAINT "CampaignDailyInsight_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdSetDailyInsight" ADD CONSTRAINT "AdSetDailyInsight_ad_set_id_fkey" FOREIGN KEY ("ad_set_id") REFERENCES "AdSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdDailyInsight" ADD CONSTRAINT "AdDailyInsight_ad_id_fkey" FOREIGN KEY ("ad_id") REFERENCES "Ad"("id") ON DELETE CASCADE ON UPDATE CASCADE;
