// Mock Data Services for FinCore ERP

export const dashboardKPIs = [
  { id: 'revenue', title: 'Total Revenue', value: '$2.4M', change: '+14.5%', trend: 'up' },
  { id: 'expenses', title: 'Total Expenses', value: '$850K', change: '-2.4%', trend: 'down' },
  { id: 'profit', title: 'Net Profit', value: '$1.55M', change: '+22.4%', trend: 'up' },
  { id: 'cash', title: 'Cash Balance', value: '$4.2M', change: '+5.1%', trend: 'up' },
];

export const cashFlowData = [
  { month: 'Jan', in: 4000, out: 2400 },
  { month: 'Feb', in: 3000, out: 1398 },
  { month: 'Mar', in: 2000, out: 9800 },
  { month: 'Apr', in: 2780, out: 3908 },
  { month: 'May', in: 1890, out: 4800 },
  { month: 'Jun', in: 2390, out: 3800 },
  { month: 'Jul', in: 3490, out: 4300 },
];

export const expenseCategories = [
  { name: 'Payroll', value: 400 },
  { name: 'Marketing', value: 300 },
  { name: 'Software', value: 300 },
  { name: 'Office', value: 200 },
];

export const recentTransactions = [
  { id: 'TRX-001', date: '2026-06-20', description: 'Stripe Payout', amount: 4500.00, status: 'Completed', type: 'Credit', category: 'Sales' },
  { id: 'TRX-002', date: '2026-06-19', description: 'AWS Services', amount: -850.50, status: 'Completed', type: 'Debit', category: 'Software' },
  { id: 'TRX-003', date: '2026-06-18', description: 'WeWork Office Rent', amount: -3200.00, status: 'Pending', type: 'Debit', category: 'Office' },
  { id: 'TRX-004', date: '2026-06-17', description: 'Client Invoice #INV-8902', amount: 12500.00, status: 'Completed', type: 'Credit', category: 'Services' },
  { id: 'TRX-005', date: '2026-06-16', description: 'Gusto Payroll', amount: -28400.00, status: 'Completed', type: 'Debit', category: 'Payroll' },
  { id: 'TRX-006', date: '2026-06-15', description: 'Adobe Creative Cloud', amount: -54.99, status: 'Completed', type: 'Debit', category: 'Software' },
  { id: 'TRX-007', date: '2026-06-14', description: 'Client Invoice #INV-8901', amount: 8000.00, status: 'Failed', type: 'Credit', category: 'Services' },
];

export const invoices = [
  { id: 'INV-8901', client: 'Acme Corp', amount: 8000, date: '2026-06-01', dueDate: '2026-06-15', status: 'Overdue' },
  { id: 'INV-8902', client: 'Global Tech', amount: 12500, date: '2026-06-10', dueDate: '2026-06-25', status: 'Paid' },
  { id: 'INV-8903', client: 'Stark Industries', amount: 45000, date: '2026-06-18', dueDate: '2026-07-02', status: 'Sent' },
  { id: 'INV-8904', client: 'Wayne Enterprises', amount: 3200, date: '2026-06-20', dueDate: '2026-07-04', status: 'Draft' },
];
