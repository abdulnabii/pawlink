-- =========================================================
-- PAWLINK COMPLETE POSTGRESQL PRODUCTION SCHEMA
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/gqqzcznxncatfovulmtp/sql)
-- =========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT PRIMARY KEY,
    "authUserId" TEXT UNIQUE,
    "email" TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "role" TEXT NOT NULL DEFAULT 'OWNER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Pets
CREATE TABLE IF NOT EXISTS "Pet" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "breed" TEXT,
    "gender" TEXT,
    "birthDate" TIMESTAMP(3),
    "weight" DOUBLE PRECISION,
    "color" TEXT,
    "photoUrl" TEXT,
    "microchipNumber" TEXT,
    "personality" TEXT,
    "specialInstructions" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SAFE',
    "contactPhone" TEXT,
    "allowWhatsApp" BOOLEAN NOT NULL DEFAULT true,
    "allowPhoneCall" BOOLEAN NOT NULL DEFAULT false,
    "allowInAppChat" BOOLEAN NOT NULL DEFAULT true,
    "hideOwnerPhone" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tags
CREATE TABLE IF NOT EXISTS "Tag" (
    "id" TEXT PRIMARY KEY,
    "tagCode" TEXT NOT NULL UNIQUE,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "qrUrl" TEXT NOT NULL,
    "label" TEXT,
    "activationPin" TEXT,
    "scanCount" INTEGER NOT NULL DEFAULT 0,
    "lastScannedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tag Assignments
CREATE TABLE IF NOT EXISTS "TagAssignment" (
    "id" TEXT PRIMARY KEY,
    "tagId" TEXT NOT NULL REFERENCES "Tag"("id") ON DELETE CASCADE,
    "petId" TEXT NOT NULL REFERENCES "Pet"("id") ON DELETE CASCADE,
    "assignedById" TEXT NOT NULL REFERENCES "User"("id"),
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unassignedAt" TIMESTAMP(3)
);

-- 5. Recovery Cases (Lost Mode)
CREATE TABLE IF NOT EXISTS "RecoveryCase" (
    "id" TEXT PRIMARY KEY,
    "petId" TEXT NOT NULL REFERENCES "Pet"("id") ON DELETE CASCADE,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenLocation" TEXT,
    "lastSeenLatitude" DOUBLE PRECISION,
    "lastSeenLongitude" DOUBLE PRECISION,
    "rewardAmount" DECIMAL(65,30) DEFAULT 0,
    "description" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolutionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Location Events (Finder GPS Pins)
CREATE TABLE IF NOT EXISTS "LocationEvent" (
    "id" TEXT PRIMARY KEY,
    "recoveryCaseId" TEXT REFERENCES "RecoveryCase"("id") ON DELETE SET NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "addressName" TEXT,
    "locationConsentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "locationExpiresAt" TIMESTAMP(3),
    "sharedByFinder" BOOLEAN NOT NULL DEFAULT true,
    "finderNote" TEXT,
    "finderContact" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. Recovery Events (Timeline)
CREATE TABLE IF NOT EXISTS "RecoveryEvent" (
    "id" TEXT PRIMARY KEY,
    "petId" TEXT NOT NULL REFERENCES "Pet"("id") ON DELETE CASCADE,
    "recoveryCaseId" TEXT REFERENCES "RecoveryCase"("id") ON DELETE SET NULL,
    "type" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "actorId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. Scan Events (Telemetry)
CREATE TABLE IF NOT EXISTS "ScanEvent" (
    "id" TEXT PRIMARY KEY,
    "tagId" TEXT NOT NULL REFERENCES "Tag"("id") ON DELETE CASCADE,
    "recoveryCaseId" TEXT REFERENCES "RecoveryCase"("id") ON DELETE SET NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isTestScan" BOOLEAN NOT NULL DEFAULT false,
    "ipHash" TEXT NOT NULL,
    "idempotencyKey" TEXT UNIQUE,
    "userAgentCategory" TEXT,
    "deviceType" TEXT,
    "browser" TEXT,
    "country" TEXT,
    "city" TEXT,
    "approximateLocation" TEXT,
    "scanSource" TEXT NOT NULL DEFAULT 'QR',
    "notificationSent" BOOLEAN NOT NULL DEFAULT false
);

-- 9. Conversations & Messages
CREATE TABLE IF NOT EXISTS "Conversation" (
    "id" TEXT PRIMARY KEY,
    "petId" TEXT NOT NULL REFERENCES "Pet"("id") ON DELETE CASCADE,
    "recoveryCaseId" TEXT REFERENCES "RecoveryCase"("id") ON DELETE SET NULL,
    "finderToken" TEXT NOT NULL UNIQUE,
    "finderName" TEXT,
    "finderPhone" TEXT,
    "finderSessionHash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastFinderActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastOwnerActivity" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Message" (
    "id" TEXT PRIMARY KEY,
    "conversationId" TEXT NOT NULL REFERENCES "Conversation"("id") ON DELETE CASCADE,
    "senderType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "photoUrl" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 10. Medical Records
CREATE TABLE IF NOT EXISTS "PetMedicalRecord" (
    "id" TEXT PRIMARY KEY,
    "petId" TEXT NOT NULL REFERENCES "Pet"("id") ON DELETE CASCADE,
    "recordType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dateAdministered" TIMESTAMP(3),
    "nextDueDate" TIMESTAMP(3),
    "veterinarian" TEXT,
    "documentUrl" TEXT,
    "isPublicAlert" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 11. Notification Preferences
CREATE TABLE IF NOT EXISTS "NotificationPreference" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
    "whatsappEnabled" BOOLEAN NOT NULL DEFAULT true,
    "whatsappVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnScan" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnLocation" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnMessage" BOOLEAN NOT NULL DEFAULT true,
    "notificationPhone" TEXT
);

-- 12. Pre-seed Default Demo Accounts
INSERT INTO "User" ("id", "email", "passwordHash", "name", "phone", "role")
VALUES 
    ('usr_owner_001', 'owner@pawlink.pet', '$2a$10$fWvB30K5R7pW4N9y0lU5mOI6iO0m/v2R3hP3E0gY5e8G9d6c7b8a.', 'Ali Khan', '+14155552671', 'OWNER'),
    ('usr_admin_001', 'admin@pawlink.pet', '$2a$10$fWvB30K5R7pW4N9y0lU5mOI6iO0m/v2R3hP3E0gY5e8G9d6c7b8a.', 'PawLink Admin', NULL, 'ADMIN')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Pet" ("id", "userId", "name", "species", "breed", "color", "status", "photoUrl")
VALUES 
    ('pet_max_001', 'usr_owner_001', 'Max', 'Dog', 'Golden Retriever', 'Golden', 'LOST', 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&auto=format&fit=crop&q=80'),
    ('pet_luna_002', 'usr_owner_001', 'Luna', 'Cat', 'Siamese', 'Cream / Seal Point', 'SAFE', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&auto=format&fit=crop&q=80'),
    ('pet_milo_003', 'usr_owner_001', 'Milo', 'Dog', 'Beagle', 'Tri-color', 'SAFE', 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=600&auto=format&fit=crop&q=80')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Tag" ("id", "tagCode", "status", "qrUrl", "label", "scanCount")
VALUES 
    ('tag_max_001', 'PW-7KX9Q2M8F4R6T1', 'ACTIVE', 'https://pawlink-chi.vercel.app/p/PW-7KX9Q2M8F4R6T1', 'Max Primary Collar Tag', 16),
    ('tag_luna_002', 'PW-9ML4B7X2N1C8K3', 'ACTIVE', 'https://pawlink-chi.vercel.app/p/PW-9ML4B7X2N1C8K3', 'Luna Breakaway Tag', 3),
    ('tag_milo_003', 'PW-3DJ8R6K5T9V2W7', 'ACTIVE', 'https://pawlink-chi.vercel.app/p/PW-3DJ8R6K5T9V2W7', 'Milo Sport Tag', 1)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "TagAssignment" ("id", "tagId", "petId", "assignedById")
VALUES 
    ('asgn_1', 'tag_max_001', 'pet_max_001', 'usr_owner_001'),
    ('asgn_2', 'tag_luna_002', 'pet_luna_002', 'usr_owner_001'),
    ('asgn_3', 'tag_milo_003', 'pet_milo_003', 'usr_owner_001')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "NotificationPreference" ("id", "userId", "whatsappEnabled", "whatsappVerified", "notificationPhone")
VALUES ('pref_usr_owner_001', 'usr_owner_001', true, true, '+14155552671')
ON CONFLICT ("id") DO NOTHING;
