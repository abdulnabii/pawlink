const { PrismaClient } = require('@prisma/client');

async function testPrisma() {
  const connectionStrings = [
    'postgresql://postgres.gqqzcznxncatfovulmtp:FeFv%3F-%40beFc7qWP@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
    'postgresql://postgres.gqqzcznxncatfovulmtp:FeFv%3F-%40beFc7qWP@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
    'postgresql://postgres:FeFv%3F-%40beFc7qWP@db.gqqzcznxncatfovulmtp.supabase.co:5432/postgres'
  ];

  for (const cs of connectionStrings) {
    console.log('Testing Prisma connection to:', cs.split('@')[1]);
    const prisma = new PrismaClient({
      datasources: { db: { url: cs } }
    });
    try {
      await prisma.$connect();
      console.log('✅ Prisma connected successfully to:', cs.split('@')[1]);
      const userCount = await prisma.user.count();
      console.log('User count in DB:', userCount);
      await prisma.$disconnect();
      return cs;
    } catch (err) {
      console.log('❌ Prisma connection failed:', err.message);
      try { await prisma.$disconnect(); } catch {}
    }
  }
}

testPrisma();
