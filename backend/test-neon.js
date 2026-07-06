const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: { url: "postgresql://neondb_owner:npg_bG3mfAuh7QPa@ep-broad-field-ac9xbn64-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true" }
  }
});

async function check() {
  try {
    const users = await prisma.user.findMany();
    console.log("Users:", users);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
