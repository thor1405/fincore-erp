import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const SettingsContext = createContext();

export function useSettings() {
  return useContext(SettingsContext);
}

const currencySymbols = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  INR: '₹'
};

export function SettingsProvider({ children }) {
  const { token } = useAuth();
  const [settings, setSettings] = useState(null);
  const [currencySymbol, setCurrencySymbol] = useState('$');

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setCurrencySymbol(currencySymbols[data.currency] || '$');
      }
    } catch (err) {
      console.error('Failed to fetch settings', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchSettings();
    } else {
      setSettings(null);
      setCurrencySymbol('$');
    }
  }, [token]);

  const updateSettings = async (newSettings) => {
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newSettings)
      });
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setCurrencySymbol(currencySymbols[data.currency] || '$');
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to update settings', err);
      return false;
    }
  };

  // Utility to format numbers according to the global currency
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '';
    return `${currencySymbol}${amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  };

  return (
    <SettingsContext.Provider value={{ settings, currencySymbol, updateSettings, formatCurrency, fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

