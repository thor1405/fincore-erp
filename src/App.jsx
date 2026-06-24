import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import { Layout } from './components/Layout/Layout';

import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { JournalEntries } from './pages/JournalEntries';
import { Invoices } from './pages/Invoices';
import { Login } from './pages/Login';
import { Payroll } from './pages/Payroll';
import { Settings } from './pages/Settings';

import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Signup } from './pages/Signup';
import { AcceptInvite } from './pages/AcceptInvite';

import { Accounts } from './pages/Accounts';
import { Customers } from './pages/Customers';
import { CustomerProfile } from './pages/CustomerProfile';
import { Vendors } from './pages/Vendors';
import { Payments } from './pages/Payments';
import { Reports } from './pages/Reports';
import { AuditLogs } from './pages/AuditLogs';
import { Taxes } from './pages/Taxes';
import { AIPredictor } from './pages/AIPredictor';
import { Budgets } from './pages/Budgets';
import { SaaSDetector } from './pages/SaaSDetector';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SettingsProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/invite/:id" element={<AcceptInvite />} />
              
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="accounts" element={<Accounts />} />
                  <Route path="transactions" element={<Transactions />} />
                  <Route path="journal" element={<JournalEntries />} />
                  <Route path="customers" element={<Customers />} />
                  <Route path="customers/:id" element={<CustomerProfile />} />
                  <Route path="vendors" element={<Vendors />} />
                  <Route path="invoices" element={<Invoices />} />
                  <Route path="budgets" element={<Budgets />} />
                  <Route path="payments" element={<Payments />} />
                  <Route path="payroll" element={<Payroll />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="taxes" element={<Taxes />} />
                  <Route path="ai" element={<AIPredictor />} />
                  <Route path="saas" element={<SaaSDetector />} />
                  <Route path="audit" element={<AuditLogs />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </SettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
