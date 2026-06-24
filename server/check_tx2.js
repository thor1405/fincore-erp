const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const t = await prisma.transaction.findUnique({
    where: { id: '6a3936b2a7b98a9768a4388d' }
  });
  console.log(t);
}
check().catch(console.error).finally(() => prisma.$disconnect());
