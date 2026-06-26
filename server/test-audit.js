const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 2,
      include: {
        actor: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });
    console.log("Success:", JSON.stringify(logs, null, 2));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}
test();
