require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const dashboardRoutes = require('./routes/dashboard');
const accountRoutes = require('./routes/accounts');
const journalRoutes = require('./routes/journal');
const invoiceRoutes = require('./routes/invoices');
const employeeRoutes = require('./routes/employees');
const customerRoutes = require('./routes/customers');
const vendorRoutes = require('./routes/vendors');
const reportsRoutes = require('./routes/reports');
const paymentRoutes = require('./routes/payments');
const settingsRoutes = require('./routes/settings');
const searchRoutes = require('./routes/search');
const auditRoutes = require('./routes/audit');
const teamRoutes = require('./routes/team');
const taxRoutes = require('./routes/tax');
const aiRoutes = require('./routes/ai');
const notificationRoutes = require('./routes/notifications');
const { initCronJobs } = require('./cron');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/tax', taxRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);

// Initialize Background Jobs
initCronJobs();

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'FinCore ERP API is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
