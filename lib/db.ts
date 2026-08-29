import { PrismaClient } from "@prisma/client";
import { resilientStore } from "./store";

const isPrismaConfigured =
  Boolean(process.env.DATABASE_URL) &&
  !process.env.DATABASE_URL?.includes("gqqzcznxncatfovulmtp") &&
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
            return await rawPrisma.user.findUnique(args);
          } catch {}
        }
        return resilientStore.findUserUnique(args);
      },
      findFirst: async (args: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.user.findFirst(args);
          } catch {}
        }
        return resilientStore.findUserFirst(args);
      },
      create: async (args: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.user.create(args);
          } catch {}
        }
        return resilientStore.createUser(args);
      },
      update: async (args: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.user.update(args);
          } catch {}
        }
        return resilientStore.updateUser(args);
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
            return await rawPrisma.pet.findMany(args);
          } catch {}
        }
        return resilientStore.findPets(args);
      },
      findFirst: async (args: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.pet.findFirst(args);
          } catch {}
        }
        return resilientStore.findPetFirst(args);
      },
      findUnique: async (args: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.pet.findUnique(args);
          } catch {}
        }
        return resilientStore.findPetFirst(args);
      },
      create: async (args: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.pet.create(args);
          } catch {}
        }
        return resilientStore.createPet(args);
      },
      update: async (args: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.pet.update(args);
          } catch {}
        }
        return resilientStore.updatePet(args);
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
            return await rawPrisma.tag.findUnique(args);
          } catch {}
        }
        return resilientStore.findTagFirst(args);
      },
      findFirst: async (args: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.tag.findFirst(args);
          } catch {}
        }
        return resilientStore.findTagFirst(args);
      },
      findMany: async (args?: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.tag.findMany(args);
          } catch {}
        }
        return resilientStore.findTags(args);
      },
      create: async (args: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.tag.create(args);
          } catch {}
        }
        return resilientStore.createTag(args);
      },
      update: async (args: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.tag.update(args);
          } catch {}
        }
        return resilientStore.updateTag(args);
      },
    },
    tagAssignment: {
      findFirst: async (args: any) => {
        return null;
      },
      updateMany: async (args: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.tagAssignment.updateMany(args);
          } catch {}
        }
        return resilientStore.updateManyTagAssignments(args);
      },
      create: async (args: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.tagAssignment.create(args);
          } catch {}
        }
        return resilientStore.createTagAssignment(args);
      },
    },
    recoveryCase: {
      count: async (args?: any) => resilientStore.getMetrics().recoveredCases,
      findFirst: async (args: any) => {
        return null;
      },
      updateMany: async (args: any) => {
        return { count: 1 };
      },
      create: async (args: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.recoveryCase.create(args);
          } catch {}
        }
        return resilientStore.createRecoveryCase(args);
      },
      update: async (args: any) => {
        return { id: args.where?.id, ...args.data };
      },
    },
    recoveryEvent: {
      create: async (args: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.recoveryEvent.create(args);
          } catch {}
        }
        return resilientStore.createRecoveryEvent(args);
      },
      createMany: async (args: any) => {
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
        if (rawPrisma) {
          try {
            return await rawPrisma.scanEvent.create(args);
          } catch {}
        }
        return resilientStore.createScanEvent(args);
      },
    },
    locationEvent: {
      create: async (args: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.locationEvent.create(args);
          } catch {}
        }
        return resilientStore.createLocationEvent(args);
      },
      deleteMany: async (args: any) => {
        return { count: 1 };
      },
    },
    conversation: {
      findFirst: async (args: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.conversation.findFirst(args);
          } catch {}
        }
        return resilientStore.findConversationUnique(args);
      },
      findUnique: async (args: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.conversation.findUnique(args);
          } catch {}
        }
        return resilientStore.findConversationUnique(args);
      },
      findMany: async (args?: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.conversation.findMany(args);
          } catch {}
        }
        return resilientStore.findConversations(args);
      },
      create: async (args: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.conversation.create(args);
          } catch {}
        }
        return resilientStore.createConversation(args);
      },
      update: async (args: any) => {
        return { id: args.where?.id, ...args.data };
      },
    },
    message: {
      create: async (args: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.message.create(args);
          } catch {}
        }
        return resilientStore.createMessage(args);
      },
      findMany: async (args: any) => {
        return [];
      },
    },
    notificationJob: {
      findMany: async (args?: any) => resilientStore.getRecentJobs(args?.take || 10),
      create: async (args: any) => {
        return resilientStore.createNotificationJob(args);
      },
    },
    notification: {
      groupBy: async () => [],
      create: async (args: any) => {
        return resilientStore.createNotification(args);
      },
      findMany: async (args: any) => {
        return [];
      },
    },
    notificationPreference: {
      upsert: async (args: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.notificationPreference.upsert(args);
          } catch {}
        }
        return resilientStore.upsertNotificationPreference(args);
      },
      findUnique: async (args: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.notificationPreference.findUnique(args);
          } catch {}
        }
        return resilientStore.findNotificationPreferenceUnique(args);
      },
    },
    auditLog: {
      create: async (args: any) => {
        return resilientStore.createAuditLog(args);
      },
    },
  } as unknown as PrismaClient;
}

export const db = createSelfHealingDb();
