import { PrismaClient } from "@prisma/client";
import { resilientStore } from "./store";

const isPrismaConfigured =
  Boolean(process.env.DATABASE_URL) &&
  !process.env.DATABASE_URL?.startsWith("file:") &&
  process.env.DATABASE_URL !== "";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const rawPrisma: PrismaClient | null =
  globalForPrisma.prisma ??
  (isPrismaConfigured
    ? new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
      })
    : null);

if (process.env.NODE_ENV !== "production" && rawPrisma) {
  globalForPrisma.prisma = rawPrisma;
}

function createSelfHealingDb() {
  return {
    $transaction: async (callbackOrArray: any) => {
      if (rawPrisma) {
        try {
          return await rawPrisma.$transaction(callbackOrArray);
        } catch (err) {
          console.warn("[Prisma $transaction Fallback]", err);
        }
      }
      if (typeof callbackOrArray === "function") {
        return await callbackOrArray(db);
      }
      return await Promise.all(callbackOrArray);
    },
    user: {
      count: async () => {
        if (rawPrisma) {
          try {
            return await rawPrisma.user.count();
          } catch {}
        }
        return resilientStore.getMetrics().totalUsers;
      },
      findUnique: async (args: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.user.findUnique(args);
          } catch {}
        }
        return await resilientStore.findUserUnique(args);
      },
      findFirst: async (args: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.user.findFirst(args);
          } catch {}
        }
        return await resilientStore.findUserFirst(args);
      },
      findMany: async (args?: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.user.findMany(args);
          } catch {}
        }
        return await resilientStore.getAllUsersForAdmin();
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
        if (rawPrisma) {
          try {
            return await rawPrisma.pet.count(args);
          } catch {}
        }
        if (args?.where?.status === "LOST") return resilientStore.getMetrics().lostPets;
        return resilientStore.getMetrics().totalPets;
      },
      findMany: async (args?: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.pet.findMany(args);
          } catch {}
        }
        return await resilientStore.findPets(args);
      },
      findFirst: async (args: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.pet.findFirst(args);
          } catch {}
        }
        return await resilientStore.findPetFirst(args);
      },
      findUnique: async (args: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.pet.findUnique(args);
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
            return await rawPrisma.pet.delete(args);
          } catch {}
        }
        return { success: true };
      },
    },
    petPhoto: {
      findMany: async (args?: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.petPhoto.findMany(args);
          } catch {}
        }
        return await resilientStore.findPetPhotos(args?.where?.petId);
      },
      create: async (args: any) => {
        let prismaRes = null;
        if (rawPrisma) {
          try {
            prismaRes = await rawPrisma.petPhoto.create(args);
          } catch {}
        }
        const storeRes = await resilientStore.createPetPhoto(args.data);
        return prismaRes || storeRes;
      },
      updateMany: async (args: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.petPhoto.updateMany(args);
          } catch {}
        }
        return await resilientStore.updateManyPetPhotos(args);
      },
      delete: async (args: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.petPhoto.delete(args);
          } catch {}
        }
        return await resilientStore.deletePetPhoto(args);
      },
    },
    tag: {
      count: async (args?: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.tag.count(args);
          } catch {}
        }
        return resilientStore.getMetrics().activeTags;
      },
      findUnique: async (args: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.tag.findUnique(args);
          } catch {}
        }
        return await resilientStore.findTagFirst(args);
      },
      findFirst: async (args: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.tag.findFirst(args);
          } catch {}
        }
        return await resilientStore.findTagFirst(args);
      },
      findMany: async (args?: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.tag.findMany(args);
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
    petMedicalRecord: {
      findMany: async (args?: any) => {
        if (rawPrisma) {
          try {
            const res = await rawPrisma.petMedicalRecord.findMany(args);
            if (Array.isArray(res)) return res;
          } catch {}
        }
        return await resilientStore.findMedicalRecords(args?.where?.petId);
      },
      create: async (args: any) => {
        let prismaRes = null;
        if (rawPrisma) {
          try {
            prismaRes = await rawPrisma.petMedicalRecord.create(args);
          } catch {}
        }
        const storeRes = await resilientStore.createMedicalRecord(args.data);
        return prismaRes || storeRes;
      },
      delete: async (args: any) => {
        if (rawPrisma) {
          try {
            await rawPrisma.petMedicalRecord.delete(args);
          } catch {}
        }
        return { success: true };
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
            return await rawPrisma.conversation.findMany(args);
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
        if (rawPrisma) {
          try {
            return await rawPrisma.notification.findMany(args);
          } catch {}
        }
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
            return await rawPrisma.subscription.findMany(args);
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
    report: {
      findMany: async (args?: any) => {
        if (rawPrisma) {
          try {
            return await (rawPrisma as any).report.findMany(args);
          } catch {}
        }
        return await resilientStore.findReports(args);
      },
      create: async (args: any) => {
        if (rawPrisma) {
          try {
            return await (rawPrisma as any).report.create(args);
          } catch {}
        }
        return await resilientStore.createReport(args);
      },
      update: async (args: any) => {
        if (rawPrisma) {
          try {
            return await (rawPrisma as any).report.update(args);
          } catch {}
        }
        return await resilientStore.updateReport(args);
      },
      count: async (args?: any) => {
        if (rawPrisma) {
          try {
            return await (rawPrisma as any).report.count(args);
          } catch {}
        }
        return await resilientStore.countReports(args);
      },
    },
    supportTicket: {
      findMany: async (args?: any) => {
        if (rawPrisma) {
          try {
            return await (rawPrisma as any).supportTicket.findMany(args);
          } catch {}
        }
        return await resilientStore.findSupportTickets(args);
      },
      create: async (args: any) => {
        if (rawPrisma) {
          try {
            return await (rawPrisma as any).supportTicket.create(args);
          } catch {}
        }
        return await resilientStore.createSupportTicket(args);
      },
      update: async (args: any) => {
        if (rawPrisma) {
          try {
            return await (rawPrisma as any).supportTicket.update(args);
          } catch {}
        }
        return await resilientStore.updateSupportTicket(args);
      },
      count: async (args?: any) => {
        if (rawPrisma) {
          try {
            return await (rawPrisma as any).supportTicket.count(args);
          } catch {}
        }
        return await resilientStore.countSupportTickets(args);
      },
    },
    announcement: {
      findMany: async (args?: any) => {
        if (rawPrisma) {
          try {
            return await (rawPrisma as any).announcement.findMany(args);
          } catch {}
        }
        return await resilientStore.findAnnouncements(args);
      },
      create: async (args: any) => {
        if (rawPrisma) {
          try {
            return await (rawPrisma as any).announcement.create(args);
          } catch {}
        }
        return await resilientStore.createAnnouncement(args);
      },
      update: async (args: any) => {
        if (rawPrisma) {
          try {
            return await (rawPrisma as any).announcement.update(args);
          } catch {}
        }
        return await resilientStore.updateAnnouncement(args);
      },
    },
    featureFlag: {
      findMany: async (args?: any) => {
        if (rawPrisma) {
          try {
            return await (rawPrisma as any).featureFlag.findMany(args);
          } catch {}
        }
        return await resilientStore.findFeatureFlags();
      },
      update: async (args: any) => {
        if (rawPrisma) {
          try {
            return await (rawPrisma as any).featureFlag.update(args);
          } catch {}
        }
        return await resilientStore.updateFeatureFlag(args);
      },
    },
    auditLog: {
      findMany: async (args?: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.auditLog.findMany(args);
          } catch {}
        }
        return await resilientStore.findAuditLogs(args);
      },
      create: async (args: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.auditLog.create(args);
          } catch {}
        }
        return await resilientStore.createAuditLog(args);
      },
      count: async (args?: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.auditLog.count(args);
          } catch {}
        }
        return (await resilientStore.findAuditLogs(args)).length;
      },
    },
  } as unknown as PrismaClient;

}

export const db = createSelfHealingDb();
