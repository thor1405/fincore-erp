const { PrismaClient } = require('@prisma/client');
const { Resend } = require('resend');
const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send live email via Resend API
 */
const sendEmail = async (toEmail, subject, body) => {
  try {
    const data = await resend.emails.send({
      from: 'FinCore ERP <onboarding@resend.dev>',
      to: [toEmail],
      subject: subject,
      text: body
    });
    console.log(`✉️  LIVE EMAIL SENT TO: ${toEmail} (ID: ${data?.data?.id || data?.id})`);
  } catch (error) {
    console.error('❌ Failed to send live email via Resend:', error);
  }
};

/**
 * Create an in-app notification for the user.
 */
const createInAppNotification = async (userId, title, message, type = 'info') => {
  try {
    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type
      }
    });
  } catch (error) {
    console.error('Failed to create in-app notification:', error);
  }
};

/**
 * Fetch a user's settings.
 */
const getUserSettings = async (userId) => {
  return await prisma.settings.findUnique({
    where: { userId },
    include: { user: true }
  });
};

/**
 * Triggers a Security Alert.
 * Sent if `emailSecurity` is true.
 */
const triggerSecurityAlert = async (userId, actionDetails) => {
  const settings = await getUserSettings(userId);
  if (!settings) return;

  if (settings.emailSecurity) {
    const emailSubject = 'FinCore Security Alert';
    const emailBody = `Hello ${settings.user.name},\n\nWe wanted to let you know about a recent security event on your account:\n\n${actionDetails}\n\nIf you did not perform this action, please secure your account immediately.\n\nBest,\nFinCore Security Team`;
    await sendEmail(settings.user.email, emailSubject, emailBody);
  }
};

/**
 * Triggers an Invoice Update alert.
 * Sent if `emailInvoices` is true.
 */
const triggerInvoiceUpdate = async (userId, invoiceId, status, clientName, amount) => {
  const settings = await getUserSettings(userId);
  if (!settings) return;

  if (settings.emailInvoices) {
    const formattedAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency: settings.currency }).format(amount);
    const emailSubject = `Invoice Update: ${invoiceId}`;
    const emailBody = `Hello ${settings.user.name},\n\nYour invoice ${invoiceId} for client ${clientName} (Amount: ${formattedAmount}) is now marked as: ${status}.\n\nBest,\nFinCore Billing Team`;
    await sendEmail(settings.user.email, emailSubject, emailBody);
  }
};

/**
 * Triggers a Large Transaction Approval in-app alert.
 * Sent if `pushApprovals` is true.
 */
const triggerLargeTransactionAlert = async (userId, transactionDesc, amount) => {
  const settings = await getUserSettings(userId);
  if (!settings) return;

  if (settings.pushApprovals) {
    const formattedAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency: settings.currency }).format(amount);
    await createInAppNotification(
      userId,
      'Large Transaction Needs Approval',
      `A transaction for "${transactionDesc}" amounting to ${formattedAmount} was just created and may require approval.`,
      'alert'
    );
  }
};

/**
 * Triggers an Overdue Invoice in-app alert.
 * Sent if `pushOverdue` is true.
 */
const triggerOverdueInvoiceAlert = async (userId, invoiceId, clientName) => {
  const settings = await getUserSettings(userId);
  if (!settings) return;

  if (settings.pushOverdue) {
    await createInAppNotification(
      userId,
      'Invoice Overdue',
      `Invoice ${invoiceId} for ${clientName} is now overdue. Please follow up.`,
      'alert'
    );
    await sendEmail(
      settings.user.email,
      `URGENT: Invoice ${invoiceId} is Overdue`,
      `Hello ${settings.user.name},\n\nThis is an automated notice that Invoice ${invoiceId} for client "${clientName}" is past its due date and remains unpaid.\n\nPlease log in to follow up with the client.\n\nBest,\nFinCore Automated Alert System`
    );
  }
};

/**
 * Triggers the Weekly Financial Summary email.
 * Sent if `emailReports` is true.
 */
const triggerWeeklySummary = async (userId, reportData) => {
  const settings = await getUserSettings(userId);
  if (!settings) return;

  if (settings.emailReports) {
    const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: settings.currency });
    const emailSubject = 'Your Weekly FinCore Financial Summary';
    const emailBody = `Hello ${settings.user.name},\n\nHere is your financial digest for the week:\n\nTotal Revenue: ${formatter.format(reportData.revenue)}\nTotal Expenses: ${formatter.format(reportData.expenses)}\nNet Cash Flow: ${formatter.format(reportData.cashFlow)}\n\nLog in to your dashboard to see more details.\n\nBest,\nFinCore Team`;
    await sendEmail(settings.user.email, emailSubject, emailBody);
  }
};

module.exports = {
  triggerSecurityAlert,
  triggerInvoiceUpdate,
  triggerLargeTransactionAlert,
  triggerOverdueInvoiceAlert,
  triggerWeeklySummary,
  createInAppNotification
};
