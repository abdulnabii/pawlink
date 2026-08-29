/**
 * Recursively serializes any Prisma or store result object to a plain JSON-safe value.
 * Converts:
 *   - Prisma Decimal → number
 *   - Prisma Atomic Operations { increment: N } / { decrement: N } / { set: N } → number
 *   - BigInt → number
 *   - Date → ISO string
 *   - All nested objects and arrays
 *
 * This guarantees that NO non-renderable objects (such as Decimal or {increment})
 * can EVER be returned to the client and crash React with Error #31.
 */
export function sanitizePrisma<T>(value: T): T {
  if (value === null || value === undefined) return value;

  // Handle Prisma Decimal (decimal.js instance)
  if (
    typeof value === "object" &&
    !Array.isArray(value) &&
    value !== null &&
    typeof (value as any).toNumber === "function"
  ) {
    return (value as any).toNumber() as unknown as T;
  }

  // Handle Prisma Atomic Operation objects like { increment: 1 } or { decrement: 1 } or { set: 1 }
  if (typeof value === "object" && !Array.isArray(value) && value !== null && !(value instanceof Date)) {
    const keys = Object.keys(value);
    if (keys.length === 1 && ("increment" in value || "decrement" in value || "set" in value)) {
      const numVal = (value as any).increment ?? (value as any).decrement ?? (value as any).set;
      if (typeof numVal === "number") {
        return numVal as unknown as T;
      }
      if (numVal !== null && numVal !== undefined) {
        const parsed = Number(numVal);
        if (!isNaN(parsed)) return parsed as unknown as T;
      }
    }
  }

  // Handle BigInt
  if (typeof value === "bigint") {
    return Number(value) as unknown as T;
  }

  // Handle Date
  if (value instanceof Date) {
    return value.toISOString() as unknown as T;
  }

  // Handle Arrays
  if (Array.isArray(value)) {
    return value.map((item) => sanitizePrisma(item)) as unknown as T;
  }

  // Handle plain objects
  if (typeof value === "object" && value !== null) {
    const result: any = {};
    for (const key of Object.keys(value as object)) {
      result[key] = sanitizePrisma((value as any)[key]);
    }
    return result as T;
  }

  return value;
}
