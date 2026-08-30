const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const db = new PrismaClient();
async function main() {
  const email = "abdulnabi.khaskheli@gmail.com";
  const user = await db.user.findFirst({ where: { email } });
  if (!user) { console.log("ERROR: No user found with email:", email); process.exit(1); }
  console.log("Found user:", user.id, "| Role:", user.role);
  const newPassword = process.env.ADMIN_PASS || "PawLink@Admin2026";
  const hash = await bcrypt.hash(newPassword, 12);
  const updated = await db.user.update({ where: { id: user.id }, data: { role: "ADMIN", passwordHash: hash } });
  console.log("SUCCESS:", updated.email, "| role:", updated.role);
  console.log("Password set to:", newPassword);
}
main().catch((e) => { console.error(e.message); process.exit(1); }).finally(() => db.$disconnect());