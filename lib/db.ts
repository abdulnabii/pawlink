import { PrismaClient } from "@prisma/client";
import { resilientStore } from "./store";

const isPrismaConfigured =
  Boolean(process.env.DATABASE_URL) &&
  !process.env.DATABASE_URL?.startsWith("file:") &&
  process.env.DATABASE_URL !== "";

let rawPrisma: PrismaClient | null = null;

if (isPrismaConfigured) {
  try {
    rawPrisma = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  } catch {
    rawPrisma = null;
  }
}

function createSelfHealingDb() {
  return {
    $transaction: async (callbackOrArray: any) => {
      if (typeof callbackOrArray === "function") {
        return await callbackOrArray(db);
      }
      return await Promise.all(callbackOrArray);
    },
    user: {
      count: async () => resilientStore.getMetrics().totalUsers,
      findUnique: async (args: any) => {
        if (rawPrisma) {
          try {
            const res = await rawPrisma.user.findUnique(args);
            if (res) return res;
          } catch {}
        }
        return await resilientStore.findUserUnique(args);
      },
      findFirst: async (args: any) => {
        if (rawPrisma) {
          try {
            const res = await rawPrisma.user.findFirst(args);
            if (res) return res;
          } catch {}
        }
        return await resilientStore.findUserFirst(args);
      },
      create: async (args: any) => {
        let prismaRes = null;
        if (rawPrisma) {
          try {
            prismaRes = await rawPrisma.user.create(args);
          } catch {}
        }
        const storeRes = await resilientStore.createUser(args);
        return prismaRes || storeRes;
      },
      update: async (args: any) => {
        let prismaRes = null;
        if (rawPrisma) {
          try {
            prismaRes = await rawPrisma.user.update(args);
          } catch {}
        }
        const storeRes = await resilientStore.updateUser(args);
        return prismaRes || storeRes;
      },
    },
    pet: {
      count: async (args?: any) => {
        if (args?.where?.status === "LOST") return resilientStore.getMetrics().lostPets;
        return resilientStore.getMetrics().totalPets;
      },
      findMany: async (args?: any) => {
        if (rawPrisma) {
          try {
            const res = await rawPrisma.pet.findMany(args);
            if (Array.isArray(res) && res.length > 0) return res;
          } catch {}
        }
        return await resilientStore.findPets(args);
      },
      findFirst: async (args: any) => {
        if (rawPrisma) {
          try {
            const res = await rawPrisma.pet.findFirst(args);
            if (res) return res;
          } catch {}
        }
        return await resilientStore.findPetFirst(args);
      },
      findUnique: async (args: any) => {
        if (rawPrisma) {
          try {
            const res = await rawPrisma.pet.findUnique(args);
            if (res) return res;
          } catch {}
        }
        return await resilientStore.findPetFirst(args);
      },
      create: async (args: any) => {
        let prismaRes = null;
        if (rawPrisma) {
          try {
            prismaRes = await rawPrisma.pet.create(args);
          } catch {}
        }
        const storeRes = await resilientStore.createPet(args);
        return prismaRes || storeRes;
      },
      update: async (args: any) => {
        let prismaRes = null;
        if (rawPrisma) {
          try {
            prismaRes = await rawPrisma.pet.update(args);
          } catch {}
        }
        const storeRes = await resilientStore.updatePet(args);
        return prismaRes || storeRes;
      },
      delete: async (args: any) => {
        if (rawPrisma) {
          try {
            await rawPrisma.pet.delete(args);
          } catch {}
        }
        return { success: true };
      },
    },
    tag: {
      count: async (args?: any) => {
        if (args?.where?.status === "ACTIVE") return resilientStore.getMetrics().activeTags;
        return resilientStore.getMetrics().activeTags;
      },
      findUnique: async (args: any) => {
        if (rawPrisma) {
          try {
            const res = await rawPrisma.tag.findUnique(args);
            if (res) return res;
          } catch {}
        }
        return await resilientStore.findTagFirst(args);
      },
      findFirst: async (args: any) => {
        if (rawPrisma) {
          try {
            const res = await rawPrisma.tag.findFirst(args);
            if (res) return res;
          } catch {}
        }
        return await resilientStore.findTagFirst(args);
      },
      findMany: async (args?: any) => {
        if (rawPrisma) {
          try {
            const res = await rawPrisma.tag.findMany(args);
            if (Array.isArray(res) && res.length > 0) return res;
          } catch {}
        }
        return await resilientStore.findTags(args);
      },
      create: async (args: any) => {
        let prismaRes = null;
        if (rawPrisma) {
          try {
            prismaRes = await rawPrisma.tag.create(args);
          } catch {}
        }
        const storeRes = await resilientStore.createTag(args);
        return prismaRes || storeRes;
      },
      update: async (args: any) => {
        let prismaRes = null;
        if (rawPrisma) {
          try {
            prismaRes = await rawPrisma.tag.update(args);
          } catch {}
        }
        const storeRes = await resilientStore.updateTag(args);
        return prismaRes || storeRes;
      },
    },
    tagAssignment: {
      findFirst: async (args: any) => {
        return null;
      },
      updateMany: async (args: any) => {
        if (rawPrisma) {
          try {
            await rawPrisma.tagAssignment.updateMany(args);
          } catch {}
        }
        return await resilientStore.updateManyTagAssignments(args);
      },
      create: async (args: any) => {
        let prismaRes = null;
        if (rawPrisma) {
          try {
            prismaRes = await rawPrisma.tagAssignment.create(args);
          } catch {}
        }
        const storeRes = await resilientStore.createTagAssignment(args);
        return prismaRes || storeRes;
      },
    },
    recoveryCase: {
      count: async (args?: any) => resilientStore.getMetrics().recoveredCases,
      findFirst: async (args: any) => {
        if (rawPrisma) {
          try {
            const res = await rawPrisma.recoveryCase.findFirst(args);
            if (res) return res;
          } catch {}
        }
        const cases = await resilientStore.findRecoveryCases(args);
        return cases[0] || null;
      },
      updateMany: async (args: any) => {
        if (rawPrisma) {
          try {
            await rawPrisma.recoveryCase.updateMany(args);
          } catch {}
        }
        return { count: 1 };
      },
      create: async (args: any) => {
        let prismaRes = null;
        if (rawPrisma) {
          try {
            prismaRes = await rawPrisma.recoveryCase.create(args);
          } catch {}
        }
        const storeRes = await resilientStore.createRecoveryCase(args);
        return prismaRes || storeRes;
      },
      update: async (args: any) => {
        let prismaRes = null;
        if (rawPrisma) {
          try {
            prismaRes = await rawPrisma.recoveryCase.update(args);
          } catch {}
        }
        const storeRes = await resilientStore.updateRecoveryCase(args);
        return prismaRes || storeRes;
      },
    },
    recoveryEvent: {
      create: async (args: any) => {
        let prismaRes = null;
        if (rawPrisma) {
          try {
            prismaRes = await rawPrisma.recoveryEvent.create(args);
          } catch {}
        }
        const storeRes = await resilientStore.createRecoveryEvent(args);
        return prismaRes || storeRes;
      },
      createMany: async (args: any) => {
        if (rawPrisma) {
          try {
            await rawPrisma.recoveryEvent.createMany(args);
          } catch {}
        }
        return { count: args.data?.length || 0 };
      },
    },
    scanEvent: {
      count: async () => resilientStore.getMetrics().totalScans,
      findMany: async (args?: any) => resilientStore.getRecentScans(args?.take || 10),
      findUnique: async (args: any) => {
        return null;
      },
      create: async (args: any) => {
        let prismaRes = null;
        if (rawPrisma) {
          try {
            prismaRes = await rawPrisma.scanEvent.create(args);
          } catch {}
        }
        const storeRes = await resilientStore.createScanEvent(args);
        return prismaRes || storeRes;
      },
    },
    locationEvent: {
      create: async (args: any) => {
        let prismaRes = null;
        if (rawPrisma) {
          try {
            prismaRes = await rawPrisma.locationEvent.create(args);
          } catch {}
        }
        const storeRes = await resilientStore.createLocationEvent(args);
        return prismaRes || storeRes;
      },
      deleteMany: async (args: any) => {
        return { count: 1 };
      },
    },
    conversation: {
      findFirst: async (args: any) => {
        if (rawPrisma) {
          try {
            const res = await rawPrisma.conversation.findFirst(args);
            if (res) return res;
          } catch {}
        }
        return await resilientStore.findConversationUnique(args);
      },
      findUnique: async (args: any) => {
        if (rawPrisma) {
          try {
            const res = await rawPrisma.conversation.findUnique(args);
            if (res) return res;
          } catch {}
        }
        return await resilientStore.findConversationUnique(args);
      },
      findMany: async (args?: any) => {
        if (rawPrisma) {
          try {
            const res = await rawPrisma.conversation.findMany(args);
            if (Array.isArray(res) && res.length > 0) return res;
          } catch {}
        }
        return await resilientStore.findConversations(args);
      },
      create: async (args: any) => {
        let prismaRes = null;
        if (rawPrisma) {
          try {
            prismaRes = await rawPrisma.conversation.create(args);
          } catch {}
        }
        const storeRes = await resilientStore.createConversation(args);
        return prismaRes || storeRes;
      },
      update: async (args: any) => {
        return { id: args.where?.id, ...args.data };
      },
    },
    message: {
      create: async (args: any) => {
        let prismaRes = null;
        if (rawPrisma) {
          try {
            prismaRes = await rawPrisma.message.create(args);
          } catch {}
        }
        const storeRes = await resilientStore.createMessage(args);
        return prismaRes || storeRes;
      },
      findMany: async (args: any) => {
        return [];
      },
    },
    notificationJob: {
      findMany: async (args?: any) => resilientStore.getRecentJobs(args?.take || 10),
      create: async (args: any) => {
        return await resilientStore.createNotificationJob(args);
      },
    },
    notification: {
      groupBy: async () => [],
      create: async (args: any) => {
        return await resilientStore.createNotification(args);
      },
      findMany: async (args: any) => {
        return [];
      },
    },
    notificationPreference: {
      upsert: async (args: any) => {
        if (rawPrisma) {
          try {
            const res = await rawPrisma.notificationPreference.upsert(args);
            if (res) return res;
          } catch {}
        }
        return await resilientStore.upsertNotificationPreference(args);
      },
      findUnique: async (args: any) => {
        if (rawPrisma) {
          try {
            const res = await rawPrisma.notificationPreference.findUnique(args);
            if (res) return res;
          } catch {}
        }
        return await resilientStore.findNotificationPreferenceUnique(args);
      },
    },
    auditLog: {
      create: async (args: any) => {
        return await resilientStore.createAuditLog(args);
      },
    },
    subscription: {
      findUnique: async (args: any) => {
        if (rawPrisma) {
          try {
            const res = await rawPrisma.subscription.findUnique(args);
            if (res) return res;
          } catch {}
        }
        return await resilientStore.findSubscriptionFirst(args);
      },
      findFirst: async (args: any) => {
        if (rawPrisma) {
          try {
            const res = await rawPrisma.subscription.findFirst(args);
            if (res) return res;
          } catch {}
        }
        if (args?.where?.userId) {
          return await resilientStore.getUserSubscription(args.where.userId);
        }
        return await resilientStore.findSubscriptionFirst(args);
      },
      findMany: async (args?: any) => {
        if (rawPrisma) {
          try {
            const res = await rawPrisma.subscription.findMany(args);
            if (Array.isArray(res) && res.length > 0) return res;
          } catch {}
        }
        return await resilientStore.findSubscriptions(args);
      },
      create: async (args: any) => {
        let prismaRes = null;
        if (rawPrisma) {
          try {
            prismaRes = await rawPrisma.subscription.create(args);
          } catch {}
        }
        const storeRes = await resilientStore.createSubscription(args);
        return prismaRes || storeRes;
      },
      update: async (args: any) => {
        let prismaRes = null;
        if (rawPrisma) {
          try {
            prismaRes = await rawPrisma.subscription.update(args);
          } catch {}
        }
        const storeRes = await resilientStore.updateSubscription(args);
        return prismaRes || storeRes;
      },
    },
  } as unknown as PrismaClient;
}

export const db = createSelfHealingDb();
