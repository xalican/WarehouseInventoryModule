import React, { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext(null);

// Fallback rates if offline or API delay (1 USD = ~35.00 TRY, 1 EUR = ~38.00 TRY)
const DEFAULT_RATES = {
  TRY: 1,
  USD: 35.00,
  EUR: 38.00,
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('TRY'); // 'TRY', 'USD', 'EUR'
  const [rates, setRates] = useState(DEFAULT_RATES);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch live exchange rates from TCMB / Open Exchange API
  useEffect(() => {
    const fetchRates = async () => {
      setLoading(true);
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/TRY');
        if (res.ok) {
          const data = await res.json();
          if (data && data.rates) {
            const usdInTry = data.rates.USD ? 1 / data.rates.USD : DEFAULT_RATES.USD;
            const eurInTry = data.rates.EUR ? 1 / data.rates.EUR : DEFAULT_RATES.EUR;
            setRates({
              TRY: 1,
              USD: parseFloat(usdInTry.toFixed(2)),
              EUR: parseFloat(eurInTry.toFixed(2)),
            });
            setLastUpdated(new Date());
          }
        }
      } catch (err) {
        console.warn('Canlı döviz kuru çekilemedi, varsayılan kurlar kullanılıyor:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
    // Refresh live exchange rates every 15 minutes
    const interval = setInterval(fetchRates, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Formats any amount given in TRY to display BOTH selected Currency AND TL Equivalent
   * @param {number} amountInTry - Amount in Turkish Lira
   * @param {boolean} showDual - Whether to show both foreign currency and TL equivalent
   * @returns {string} Formatted price string (e.g. "$10.00 (₺350.00 TL)")
   */
  const formatMoney = (amountInTry, showDual = true) => {
    if (amountInTry === null || amountInTry === undefined || isNaN(amountInTry)) {
      return '-';
    }

    const num = parseFloat(amountInTry);
    const tryStr = `₺${num.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    if (currency === 'USD') {
      const converted = num / (rates.USD || DEFAULT_RATES.USD);
      const usdStr = `$${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      return showDual ? `${usdStr} (${tryStr} TL)` : usdStr;
    }

    if (currency === 'EUR') {
      const converted = num / (rates.EUR || DEFAULT_RATES.EUR);
      const eurStr = `€${converted.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      return showDual ? `${eurStr} (${tryStr} TL)` : eurStr;
    }

    // Default TRY
    const usdConverted = num / (rates.USD || DEFAULT_RATES.USD);
    const usdStr = `$${usdConverted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return showDual ? `${tryStr} (${usdStr} USD)` : tryStr;
  };

  /**
   * Formats single currency string without dual parentheses
   */
  const formatMoneySingle = (amountInTry) => {
    return formatMoney(amountInTry, false);
  };

  /**
   * Returns current active symbol (₺, $, €)
   */
  const getCurrencySymbol = () => {
    switch (currency) {
      case 'USD': return '$';
      case 'EUR': return '€';
      default: return '₺';
    }
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        rates,
        formatMoney,
        formatMoneySingle,
        getCurrencySymbol,
        loading,
        lastUpdated,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
