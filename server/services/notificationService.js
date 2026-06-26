const { PrismaClient } = require('@prisma/client');
const { Resend } = require('resend');
const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Reusable HTML Email Wrapper
 */
const renderHtmlTemplate = (title, contentHtml, ctaText = null, ctaUrl = null) => {
  const ctaButton = ctaText && ctaUrl ? `
    <table border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
      <tr>
        <td align="center" style="border-radius: 8px; background: #4f46e5;">
          <a href="${ctaUrl}" target="_blank" style="font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; display: inline-block; padding: 14px 28px; border-radius: 8px; border: 1px solid #4f46e5;">
            ${ctaText}
          </a>
        </td>
      </tr>
    </table>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; margin: 0; padding: 40px 16px; color: #e2e8f0;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #151b2b; border-radius: 16px; border: 1px solid #232d42; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);">
        <!-- Header -->
        <tr>
          <td style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 32px 24px; text-align: center; border-bottom: 1px solid #3730a3;">
            <div style="font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; display: inline-flex; align-items: center; gap: 10px;">
              <span style="display: inline-block; width: 12px; height: 12px; background-color: #818cf8; border-radius: 50%;"></span>
              FinCore ERP
            </div>
          </td>
        </tr>
        <!-- Content -->
        <tr>
          <td style="padding: 36px 32px; font-size: 16px; line-height: 1.6; color: #cbd5e1;">
            ${contentHtml}
            ${ctaButton}
            <p style="margin-top: 32px; font-size: 14px; color: #94a3b8;">
              Best regards,<br>
              <strong style="color: #f8fafc;">The FinCore Team</strong>
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background-color: #0f1422; padding: 24px 32px; text-align: center; font-size: 13px; color: #64748b; border-top: 1px solid #232d42;">
            <p style="margin: 0 0 8px 0; color: #94a3b8; font-weight: 500;">FinCore Enterprise Operating System</p>
            <p style="margin: 0;">Automated notification sent from secured servers. <a href="https://myjoice.com" style="color: #818cf8; text-decoration: none;">Launch Portal</a></p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

/**
 * Send live email via Resend API
 */
const sendEmail = async (toEmail, subject, plainText, htmlContent) => {
  try {
    const data = await resend.emails.send({
      from: 'FinCore ERP <notifications@myjoice.com>',
      to: [toEmail],
      subject: subject,
      text: plainText,
      html: htmlContent
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
      data: { userId, title, message, type }
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
 * Triggers Onboarding Welcome Email
 */
const triggerWelcomeEmail = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const subject = 'Welcome to FinCore ERP 🚀';
  const plainText = `Hi ${user.name},\n\nWelcome to FinCore ERP! Your enterprise operating system is ready.\n\nLog in at https://myjoice.com`;
  const html = renderHtmlTemplate(
    subject,
    `
      <h2 style="color: #ffffff; margin-top: 0; font-size: 22px;">Welcome aboard, ${user.name}! 🎉</h2>
      <p>We are thrilled to have you set up on **FinCore ERP**. Your centralized financial operating system is completely configured and ready to streamline your business.</p>
      <div style="background-color: #1e293b; padding: 20px; border-radius: 12px; border-left: 4px solid #818cf8; margin: 24px 0;">
        <h4 style="color: #ffffff; margin: 0 0 12px 0; font-size: 16px;">What you can do right now:</h4>
        <ul style="margin: 0; padding-left: 20px; color: #e2e8f0;">
          <li style="margin-bottom: 8px;"><strong>Invoices & Billing:</strong> Create professional invoices and track lifetime collections.</li>
          <li style="margin-bottom: 8px;"><strong>CRM Directory:</strong> Manage customer and vendor profiles natively.</li>
          <li style="margin-bottom: 8px;"><strong>General Ledger:</strong> Track double-entry accounting journals and balance sheets.</li>
          <li><strong>AI Assistant:</strong> Ask financial questions and get instant insights.</li>
        </ul>
      </div>
      <p>Click below to jump into your active workspace:</p>
    `,
    'Launch FinCore Portal',
    'https://myjoice.com'
  );

  await sendEmail(user.email, subject, plainText, html);
};

/**
 * Triggers a Security Alert.
 */
const triggerSecurityAlert = async (userId, actionDetails) => {
  const settings = await getUserSettings(userId);
  if (!settings || !settings.emailSecurity) return;

  const subject = 'FinCore Security Alert 🛡️';
  const plainText = `Hello ${settings.user.name},\n\nSecurity notice: ${actionDetails}\n\nIf you did not perform this action, please secure your account immediately.`;
  const html = renderHtmlTemplate(
    subject,
    `
      <h2 style="color: #f87171; margin-top: 0; font-size: 20px;">Security Event Detected</h2>
      <p>Hello ${settings.user.name},</p>
      <p>We detected a recent security-related action on your FinCore account:</p>
      <div style="background-color: #451a1a; border: 1px solid #7f1d1d; padding: 16px; border-radius: 8px; color: #fca5a5; font-family: monospace; margin: 20px 0;">
        ${actionDetails}
      </div>
      <p>If you authorized this change, no further action is required. If you did not recognize this activity, please reset your password immediately.</p>
    `,
    'Review Account Security',
    'https://myjoice.com/settings'
  );

  await sendEmail(settings.user.email, subject, plainText, html);
};

/**
 * Triggers an Invoice Update alert.
 */
const triggerInvoiceUpdate = async (userId, invoiceId, status, clientName, amount) => {
  const settings = await getUserSettings(userId);
  if (!settings || !settings.emailInvoices) return;

  const locale = settings.currency === 'INR' ? 'en-IN' : 'en-US';
  const formattedAmount = new Intl.NumberFormat(locale, { style: 'currency', currency: settings.currency }).format(amount);
  const subject = `Invoice Update: ${invoiceId} (${status})`;
  const plainText = `Hello ${settings.user.name},\n\nInvoice ${invoiceId} for ${clientName} (${formattedAmount}) is now marked as: ${status}.`;
  
  const statusColor = status === 'Paid' ? '#10b981' : '#f59e0b';
  const html = renderHtmlTemplate(
    subject,
    `
      <h2 style="color: #ffffff; margin-top: 0; font-size: 20px;">Invoice Status Changed</h2>
      <p>Hello ${settings.user.name},</p>
      <p>Your invoice has been updated in the billing ledger:</p>
      <table width="100%" border="0" cellspacing="0" cellpadding="12" style="background-color: #1e293b; border-radius: 8px; margin: 20px 0;">
        <tr>
          <td style="color: #94a3b8; font-size: 14px;">Invoice ID</td>
          <td align="right" style="color: #ffffff; font-weight: bold;">${invoiceId}</td>
        </tr>
        <tr>
          <td style="color: #94a3b8; font-size: 14px;">Client</td>
          <td align="right" style="color: #ffffff; font-weight: bold;">${clientName}</td>
        </tr>
        <tr>
          <td style="color: #94a3b8; font-size: 14px;">Total Amount</td>
          <td align="right" style="color: #818cf8; font-weight: bold; font-size: 18px;">${formattedAmount}</td>
        </tr>
        <tr>
          <td style="color: #94a3b8; font-size: 14px;">Current Status</td>
          <td align="right"><span style="background-color: ${statusColor}; color: #ffffff; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase;">${status}</span></td>
        </tr>
      </table>
    `,
    'View Invoice Ledger',
    'https://myjoice.com/invoices'
  );

  await sendEmail(settings.user.email, subject, plainText, html);
};

/**
 * Triggers a Large Transaction Approval in-app alert.
 */
const triggerLargeTransactionAlert = async (userId, transactionDesc, amount) => {
  const settings = await getUserSettings(userId);
  if (!settings || !settings.pushApprovals) return;

  const locale = settings.currency === 'INR' ? 'en-IN' : 'en-US';
  const formattedAmount = new Intl.NumberFormat(locale, { style: 'currency', currency: settings.currency }).format(amount);
  await createInAppNotification(
    userId,
    'Large Transaction Needs Approval',
    `A transaction for "${transactionDesc}" amounting to ${formattedAmount} was just created and may require approval.`,
    'alert'
  );
};

/**
 * Triggers an Overdue Invoice alert.
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
    
    const subject = `⚠️ URGENT: Invoice ${invoiceId} is Overdue`;
    const plainText = `Hello ${settings.user.name},\n\nInvoice ${invoiceId} for client "${clientName}" is past its due date and remains unpaid.\n\nPlease log in to follow up.`;
    const html = renderHtmlTemplate(
      subject,
      `
        <h2 style="color: #f87171; margin-top: 0; font-size: 20px;">Overdue Invoice Notice</h2>
        <p>Hello ${settings.user.name},</p>
        <p>Our automated auditing system detected an unpaid invoice that has exceeded its scheduled payment due date:</p>
        <div style="background-color: #451a1a; border-left: 4px solid #ef4444; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <strong style="color: #fca5a5; display: block; font-size: 16px;">Invoice: ${invoiceId}</strong>
          <span style="color: #cbd5e1; display: block; margin-top: 4px;">Client: ${clientName}</span>
          <span style="color: #ef4444; font-weight: bold; display: block; margin-top: 8px;">Status: PAYMENT OVERDUE</span>
        </div>
        <p>We recommend sending a reminder link to the customer or checking their payment status.</p>
      `,
      'Follow Up With Client',
      'https://myjoice.com/invoices'
    );

    await sendEmail(settings.user.email, subject, plainText, html);
  }
};

/**
 * Triggers the Weekly Financial Summary email.
 */
const triggerWeeklySummary = async (userId, reportData) => {
  const settings = await getUserSettings(userId);
  if (!settings || !settings.emailReports) return;

  const locale = settings.currency === 'INR' ? 'en-IN' : 'en-US';
  const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency: settings.currency });
  const rev = formatter.format(reportData.revenue);
  const exp = formatter.format(reportData.expenses);
  const net = formatter.format(reportData.cashFlow);

  const subject = 'Your Weekly FinCore Financial Digest 📊';
  const plainText = `Hello ${settings.user.name},\n\nWeekly Digest:\nRevenue: ${rev}\nExpenses: ${exp}\nNet Cash Flow: ${net}`;
  const html = renderHtmlTemplate(
    subject,
    `
      <h2 style="color: #ffffff; margin-top: 0; font-size: 20px;">Weekly Executive Digest</h2>
      <p>Hello ${settings.user.name},</p>
      <p>Here is your verified financial performance summary for the preceding 7 days:</p>
      <table width="100%" border="0" cellspacing="0" cellpadding="16" style="background-color: #1e293b; border-radius: 12px; margin: 24px 0;">
        <tr>
          <td align="center" style="border-right: 1px solid #334155;">
            <span style="color: #94a3b8; font-size: 12px; text-transform: uppercase; display: block; font-weight: bold;">Revenue</span>
            <span style="color: #10b981; font-size: 20px; font-weight: 800; display: block; margin-top: 4px;">${rev}</span>
          </td>
          <td align="center" style="border-right: 1px solid #334155;">
            <span style="color: #94a3b8; font-size: 12px; text-transform: uppercase; display: block; font-weight: bold;">Expenses</span>
            <span style="color: #f43f5e; font-size: 20px; font-weight: 800; display: block; margin-top: 4px;">${exp}</span>
          </td>
          <td align="center">
            <span style="color: #94a3b8; font-size: 12px; text-transform: uppercase; display: block; font-weight: bold;">Net Cash Flow</span>
            <span style="color: #818cf8; font-size: 20px; font-weight: 800; display: block; margin-top: 4px;">${net}</span>
          </td>
        </tr>
      </table>
      <p>Your accounts are fully reconciled. Click below to inspect category breakdowns and cash forecasts.</p>
    `,
    'View Analytics Dashboard',
    'https://myjoice.com'
  );

  await sendEmail(settings.user.email, subject, plainText, html);
};

/**
 * Triggers a Budget Exceeded Alert
 */
const triggerBudgetAlert = async (userId, category, spentAmount, budgetLimit) => {
  const settings = await getUserSettings(userId);
  if (!settings) return;

  const locale = settings.currency === 'INR' ? 'en-IN' : 'en-US';
  const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency: settings.currency });
  const spent = formatter.format(spentAmount);
  const limit = formatter.format(budgetLimit);
  const overagePercent = ((spentAmount / budgetLimit) * 100).toFixed(0);

  await createInAppNotification(
    userId,
    `Budget Exceeded: ${category}`,
    `You have spent ${spent} on ${category}, which exceeds your allocated limit of ${limit} (${overagePercent}%).`,
    'alert'
  );

  const subject = `🚨 Budget Alert: ${category} Threshold Exceeded`;
  const plainText = `Hello ${settings.user.name},\n\nYou have spent ${spent} on ${category}, exceeding your monthly budget of ${limit}.`;
  const html = renderHtmlTemplate(
    subject,
    `
      <h2 style="color: #f87171; margin-top: 0; font-size: 20px;">Budget Limit Exceeded</h2>
      <p>Hello ${settings.user.name},</p>
      <p>Your recorded monthly expenditures for <strong>${category}</strong> have reached or exceeded your configured threshold:</p>
      <table width="100%" border="0" cellspacing="0" cellpadding="14" style="background-color: #451a1a; border: 1px solid #7f1d1d; border-radius: 12px; margin: 24px 0;">
        <tr>
          <td style="color: #fca5a5; font-size: 14px;">Category</td>
          <td align="right" style="color: #ffffff; font-weight: bold; font-size: 16px;">${category}</td>
        </tr>
        <tr>
          <td style="color: #fca5a5; font-size: 14px;">Allocated Budget</td>
          <td align="right" style="color: #cbd5e1; font-weight: bold;">${limit}</td>
        </tr>
        <tr>
          <td style="color: #fca5a5; font-size: 14px;">Actual Spent</td>
          <td align="right" style="color: #f87171; font-weight: 800; font-size: 20px;">${spent}</td>
        </tr>
        <tr>
          <td style="color: #fca5a5; font-size: 14px;">Capacity Used</td>
          <td align="right"><span style="background-color: #ef4444; color: #ffffff; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: bold;">${overagePercent}%</span></td>
        </tr>
      </table>
      <p>We recommend reviewing your recent transactions or reallocating budget capacity.</p>
    `,
    'Adjust Budget Limits',
    'https://myjoice.com/budgets'
  );

  await sendEmail(settings.user.email, subject, plainText, html);
};

module.exports = {
  triggerSecurityAlert,
  triggerInvoiceUpdate,
  triggerLargeTransactionAlert,
  triggerOverdueInvoiceAlert,
  triggerWeeklySummary,
  triggerWelcomeEmail,
  triggerBudgetAlert,
  createInAppNotification
};
