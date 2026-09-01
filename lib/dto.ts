import { Pet, PetMedicalRecord, RecoveryCase, Tag } from "@prisma/client";

export interface PublicMedicalAlert {
  recordType: string;
  title: string;
  description: string | null;
}

export interface PublicRecoveryCase {
  startedAt: string;
  lastSeenLocation: string | null; // e.g. "Clifton Block 4"
  rewardAmount: number | null;
  description: string | null;
}

export interface PublicPetResponse {
  tagCode: string;
  petName: string;
  species: string;
  breed: string | null;
  color: string | null;
  photoUrl: string | null;
  personality: string | null;
  specialInstructions: string | null;
  status: "SAFE" | "LOST" | "RECOVERED" | "DECEASED" | "ARCHIVED";
  isLost: boolean;
  recoveryCase: PublicRecoveryCase | null;
  publicMedicalAlerts: PublicMedicalAlert[];
  contactOptions: {
    allowWhatsApp: boolean;
    allowPhoneCall: boolean;
    allowInAppChat: boolean;
    directPhone: string | null; // Only exposed if owner unchecked hideOwnerPhone
    whatsappPhone: string | null; // Sanitized E.164 phone string for direct WhatsApp chat
  };
}

/**
 * Strips non-digit characters from phone number to form a valid direct WhatsApp URL parameter
 * e.g. "+92 (300) 123-4567" -> "923001234567", "03001234567" -> "923001234567"
 */
export function formatWhatsAppNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^0-9]/g, "");
  if (!digits) return null;
  // If local Pakistani 11-digit format starting with 0 (e.g. 03001234567), convert to 923001234567
  if (digits.startsWith("0") && digits.length === 11) {
    return `92${digits.substring(1)}`;
  }
  // If local US 10-digit format (e.g. 4155552671), prepend 1
  if (digits.length === 10 && !digits.startsWith("92")) {
    return `1${digits}`;
  }
  return digits;
}

/**
 * Strictly projects a Pet database record and its relations into a safe, non-leaking PublicPetResponse DTO.
 * Guarantees zero leak of: userId, owner email, microchip number, private medical notes, or exact coordinates.
 */
export function toPublicPetResponse(
  pet: Pet & {
    medicalRecords?: PetMedicalRecord[];
    recoveryCases?: RecoveryCase[];
    user?: {
      phone?: string | null;
      notificationPreference?: { notificationPhone?: string | null } | null;
    } | null;
  },
  tag: Tag
): PublicPetResponse {
  const activeRecoveryCase = pet.recoveryCases?.find((rc) => rc.status === "OPEN") || null;
  const isLost = pet.status === "LOST" || Boolean(activeRecoveryCase);

  const publicMedicalAlerts: PublicMedicalAlert[] = (pet.medicalRecords || [])
    .filter((mr) => mr.isPublicAlert)
    .map((mr) => ({
      recordType: mr.recordType,
      title: mr.title,
      description: mr.description,
    }));

  const rawPhone =
    pet.contactPhone ||
    (pet as any).user?.phone ||
    (pet as any).user?.notificationPreference?.notificationPhone ||
    null;

  return {
    tagCode: tag.tagCode,
    petName: pet.name,
    species: pet.species,
    breed: pet.breed,
    color: pet.color,
    photoUrl: pet.photoUrl,
    personality: pet.personality,
    specialInstructions: pet.specialInstructions,
    status: pet.status as any,
    isLost,
    recoveryCase: activeRecoveryCase
      ? {
          startedAt: activeRecoveryCase.startedAt
            ? typeof activeRecoveryCase.startedAt === "string"
              ? activeRecoveryCase.startedAt
              : new Date(activeRecoveryCase.startedAt).toISOString()
            : new Date().toISOString(),
          lastSeenLocation: activeRecoveryCase.lastSeenLocation,
          rewardAmount:
            activeRecoveryCase.rewardAmount != null
              ? Number(activeRecoveryCase.rewardAmount)
              : null,
          description: activeRecoveryCase.description,
        }
      : null,
    publicMedicalAlerts,
    contactOptions: {
      allowWhatsApp: pet.allowWhatsApp,
      allowPhoneCall: pet.allowPhoneCall,
      allowInAppChat: pet.allowInAppChat,
      directPhone: pet.hideOwnerPhone ? null : (pet.contactPhone || rawPhone),
      whatsappPhone: pet.allowWhatsApp ? formatWhatsAppNumber(rawPhone) : null,
    },
  };
}
