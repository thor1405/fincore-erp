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
      content: 'This is your main navigation menu. From here you can access all your modules like Accounts, Transactions, Invoices, and Reports.',
      placement: 'right',
    },
    {
      target: 'a[href="/invoices"]',
      content: 'Manage all your customer invoices here. You can create new invoices, track their status, and automatically monitor overdue payments.',
      placement: 'right',
    },
    {
      target: 'a[href="/reports"]',
      content: 'Access detailed financial reports, including the powerful Accounts Receivable Aging Report to track outstanding customer balances.',
      placement: 'right',
    },
    {
      target: 'a[href="/settings"]',
      content: 'Head to Settings to manage your company profile, set up Two-Factor Authentication, and invite new team members to your workspace!',
      placement: 'right',
    },
    {
      target: '#tour-search',
      content: 'Use the global search bar to quickly find transactions, accounts, or contacts across the entire system.',
      placement: 'bottom',
    },
    {
      target: '#tour-profile',
      content: 'Click here to edit your profile, update your global currency settings, or log out of the system.',
      placement: 'bottom-end',
    },
    {
      target: '#tour-dashboard-kpis',
      content: 'Your Executive Dashboard provides a high-level overview of your Total Revenue, Expenses, Net Profit, and Cash Balance.',
      placement: 'bottom',
    },
    {
      target: '#tour-dashboard-charts',
      content: 'Visualize your cash flow trends and see your top expense categories at a glance.',
      placement: 'top',
    },
    {
      target: '#tour-recent-activity',
      content: 'Keep track of all your latest transactions here without leaving the dashboard.',
      placement: 'left',
    },
    {
      target: '#tour-export-btn',
      content: 'Need your data offline? Use the Export to Excel button to instantly download well-formatted reports of your data.',
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
