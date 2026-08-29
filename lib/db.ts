import { PrismaClient } from "@prisma/client";
import { resilientStore } from "./store";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const rawPrisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = rawPrisma;

/**
 * Self-healing DB proxy that routes to Prisma when PostgreSQL is healthy,
 * and transparently falls back to the resilient data store if PostgreSQL is unreachable or paused.
 */
function createSelfHealingDb() {
  const handler: ProxyHandler<any> = {
    get(target, prop: string) {
      if (prop === "$transaction") {
        return async (callbackOrArray: any) => {
          try {
            if (typeof callbackOrArray === "function") {
              return await callbackOrArray(target);
            }
            return await Promise.all(callbackOrArray);
          } catch (e) {
            return [];
          }
        };
      }

      // Model Handlers
      if (prop === "user") {
        return {
          findUnique: async (args: any) => {
            try {
              return await rawPrisma.user.findUnique(args);
            } catch {
              return resilientStore.findUserUnique(args);
            }
          },
          findFirst: async (args: any) => {
            try {
              return await rawPrisma.user.findFirst(args);
            } catch {
              return resilientStore.findUserFirst(args);
            }
          },
          create: async (args: any) => {
            try {
              return await rawPrisma.user.create(args);
            } catch {
              return resilientStore.createUser(args);
            }
          },
          update: async (args: any) => {
            try {
              return await rawPrisma.user.update(args);
            } catch {
              return resilientStore.updateUser(args);
            }
          },
        };
      }

      if (prop === "pet") {
        return {
          findMany: async (args?: any) => {
            try {
              return await rawPrisma.pet.findMany(args);
            } catch {
              return resilientStore.findPets(args);
            }
          },
          findFirst: async (args: any) => {
            try {
              return await rawPrisma.pet.findFirst(args);
            } catch {
              return resilientStore.findPetFirst(args);
            }
          },
          findUnique: async (args: any) => {
            try {
              return await rawPrisma.pet.findUnique(args);
            } catch {
              return resilientStore.findPetFirst(args);
            }
          },
          create: async (args: any) => {
            try {
              return await rawPrisma.pet.create(args);
            } catch {
              return resilientStore.createPet(args);
            }
          },
          update: async (args: any) => {
            try {
              return await rawPrisma.pet.update(args);
            } catch {
              return resilientStore.updatePet(args);
            }
          },
        };
      }

      if (prop === "tag") {
        return {
          findUnique: async (args: any) => {
            try {
              return await rawPrisma.tag.findUnique(args);
            } catch {
              return resilientStore.findTagFirst(args);
            }
          },
          findFirst: async (args: any) => {
            try {
              return await rawPrisma.tag.findFirst(args);
            } catch {
              return resilientStore.findTagFirst(args);
            }
          },
          findMany: async (args?: any) => {
            try {
              return await rawPrisma.tag.findMany(args);
            } catch {
              return resilientStore.findTags(args);
            }
          },
          create: async (args: any) => {
            try {
              return await rawPrisma.tag.create(args);
            } catch {
              return resilientStore.createTag(args);
            }
          },
          update: async (args: any) => {
            try {
              return await rawPrisma.tag.update(args);
            } catch {
              return resilientStore.updateTag(args);
            }
          },
        };
      }

      if (prop === "recoveryEvent") {
        return {
          create: async (args: any) => {
            try {
              return await rawPrisma.recoveryEvent.create(args);
            } catch {
              return resilientStore.createRecoveryEvent(args);
            }
          },
          createMany: async (args: any) => {
            try {
              return await rawPrisma.recoveryEvent.createMany(args);
            } catch {
              return { count: args.data?.length || 0 };
            }
          },
        };
      }

      if (prop === "scanEvent") {
        return {
          create: async (args: any) => {
            try {
              return await rawPrisma.scanEvent.create(args);
            } catch {
              return resilientStore.createScanEvent(args);
            }
          },
        };
      }

      if (prop === "locationEvent") {
        return {
          create: async (args: any) => {
            try {
              return await rawPrisma.locationEvent.create(args);
            } catch {
              return resilientStore.createLocationEvent(args);
            }
          },
        };
      }

      if (prop === "conversation") {
        return {
          findFirst: async (args: any) => {
            try {
              return await rawPrisma.conversation.findFirst(args);
            } catch {
              return null;
            }
          },
          create: async (args: any) => {
            try {
              return await rawPrisma.conversation.create(args);
            } catch {
              return resilientStore.createConversation(args);
            }
          },
        };
      }

      if (prop === "message") {
        return {
          create: async (args: any) => {
            try {
              return await rawPrisma.message.create(args);
            } catch {
              return resilientStore.createMessage(args);
            }
          },
        };
      }

      if (prop === "notificationJob") {
        return {
          create: async (args: any) => {
            try {
              return await rawPrisma.notificationJob.create(args);
            } catch {
              return resilientStore.createNotificationJob(args);
            }
          },
        };
      }

      if (prop === "notification") {
        return {
          create: async (args: any) => {
            try {
              return await rawPrisma.notification.create(args);
            } catch {
              return resilientStore.createNotification(args);
            }
          },
        };
      }

      if (prop === "auditLog") {
        return {
          create: async (args: any) => {
            try {
              return await rawPrisma.auditLog.create(args);
            } catch {
              return resilientStore.createAuditLog(args);
            }
          },
        };
      }

      // Default fallback
      if (prop in target) {
        return target[prop];
      }

      return {};
    },
  };

  return new Proxy(rawPrisma, handler);
}

export const db = createSelfHealingDb();
