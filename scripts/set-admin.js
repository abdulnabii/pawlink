const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const db = new PrismaClient();
async function main() {
  const emails = ["abdulnabi.khaskhely@gmail.com", "khaskheli.abdulnabi110@gmail.com", "abdulnabi.khaskheli@gmail.com"];
  const newPassword = process.env.ADMIN_PASS || "PawLink@Admin2026";
  const hash = await bcrypt.hash(newPassword, 12);
  for (const email of emails) {
    const user = await db.user.findFirst({ where: { email } });
    if (user) {
      const updated = await db.user.update({ where: { id: user.id }, data: { role: "SUPER_ADMIN", passwordHash: hash } });
      console.log("Updated admin:", updated.email, "| role:", updated.role);
    }
  }
}
main().catch((e) => { console.error(e.message); process.exit(1); }).finally(() => db.$disconnect());