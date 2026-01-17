-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MEDIA_BUYER', 'VIEWER');

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
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ad_account_id" TEXT NOT NULL,
    "color_code" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "access_token" TEXT,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "DailyInsight" (
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

-- CreateTable
CREATE TABLE "AnalysisHistory" (
    "id" TEXT NOT NULL,
    "prompt" TEXT,
    "response" TEXT NOT NULL,
    "messages" JSONB,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "date_from" TIMESTAMP(3) NOT NULL,
    "date_to" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalysisHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "created_time" TIMESTAMP(3) NOT NULL,
    "ad_id" TEXT,
    "ad_name" TEXT,
    "business_id" TEXT NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HourlyStat" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "hour" INTEGER NOT NULL,
    "spend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "messaging_conversations" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "HourlyStat_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "Business_ad_account_id_key" ON "Business"("ad_account_id");

-- CreateIndex
CREATE INDEX "Business_created_at_idx" ON "Business"("created_at");

-- CreateIndex
CREATE INDEX "Business_is_active_idx" ON "Business"("is_active");

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
CREATE INDEX "DailyInsight_business_id_idx" ON "DailyInsight"("business_id");

-- CreateIndex
CREATE INDEX "DailyInsight_date_idx" ON "DailyInsight"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyInsight_business_id_date_key" ON "DailyInsight"("business_id", "date");

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
CREATE INDEX "AnalysisHistory_created_at_idx" ON "AnalysisHistory"("created_at");

-- CreateIndex
CREATE INDEX "Lead_business_id_idx" ON "Lead"("business_id");

-- CreateIndex
CREATE INDEX "Lead_created_time_idx" ON "Lead"("created_time");

-- CreateIndex
CREATE INDEX "HourlyStat_business_id_idx" ON "HourlyStat"("business_id");

-- CreateIndex
CREATE INDEX "HourlyStat_date_idx" ON "HourlyStat"("date");

-- CreateIndex
CREATE UNIQUE INDEX "HourlyStat_business_id_date_hour_key" ON "HourlyStat"("business_id", "date", "hour");

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

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HourlyStat" ADD CONSTRAINT "HourlyStat_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

