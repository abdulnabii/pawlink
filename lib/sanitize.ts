/**
 * Recursively serializes a Prisma result object to a plain JSON-safe value.
 * Converts:
 *   - Prisma Decimal → number
 *   - BigInt → number
 *   - Date → ISO string
 *   - All nested objects and arrays
 *
 * This prevents React error #31: "Objects are not valid as a React child"
 * which occurs when Prisma Decimal objects are passed to JSON responses
 * and then rendered in JSX.
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
