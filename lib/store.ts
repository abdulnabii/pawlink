import bcrypt from "bcryptjs";

const SUPABASE_REST_URL = "https://gqqzcznxncatfovulmtp.supabase.co/rest/v1/projects";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxcXpjem54bmNhdGZvdnVsbXRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0NzEzNzYsImV4cCI6MjA5OTA0NzM3Nn0.1HoimV4vDtSOwSGnEshnUp68qDWxCHxus5RN07c7a1I";

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
  private subscriptions: any[] = [];
  private paymentRequests: any[] = [];
  private auditLogs: any[] = [];
  private medicalRecords: any[] = [];
  private petPhotos: any[] = [];
  private reports: any[] = [];
  private supportTickets: any[] = [];
  private announcements: any[] = [];
  private featureFlags: any[] = [];

  private lastCloudSync = 0;
  private isSyncing = false;
  private isInitialized = false;
  private hydrationPromise: Promise<void> | null = null;
  private saveDebounceTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.initSeed();
    this.syncFromCloud().catch(() => {});
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
        phone: "+923001234567",
        role: "OWNER",
        createdAt: new Date(),
        updatedAt: new Date(),
        notificationPreference: {
          whatsappEnabled: true,
          whatsappVerified: true,
          emailEnabled: true,
          notificationPhone: "+923001234567",
        },
      },
      {
        id: adminId,
        email: "abdulnabi.khaskheli@gmail.com",
        passwordHash: "$2a$10$8RXbeytATwI6CnsJvNLdA.ZUCnFvEeYEsxA3vW5hJ33oCpwGMBtI6", // abkhaskhely
        name: "Abdul Nabi Khaskheli",
        phone: "+923001234567",
        role: "ADMIN",
        createdAt: new Date(),
        updatedAt: new Date(),
        notificationPreference: {
          whatsappEnabled: true,
          whatsappVerified: true,
          emailEnabled: true,
          notificationPhone: "+923001234567",
        },
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
        contactPhone: "+923001234567",
        allowWhatsApp: true,
        allowPhoneCall: true,
        allowInAppChat: true,
        hideOwnerPhone: false,
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
        contactPhone: "+923001234567",
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
        contactPhone: "+923001234567",
        allowWhatsApp: true,
        allowInAppChat: true,
        hideOwnerPhone: false,
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

    this.notifications = [
      {
        id: "notif_seed_01",
        userId: ownerId,
        type: "TAG_SCANNED",
        channel: "WHATSAPP",
        title: "🚨 Max's QR Tag Scanned",
        body: "Max's collar tag was scanned near Clifton Beach Park. Click to view recovery details.",
        status: "SENT",
        createdAt: new Date(Date.now() - 45 * 60 * 1000),
      },
      {
        id: "notif_seed_02",
        userId: ownerId,
        type: "LOCATION_SHARED",
        channel: "WHATSAPP",
        title: "📍 Finder Shared GPS Location",
        body: "A finder shared live coordinates for Max near Beach Avenue Cafe (~12m accuracy).",
        status: "SENT",
        createdAt: new Date(Date.now() - 40 * 60 * 1000),
      },
      {
        id: "notif_seed_03",
        userId: ownerId,
        type: "MESSAGE_RECEIVED",
        channel: "IN_APP",
        title: "💬 New Finder Message Received",
        body: "Sarah: 'Hi! I just found Max sitting near the beach cafe.'",
        status: "SENT",
        createdAt: new Date(Date.now() - 35 * 60 * 1000),
      },
      {
        id: "notif_seed_04",
        userId: ownerId,
        type: "WELCOME",
        channel: "EMAIL",
        title: "🛡️ Welcome to PawLink!",
        body: "Your pet recovery QR tags are active and protected by 24/7 instant scan alerts.",
        status: "READ",
        createdAt: new Date(Date.now() - 24 * 3600 * 1000),
      },
    ];
  }

  private cleanTag(tag: any) {
    if (!tag) return tag;
    let sc = tag.scanCount;
    if (sc && typeof sc === "object") {
      if (typeof sc.increment === "number") sc = sc.increment;
      else if (typeof sc.toNumber === "function") sc = sc.toNumber();
      else sc = 0;
    }
    tag.scanCount = typeof sc === "number" && !isNaN(sc) ? sc : Number(sc) || 0;
    return tag;
  }

  private applyPrismaData(target: any, data: any) {
    if (!data || typeof data !== "object") return;
    for (const [key, val] of Object.entries(data)) {
      if (val && typeof val === "object" && !Array.isArray(val) && !(val instanceof Date)) {
        if ("increment" in val && typeof (val as any).increment === "number") {
          const current = typeof target[key] === "number" ? target[key] : (typeof target[key]?.increment === "number" ? target[key].increment : 0);
          target[key] = current + (val as any).increment;
          continue;
        }
        if ("decrement" in val && typeof (val as any).decrement === "number") {
          const current = typeof target[key] === "number" ? target[key] : 0;
          target[key] = current - (val as any).decrement;
          continue;
        }
        if ("set" in val) {
          target[key] = (val as any).set;
          continue;
        }
      }
      target[key] = val;
    }
  }

  private syncArrayFromCloud(localArr: any[], cloudArr: any[]) {
    if (!Array.isArray(cloudArr)) return localArr;
    const map = new Map();
    // 1. Cloud state is the primary persistent store
    for (const item of cloudArr) {
      if (item && item.id) map.set(item.id, item);
    }
    // 2. Keep all local items and merge newer local mutations
    for (const item of localArr) {
      if (item && item.id) {
        const cloudItem = map.get(item.id);
        if (!cloudItem) {
          // Brand new local item (user, pet, etc.) -> ALWAYS preserve and sync
          map.set(item.id, item);
        } else {
          const localTime = new Date(item.updatedAt || item.createdAt || 0).getTime();
          const cloudTime = new Date(cloudItem.updatedAt || cloudItem.createdAt || 0).getTime();
          if (localTime >= cloudTime) {
            map.set(item.id, { ...cloudItem, ...item });
          } else {
            map.set(item.id, cloudItem);
          }
        }
      }
    }
    return Array.from(map.values());
  }

  async syncFromCloud() {
    const now = Date.now();
    
    // Fast path: If already initialized, serve from in-memory cache instantly
    if (this.isInitialized) {
      if (now - this.lastCloudSync > 30000 && !this.isSyncing) {
        this.lastCloudSync = now;
        this.fetchCloudStateInBackground();
      }
      return;
    }

    if (!this.hydrationPromise) {
      this.hydrationPromise = this.fetchCloudState();
    }
    await this.hydrationPromise;
  }

  private async fetchCloudState() {
    if (this.isSyncing) return;
    this.isSyncing = true;
    try {
      const res = await fetch(`${SUPABASE_REST_URL}?id=eq.pawlink_cloud_state&select=*`, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(4000),
      });

      if (res.ok) {
        const rows = await res.json();
        if (rows && rows[0]?.description) {
          const state = JSON.parse(rows[0].description);
          if (Array.isArray(state.users)) this.users = this.syncArrayFromCloud(this.users, state.users);
          if (Array.isArray(state.pets)) this.pets = this.syncArrayFromCloud(this.pets, state.pets);
          if (Array.isArray(state.tags)) {
            this.tags = this.syncArrayFromCloud(this.tags, state.tags).map((t) => this.cleanTag(t));
          }
          if (Array.isArray(state.tagAssignments)) this.tagAssignments = this.syncArrayFromCloud(this.tagAssignments, state.tagAssignments);
          if (Array.isArray(state.recoveryCases)) this.recoveryCases = this.syncArrayFromCloud(this.recoveryCases, state.recoveryCases);
          if (Array.isArray(state.recoveryEvents)) this.recoveryEvents = this.syncArrayFromCloud(this.recoveryEvents, state.recoveryEvents);
          if (Array.isArray(state.scanEvents)) this.scanEvents = this.syncArrayFromCloud(this.scanEvents, state.scanEvents);
          if (Array.isArray(state.locationEvents)) this.locationEvents = this.syncArrayFromCloud(this.locationEvents, state.locationEvents);
          if (Array.isArray(state.conversations)) this.conversations = this.syncArrayFromCloud(this.conversations, state.conversations);
          if (Array.isArray(state.subscriptions)) this.subscriptions = this.syncArrayFromCloud(this.subscriptions, state.subscriptions);
          if (Array.isArray(state.paymentRequests)) this.paymentRequests = this.syncArrayFromCloud(this.paymentRequests, state.paymentRequests);
          if (Array.isArray(state.notifications)) this.notifications = this.syncArrayFromCloud(this.notifications, state.notifications);
          if (Array.isArray(state.notificationJobs)) this.notificationJobs = this.syncArrayFromCloud(this.notificationJobs, state.notificationJobs);
          if (Array.isArray(state.medicalRecords)) this.medicalRecords = this.syncArrayFromCloud(this.medicalRecords, state.medicalRecords);
        }
      }
    } catch {} finally {
      this.isSyncing = false;
      this.isInitialized = true;
      this.lastCloudSync = Date.now();
    }
  }

  private fetchCloudStateInBackground() {
    this.fetchCloudState().catch(() => {});
  }

  async syncToCloud(immediate = true) {
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
      this.saveDebounceTimer = null;
    }

    if (immediate) {
      await this.executeCloudSave();
      return;
    }

    this.saveDebounceTimer = setTimeout(() => {
      this.executeCloudSave().catch(() => {});
    }, 60);
  }

  private async executeCloudSave() {
    try {
      const statePayload = {
        users: this.users,
        pets: this.pets,
        tags: this.tags,
        tagAssignments: this.tagAssignments,
        recoveryCases: this.recoveryCases,
        recoveryEvents: this.recoveryEvents,
        scanEvents: this.scanEvents,
        locationEvents: this.locationEvents,
        conversations: this.conversations,
        subscriptions: this.subscriptions,
        paymentRequests: this.paymentRequests,
        notifications: this.notifications,
        notificationJobs: this.notificationJobs,
        medicalRecords: this.medicalRecords,
        updatedAt: new Date().toISOString(),
      };

      const body = JSON.stringify({
        id: "pawlink_cloud_state",
        title: "PawLink Cloud Database Sync",
        description: JSON.stringify(statePayload),
        tags: ["PawLink", "DatabaseSync", "PersistentState"],
      });

      await fetch(SUPABASE_REST_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: "resolution=merge-duplicates",
        },
        body,
        signal: AbortSignal.timeout(5000),
      });
    } catch {}
  }

  // --- USER METHODS ---
  async findUserUnique(args: any) {
    await this.syncFromCloud();
    let user = null;
    if (args.where?.id) user = this.users.find((u) => u.id === args.where.id) || null;
    if (!user && args.where?.email) user = this.users.find((u) => u.email?.toLowerCase() === args.where.email.toLowerCase()) || null;
    if (!user && args.where?.authUserId) user = this.users.find((u) => u.authUserId === args.where.authUserId) || null;
    
    // Cache-miss fallback: If user not found in warm container, force fresh fetch from Supabase
    if (!user) {
      await this.fetchCloudState();
      if (args.where?.id) user = this.users.find((u) => u.id === args.where.id) || null;
      if (!user && args.where?.email) user = this.users.find((u) => u.email?.toLowerCase() === args.where.email.toLowerCase()) || null;
      if (!user && args.where?.authUserId) user = this.users.find((u) => u.authUserId === args.where.authUserId) || null;
    }
    return user;
  }

  async findUserFirst(args: any) {
    await this.syncFromCloud();
    if (!args?.where) return this.users[0] || null;
    if (args.where.OR) {
      for (const cond of args.where.OR) {
        const found = await this.findUserUnique({ where: cond });
        if (found) return found;
      }
    }
    let user = this.findUserFromMemory(args.where);
    if (!user) {
      await this.fetchCloudState();
      user = this.findUserFromMemory(args.where);
    }
    return user || null;
  }

  private findUserFromMemory(where: any) {
    return this.users.find((u) => {
      if (where.id && u.id !== where.id) return false;
      if (where.email && u.email?.toLowerCase() !== where.email.toLowerCase()) return false;
      if (where.authUserId && u.authUserId !== where.authUserId) return false;
      if (where.role && u.role !== where.role) return false;
      return true;
    });
  }

  async createUser(args: any) {
    await this.syncFromCloud();
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
    await this.syncToCloud(true);
    return user;
  }

  async updateUser(args: any) {
    await this.syncFromCloud();
    const user = await this.findUserUnique(args);
    if (!user) return null;
    this.applyPrismaData(user, args.data);
    user.updatedAt = new Date();
    await this.syncToCloud(true);
    return user;
  }

  // --- PET METHODS ---
  async findPets(args?: any) {
    await this.syncFromCloud();
    let result = [...this.pets];
    if (args?.where?.userId) {
      result = result.filter((p) => p.userId === args.where.userId);
      // Cache-miss check: If 0 pets found for this user, force a fresh fetch from Supabase
      if (result.length === 0) {
        await this.fetchCloudState();
        result = this.pets.filter((p) => p.userId === args.where.userId);
      }
    }
    return result.map((p) => this.hydratePet(p));
  }

  async findPetFirst(args: any) {
    await this.syncFromCloud();
    if (args?.where?.id) {
      let pet = this.pets.find((p) => {
        if (p.id !== args.where.id) return false;
        if (args.where.userId && p.userId !== args.where.userId) return false;
        return true;
      });
      // Cache-miss fallback: if not in warm memory, force re-sync from Supabase before returning null
      if (!pet) {
        await this.fetchCloudState();
        pet = this.pets.find((p) => {
          if (p.id !== args.where.id) return false;
          if (args.where.userId && p.userId !== args.where.userId) return false;
          return true;
        });
      }
      if (pet) return this.hydratePet(pet);
      return null;
    }
    let pets = await this.findPets(args);
    if (!pets[0] && args?.where?.userId) {
      await this.fetchCloudState();
      pets = await this.findPets(args);
    }
    return pets[0] || null;
  }

  async createPet(args: any) {
    await this.syncFromCloud();
    const pet = {
      id: `pet_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...args.data,
      medicalRecords: args.data.medicalRecords?.create || [],
      photos: args.data.photos?.create || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.pets.push(pet);
    await this.syncToCloud(true);
    return this.hydratePet(pet);
  }

  async updatePet(args: any) {
    await this.syncFromCloud();
    const pet = this.pets.find((p) => p.id === args.where.id);
    if (!pet) return null;
    this.applyPrismaData(pet, args.data);
    pet.updatedAt = new Date();

    // If pet status was set to SAFE, automatically resolve any active OPEN recovery cases
    if (args.data?.status === "SAFE") {
      this.recoveryCases
        .filter((c) => c.petId === pet.id && c.status === "OPEN")
        .forEach((c) => {
          c.status = "RESOLVED";
          c.resolvedAt = new Date();
          c.updatedAt = new Date();
        });
    }

    await this.syncToCloud(true);
    return this.hydratePet(pet);
  }

  async deletePet(args: any) {
    await this.syncFromCloud();
    const id = args?.where?.id || args?.id || args;
    const initialLen = this.pets.length;
    this.pets = this.pets.filter((p) => p.id !== id);
    this.tagAssignments = this.tagAssignments.filter((a) => a.petId !== id);
    this.recoveryCases = this.recoveryCases.filter((c) => c.petId !== id);
    this.recoveryEvents = this.recoveryEvents.filter((e) => e.petId !== id);
    this.petPhotos = (this.petPhotos || []).filter((ph: any) => ph.petId !== id);
    this.medicalRecords = (this.medicalRecords || []).filter((m: any) => m.petId !== id);
    await this.syncToCloud(true);
    return { count: initialLen - this.pets.length };
  }

  private hydratePet(pet: any) {
    const owner = this.users.find((u) => u.id === pet.userId);
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
    const medicalRecords = this.medicalRecords.filter((m) => m.petId === pet.id);
    const activeCase = recoveryCases.find((c) => c.status === "OPEN");
    const isLost = pet.status === "LOST" || Boolean(activeCase);

    return {
      ...pet,
      status: isLost ? "LOST" : (pet.status === "LOST" ? "SAFE" : (pet.status || "SAFE")),
      user: owner
        ? {
            id: owner.id,
            name: owner.name,
            phone: owner.phone,
            email: owner.email,
            role: owner.role,
          }
        : null,
      tagAssignments: assignments,
      recoveryCases,
      recoveryEvents,
      conversations,
      medicalRecords: medicalRecords.length > 0 ? medicalRecords : (pet.medicalRecords || []),
      photos: pet.photos || [],
      _count: {
        recoveryEvents: recoveryEvents.length,
        conversations: conversations.length,
      },
    };
  }

  // --- TAG METHODS ---
  async findTagFirst(args: any) {
    await this.syncFromCloud();
    if (args?.where?.tagCode) {
      const rawTarget = (args.where.tagCode || "").trim().toUpperCase();
      const targetClean = rawTarget.replace(/[^A-Z0-9]/g, "");
      let tag = this.tags.find((t) => {
        const rawCode = (t.tagCode || "").trim().toUpperCase();
        const codeClean = rawCode.replace(/[^A-Z0-9]/g, "");
        return rawCode === rawTarget || codeClean === targetClean;
      });
      if (!tag) {
        await this.fetchCloudState();
        tag = this.tags.find((t) => {
          const rawCode = (t.tagCode || "").trim().toUpperCase();
          const codeClean = rawCode.replace(/[^A-Z0-9]/g, "");
          return rawCode === rawTarget || codeClean === targetClean;
        });
      }
      if (!tag) return null;
      return this.hydrateTag(tag);
    }
    if (args?.where?.id) {
      let tag = this.tags.find((t) => t.id === args.where.id);
      if (!tag) {
        await this.fetchCloudState();
        tag = this.tags.find((t) => t.id === args.where.id);
      }
      if (!tag) return null;
      return this.hydrateTag(tag);
    }
    const tags = await this.findTags(args);
    return tags[0] || null;
  }

  async findTags(args?: any) {
    await this.syncFromCloud();
    let result = [...this.tags];
    const assignedById = args?.where?.assignments?.some?.assignedById;
    if (assignedById) {
      result = result.filter((t) => {
        const asgn = this.tagAssignments.find((a) => a.tagId === t.id && !a.unassignedAt);
        if (!asgn) return false;
        if (asgn.assignedById === assignedById) return true;
        const pet = this.pets.find((p) => p.id === asgn.petId);
        return pet && pet.userId === assignedById;
      });
    }
    return result.map((t) => this.hydrateTag(t));
  }

  async createTag(args: any) {
    await this.syncFromCloud();
    const tag = {
      id: `tag_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...args.data,
      scanCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.tags.push(tag);
    await this.syncToCloud();
    return this.hydrateTag(tag);
  }

  async updateTag(args: any) {
    await this.syncFromCloud();
    const tag = this.tags.find((t) => t.id === args.where.id);
    if (!tag) return null;
    this.applyPrismaData(tag, args.data);
    tag.updatedAt = new Date();
    this.cleanTag(tag);
    await this.syncToCloud();
    return this.hydrateTag(tag);
  }

  private hydrateTag(tag: any) {
    const cleanedTag = this.cleanTag(tag);
    const assignments = this.tagAssignments
      .filter((a) => a.tagId === cleanedTag.id && !a.unassignedAt)
      .map((a) => {
        const pet = this.pets.find((p) => p.id === a.petId);
        const owner = pet ? this.users.find((u) => u.id === pet.userId) : null;
        return {
          ...a,
          pet: pet
            ? {
                ...pet,
                user: owner
                  ? {
                      id: owner.id,
                      name: owner.name,
                      phone: owner.phone,
                      email: owner.email,
                    }
                  : null,
                recoveryCases: this.recoveryCases.filter((c) => c.petId === pet.id && c.status === "OPEN"),
                medicalRecords: pet.medicalRecords || [],
              }
            : null,
        };
      });

    return {
      ...cleanedTag,
      assignments,
      scanEvents: this.scanEvents.filter((s) => s.tagId === cleanedTag.id),
    };
  }

  // --- RECOVERY CASES ---
  async findRecoveryCases(args?: any) {
    await this.syncFromCloud();
    let result = [...this.recoveryCases];
    if (args?.where?.petId) {
      result = result.filter((c) => c.petId === args.where.petId);
    }
    if (args?.where?.status) {
      result = result.filter((c) => c.status === args.where.status);
    }
    return result.map((c) => {
      const pet = this.pets.find((p) => p.id === c.petId);
      const locs = this.locationEvents.filter((l) => l.recoveryCaseId === c.id);
      const convs = this.conversations.filter((cv) => cv.recoveryCaseId === c.id || cv.petId === c.petId);
      const events = this.recoveryEvents.filter((e) => e.petId === c.petId);
      return {
        ...c,
        pet: pet ? this.hydratePet(pet) : null,
        locationEvents: locs,
        conversations: convs,
        recoveryEvents: events,
      };
    });
  }

  async findRecoveryCaseUnique(args: any) {
    await this.syncFromCloud();
    const id = args?.where?.id;
    if (!id) return null;
    const c = this.recoveryCases.find((x) => x.id === id);
    if (!c) return null;
    const pet = this.pets.find((p) => p.id === c.petId);
    const locs = this.locationEvents.filter((l) => l.recoveryCaseId === c.id);
    const convs = this.conversations.filter((cv) => cv.recoveryCaseId === c.id || cv.petId === c.petId);
    const events = this.recoveryEvents.filter((e) => e.petId === c.petId);
    return {
      ...c,
      pet: pet ? this.hydratePet(pet) : null,
      locationEvents: locs,
      conversations: convs,
      recoveryEvents: events,
    };
  }

  async countRecoveryCases(args?: any) {
    await this.syncFromCloud();
    if (args?.where?.status) {
      return this.recoveryCases.filter((c) => c.status === args.where.status).length;
    }
    return this.recoveryCases.length;
  }

  async createRecoveryCase(args: any) {
    await this.syncFromCloud();
    const newCase = {
      id: `case_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...args.data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.recoveryCases.push(newCase);
    await this.syncToCloud();
    return newCase;
  }

  async updateRecoveryCase(args: any) {
    await this.syncFromCloud();
    const c = this.recoveryCases.find((x) => x.id === args.where.id);
    if (!c) return null;
    this.applyPrismaData(c, args.data);
    c.updatedAt = new Date();
    await this.syncToCloud();
    return c;
  }

  async updateManyRecoveryCases(args: any) {
    await this.syncFromCloud();
    let count = 0;
    for (const c of this.recoveryCases) {
      let matches = true;
      if (args.where?.petId && c.petId !== args.where.petId) matches = false;
      if (args.where?.status && c.status !== args.where.status) matches = false;
      if (matches) {
        this.applyPrismaData(c, args.data);
        c.updatedAt = new Date();
        count++;
      }
    }
    await this.syncToCloud();
    return { count };
  }

  // --- RECOVERY EVENTS ---
  async createRecoveryEvent(args: any) {
    await this.syncFromCloud();
    const event = {
      id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...args.data,
      createdAt: new Date(),
    };
    this.recoveryEvents.push(event);
    await this.syncToCloud();
    return event;
  }

  // --- SCAN EVENTS ---
  async findScanEvents(args?: any) {
    await this.syncFromCloud();
    let result = [...this.scanEvents];
    if (args?.where?.tagId) {
      result = result.filter((s) => s.tagId === args.where.tagId);
    }
    result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    if (args?.skip) {
      result = result.slice(args.skip);
    }
    if (args?.take) {
      result = result.slice(0, args.take);
    }
    return result.map((s) => {
      const tag = this.tags.find((t) => t.id === s.tagId);
      return {
        ...s,
        tag: tag ? this.hydrateTag(tag) : null,
      };
    });
  }

  async countScanEvents(args?: any) {
    await this.syncFromCloud();
    if (args?.where?.tagId) {
      return this.scanEvents.filter((s) => s.tagId === args.where.tagId).length;
    }
    return this.scanEvents.length;
  }

  async createScanEvent(args: any) {
    await this.syncFromCloud();
    const scan = {
      id: `scan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...args.data,
      timestamp: new Date(),
    };
    this.scanEvents.push(scan);

    const tag = this.tags.find((t) => t.id === args.data.tagId);
    if (tag) {
      tag.scanCount = (tag.scanCount || 0) + 1;
      tag.lastScannedAt = new Date();
    }
    await this.syncToCloud();
    return scan;
  }

  // --- LOCATION EVENTS ---
  async findLocationEvents(args?: any) {
    await this.syncFromCloud();
    let result = [...this.locationEvents];
    if (args?.where?.recoveryCaseId) {
      result = result.filter((l) => l.recoveryCaseId === args.where.recoveryCaseId);
    }
    return result;
  }

  async countLocationEvents(args?: any) {
    await this.syncFromCloud();
    if (args?.where?.recoveryCaseId) {
      return this.locationEvents.filter((l) => l.recoveryCaseId === args.where.recoveryCaseId).length;
    }
    return this.locationEvents.length;
  }

  async createLocationEvent(args: any) {
    await this.syncFromCloud();
    const loc = {
      id: `loc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...args.data,
      createdAt: new Date(),
    };
    this.locationEvents.push(loc);
    await this.syncToCloud();
    return loc;
  }

  // --- CONVERSATIONS & MESSAGES ---
  async findConversations(args?: any) {
    await this.syncFromCloud();
    let result = [...this.conversations];
    if (args?.where?.pet?.userId) {
      const ownerPets = this.pets.filter((p) => p.userId === args.where.pet.userId);
      const ownerPetIds = new Set(ownerPets.map((p) => p.id));
      result = result.filter((c) => ownerPetIds.has(c.petId));
    }
    return result.map((c) => this.hydrateConversation(c));
  }

  async findConversationUnique(args: any) {
    await this.syncFromCloud();
    const where = args?.where || {};
    let conv: any = null;
    if (where.id) conv = this.conversations.find((c) => c.id === where.id);
    else if (where.finderToken) conv = this.conversations.find((c) => c.finderToken === where.finderToken);
    if (!conv) return null;
    return this.hydrateConversation(conv);
  }

  async createConversation(args: any) {
    await this.syncFromCloud();
    const conv = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...args.data,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (args.data.messages?.create) {
      const initialMsgs = Array.isArray(args.data.messages.create)
        ? args.data.messages.create
        : [args.data.messages.create];
      conv.messages = initialMsgs.map((m: any, idx: number) => ({
        id: `msg_${Date.now()}_${idx}`,
        conversationId: conv.id,
        ...m,
        createdAt: new Date(),
      }));
    }

    this.conversations.push(conv);
    await this.syncToCloud();
    return this.hydrateConversation(conv);
  }

  async createMessage(args: any) {
    await this.syncFromCloud();
    const msg = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...args.data,
      createdAt: new Date(),
    };

    const conv = this.conversations.find((c) => c.id === args.data.conversationId);
    if (conv) {
      if (!conv.messages) conv.messages = [];
      conv.messages.push(msg);
      conv.updatedAt = new Date();
    }
    await this.syncToCloud();
    return msg;
  }

  async findMessages(args?: any) {
    await this.syncFromCloud();
    let result: any[] = [];
    this.conversations.forEach((c) => {
      if (Array.isArray(c.messages)) {
        result.push(...c.messages);
      }
    });
    if (args?.where?.conversationId) {
      result = result.filter((m) => m.conversationId === args.where.conversationId);
    }
    return result;
  }

  private hydrateConversation(conv: any) {
    const pet = this.pets.find((p) => p.id === conv.petId);
    const owner = pet ? this.users.find((u) => u.id === pet.userId) : null;
    return {
      ...conv,
      pet: pet
        ? {
            ...pet,
            user: owner,
          }
        : null,
      messages: conv.messages || [],
    };
  }

  // --- TAG ASSIGNMENTS ---
  async createTagAssignment(args: any) {
    await this.syncFromCloud();
    const asgn = {
      id: `asgn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...args.data,
      assignedAt: new Date(),
      unassignedAt: null,
    };
    this.tagAssignments.push(asgn);
    await this.syncToCloud();
    return asgn;
  }

  async updateManyTagAssignments(args: any) {
    await this.syncFromCloud();
    const { where, data } = args;
    let count = 0;
    this.tagAssignments.forEach((a) => {
      let matches = true;
      if (where.tagId && a.tagId !== where.tagId) matches = false;
      if (where.petId && a.petId !== where.petId) matches = false;
      if (where.unassignedAt === null && a.unassignedAt !== null) matches = false;
      if (matches) {
        Object.assign(a, data);
        count++;
      }
    });
    if (count > 0) await this.syncToCloud();
    return { count };
  }

  // --- NOTIFICATION PREFERENCES ---
  async upsertNotificationPreference(args: any) {
    await this.syncFromCloud();
    const userId = args.where?.userId;
    const user = this.users.find((u) => u.id === userId);
    if (user) {
      user.notificationPreference = {
        ...(user.notificationPreference || {}),
        ...(args.update || args.create || {}),
      };
      await this.syncToCloud();
      return user.notificationPreference;
    }
    return null;
  }

  async findNotificationPreferenceUnique(args: any) {
    await this.syncFromCloud();
    const userId = args.where?.userId;
    const user = this.users.find((u) => u.id === userId);
    return user?.notificationPreference || null;
  }

  // --- NOTIFICATION JOBS & NOTIFICATIONS ---
  async findNotificationJobs(args?: any) {
    await this.syncFromCloud();
    let result = [...this.notificationJobs];
    if (args?.where?.status) {
      result = result.filter((j) => j.status === args.where.status);
    }
    result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    if (args?.take) {
      result = result.slice(0, args.take);
    }
    return result;
  }

  async findNotificationJobUnique(args: any) {
    await this.syncFromCloud();
    const id = args?.where?.id;
    if (!id) return null;
    return this.notificationJobs.find((j) => j.id === id) || null;
  }

  async countNotificationJobs(args?: any) {
    await this.syncFromCloud();
    if (args?.where?.status) {
      return this.notificationJobs.filter((j) => j.status === args.where.status).length;
    }
    return this.notificationJobs.length;
  }

  async createNotificationJob(args: any) {
    await this.syncFromCloud();
    const job = {
      id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...args.data,
      attempts: args.data.attempts || 0,
      maxAttempts: args.data.maxAttempts || 4,
      status: args.data.status || "QUEUED",
      createdAt: new Date(),
      scheduledAt: args.data.scheduledAt || new Date(),
    };
    this.notificationJobs.unshift(job);
    await this.syncToCloud();
    return job;
  }

  async updateNotificationJob(args: any) {
    await this.syncFromCloud();
    const job = this.notificationJobs.find((j) => j.id === args.where?.id);
    if (!job) return null;
    this.applyPrismaData(job, args.data);
    await this.syncToCloud(true);
    return job;
  }

  async updateManyNotificationJobs(args: any) {
    await this.syncFromCloud();
    let count = 0;
    for (const job of this.notificationJobs) {
      let matches = true;
      if (args?.where?.id && job.id !== args.where.id) matches = false;
      if (args?.where?.status && job.status !== args.where.status) matches = false;
      if (matches) {
        this.applyPrismaData(job, args.data);
        count++;
      }
    }
    await this.syncToCloud(true);
    return { count };
  }

  async findNotifications(args?: any) {
    await this.syncFromCloud();
    let result = [...this.notifications];
    if (args?.where?.userId) {
      result = result.filter((n) => n.userId === args.where.userId);
    }
    if (args?.where?.id) {
      result = result.filter((n) => n.id === args.where.id);
    }
    if (args?.where?.status) {
      if (typeof args.where.status === "object" && "not" in args.where.status) {
        result = result.filter((n) => n.status !== args.where.status.not);
      } else {
        result = result.filter((n) => n.status === args.where.status);
      }
    }
    if (args?.take) {
      result = result.slice(0, args.take);
    }
    return result;
  }

  async createNotification(args: any) {
    await this.syncFromCloud();
    const notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...args.data,
      status: args.data.status || "SENT",
      createdAt: new Date(),
    };
    this.notifications.unshift(notification);
    await this.syncToCloud();
    return notification;
  }

  async updateNotification(args: any) {
    await this.syncFromCloud();
    const n = this.notifications.find((x) => x.id === args.where?.id);
    if (!n) return null;
    Object.assign(n, args.data);
    await this.syncToCloud();
    return n;
  }

  async updateManyNotifications(args: any) {
    await this.syncFromCloud();
    let count = 0;
    const { where, data } = args;
    this.notifications.forEach((n) => {
      let matches = true;
      if (where?.id && n.id !== where.id) matches = false;
      if (where?.userId && n.userId !== where.userId) matches = false;
      if (where?.status) {
        if (typeof where.status === "object" && "not" in where.status) {
          if (n.status === where.status.not) matches = false;
        } else if (n.status !== where.status) {
          matches = false;
        }
      }
      if (matches) {
        Object.assign(n, data);
        count++;
      }
    });
    if (count > 0) await this.syncToCloud();
    return { count };
  }

  // --- SUBSCRIPTION METHODS ---
  async getUserSubscription(userId: string) {
    await this.syncFromCloud();
    const activeSubs = this.subscriptions.filter(
      (s) => s.userId === userId && s.status === "ACTIVE"
    );

    // Prioritize paid active tiers (PRO > PLUS > latest active)
    let sub =
      activeSubs.find((s) => s.plan === "PRO") ||
      activeSubs.find((s) => s.plan === "PLUS") ||
      activeSubs.sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt || 0).getTime() -
          new Date(a.updatedAt || a.createdAt || 0).getTime()
      )[0];

    if (!sub) {
      // Default to Basic ID (FREE)
      sub = {
        id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId,
        plan: "FREE",
        status: "ACTIVE",
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.subscriptions.push(sub);
      await this.syncToCloud(true);
    }
    return sub;
  }

  async findSubscriptions(args?: any) {
    await this.syncFromCloud();
    let result = [...this.subscriptions];
    if (args?.where?.userId) {
      result = result.filter((s) => s.userId === args.where.userId);
    }
    if (args?.where?.status) {
      result = result.filter((s) => s.status === args.where.status);
    }
    return result;
  }

  async findSubscriptionFirst(args?: any) {
    const list = await this.findSubscriptions(args);
    return list[0] || null;
  }

  async createSubscription(args: any) {
    await this.syncFromCloud();
    const sub = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...args.data,
      plan: args.data.plan || "FREE",
      status: args.data.status || "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.subscriptions.push(sub);
    await this.syncToCloud(true);
    return sub;
  }

  async updateSubscription(args: any) {
    await this.syncFromCloud();
    const sub = this.subscriptions.find((s) => s.id === args.where?.id || s.userId === args.where?.userId);
    if (!sub) return null;
    this.applyPrismaData(sub, args.data);
    sub.updatedAt = new Date();
    await this.syncToCloud(true);
    return sub;
  }

  // --- PAYMENT / UPGRADE REQUEST METHODS ---
  async createPaymentRequest(data: any) {
    await this.syncFromCloud();
    const req = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: data.userId,
      userEmail: data.userEmail,
      userName: data.userName,
      requestedPlan: data.requestedPlan,
      amountPKR: data.amountPKR,
      transactionId: data.transactionId,
      senderName: data.senderName,
      senderPhone: data.senderPhone || null,
      notes: data.notes || null,
      status: "PENDING", // PENDING, APPROVED, REJECTED
      adminNotes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.paymentRequests.push(req);
    await this.syncToCloud(true);
    return req;
  }

  async getAllPaymentRequests() {
    await this.syncFromCloud();
    return [...this.paymentRequests].reverse();
  }

  async getPendingPaymentRequests() {
    await this.syncFromCloud();
    return this.paymentRequests.filter((p) => p.status === "PENDING").reverse();
  }

  async getUserPaymentRequests(userId: string) {
    await this.syncFromCloud();
    return this.paymentRequests.filter((p) => p.userId === userId).reverse();
  }

  async approvePaymentRequest(requestId: string, adminNotes?: string) {
    await this.syncFromCloud();
    const req = this.paymentRequests.find((p) => p.id === requestId);
    if (!req) return null;

    req.status = "APPROVED";
    req.adminNotes = adminNotes || "Payment verified and approved by admin";
    req.reviewedAt = new Date();
    req.updatedAt = new Date();

    // Calculate next month ending date on the exact same date of the month:
    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    if (nextMonth.getDate() !== now.getDate()) {
      nextMonth.setDate(0); // If day rolled over (e.g. Jan 31 -> Feb 28), cap at last day of next month
    }

    // Activate the subscription for this user
    let sub = this.subscriptions.find((s) => s.userId === req.userId);
    if (sub) {
      sub.plan = req.requestedPlan;
      sub.status = "ACTIVE";
      sub.currentPeriodEnd = nextMonth;
      sub.updatedAt = new Date();
    } else {
      sub = {
        id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: req.userId,
        plan: req.requestedPlan,
        status: "ACTIVE",
        currentPeriodEnd: nextMonth,
        cancelAtPeriodEnd: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.subscriptions.push(sub);
    }

    // Clean up duplicate old free subscriptions for this user
    this.subscriptions.forEach((s) => {
      if (s.userId === req.userId && s.id !== sub.id && s.status === "ACTIVE") {
        s.status = "INACTIVE";
        s.updatedAt = new Date();
      }
    });

    // Also update plan on User object if present
    const user = this.users.find((u) => u.id === req.userId);
    if (user) {
      user.plan = req.requestedPlan;
      user.updatedAt = new Date();
    }

    await this.syncToCloud(true);
    return req;
  }

  async rejectPaymentRequest(requestId: string, adminNotes?: string) {
    await this.syncFromCloud();
    const req = this.paymentRequests.find((p) => p.id === requestId);
    if (!req) return null;

    req.status = "REJECTED";
    req.adminNotes = adminNotes || "Payment verification declined";
    req.reviewedAt = new Date();
    req.updatedAt = new Date();

    await this.syncToCloud(true);
    return req;
  }

  async getAllUsersForAdmin() {
    await this.syncFromCloud();
    return this.users.map((u) => {
      const userPets = this.pets.filter((p) => p.userId === u.id);
      return {
        id: u.id,
        email: u.email,
        name: u.name,
        phone: u.phone,
        role: u.role,
        createdAt: u.createdAt,
        petCount: userPets.length,
        pets: userPets.map((p) => p.name),
      };
    });
  }

  async getAllPetsForAdmin() {
    await this.syncFromCloud();
    return this.pets.map((p) => {
      const owner = this.users.find((u) => u.id === p.userId);
      const asgn = this.tagAssignments.find((a) => a.petId === p.id && !a.unassignedAt);
      const tag = asgn ? this.tags.find((t) => t.id === asgn.tagId) : null;

      return {
        id: p.id,
        name: p.name,
        species: p.species,
        breed: p.breed,
        gender: p.gender,
        color: p.color,
        status: p.status,
        photoUrl: p.photoUrl,
        createdAt: p.createdAt,
        owner: owner ? { id: owner.id, name: owner.name, email: owner.email } : null,
        tagCode: tag?.tagCode || null,
      };
    });
  }

  async getAllTagsForAdmin() {
    await this.syncFromCloud();
    return this.tags.map((t) => {
      const asgn = this.tagAssignments.find((a) => a.tagId === t.id && !a.unassignedAt);
      const pet = asgn ? this.pets.find((p) => p.id === asgn.petId) : null;
      const owner = pet ? this.users.find((u) => u.id === pet.userId) : null;

      return {
        id: t.id,
        tagCode: t.tagCode,
        label: t.label,
        status: t.status,
        scanCount: this.cleanTag(t).scanCount,
        createdAt: t.createdAt,
        lastScannedAt: t.lastScannedAt,
        pet: pet ? { id: pet.id, name: pet.name, species: pet.species } : null,
        owner: owner ? { id: owner.id, name: owner.name, email: owner.email } : null,
      };
    });
  }

  async createMedicalRecord(data: any) {
    await this.syncFromCloud();
    const record = {
      id: `med_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      petId: data.petId,
      recordType: data.recordType,
      title: data.title,
      description: data.description || null,
      dateAdministered: data.dateAdministered ? new Date(data.dateAdministered) : null,
      nextDueDate: data.nextDueDate ? new Date(data.nextDueDate) : null,
      veterinarian: data.veterinarian || null,
      documentUrl: data.documentUrl || null,
      isPublicAlert: Boolean(data.isPublicAlert),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.medicalRecords.push(record);
    await this.syncToCloud();
    return record;
  }

  async findMedicalRecords(petId?: string) {
    await this.syncFromCloud();
    if (petId) return this.medicalRecords.filter((m) => m.petId === petId);
    return [...this.medicalRecords];
  }

  async findPetPhotos(petId?: string) {
    await this.syncFromCloud();
    if (petId) return this.petPhotos.filter((p) => p.petId === petId);
    return [...this.petPhotos];
  }

  async createPetPhoto(data: any) {
    await this.syncFromCloud();
    const photo = {
      id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      petId: data.petId,
      url: data.url,
      caption: data.caption || null,
      isPrimary: Boolean(data.isPrimary),
      createdAt: new Date(),
    };
    this.petPhotos.push(photo);
    await this.syncToCloud();
    return photo;
  }

  async updateManyPetPhotos(args: any) {
    await this.syncFromCloud();
    let count = 0;
    this.petPhotos = this.petPhotos.map((p) => {
      if (!args.where || !args.where.petId || p.petId === args.where.petId) {
        count++;
        return { ...p, ...args.data };
      }
      return p;
    });
    await this.syncToCloud();
    return { count };
  }

  async deletePetPhoto(args: any) {
    await this.syncFromCloud();
    const id = args?.where?.id;
    if (id) {
      this.petPhotos = this.petPhotos.filter((p) => p.id !== id);
      await this.syncToCloud();
    }
    return { success: true };
  }


  async findReports(args?: any) {
    await this.syncFromCloud();
    let result = [...this.reports];
    if (args?.where?.status) {
      result = result.filter((r) => r.status === args.where.status);
    }
    if (args?.take) {
      result = result.slice(0, args.take);
    }
    return result;
  }

  async createReport(args: any) {
    await this.syncFromCloud();
    const report = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...args.data,
      status: args.data.status || "OPEN",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.reports.push(report);
    await this.syncToCloud();
    return report;
  }

  async updateReport(args: any) {
    await this.syncFromCloud();
    const rep = this.reports.find((r) => r.id === args?.where?.id);
    if (!rep) return null;
    this.applyPrismaData(rep, args.data);
    rep.updatedAt = new Date();
    await this.syncToCloud();
    return rep;
  }

  async countReports(args?: any) {
    await this.syncFromCloud();
    if (args?.where?.status) {
      return this.reports.filter((r) => r.status === args.where.status).length;
    }
    return this.reports.length;
  }

  // Support Tickets
  async findSupportTickets(args?: any) {
    await this.syncFromCloud();
    let result = [...this.supportTickets];
    if (args?.where?.status) {
      result = result.filter((t) => t.status === args.where.status);
    }
    if (args?.take) {
      result = result.slice(0, args.take);
    }
    return result;
  }

  async createSupportTicket(args: any) {
    await this.syncFromCloud();
    const ticket = {
      id: `tkt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...args.data,
      status: args.data.status || "OPEN",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.supportTickets.push(ticket);
    await this.syncToCloud();
    return ticket;
  }

  async updateSupportTicket(args: any) {
    await this.syncFromCloud();
    const tkt = this.supportTickets.find((t) => t.id === args?.where?.id);
    if (!tkt) return null;
    this.applyPrismaData(tkt, args.data);
    tkt.updatedAt = new Date();
    await this.syncToCloud();
    return tkt;
  }

  async countSupportTickets(args?: any) {
    await this.syncFromCloud();
    if (args?.where?.status) {
      return this.supportTickets.filter((t) => t.status === args.where.status).length;
    }
    return this.supportTickets.length;
  }

  // Announcements
  async findAnnouncements(args?: any) {
    await this.syncFromCloud();
    return [...this.announcements];
  }

  async createAnnouncement(args: any) {
    await this.syncFromCloud();
    const ann = {
      id: `ann_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...args.data,
      status: args.data.status || "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.announcements.push(ann);
    await this.syncToCloud();
    return ann;
  }

  async updateAnnouncement(args: any) {
    await this.syncFromCloud();
    const ann = this.announcements.find((a) => a.id === args?.where?.id);
    if (!ann) return null;
    this.applyPrismaData(ann, args.data);
    ann.updatedAt = new Date();
    await this.syncToCloud();
    return ann;
  }

  // Feature Flags
  async findFeatureFlags() {
    await this.syncFromCloud();
    if (this.featureFlags.length === 0) {
      this.featureFlags = [
        { id: "ff_1", key: "WHATSAPP_ALERTS", name: "WhatsApp Scan Alerts", description: "Send real-time alerts via WhatsApp on QR scan", enabled: true, updatedAt: new Date() },
        { id: "ff_2", key: "NFC_SUPPORT", name: "NFC Tag Support", description: "Enable high-frequency NFC tag tap routing", enabled: true, updatedAt: new Date() },
        { id: "ff_3", key: "GPS_RECOVERY", name: "GPS Recovery Maps", description: "Interactive Leaflet live finder location sharing", enabled: true, updatedAt: new Date() },
        { id: "ff_4", key: "FINDER_CHAT", name: "Finder In-App Chat", description: "Encrypted direct messaging between finder and pet owner", enabled: true, updatedAt: new Date() },
        { id: "ff_5", key: "BANK_PAYMENT_VERIFICATION", name: "Meezan Bank Raast Payments", description: "Manual offline bank transfer verification flow", enabled: true, updatedAt: new Date() },
      ];
    }
    return [...this.featureFlags];
  }

  async updateFeatureFlag(args: any) {
    await this.syncFromCloud();
    const flag = this.featureFlags.find((f) => f.key === args?.where?.key || f.id === args?.where?.id);
    if (flag) {
      this.applyPrismaData(flag, args.data);
      flag.updatedAt = new Date();
      await this.syncToCloud();
      return flag;
    }
    return null;
  }

  // Audit Logs
  async findAuditLogs(args?: any) {
    await this.syncFromCloud();
    let result = [...this.auditLogs];
    if (args?.take) {
      result = result.slice(0, args.take);
    }
    return result;
  }

  async createAuditLog(args: any) {
    await this.syncFromCloud();
    const log = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...args.data,
      createdAt: new Date(),
    };
    this.auditLogs.unshift(log);
    await this.syncToCloud();
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
      totalScans: this.tags.reduce((acc, t) => acc + (this.cleanTag(t).scanCount || 0), 0),
      recoveredCases: this.pets.filter((p) => p.status === "RECOVERED" || p.status === "SAFE").length,
    };
  }
}

export const resilientStore = new ResilientDataStore();

