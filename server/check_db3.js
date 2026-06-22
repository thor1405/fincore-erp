const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 15
  });
  console.log('Recent audit logs:');
  logs.forEach(l => console.log(l.action, l.details, l.createdAt));
}
check().catch(console.error).finally(() => prisma.$disconnect());
