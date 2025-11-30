import { create } from 'zustand';
import { Baby, FeedingRecord } from '@/types';
import { feedingService } from '@/services/feeding';

interface FeedingState {
  babies: Baby[];
  currentBabyId: string | null;
  records: FeedingRecord[];
  recordsCache: Record<string, FeedingRecord[]>; // 每个宝宝的记录缓存
  isLoading: boolean;
  fetchBabies: () => Promise<void>;
  setCurrentBaby: (babyId: string) => void;
  addBaby: (baby: Partial<Baby>) => Promise<void>;
  updateBaby: (id: string, baby: Partial<Baby>) => Promise<void>;
  deleteBaby: (id: string) => Promise<void>;
  fetchRecords: (babyId?: string, useCache?: boolean) => Promise<void>;
  addRecord: (record: Partial<FeedingRecord>) => Promise<void>;
  updateRecord: (id: string, record: Partial<FeedingRecord>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
}

export const useFeedingStore = create<FeedingState>((set, get) => ({
  babies: [],
  currentBabyId: localStorage.getItem('currentBabyId') || null,
  records: [],
  recordsCache: {}, // 缓存对象
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
    
    // 切换宝宝时，先从缓存加载数据（即时响应）
    const cache = get().recordsCache;
    if (cache[babyId]) {
      set({ records: cache[babyId] });
    } else {
      set({ records: [] }); // 没有缓存则清空
    }
    
    // 后台异步刷新最新数据
    get().fetchRecords(babyId, false);
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

  fetchRecords: async (babyId?: string, useCache = true) => {
    const targetBabyId = babyId || get().currentBabyId;
    if (!targetBabyId) return;
    
    // 如果允许使用缓存且有缓存，先显示缓存
    const cache = get().recordsCache;
    if (useCache && cache[targetBabyId]) {
      set({ records: cache[targetBabyId] });
    }
    
    set({ isLoading: true });
    try {
      const records = await feedingService.getRecords({ babyId: targetBabyId, limit: 50 });
      
      // 更新缓存
      set((state) => ({
        records,
        recordsCache: {
          ...state.recordsCache,
          [targetBabyId]: records,
        },
        isLoading: false,
      }));
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  addRecord: async (record: Partial<FeedingRecord>) => {
    set({ isLoading: true });
    try {
      const newRecord = await feedingService.createRecord(record);
      set((state) => {
        const updatedRecords = [newRecord, ...state.records];
        const babyId = newRecord.babyId;
        
        return {
          records: updatedRecords,
          recordsCache: {
            ...state.recordsCache,
            [babyId]: updatedRecords, // 更新缓存
          },
          isLoading: false,
        };
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateRecord: async (id: string, record: Partial<FeedingRecord>) => {
    set({ isLoading: true });
    try {
      const updatedRecord = await feedingService.updateRecord(id, record);
      set((state) => {
        const updatedRecords = state.records.map((r) => (r.id === id ? updatedRecord : r));
        const babyId = updatedRecord.babyId;
        
        return {
          records: updatedRecords,
          recordsCache: {
            ...state.recordsCache,
            [babyId]: updatedRecords, // 更新缓存
          },
          isLoading: false,
        };
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  deleteRecord: async (id: string) => {
    set({ isLoading: true });
    try {
      await feedingService.deleteRecord(id);
      set((state) => {
        const updatedRecords = state.records.filter((r) => r.id !== id);
        const currentBabyId = state.currentBabyId;
        
        return {
          records: updatedRecords,
          recordsCache: currentBabyId ? {
            ...state.recordsCache,
            [currentBabyId]: updatedRecords, // 更新缓存
          } : state.recordsCache,
          isLoading: false,
        };
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
}));
