import { z } from "zod";

export const RegisterInputSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
});

export const LoginInputSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const CreatePetInputSchema = z.object({
  name: z.string().min(1, "Pet name is required").max(50),
  species: z.string().min(1, "Species is required"),
  breed: z.string().max(100).optional().nullable(),
  gender: z.enum(["Male", "Female", "Unknown"]).optional().nullable(),
  birthDate: z.string().optional().nullable(),
  weight: z.number().positive().max(300).optional().nullable(),
  color: z.string().max(100).optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
  microchipNumber: z.string().max(50).optional().nullable(),
  personality: z.string().max(500).optional().nullable(),
  specialInstructions: z.string().max(1000).optional().nullable(),
  allowWhatsApp: z.boolean().default(true),
  allowPhoneCall: z.boolean().default(false),
  allowInAppChat: z.boolean().default(true),
  hideOwnerPhone: z.boolean().default(true),
  contactPhone: z.string().optional().nullable(),
});

export const UpdatePetInputSchema = CreatePetInputSchema.partial();

export const LostModeInputSchema = z.object({
  activate: z.boolean(),
  lastSeenLocation: z.string().max(200).optional().nullable(),
  lastSeenLatitude: z.number().min(-90).max(90).optional().nullable(),
  lastSeenLongitude: z.number().min(-180).max(180).optional().nullable(),
  rewardAmount: z.number().min(0).max(100000).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  resolutionNote: z.string().max(1000).optional().nullable(),
});

export const LocationShareInputSchema = z.object({
  tagCode: z.string().min(1, "Tag code is required"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().positive().optional().nullable(),
  addressName: z.string().max(255).optional().nullable(),
  finderNote: z.string().max(500).optional().nullable(),
  finderContact: z.string().max(100).optional().nullable(),
});

export const CreateMessageInputSchema = z.object({
  conversationId: z.string().min(1),
  finderToken: z.string().optional(), // Provided when finder sends message
  content: z.string().min(1).max(2000),
  photoUrl: z.string().url().optional().nullable(),
});

export const TagActivationInputSchema = z.object({
  tagCode: z.string().min(5),
  petId: z.string().min(1),
  activationPin: z.string().optional().nullable(),
  label: z.string().max(100).optional().nullable(),
});

export const NotificationPreferenceSchema = z.object({
  whatsappEnabled: z.boolean(),
  emailEnabled: z.boolean(),
  smsEnabled: z.boolean(),
  pushEnabled: z.boolean(),
  notifyOnScan: z.boolean(),
  notifyOnLocation: z.boolean(),
  notifyOnMessage: z.boolean(),
  notificationPhone: z.string().optional().nullable(),
});

export const MedicalRecordInputSchema = z.object({
  recordType: z.enum(["VACCINATION", "ALLERGY", "MEDICATION", "MEDICAL_CONDITION", "VET_NOTE"]),
  title: z.string().min(1).max(150),
  description: z.string().max(1000).optional().nullable(),
  dateAdministered: z.string().optional().nullable(),
  nextDueDate: z.string().optional().nullable(),
  veterinarian: z.string().max(150).optional().nullable(),
  documentUrl: z.string().url().optional().nullable(),
  isPublicAlert: z.boolean().default(false),
});
