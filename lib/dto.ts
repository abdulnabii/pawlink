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
  };
}

/**
 * Strictly projects a Pet database record and its relations into a safe, non-leaking PublicPetResponse DTO.
 * Guarantees zero leak of: userId, owner email, microchip number, private medical notes, or exact coordinates.
 */
export function toPublicPetResponse(
  pet: Pet & {
    medicalRecords?: PetMedicalRecord[];
    recoveryCases?: RecoveryCase[];
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
      directPhone: pet.hideOwnerPhone ? null : pet.contactPhone,
    },
  };
}
