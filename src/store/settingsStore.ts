import { create } from 'zustand';
import { getExchangeRate, setSetting } from '../db/database';

interface SettingsStore {
  exchangeRate: number;
  load: () => void;
  setExchangeRate: (rate: number) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  exchangeRate: 90000,

  load() {
    set({ exchangeRate: getExchangeRate() });
  },

  setExchangeRate(rate) {
    setSetting('exchange_rate', String(rate));
    set({ exchangeRate: rate });
  },
}));
