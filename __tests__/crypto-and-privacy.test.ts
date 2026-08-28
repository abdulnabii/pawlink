import { describe, it, expect } from "vitest";
import { generateTagCode, generateFinderToken, hashIp, generateScanFingerprint } from "../lib/crypto";
import { toPublicPetResponse } from "../lib/dto";

describe("Cryptographic Security & Privacy Suite", () => {
  it("should generate cryptographically secure, high-entropy tag codes with PW- prefix", () => {
    const code1 = generateTagCode();
    const code2 = generateTagCode();

    expect(code1).toMatch(/^PW-[2-9A-HJ-NP-Z]{14}$/);
    expect(code2).toMatch(/^PW-[2-9A-HJ-NP-Z]{14}$/);
    expect(code1).not.toEqual(code2);
  });

  it("should generate 256-bit hex finder tokens", () => {
    const token = generateFinderToken();
    expect(token).toHaveLength(64); // 32 bytes hex = 64 chars
  });

  it("should salt and hash IP addresses consistently without storing raw IPs", () => {
    const ip = "192.168.1.105";
    const hash1 = hashIp(ip);
    const hash2 = hashIp(ip);

    expect(hash1).toHaveLength(64);
    expect(hash1).toEqual(hash2);
    expect(hash1).not.toContain(ip);
  });

  it("should strictly redact sensitive owner details in toPublicPetResponse DTO", () => {
    const mockPet: any = {
      id: "pet_123",
      userId: "user_secret_999",
      name: "Max",
      species: "Dog",
      breed: "Golden Retriever",
      color: "Golden",
      photoUrl: "https://example.com/photo.jpg",
      microchipNumber: "SECRET_CHIP_985141001",
      personality: "Friendly",
      specialInstructions: "Give treats",
      status: "LOST",
      contactPhone: "+15551234567",
      allowWhatsApp: true,
      allowPhoneCall: false,
      allowInAppChat: true,
      hideOwnerPhone: true,
      medicalRecords: [
        {
          id: "m1",
          recordType: "ALLERGY",
          title: "Chicken Allergy",
          description: "Feed only beef",
          isPublicAlert: true,
        },
        {
          id: "m2",
          recordType: "VACCINATION",
          title: "Private Rabies Cert",
          description: "Doctor confidential note",
          isPublicAlert: false,
        },
      ],
      recoveryCases: [
        {
          id: "case_1",
          status: "OPEN",
          startedAt: new Date(),
          lastSeenLocation: "Clifton Block 4",
          rewardAmount: 500,
          description: "Missing near park",
        },
      ],
    };

    const mockTag: any = {
      tagCode: "PW-7KX9Q2M8F4R6T1",
      status: "ACTIVE",
    };

    const publicDto = toPublicPetResponse(mockPet, mockTag);

    // Verify allowed public fields
    expect(publicDto.petName).toBe("Max");
    expect(publicDto.species).toBe("Dog");
    expect(publicDto.isLost).toBe(true);
    expect(publicDto.recoveryCase?.lastSeenLocation).toBe("Clifton Block 4");
    expect(publicDto.recoveryCase?.rewardAmount).toBe(500);

    // Verify public medical alerts only include isPublicAlert: true
    expect(publicDto.publicMedicalAlerts).toHaveLength(1);
    expect(publicDto.publicMedicalAlerts[0].title).toBe("Chicken Allergy");

    // CRITICAL: Verify sensitive data is NOT in public projection
    expect((publicDto as any).userId).toBeUndefined();
    expect((publicDto as any).microchipNumber).toBeUndefined();
    expect((publicDto as any).contactPhone).toBeUndefined();
    expect(publicDto.contactOptions.directPhone).toBeNull(); // Masked!
  });
});
