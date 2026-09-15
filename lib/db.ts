import { PrismaClient } from "@prisma/client";
import { resilientStore } from "./store";

const SUPABASE_VERIFIED_POOLER_URL =
  "postgresql://postgres.gqqzcznxncatfovulmtp:AbdulNabi%40Admin2025!@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
const SUPABASE_VERIFIED_DIRECT_URL =
  "postgresql://postgres.gqqzcznxncatfovulmtp:AbdulNabi%40Admin2025!@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

export function normalizeSupabaseDatabaseUrl(url?: string): string {
  if (!url) return SUPABASE_VERIFIED_POOLER_URL;
  // Supabase project gqqzcznxncatfovulmtp is hosted in Mumbai (aws-1-ap-south-1).
  // If the host in Vercel settings has aws-0-us-east-1, wrong region, unencoded '@', or invalid credentials:
  if (
    url.includes("gqqzcznxncatfovulmtp") ||
    url.includes("supabase.co") ||
    url.includes("pooler.supabase.com")
  ) {
    return SUPABASE_VERIFIED_POOLER_URL;
  }
  return url;
}

export function normalizeSupabaseDirectUrl(url?: string): string {
  if (!url) return SUPABASE_VERIFIED_DIRECT_URL;
  if (
    url.includes("gqqzcznxncatfovulmtp") ||
    url.includes("supabase.co") ||
    url.includes("pooler.supabase.com")
  ) {
    return SUPABASE_VERIFIED_DIRECT_URL;
  }
  return url;
}

process.env.DATABASE_URL = normalizeSupabaseDatabaseUrl(process.env.DATABASE_URL);
process.env.DIRECT_URL = normalizeSupabaseDirectUrl(process.env.DIRECT_URL);

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
        datasources: {
          db: {
            url: normalizeSupabaseDatabaseUrl(process.env.DATABASE_URL),
          },
        },
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
          } catch (err) {
            console.warn("[db.user.update Prisma warn]:", err);
          }
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
        return await resilientStore.deletePet(args);
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
        if (rawPrisma) {
          try {
            return await rawPrisma.tagAssignment.findFirst(args);
          } catch {}
        }
        return null;
      },
      findMany: async (args?: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.tagAssignment.findMany(args);
          } catch {}
        }
        return [];
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
      count: async (args?: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.recoveryCase.count(args);
          } catch {}
        }
        return await resilientStore.countRecoveryCases(args);
      },
      findMany: async (args?: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.recoveryCase.findMany(args);
          } catch {}
        }
        return await resilientStore.findRecoveryCases(args);
      },
      findUnique: async (args: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.recoveryCase.findUnique(args);
          } catch {}
        }
        return await resilientStore.findRecoveryCaseUnique(args);
      },
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
        let prismaRes = null;
        if (rawPrisma) {
          try {
            prismaRes = await rawPrisma.recoveryCase.updateMany(args);
          } catch {}
        }
        const storeRes = await resilientStore.updateManyRecoveryCases(args);
        return prismaRes || storeRes;
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
      findMany: async (args?: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.recoveryEvent.findMany(args);
          } catch {}
        }
        return [];
      },
      count: async (args?: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.recoveryEvent.count(args);
          } catch {}
        }
        return 0;
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
      count: async (args?: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.petMedicalRecord.count(args);
          } catch {}
        }
        return 0;
      },
    },
    scanEvent: {
      count: async (args?: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.scanEvent.count(args);
          } catch {}
        }
        return await resilientStore.countScanEvents(args);
      },
      findMany: async (args?: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.scanEvent.findMany(args);
          } catch {}
        }
        return await resilientStore.findScanEvents(args);
      },
      findUnique: async (args: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.scanEvent.findUnique(args);
          } catch {}
        }
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
      count: async (args?: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.locationEvent.count(args);
          } catch {}
        }
        return await resilientStore.countLocationEvents(args);
      },
      findMany: async (args?: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.locationEvent.findMany(args);
          } catch {}
        }
        return await resilientStore.findLocationEvents(args);
      },
      findFirst: async (args?: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.locationEvent.findFirst(args);
          } catch {}
        }
        return (await resilientStore.findLocationEvents(args))[0] || null;
      },
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
        if (rawPrisma) {
          try {
            await rawPrisma.locationEvent.deleteMany(args);
          } catch {}
        }
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
      count: async (args?: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.conversation.count(args);
          } catch {}
        }
        return (await resilientStore.findConversations(args)).length;
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
        let prismaRes = null;
        if (rawPrisma) {
          try {
            prismaRes = await rawPrisma.conversation.update(args);
          } catch {}
        }
        const storeRes = await resilientStore.updateConversation(args);
        return prismaRes || storeRes || { id: args.where?.id, ...args.data };
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
        if (rawPrisma) {
          try {
            return await rawPrisma.message.findMany(args);
          } catch {}
        }
        return await resilientStore.findMessages(args);
      },
      count: async (args?: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.message.count(args);
          } catch {}
        }
        return (await resilientStore.findMessages(args)).length;
      },
    },
    notificationJob: {
      findMany: async (args?: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.notificationJob.findMany(args);
          } catch {}
        }
        return await resilientStore.findNotificationJobs(args);
      },
      findUnique: async (args: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.notificationJob.findUnique(args);
          } catch {}
        }
        return await resilientStore.findNotificationJobUnique(args);
      },
      findFirst: async (args: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.notificationJob.findFirst(args);
          } catch {}
        }
        return (await resilientStore.findNotificationJobs(args))[0] || null;
      },
      count: async (args?: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.notificationJob.count(args);
          } catch {}
        }
        return await resilientStore.countNotificationJobs(args);
      },
      create: async (args: any) => {
        let prismaRes = null;
        if (rawPrisma) {
          try {
            prismaRes = await rawPrisma.notificationJob.create(args);
          } catch {}
        }
        const storeRes = await resilientStore.createNotificationJob(args);
        return prismaRes || storeRes;
      },
      update: async (args: any) => {
        let prismaRes = null;
        if (rawPrisma) {
          try {
            prismaRes = await rawPrisma.notificationJob.update(args);
          } catch {}
        }
        const storeRes = await resilientStore.updateNotificationJob(args);
        return prismaRes || storeRes;
      },
      updateMany: async (args: any) => {
        let prismaRes = null;
        if (rawPrisma) {
          try {
            prismaRes = await rawPrisma.notificationJob.updateMany(args);
          } catch {}
        }
        const storeRes = await resilientStore.updateManyNotificationJobs(args);
        return prismaRes || storeRes;
      },
    },
    notification: {
      groupBy: async () => [],
      create: async (args: any) => {
        let prismaRes = null;
        if (rawPrisma) {
          try {
            prismaRes = await rawPrisma.notification.create(args);
          } catch {}
        }
        const storeRes = await resilientStore.createNotification(args);
        return prismaRes || storeRes;
      },
      findMany: async (args: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.notification.findMany(args);
          } catch {}
        }
        return await resilientStore.findNotifications(args);
      },
      count: async (args?: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.notification.count(args);
          } catch {}
        }
        return (await resilientStore.findNotifications(args)).length;
      },
      update: async (args: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.notification.update(args);
          } catch {}
        }
        return await resilientStore.updateNotification(args);
      },
      updateMany: async (args: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.notification.updateMany(args);
          } catch {}
        }
        return await resilientStore.updateManyNotifications(args);
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
            return await rawPrisma.subscription.findUnique(args);
          } catch (err) {
            console.warn("[db.subscription.findUnique Prisma warn]:", err);
          }
        }
        return await resilientStore.findSubscriptionFirst(args);
      },
      findFirst: async (args: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.subscription.findFirst(args);
          } catch (err) {
            console.warn("[db.subscription.findFirst Prisma warn]:", err);
          }
        }
        return await resilientStore.findSubscriptionFirst(args);
      },
      findMany: async (args?: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.subscription.findMany(args);
          } catch (err) {
            console.warn("[db.subscription.findMany Prisma warn]:", err);
          }
        }
        return await resilientStore.findSubscriptions(args);
      },

      create: async (args: any) => {
        let prismaRes = null;
        if (rawPrisma) {
          try {
            prismaRes = await rawPrisma.subscription.create(args);
          } catch (err) {
            console.error("[db.subscription.create Prisma error]:", err);
          }
        }
        const storeRes = await resilientStore.createSubscription(args);
        return prismaRes || storeRes;
      },
      update: async (args: any) => {
        let prismaRes = null;
        if (rawPrisma) {
          try {
            prismaRes = await rawPrisma.subscription.update(args);
          } catch (err) {
            console.error("[db.subscription.update Prisma error]:", err);
          }
        }
        const storeRes = await resilientStore.updateSubscription(args);
        return prismaRes || storeRes;
      },
      count: async (args?: any) => {
        if (rawPrisma) {
          try {
            return await rawPrisma.subscription.count(args);
          } catch {}
        }
        return (await resilientStore.findSubscriptions(args)).length;
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
    paymentRequest: {
      findMany: async (args?: any) => {
        if (rawPrisma) {
          try {
            return await (rawPrisma as any).paymentRequest.findMany(args);
          } catch (err) {
            console.error("[db.paymentRequest.findMany error]", err);
          }
        }
        return await resilientStore.getAllPaymentRequests();
      },
      findUnique: async (args: any) => {
        if (rawPrisma) {
          try {
            return await (rawPrisma as any).paymentRequest.findUnique(args);
          } catch (err) {
            console.error("[db.paymentRequest.findUnique error]", err);
          }
        }
        const list = await resilientStore.getAllPaymentRequests();
        return list.find((r: any) => r.id === args?.where?.id) || null;
      },
      findFirst: async (args?: any) => {
        if (rawPrisma) {
          try {
            return await (rawPrisma as any).paymentRequest.findFirst(args);
          } catch (err) {
            console.error("[db.paymentRequest.findFirst error]", err);
          }
        }
        const list = await resilientStore.getAllPaymentRequests();
        if (args?.where?.id) return list.find((r: any) => r.id === args.where.id) || null;
        if (args?.where?.userId) return list.find((r: any) => r.userId === args.where.userId) || null;
        return list[0] || null;
      },
      create: async (args: any) => {
        let prismaRes = null;
        if (rawPrisma) {
          try {
            prismaRes = await (rawPrisma as any).paymentRequest.create(args);
          } catch (err) {
            console.error("[db.paymentRequest.create error]", err);
          }
        }
        const storeRes = await resilientStore.createPaymentRequest(args.data);
        return prismaRes || storeRes;
      },
      update: async (args: any) => {
        let prismaRes = null;
        if (rawPrisma) {
          try {
            prismaRes = await (rawPrisma as any).paymentRequest.update(args);
          } catch (err) {
            console.error("[db.paymentRequest.update error]", err);
          }
        }
        if (args?.data?.status === "APPROVED") {
          await resilientStore.approvePaymentRequest(args.where.id, args.data?.adminNotes);
        } else if (args?.data?.status === "REJECTED") {
          await resilientStore.rejectPaymentRequest(args.where.id, args.data?.adminNotes);
        }
        return prismaRes || { id: args?.where?.id, ...args?.data };
      },
      count: async (args?: any) => {
        if (rawPrisma) {
          try {
            return await (rawPrisma as any).paymentRequest.count(args);
          } catch {}
        }
        return (await resilientStore.getAllPaymentRequests()).length;
      },
    },
    subscriptionRequest: {
      findMany: async (args?: any) => {
        if (rawPrisma) {
          try {
            return await (rawPrisma as any).paymentRequest.findMany(args);
          } catch {}
        }
        return await resilientStore.getAllPaymentRequests();
      },
      findFirst: async (args?: any) => {
        if (rawPrisma) {
          try {
            return await (rawPrisma as any).paymentRequest.findFirst(args);
          } catch {}
        }
        const list = await resilientStore.getAllPaymentRequests();
        if (args?.where?.id) return list.find((r: any) => r.id === args.where.id) || null;
        if (args?.where?.userId) return list.find((r: any) => r.userId === args.where.userId) || null;
        return list[0] || null;
      },
      create: async (args: any) => {
        if (rawPrisma) {
          try {
            return await (rawPrisma as any).paymentRequest.create(args);
          } catch {}
        }
        return await resilientStore.createPaymentRequest(args.data);
      },
      update: async (args: any) => {
        if (rawPrisma) {
          try {
            return await (rawPrisma as any).paymentRequest.update(args);
          } catch {}
        }
        if (args?.data?.status === "APPROVED") {
          return await resilientStore.approvePaymentRequest(args.where.id);
        } else if (args?.data?.status === "REJECTED") {
          return await resilientStore.rejectPaymentRequest(args.where.id, args.data.adminNotes);
        }
        return null;
      },
    },

    // ── PushSubscription — pass-through to Prisma directly ──────────────
    pushSubscription: {
      upsert: async (args: any) => {
        if (rawPrisma) {
          try { return await rawPrisma.pushSubscription.upsert(args); } catch {}
        }
        return { id: "stub", ...args.create };
      },
      delete: async (args: any) => {
        if (rawPrisma) {
          try { return await rawPrisma.pushSubscription.delete(args); } catch {}
        }
        return null;
      },
      findMany: async (args?: any) => {
        if (rawPrisma) {
          try { return await rawPrisma.pushSubscription.findMany(args); } catch {}
        }
        return [];
      },
    },

    // ── CommunityScout — pass-through to Prisma directly ────────────────
    communityScout: {
      findFirst: async (args?: any) => {
        if (rawPrisma) {
          try { return await rawPrisma.communityScout.findFirst(args); } catch {}
        }
        return null;
      },
      findMany: async (args?: any) => {
        if (rawPrisma) {
          try { return await rawPrisma.communityScout.findMany(args); } catch {}
        }
        return [];
      },
      upsert: async (args: any) => {
        if (rawPrisma) {
          try { return await rawPrisma.communityScout.upsert(args); } catch {}
        }
        return { id: "stub", ...args.create };
      },
      delete: async (args: any) => {
        if (rawPrisma) {
          try { return await rawPrisma.communityScout.delete(args); } catch {}
        }
        return null;
      },
    },

    // ── FamilyMember — pass-through to Prisma directly ──────────────────
    familyMember: {
      findMany: async (args?: any) => {
        if (rawPrisma) {
          try { return await rawPrisma.familyMember.findMany(args); } catch {}
        }
        return [];
      },
      findFirst: async (args?: any) => {
        if (rawPrisma) {
          try { return await rawPrisma.familyMember.findFirst(args); } catch {}
        }
        return null;
      },
      create: async (args: any) => {
        if (rawPrisma) {
          try { return await rawPrisma.familyMember.create(args); } catch {}
        }
        return { id: "stub", ...args.data };
      },
      delete: async (args: any) => {
        if (rawPrisma) {
          try { return await rawPrisma.familyMember.delete(args); } catch {}
        }
        return null;
      },
    },
  } as unknown as PrismaClient;

}

export const db = createSelfHealingDb();
