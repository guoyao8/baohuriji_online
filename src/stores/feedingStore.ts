import { create } from 'zustand';
import { Baby, FeedingRecord } from '@/types';
import { feedingService } from '@/services/feeding';

interface FeedingState {
  babies: Baby[];
  babiesCache: { data: Baby[]; timestamp: number } | null; // 宝宝列表缓存
  currentBabyId: string | null;
  records: FeedingRecord[];
  recordsCache: Record<string, { data: FeedingRecord[]; timestamp: number }>; // 记录缓存增加时间戳
  isLoading: boolean;
  fetchBabies: (forceRefresh?: boolean) => Promise<void>;
  setCurrentBaby: (babyId: string) => void;
  addBaby: (baby: Partial<Baby>) => Promise<void>;
  updateBaby: (id: string, baby: Partial<Baby>) => Promise<void>;
  deleteBaby: (id: string) => Promise<void>;
  fetchRecords: (babyId?: string, useCache?: boolean) => Promise<void>;
  addRecord: (record: Partial<FeedingRecord>) => Promise<void>;
  updateRecord: (id: string, record: Partial<FeedingRecord>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  clearCache: () => void; // 清除所有缓存
}

// 缓存有效期：5分钟
const CACHE_DURATION = 5 * 60 * 1000;

// 从localStorage加载缓存
const loadCacheFromStorage = () => {
  try {
    const stored = localStorage.getItem('feedingStoreCache');
    if (stored) {
      const cache = JSON.parse(stored);
      const now = Date.now();
      
      // 验证缓存是否过期
      if (cache.recordsCache) {
        Object.keys(cache.recordsCache).forEach(key => {
          if (now - cache.recordsCache[key].timestamp > CACHE_DURATION) {
            delete cache.recordsCache[key];
          }
        });
      }
      
      if (cache.babiesCache && now - cache.babiesCache.timestamp > CACHE_DURATION) {
        cache.babiesCache = null;
      }
      
      return cache;
    }
  } catch (error) {
    console.error('Failed to load cache from storage:', error);
  }
  return { recordsCache: {}, babiesCache: null };
};

// 保存缓存到localStorage
const saveCacheToStorage = (recordsCache: any, babiesCache: any) => {
  try {
    localStorage.setItem('feedingStoreCache', JSON.stringify({
      recordsCache,
      babiesCache,
    }));
  } catch (error) {
    console.error('Failed to save cache to storage:', error);
  }
};

const initialCache = loadCacheFromStorage();

export const useFeedingStore = create<FeedingState>((set, get) => ({
  babies: initialCache.babiesCache?.data || [],
  babiesCache: initialCache.babiesCache || null,
  currentBabyId: localStorage.getItem('currentBabyId') || null,
  records: [],
  recordsCache: initialCache.recordsCache || {},
  isLoading: false,

  fetchBabies: async (forceRefresh = false) => {
    // 如果有缓存且未过期，且不强制刷新，则使用缓存
    const cache = get().babiesCache;
    const now = Date.now();
    
    if (!forceRefresh && cache && now - cache.timestamp < CACHE_DURATION) {
      console.log('使用宝宝列表缓存');
      set({ babies: cache.data });
      return;
    }
    
    set({ isLoading: true });
    try {
      const babies = await feedingService.getBabies();
      const newCache = { data: babies, timestamp: now };
      
      set({ 
        babies, 
        babiesCache: newCache,
        isLoading: false 
      });
      
      // 保存到localStorage
      saveCacheToStorage(get().recordsCache, newCache);
      
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
    const cache = get().recordsCache[babyId];
    if (cache) {
      set({ records: cache.data });
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
      set((state) => {
        const babies = [...state.babies, newBaby];
        const newCache = { data: babies, timestamp: Date.now() };
        
        // 保存到localStorage
        saveCacheToStorage(state.recordsCache, newCache);
        
        return {
          babies,
          babiesCache: newCache,
          currentBabyId: newBaby.id,
          isLoading: false,
        };
      });
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
      set((state) => {
        const babies = state.babies.map((b) => (b.id === id ? updatedBaby : b));
        const newCache = { data: babies, timestamp: Date.now() };
        
        // 保存到localStorage
        saveCacheToStorage(state.recordsCache, newCache);
        
        return {
          babies,
          babiesCache: newCache,
          isLoading: false,
        };
      });
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
        const newCache = { data: babies, timestamp: Date.now() };
        
        // 清除被删除宝宝的记录缓存
        const newRecordsCache = { ...state.recordsCache };
        delete newRecordsCache[id];
        
        // 保存到localStorage
        saveCacheToStorage(newRecordsCache, newCache);
        
        if (currentBabyId) {
          localStorage.setItem('currentBabyId', currentBabyId);
        } else {
          localStorage.removeItem('currentBabyId');
        }
        return { 
          babies, 
          babiesCache: newCache,
          recordsCache: newRecordsCache,
          currentBabyId, 
          isLoading: false 
        };
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
    const cache = get().recordsCache[targetBabyId];
    const now = Date.now();
    
    if (useCache && cache) {
      // 检查缓存是否过期
      if (now - cache.timestamp < CACHE_DURATION) {
        console.log('使用记录缓存');
        set({ records: cache.data });
        return; // 缓存未过期，直接返回
      } else {
        // 缓存过期，先显示旧数据，然后刷新
        set({ records: cache.data });
      }
    }
    
    set({ isLoading: true });
    try {
      const records = await feedingService.getRecords({ babyId: targetBabyId, limit: 50 });
      
      // 更新缓存
      set((state) => {
        const newRecordsCache = {
          ...state.recordsCache,
          [targetBabyId]: { data: records, timestamp: now },
        };
        
        // 保存到localStorage
        saveCacheToStorage(newRecordsCache, state.babiesCache);
        
        return {
          records,
          recordsCache: newRecordsCache,
          isLoading: false,
        };
      });
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
        const newRecordsCache = {
          ...state.recordsCache,
          [babyId]: { data: updatedRecords, timestamp: Date.now() },
        };
        
        // 保存到localStorage
        saveCacheToStorage(newRecordsCache, state.babiesCache);
        
        return {
          records: updatedRecords,
          recordsCache: newRecordsCache,
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
        const newRecordsCache = {
          ...state.recordsCache,
          [babyId]: { data: updatedRecords, timestamp: Date.now() },
        };
        
        // 保存到localStorage
        saveCacheToStorage(newRecordsCache, state.babiesCache);
        
        return {
          records: updatedRecords,
          recordsCache: newRecordsCache,
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
        const newRecordsCache = currentBabyId ? {
          ...state.recordsCache,
          [currentBabyId]: { data: updatedRecords, timestamp: Date.now() },
        } : state.recordsCache;
        
        // 保存到localStorage
        saveCacheToStorage(newRecordsCache, state.babiesCache);
        
        return {
          records: updatedRecords,
          recordsCache: newRecordsCache,
          isLoading: false,
        };
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  clearCache: () => {
    set({ 
      recordsCache: {}, 
      babiesCache: null 
    });
    localStorage.removeItem('feedingStoreCache');
  },
}));
