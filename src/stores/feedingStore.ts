import { create } from 'zustand';
import { Baby, FeedingRecord } from '@/types';
import { feedingService } from '@/services/feeding';

interface FeedingState {
  babies: Baby[];
  currentBabyId: string | null;
  records: FeedingRecord[];
  isLoading: boolean;
  fetchBabies: () => Promise<void>;
  setCurrentBaby: (babyId: string) => void;
  addBaby: (baby: Partial<Baby>) => Promise<void>;
  updateBaby: (id: string, baby: Partial<Baby>) => Promise<void>;
  deleteBaby: (id: string) => Promise<void>;
  fetchRecords: (babyId?: string) => Promise<void>;
  addRecord: (record: Partial<FeedingRecord>) => Promise<void>;
  updateRecord: (id: string, record: Partial<FeedingRecord>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
}

export const useFeedingStore = create<FeedingState>((set, get) => ({
  babies: [],
  currentBabyId: localStorage.getItem('currentBabyId') || null,
  records: [],
  isLoading: false,

  fetchBabies: async () => {
    set({ isLoading: true });
    try {
      const babies = await feedingService.getBabies();
      set({ babies, isLoading: false });
      if (babies.length > 0 && !get().currentBabyId) {
        set({ currentBabyId: babies[0].id });
        localStorage.setItem('currentBabyId', babies[0].id);
      }
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  setCurrentBaby: (babyId: string) => {
    set({ currentBabyId: babyId });
    localStorage.setItem('currentBabyId', babyId);
  },

  addBaby: async (baby: Partial<Baby>) => {
    set({ isLoading: true });
    try {
      const newBaby = await feedingService.createBaby(baby);
      set((state) => ({
        babies: [...state.babies, newBaby],
        currentBabyId: newBaby.id,
        isLoading: false,
      }));
      localStorage.setItem('currentBabyId', newBaby.id);
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateBaby: async (id: string, baby: Partial<Baby>) => {
    set({ isLoading: true });
    try {
      const updatedBaby = await feedingService.updateBaby(id, baby);
      set((state) => ({
        babies: state.babies.map((b) => (b.id === id ? updatedBaby : b)),
        isLoading: false,
      }));
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  deleteBaby: async (id: string) => {
    set({ isLoading: true });
    try {
      await feedingService.deleteBaby(id);
      set((state) => {
        const babies = state.babies.filter((b) => b.id !== id);
        const currentBabyId = state.currentBabyId === id ? (babies[0]?.id || null) : state.currentBabyId;
        if (currentBabyId) {
          localStorage.setItem('currentBabyId', currentBabyId);
        } else {
          localStorage.removeItem('currentBabyId');
        }
        return { babies, currentBabyId, isLoading: false };
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchRecords: async (babyId?: string) => {
    set({ isLoading: true });
    try {
      const records = await feedingService.getRecords({ babyId, limit: 50 });
      set({ records, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  addRecord: async (record: Partial<FeedingRecord>) => {
    set({ isLoading: true });
    try {
      const newRecord = await feedingService.createRecord(record);
      set((state) => ({
        records: [newRecord, ...state.records],
        isLoading: false,
      }));
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateRecord: async (id: string, record: Partial<FeedingRecord>) => {
    set({ isLoading: true });
    try {
      const updatedRecord = await feedingService.updateRecord(id, record);
      set((state) => ({
        records: state.records.map((r) => (r.id === id ? updatedRecord : r)),
        isLoading: false,
      }));
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  deleteRecord: async (id: string) => {
    set({ isLoading: true });
    try {
      await feedingService.deleteRecord(id);
      set((state) => ({
        records: state.records.filter((r) => r.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
}));
