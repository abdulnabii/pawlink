-- Run this in Supabase SQL Editor → https://supabase.com/dashboard/project/gqqzcznxncatfovulmtp/sql
-- This adds the new tables for Phase 1-4 features

-- 1. Add vetAccessToken to Pet table
ALTER TABLE "Pet" 
  ADD COLUMN IF NOT EXISTS "vetAccessToken" TEXT,
  ADD COLUMN IF NOT EXISTS "vetTokenExpiresAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "Pet_vetAccessToken_key" ON "Pet"("vetAccessToken");

-- 2. Push Subscriptions table (browser push notifications)
CREATE TABLE IF NOT EXISTS "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");
CREATE INDEX IF NOT EXISTS "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- 3. Community Scout table (neighborhood recovery network)
CREATE TABLE IF NOT EXISTS "CommunityScout" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "radiusKm" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "alertsReceived" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommunityScout_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CommunityScout_userId_idx" ON "CommunityScout"("userId");
CREATE INDEX IF NOT EXISTS "CommunityScout_isActive_idx" ON "CommunityScout"("isActive");
