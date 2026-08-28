import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding PawLink database with realistic scenarios...");

  // 1. Clean existing records for clean state
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.locationEvent.deleteMany();
  await prisma.scanEvent.deleteMany();
  await prisma.recoveryEvent.deleteMany();
  await prisma.recoveryCase.deleteMany();
  await prisma.petMedicalRecord.deleteMany();
  await prisma.petPhoto.deleteMany();
  await prisma.tagAssignment.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.notificationJob.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.pet.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  // 2. Create Owner User
  const owner = await prisma.user.create({
    data: {
      name: "Ali Khan",
      email: "owner@pawlink.pet",
      passwordHash,
      phone: "+14155552671",
      role: "OWNER",
      notificationPreference: {
        create: {
          whatsappEnabled: true,
          whatsappVerified: true,
          emailEnabled: true,
          smsEnabled: false,
          pushEnabled: true,
          notificationPhone: "+14155552671",
        },
      },
    },
  });

  // 3. Create Admin User
  const admin = await prisma.user.create({
    data: {
      name: "PawLink Security Admin",
      email: "admin@pawlink.pet",
      passwordHash,
      phone: "+14155550000",
      role: "ADMIN",
      notificationPreference: {
        create: {
          whatsappEnabled: true,
          whatsappVerified: true,
          emailEnabled: true,
        },
      },
    },
  });

  console.log(`✓ Created Owner (${owner.email}) & Admin (${admin.email})`);

  // 4. Create Pet 1: Max (Lost Mode Active with Scan & Location History)
  const max = await prisma.pet.create({
    data: {
      userId: owner.id,
      name: "Max",
      species: "Dog",
      breed: "Golden Retriever",
      gender: "Male",
      color: "Golden",
      photoUrl: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&auto=format&fit=crop&q=80",
      microchipNumber: "985141001234567",
      personality: "Friendly, gentle, loves children and tennis balls.",
      specialInstructions: "Responds eagerly to 'treat' and 'sit'. Please do not yell.",
      status: "LOST",
      allowWhatsApp: true,
      allowPhoneCall: true,
      allowInAppChat: true,
      hideOwnerPhone: true,
      medicalRecords: {
        create: [
          {
            recordType: "ALLERGY",
            title: "Severe Allergy to Chicken",
            description: "Causes immediate hives and upset stomach. Only feed beef or fish.",
            isPublicAlert: true,
          },
          {
            recordType: "VACCINATION",
            title: "Rabies Core Vaccine",
            description: "Administered at Clifton Veterinary Clinic",
            dateAdministered: new Date("2026-01-15"),
            nextDueDate: new Date("2027-01-15"),
            veterinarian: "Dr. Samira Qureshi",
            isPublicAlert: false,
          },
        ],
      },
    },
  });

  // Create Tag for Max
  const maxTag = await prisma.tag.create({
    data: {
      tagCode: "PW-7KX9Q2M8F4R6T1",
      qrUrl: "http://localhost:3000/p/PW-7KX9Q2M8F4R6T1",
      label: "Max's Primary Collar Tag",
      status: "ACTIVE",
      scanCount: 8,
      lastScannedAt: new Date(),
      assignments: {
        create: {
          petId: max.id,
          assignedById: owner.id,
        },
      },
    },
  });

  // Create Active RecoveryCase for Max
  const maxCase = await prisma.recoveryCase.create({
    data: {
      petId: max.id,
      status: "OPEN",
      startedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      lastSeenAt: new Date(Date.now() - 3.5 * 60 * 60 * 1000),
      lastSeenLocation: "Near Clifton Beach Park, Karachi",
      lastSeenLatitude: 24.8138,
      lastSeenLongitude: 67.0299,
      rewardAmount: 500,
      description: "Max slipped out through the side garden gate. He is friendly but may be disoriented.",
    },
  });

  // Create Location Events for Max
  const loc1 = await prisma.locationEvent.create({
    data: {
      recoveryCaseId: maxCase.id,
      latitude: 24.8165,
      longitude: 67.0325,
      accuracy: 12.5,
      addressName: "Near Beach Avenue Cafe, Clifton",
      sharedByFinder: true,
      finderNote: "Spotted Max drinking water near the beach walkway cafe.",
      finderContact: "+15550192837",
    },
  });

  // Create Recovery Events for Max Timeline
  await prisma.recoveryEvent.createMany({
    data: [
      {
        petId: max.id,
        recoveryCaseId: maxCase.id,
        type: "LOST_MODE_ACTIVATED",
        actorType: "OWNER",
        actorId: owner.id,
        title: "Lost Mode Broadcast Activated",
        description: "Owner reported Max missing near Clifton Beach Park. Reward: $500.",
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      },
      {
        petId: max.id,
        recoveryCaseId: maxCase.id,
        type: "TAG_SCANNED",
        actorType: "FINDER",
        title: "Collar Tag Scanned",
        description: "Max's QR tag was scanned by a finder on an iPhone (iOS).",
        metadata: JSON.stringify({ deviceType: "iOS", userAgentCategory: "Mobile" }),
        createdAt: new Date(Date.now() - 45 * 60 * 1000),
      },
      {
        petId: max.id,
        recoveryCaseId: maxCase.id,
        type: "LOCATION_SHARED",
        actorType: "FINDER",
        title: "📍 Finder Shared GPS Location",
        description: "Finder shared GPS coordinates near Beach Avenue Cafe (~12m accuracy).",
        metadata: JSON.stringify({ latitude: 24.8165, longitude: 67.0325, accuracy: 12.5 }),
        createdAt: new Date(Date.now() - 42 * 60 * 1000),
      },
    ],
  });

  // Create Conversation for Max
  const conversation = await prisma.conversation.create({
    data: {
      petId: max.id,
      recoveryCaseId: maxCase.id,
      finderToken: "0a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef",
      finderName: "Sarah (Beach Walker)",
      finderPhone: "+15550192837",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: "OPEN",
      messages: {
        create: [
          {
            senderType: "FINDER",
            content: "Hi! I just found Max sitting near the beach cafe. He is drinking some water and seems very friendly.",
            createdAt: new Date(Date.now() - 40 * 60 * 1000),
          },
          {
            senderType: "OWNER",
            content: "Thank God! Thank you so much Sarah, I am 5 minutes away in my car. Please keep him safe!",
            createdAt: new Date(Date.now() - 35 * 60 * 1000),
          },
        ],
      },
    },
  });

  // 5. Create Pet 2: Luna (Safe Siamese Cat)
  const luna = await prisma.pet.create({
    data: {
      userId: owner.id,
      name: "Luna",
      species: "Cat",
      breed: "Siamese",
      gender: "Female",
      color: "Seal Point / Cream",
      photoUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&auto=format&fit=crop&q=80",
      microchipNumber: "985141009876543",
      personality: "Calm, vocal, enjoys sunny window perches.",
      status: "SAFE",
      allowWhatsApp: true,
      allowInAppChat: true,
      hideOwnerPhone: true,
      medicalRecords: {
        create: [
          {
            recordType: "VACCINATION",
            title: "FVRCP Core Cat Vaccine",
            dateAdministered: new Date("2026-02-10"),
            nextDueDate: new Date("2027-02-10"),
            veterinarian: "Dr. Samira Qureshi",
            isPublicAlert: false,
          },
        ],
      },
    },
  });

  await prisma.tag.create({
    data: {
      tagCode: "PW-9ML4B7X2N1C8K3",
      qrUrl: "http://localhost:3000/p/PW-9ML4B7X2N1C8K3",
      label: "Luna's Breakaway Collar Tag",
      status: "ACTIVE",
      scanCount: 2,
      assignments: {
        create: {
          petId: luna.id,
          assignedById: owner.id,
        },
      },
    },
  });

  // 6. Create Pet 3: Milo (Safe Beagle)
  const milo = await prisma.pet.create({
    data: {
      userId: owner.id,
      name: "Milo",
      species: "Dog",
      breed: "Beagle",
      gender: "Male",
      color: "Tri-color",
      photoUrl: "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=600&auto=format&fit=crop&q=80",
      status: "SAFE",
      allowWhatsApp: true,
      allowInAppChat: true,
    },
  });

  await prisma.tag.create({
    data: {
      tagCode: "PW-3DJ8R6K5T9V2W7",
      qrUrl: "http://localhost:3000/p/PW-3DJ8R6K5T9V2W7",
      label: "Milo's Sport Collar Tag",
      status: "ACTIVE",
      scanCount: 1,
      assignments: {
        create: {
          petId: milo.id,
          assignedById: owner.id,
        },
      },
    },
  });

  console.log("✅ Database successfully seeded with 3 pets, active tags, lost recovery scenario, and conversations!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
