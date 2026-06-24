import React, { useState } from 'react';
import { Joyride, STATUS } from 'react-joyride';

export function OnboardingTour({ run, setRun }) {
  const [steps] = useState([
    {
      target: 'body',
      content: 'Welcome to FinCore ERP! Let\'s take a quick tour to get you acquainted with the system.',
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '#tour-sidebar',
      content: 'Task: Navigating between modules.\n\nThis is your main navigation menu. From here you can access all your core business functions like Accounts, Transactions, Invoices, and Reports.',
      placement: 'right',
    },
    {
      target: 'a[href="/invoices"]',
      content: 'Task: Invoicing and billing customers.\n\nManage all your customer invoices here. You can create new invoices, track their status, and automatically monitor overdue payments.',
      placement: 'right',
    },
    {
      target: 'a[href="/reports"]',
      content: 'Task: Financial analysis and reporting.\n\nAccess detailed financial reports, including the powerful Accounts Receivable Aging Report to track outstanding customer balances.',
      placement: 'right',
    },
    {
      target: 'a[href="/saas"]',
      content: 'Task: Detecting wasted software spend.\n\nRun an AI-powered audit on your transaction history to find hidden overlapping subscriptions, duplicate payments, and wasted SaaS spend.',
      placement: 'right',
    },
    {
      target: 'a[href="/ai"]',
      content: 'Task: Intelligent financial forecasting.\n\nAsk FinCore AI any question about your finances. The AI has deep context of your daily profits, expenses, and transaction ledger to give you precise answers.',
      placement: 'right',
    },
    {
      target: 'a[href="/journal-entries"]',
      content: 'Task: Advanced manual accounting.\n\nUse double-entry bookkeeping to record complex transactions, correct mistakes across specific accounts, or manage depreciation and loans.',
      placement: 'right',
    },
    {
      target: 'a[href="/settings"]',
      content: 'Task: Configuring system preferences.\n\nHead to Settings to manage your company profile, set up Two-Factor Authentication, and invite new team members to your workspace!',
      placement: 'right',
    },
    {
      target: '#tour-search',
      content: 'Task: Finding specific records instantly.\n\nUse the global search bar to quickly locate transactions, accounts, or contacts across the entire system without navigating through menus.',
      placement: 'bottom',
    },
    {
      target: '#tour-profile',
      content: 'Task: Managing your user account.\n\nClick here to edit your profile, update your global currency settings, or securely log out of the system.',
      placement: 'bottom-end',
    },
    {
      target: '#tour-dashboard-kpis',
      content: 'Task: Monitoring key performance indicators.\n\nYour Executive Dashboard provides a high-level, real-time overview of your Total Revenue, Expenses, Net Profit, and Cash Balance.',
      placement: 'bottom',
    },
    {
      target: '#tour-dashboard-charts',
      content: 'Task: Analyzing cash flow trends.\n\nVisualize your historical cash flow trends and see your top expense categories at a glance using interactive charts.',
      placement: 'top',
    },
    {
      target: '#tour-recent-activity',
      content: 'Task: Auditing recent system actions.\n\nKeep track of all your latest transactions and system events right from the dashboard to ensure nothing slips past you.',
      placement: 'left',
    },
    {
      target: '#tour-export-btn',
      content: 'Task: Exporting data to Excel.\n\nNeed your data offline? Use the Export button to instantly download well-formatted Excel spreadsheets of your current view.',
      placement: 'left',
    }
  ]);

  const handleJoyrideCallback = (data) => {
    const { status } = data;
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];
    
    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem('fincore_tour_completed', 'true');
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous={true}
      showProgress={true}
      showSkipButton={true}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#6366f1',
          zIndex: 10000,
        },
        tooltipContainer: {
          textAlign: 'left'
        },
        buttonNext: {
          backgroundColor: 'var(--color-indigo)',
        },
        buttonBack: {
          color: 'var(--color-indigo)',
        }
      }}
    />
  );
}
