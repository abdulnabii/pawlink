import bcrypt from "bcryptjs";

// Initial Demo Seed State
const defaultPasswordHash = "$2a$10$wN1rXp0w3.C0b4s1KjBVOeXzN7hQo.2w1eY4a5b6c7d8e9f0g1h2i"; // 'password123'

export class ResilientDataStore {
  private users: any[] = [];
  private pets: any[] = [];
  private tags: any[] = [];
  private tagAssignments: any[] = [];
  private recoveryCases: any[] = [];
  private recoveryEvents: any[] = [];
  private scanEvents: any[] = [];
  private locationEvents: any[] = [];
  private conversations: any[] = [];
  private messages: any[] = [];
  private notifications: any[] = [];
  private notificationJobs: any[] = [];
  private auditLogs: any[] = [];

  constructor() {
    this.initSeed();
  }

  private initSeed() {
    const ownerId = "usr_owner_001";
    const adminId = "usr_admin_001";

    this.users = [
      {
        id: ownerId,
        email: "owner@pawlink.pet",
        passwordHash: "$2a$10$fWvB30K5R7pW4N9y0lU5mOI6iO0m/v2R3hP3E0gY5e8G9d6c7b8a.", // password123
        name: "Ali Khan",
        phone: "+14155552671",
        role: "OWNER",
        createdAt: new Date(),
        updatedAt: new Date(),
        notificationPreference: {
          whatsappEnabled: true,
          whatsappVerified: true,
          emailEnabled: true,
          notificationPhone: "+14155552671",
        },
      },
      {
        id: adminId,
        email: "admin@pawlink.pet",
        passwordHash: "$2a$10$fWvB30K5R7pW4N9y0lU5mOI6iO0m/v2R3hP3E0gY5e8G9d6c7b8a.", // password123
        name: "PawLink Admin",
        role: "ADMIN",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const maxId = "pet_max_001";
    const lunaId = "pet_luna_002";
    const miloId = "pet_milo_003";

    this.pets = [
      {
        id: maxId,
        userId: ownerId,
        name: "Max",
        species: "Dog",
        breed: "Golden Retriever",
        gender: "Male",
        color: "Golden",
        photoUrl: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&auto=format&fit=crop&q=80",
        personality: "Friendly, loves treats, gentle with children",
        specialInstructions: "Responds to sit and shake. Allergic to chicken.",
        status: "LOST",
        allowWhatsApp: true,
        allowPhoneCall: true,
        allowInAppChat: true,
        hideOwnerPhone: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        medicalRecords: [
          {
            id: "med_01",
            recordType: "ALLERGY",
            title: "Severe Allergy to Chicken",
            description: "Feed only beef or fish",
            isPublicAlert: true,
          },
        ],
      },
      {
        id: lunaId,
        userId: ownerId,
        name: "Luna",
        species: "Cat",
        breed: "Siamese",
        gender: "Female",
        color: "Cream / Seal Point",
        photoUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&auto=format&fit=crop&q=80",
        personality: "Calm, vocal, affectionate",
        status: "SAFE",
        allowWhatsApp: true,
        allowInAppChat: true,
        hideOwnerPhone: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        medicalRecords: [],
      },
      {
        id: miloId,
        userId: ownerId,
        name: "Milo",
        species: "Dog",
        breed: "Beagle",
        gender: "Male",
        color: "Tri-color",
        photoUrl: "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=600&auto=format&fit=crop&q=80",
        status: "SAFE",
        allowWhatsApp: true,
        allowInAppChat: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        medicalRecords: [],
      },
    ];

    const tagMax = {
      id: "tag_max_001",
      tagCode: "PW-7KX9Q2M8F4R6T1",
      status: "ACTIVE",
      qrUrl: "https://pawlink.pet/p/PW-7KX9Q2M8F4R6T1",
      label: "Max's Primary Collar Tag",
      scanCount: 12,
      lastScannedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const tagLuna = {
      id: "tag_luna_002",
      tagCode: "PW-9ML4B7X2N1C8K3",
      status: "ACTIVE",
      qrUrl: "https://pawlink.pet/p/PW-9ML4B7X2N1C8K3",
      label: "Luna's Breakaway Tag",
      scanCount: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const tagMilo = {
      id: "tag_milo_003",
      tagCode: "PW-3DJ8R6K5T9V2W7",
      status: "ACTIVE",
      qrUrl: "https://pawlink.pet/p/PW-3DJ8R6K5T9V2W7",
      label: "Milo's Sport Tag",
      scanCount: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.tags = [tagMax, tagLuna, tagMilo];

    this.tagAssignments = [
      { id: "asgn_1", tagId: tagMax.id, petId: maxId, assignedById: ownerId, assignedAt: new Date() },
      { id: "asgn_2", tagId: tagLuna.id, petId: lunaId, assignedById: ownerId, assignedAt: new Date() },
      { id: "asgn_3", tagId: tagMilo.id, petId: miloId, assignedById: ownerId, assignedAt: new Date() },
    ];

    const case1 = {
      id: "case_max_001",
      petId: maxId,
      status: "OPEN",
      startedAt: new Date(Date.now() - 3 * 3600 * 1000),
      lastSeenAt: new Date(Date.now() - 3.5 * 3600 * 1000),
      lastSeenLocation: "Near Clifton Beach Park, Karachi",
      lastSeenLatitude: 24.8138,
      lastSeenLongitude: 67.0299,
      rewardAmount: 500,
      description: "Max slipped out through the garden gate. He is very friendly.",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.recoveryCases = [case1];

    this.locationEvents = [
      {
        id: "loc_001",
        recoveryCaseId: case1.id,
        latitude: 24.8165,
        longitude: 67.0325,
        accuracy: 12.5,
        addressName: "Near Beach Avenue Cafe, Clifton",
        sharedByFinder: true,
        finderNote: "Spotted Max drinking water near the beach cafe.",
        finderContact: "+15550192837",
        createdAt: new Date(Date.now() - 40 * 60 * 1000),
      },
    ];

    this.recoveryEvents = [
      {
        id: "ev_1",
        petId: maxId,
        recoveryCaseId: case1.id,
        type: "LOST_MODE_ACTIVATED",
        actorType: "OWNER",
        actorId: ownerId,
        title: "Lost Mode Activated",
        description: "Owner reported Max missing near Clifton Beach Park. Reward: $500.",
        createdAt: new Date(Date.now() - 3 * 3600 * 1000),
      },
      {
        id: "ev_2",
        petId: maxId,
        recoveryCaseId: case1.id,
        type: "TAG_SCANNED",
        actorType: "FINDER",
        title: "Collar Tag Scanned",
        description: "Max's QR collar tag was scanned by a finder on an iPhone.",
        createdAt: new Date(Date.now() - 45 * 60 * 1000),
      },
      {
        id: "ev_3",
        petId: maxId,
        recoveryCaseId: case1.id,
        type: "LOCATION_SHARED",
        actorType: "FINDER",
        title: "📍 Finder Shared GPS Location",
        description: "Finder shared GPS coordinates near Beach Avenue Cafe (~12m accuracy).",
        createdAt: new Date(Date.now() - 40 * 60 * 1000),
      },
    ];

    this.conversations = [
      {
        id: "conv_001",
        petId: maxId,
        recoveryCaseId: case1.id,
        finderToken: "0a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef",
        finderName: "Sarah (Beach Walker)",
        finderPhone: "+15550192837",
        status: "OPEN",
        expiresAt: new Date(Date.now() + 7 * 86400 * 1000),
        lastFinderActivity: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: [
          {
            id: "msg_1",
            conversationId: "conv_001",
            senderType: "FINDER",
            content: "Hi! I just found Max sitting near the beach cafe. He is drinking some water and seems very friendly.",
            createdAt: new Date(Date.now() - 40 * 60 * 1000),
          },
          {
            id: "msg_2",
            conversationId: "conv_001",
            senderType: "OWNER",
            content: "Thank God! Thank you so much Sarah, I am 5 minutes away in my car. Please keep him safe!",
            createdAt: new Date(Date.now() - 35 * 60 * 1000),
          },
        ],
      },
    ];
  }

  // --- USER METHODS ---
  async findUserUnique(args: any) {
    if (args.where.id) return this.users.find((u) => u.id === args.where.id) || null;
    if (args.where.email) return this.users.find((u) => u.email.toLowerCase() === args.where.email.toLowerCase()) || null;
    if (args.where.authUserId) return this.users.find((u) => u.authUserId === args.where.authUserId) || null;
    return null;
  }

  async findUserFirst(args: any) {
    if (args?.where?.OR) {
      for (const cond of args.where.OR) {
        const found = await this.findUserUnique({ where: cond });
        if (found) return found;
      }
    }
    return this.findUserUnique(args);
  }

  async createUser(args: any) {
    const user = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...args.data,
      createdAt: new Date(),
      updatedAt: new Date(),
      notificationPreference: args.data.notificationPreference?.create || {
        whatsappEnabled: true,
        whatsappVerified: false,
        emailEnabled: true,
      },
    };
    this.users.push(user);
    return user;
  }

  async updateUser(args: any) {
    const user = await this.findUserUnique(args);
    if (!user) return null;
    Object.assign(user, args.data, { updatedAt: new Date() });
    return user;
  }

  // --- PET METHODS ---
  async findPets(args?: any) {
    let result = [...this.pets];
    if (args?.where?.userId) {
      result = result.filter((p) => p.userId === args.where.userId);
    }
    return result.map((p) => this.hydratePet(p));
  }

  async findPetFirst(args: any) {
    const pets = await this.findPets(args);
    if (args?.where?.id) {
      return pets.find((p) => p.id === args.where.id) || null;
    }
    return pets[0] || null;
  }

  async createPet(args: any) {
    const pet = {
      id: `pet_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...args.data,
      medicalRecords: args.data.medicalRecords?.create || [],
      photos: args.data.photos?.create || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.pets.push(pet);
    return this.hydratePet(pet);
  }

  async updatePet(args: any) {
    const pet = this.pets.find((p) => p.id === args.where.id);
    if (!pet) return null;
    Object.assign(pet, args.data, { updatedAt: new Date() });
    return this.hydratePet(pet);
  }

  private hydratePet(pet: any) {
    const assignments = this.tagAssignments
      .filter((a) => a.petId === pet.id && !a.unassignedAt)
      .map((a) => {
        const tag = this.tags.find((t) => t.id === a.tagId);
        return { ...a, tag };
      });

    const recoveryCases = this.recoveryCases
      .filter((c) => c.petId === pet.id)
      .map((c) => {
        const locationEvents = this.locationEvents.filter((l) => l.recoveryCaseId === c.id);
        const conversations = this.conversations.filter((cv) => cv.recoveryCaseId === c.id);
        return { ...c, locationEvents, conversations };
      });

    const recoveryEvents = this.recoveryEvents.filter((e) => e.petId === pet.id);
    const conversations = this.conversations.filter((cv) => cv.petId === pet.id);

    return {
      ...pet,
      tagAssignments: assignments,
      recoveryCases,
      recoveryEvents,
      conversations,
      medicalRecords: pet.medicalRecords || [],
      photos: pet.photos || [],
    };
  }

  // --- TAG METHODS ---
  async findTagFirst(args: any) {
    if (args?.where?.tagCode) {
      const tag = this.tags.find((t) => t.tagCode.toUpperCase() === args.where.tagCode.toUpperCase());
      if (!tag) return null;
      return this.hydrateTag(tag);
    }
    if (args?.where?.id) {
      const tag = this.tags.find((t) => t.id === args.where.id);
      if (!tag) return null;
      return this.hydrateTag(tag);
    }
    return null;
  }

  async findTags(args?: any) {
    return this.tags.map((t) => this.hydrateTag(t));
  }

  async createTag(args: any) {
    const tag = {
      id: `tag_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...args.data,
      scanCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.tags.push(tag);
    return this.hydrateTag(tag);
  }

  async updateTag(args: any) {
    const tag = this.tags.find((t) => t.id === args.where.id);
    if (!tag) return null;
    Object.assign(tag, args.data, { updatedAt: new Date() });
    return this.hydrateTag(tag);
  }

  private hydrateTag(tag: any) {
    const assignments = this.tagAssignments
      .filter((a) => a.tagId === tag.id && !a.unassignedAt)
      .map((a) => {
        const pet = this.pets.find((p) => p.id === a.petId);
        return {
          ...a,
          pet: pet
            ? {
                ...pet,
                recoveryCases: this.recoveryCases.filter((c) => c.petId === pet.id && c.status === "OPEN"),
                medicalRecords: pet.medicalRecords || [],
              }
            : null,
        };
      });

    return {
      ...tag,
      assignments,
      scanEvents: this.scanEvents.filter((s) => s.tagId === tag.id),
    };
  }

  // --- RECOVERY / TIMELINE ---
  async createRecoveryEvent(args: any) {
    const ev = {
      id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...args.data,
      createdAt: new Date(),
    };
    this.recoveryEvents.push(ev);
    return ev;
  }

  async createScanEvent(args: any) {
    const scan = {
      id: `scan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...args.data,
      timestamp: new Date(),
    };
    this.scanEvents.push(scan);

    // Update tag scan count
    const tag = this.tags.find((t) => t.id === args.data.tagId);
    if (tag) {
      tag.scanCount = (tag.scanCount || 0) + 1;
      tag.lastScannedAt = new Date();
    }

    return scan;
  }

  async createRecoveryCase(args: any) {
    const caseId = `case_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const c = {
      id: caseId,
      petId: args.data.petId,
      status: args.data.status || "OPEN",
      lastSeenLocation: args.data.lastSeenLocation || null,
      lastSeenLatitude: args.data.lastSeenLatitude || null,
      lastSeenLongitude: args.data.lastSeenLongitude || null,
      rewardAmount: args.data.rewardAmount || 0,
      description: args.data.description || null,
      startedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      locationEvents: [],
    };
    this.recoveryCases.push(c);
    return c;
  }

  async createLocationEvent(args: any) {
    const loc = {
      id: `loc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...args.data,
      createdAt: new Date(),
    };
    this.locationEvents.push(loc);

    if (args.data?.recoveryCaseId) {
      const rc = this.recoveryCases.find((c) => c.id === args.data.recoveryCaseId);
      if (rc) {
        if (!rc.locationEvents) rc.locationEvents = [];
        rc.locationEvents.push(loc);
      }
    }

    return loc;
  }

  // --- CONVERSATION & CHAT METHODS ---
  async findConversations(args?: any) {
    let list = [...this.conversations];
    if (args?.where?.pet?.userId) {
      const ownerPets = this.pets.filter((p) => p.userId === args.where.pet.userId).map((p) => p.id);
      list = list.filter((c) => ownerPets.includes(c.petId));
    }
    if (args?.where?.petId) {
      list = list.filter((c) => c.petId === args.where.petId);
    }
    return list.map((c) => this.hydrateConversation(c));
  }

  async findConversationUnique(args: any) {
    if (args?.where?.id) {
      const c = this.conversations.find((conv) => conv.id === args.where.id);
      return c ? this.hydrateConversation(c) : null;
    }
    if (args?.where?.finderToken) {
      const c = this.conversations.find((conv) => conv.finderToken === args.where.finderToken);
      return c ? this.hydrateConversation(c) : null;
    }
    return null;
  }

  private hydrateConversation(conv: any) {
    const pet = this.pets.find((p) => p.id === conv.petId);
    const msgs = this.messages
      .filter((m) => m.conversationId === conv.id)
      .concat(conv.messages || []);
    // Deduplicate messages by ID
    const uniqueMsgs = Array.from(new Map(msgs.map((m) => [m.id, m])).values()).sort(
      (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return {
      ...conv,
      pet: pet
        ? {
            id: pet.id,
            userId: pet.userId,
            name: pet.name,
            photoUrl: pet.photoUrl,
            species: pet.species,
            status: pet.status,
            user: { id: pet.userId, name: "Pet Owner", phone: pet.contactPhone || null },
          }
        : null,
      messages: uniqueMsgs,
    };
  }

  async createConversation(args: any) {
    const convId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const initialMsgData = args.data.messages?.create;
    const initialMsgs = [];

    if (initialMsgData) {
      const msg = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        conversationId: convId,
        senderType: initialMsgData.senderType || "FINDER",
        content: initialMsgData.content,
        createdAt: new Date(),
      };
      this.messages.push(msg);
      initialMsgs.push(msg);
    }

    const conv = {
      id: convId,
      petId: args.data.petId,
      recoveryCaseId: args.data.recoveryCaseId || null,
      finderToken: args.data.finderToken,
      finderName: args.data.finderName || "Helpful Finder",
      finderPhone: args.data.finderPhone || null,
      status: args.data.status || "OPEN",
      expiresAt: args.data.expiresAt || new Date(Date.now() + 7 * 86400 * 1000),
      lastFinderActivity: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: initialMsgs,
    };
    this.conversations.push(conv);
    return this.hydrateConversation(conv);
  }

  async createMessage(args: any) {
    const msg = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...args.data,
      createdAt: new Date(),
    };
    this.messages.push(msg);

    const conv = this.conversations.find((c) => c.id === args.data.conversationId);
    if (conv) {
      if (!conv.messages) conv.messages = [];
      conv.messages.push(msg);
    }
    return msg;
  }

  async createNotificationJob(args: any) {
    const job = {
      id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...args.data,
      status: "QUEUED",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.notificationJobs.push(job);
    return job;
  }

  async createNotification(args: any) {
    const notif = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...args.data,
      createdAt: new Date(),
    };
    this.notifications.push(notif);
    return notif;
  }

  async createAuditLog(args: any) {
    const log = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...args.data,
      createdAt: new Date(),
    };
    this.auditLogs.push(log);
    return log;
  }

  getRecentScans(take = 10) {
    return this.scanEvents
      .slice(-take)
      .reverse()
      .map((s) => {
        const tag = this.tags.find((t) => t.id === s.tagId);
        return {
          ...s,
          tag: tag ? this.hydrateTag(tag) : null,
        };
      });
  }

  getRecentJobs(take = 10) {
    return this.notificationJobs.slice(-take).reverse();
  }

  getMetrics() {
    return {
      totalUsers: this.users.length,
      totalPets: this.pets.length,
      lostPets: this.pets.filter((p) => p.status === "LOST").length,
      activeTags: this.tags.filter((t) => t.status === "ACTIVE").length,
      totalScans: this.tags.reduce((acc, t) => acc + (t.scanCount || 0), 0),
      recoveredCases: this.pets.filter((p) => p.status === "RECOVERED" || p.status === "SAFE").length,
    };
  }
}

export const resilientStore = new ResilientDataStore();
