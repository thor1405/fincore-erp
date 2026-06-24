const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Creates an audit log entry in the database.
 * @param {string} userId - The ID of the user performing the action
 * @param {string} action - Short description of the action (e.g., 'CREATED_TRANSACTION')
 * @param {string} module - The module where the action occurred (e.g., 'Transactions')
 * @param {string} details - Additional context or details
 */
async function createAuditLog(userId, action, module, details = null, actorId = null) {
  try {
    if (!userId) return;
    await prisma.auditLog.create({
      data: {
        userId,
        actorId: actorId || userId,
        action,
        module,
        details
      }
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // We swallow the error here to prevent audit logging failures from crashing the main request
  }
}

module.exports = { createAuditLog };
