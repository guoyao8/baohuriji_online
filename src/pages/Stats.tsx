import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { feedingService } from '@/services/feeding';
import { useFeedingStore } from '@/stores/feedingStore';
import { DailyStats, TrendData } from '@/types';
import { format, addDays, subDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function Stats() {
  const navigate = useNavigate();
  const { babies } = useFeedingStore();
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [stats, setStats] = useState<DailyStats[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [statsCache, setStatsCache] = useState<Record<string, { data: DailyStats[]; timestamp: number }>>({});
  const [trendCache, setTrendCache] = useState<Record<string, { data: TrendData[]; timestamp: number }>>({});

  useEffect(() => {
    loadStats();
  }, [currentDate, babies, viewMode]);

  const loadStats = async () => {
    try {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const CACHE_DURATION = 2 * 60 * 1000; // 2分钟缓存（统计数据更新频繁）
      const now = Date.now();
      
      // 统计数据缓存键
      const statsCacheKey = dateStr;
      if (statsCache[statsCacheKey] && now - statsCache[statsCacheKey].timestamp < CACHE_DURATION) {
        console.log('使用统计数据缓存');
        setStats(statsCache[statsCacheKey].data);
      } else {
        // 先显示缓存，然后异步更新
        if (statsCache[statsCacheKey]) {
          setStats(statsCache[statsCacheKey].data);
        }
        
        const data = await feedingService.getDailyStats(dateStr);
        setStats(data);
        setStatsCache(prev => ({
          ...prev,
          [statsCacheKey]: { data, timestamp: now }
        }));
      }

      const babyIds = babies.map((b) => b.id);
      
      // 根据视图模式获取不同时间范围的趋势数据
      let trendStartDate;
      let groupBy: 'hour' | 'day';
      
      if (viewMode === 'day') {
        // 日视图：获取当天的数据，按小时统计
        trendStartDate = format(currentDate, 'yyyy-MM-dd');
        groupBy = 'hour';
      } else {
        // 周视图：获取过去7天的数据，按天统计
        trendStartDate = format(subDays(currentDate, 6), 'yyyy-MM-dd');
        groupBy = 'day';
      }
      
      // 趋势数据缓存键
      const trendCacheKey = `${trendStartDate}_${dateStr}_${groupBy}_${babyIds.join(',')}`;
      if (trendCache[trendCacheKey] && now - trendCache[trendCacheKey].timestamp < CACHE_DURATION) {
        console.log('使用趋势数据缓存');
        setTrendData(trendCache[trendCacheKey].data);
      } else {
        // 先显示缓存，然后异步更新
        if (trendCache[trendCacheKey]) {
          setTrendData(trendCache[trendCacheKey].data);
        }
        
        const trend = await feedingService.getTrend({
          startDate: trendStartDate,
          endDate: dateStr,
          babyIds,
          groupBy,
        });
        setTrendData(trend);
        setTrendCache(prev => ({
          ...prev,
          [trendCacheKey]: { data: trend, timestamp: now }
        }));
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const goToPrevious = () => {
    setCurrentDate((prev) => subDays(prev, viewMode === 'day' ? 1 : 7));
  };

  const goToNext = () => {
    setCurrentDate((prev) => addDays(prev, viewMode === 'day' ? 1 : 7));
  };

  const getMaxAmount = () => {
    if (trendData.length === 0) return 300;
    const max = Math.max(
      ...trendData.flatMap((d) => d.babies.map((b) => b.amount || 0))
    );
    return Math.max(max, 100);
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col">
      <div className="pb-24">
        <div className="flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between sticky top-0 z-10">
          <div className="flex size-12 shrink-0 items-center justify-start">
            <button onClick={() => navigate(-1)}>
              <span className="material-symbols-outlined text-zinc-900 dark:text-white">
                arrow_back_ios_new
              </span>
            </button>
          </div>
          <h1 className="text-zinc-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
            统计
          </h1>
          <div className="flex w-12 items-center justify-end"></div>
        </div>

        <div className="flex px-4 py-3">
          <div className="flex h-10 flex-1 items-center justify-center rounded-lg bg-zinc-200 dark:bg-zinc-800 p-1">
            <label className="flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 has-[:checked]:bg-background-light has-[:checked]:dark:bg-background-dark has-[:checked]:shadow-sm has-[:checked]:text-zinc-900 has-[:checked]:dark:text-white text-zinc-500 dark:text-zinc-400 text-sm font-medium leading-normal">
              <span className="truncate">日</span>
              <input
                checked={viewMode === 'day'}
                onChange={() => setViewMode('day')}
                className="invisible w-0"
                type="radio"
                name="time-range"
              />
            </label>
            <label className="flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 has-[:checked]:bg-background-light has-[:checked]:dark:bg-background-dark has-[:checked]:shadow-sm has-[:checked]:text-zinc-900 has-[:checked]:dark:text-white text-zinc-500 dark:text-zinc-400 text-sm font-medium leading-normal">
              <span className="truncate">周</span>
              <input
                checked={viewMode === 'week'}
                onChange={() => setViewMode('week')}
                className="invisible w-0"
                type="radio"
                name="time-range"
              />
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-2">
          <button onClick={goToPrevious} className="p-2 text-zinc-500 dark:text-zinc-400">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <h4 className="text-zinc-500 dark:text-zinc-400 text-sm font-bold leading-normal tracking-[0.015em] text-center">
            {viewMode === 'day'
              ? format(currentDate, 'MM月dd日', { locale: zhCN })
              : `${format(subDays(currentDate, 6), 'MM月dd日')} - ${format(currentDate, 'MM月dd日')}`}
          </h4>
          <button onClick={goToNext} className="p-2 text-zinc-500 dark:text-zinc-400">
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>

        {babies.length > 0 && (
          <div className="flex items-center justify-center gap-4 px-4 pt-2 pb-4">
            {babies.map((baby) => (
              <div key={baby.id} className="flex items-center gap-2">
                <div
                  className={`size-3 rounded-full ${
                    baby.gender === 'male' ? 'bg-blue-500' : 'bg-pink-500'
                  }`}
                />
                <span className="text-sm font-medium text-zinc-900 dark:text-white">{baby.name}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-4 px-4">
          {stats.map((stat) => (
            <div
              key={stat.babyId}
              className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50"
            >
              <p className="text-zinc-600 dark:text-zinc-400 text-base font-medium leading-normal">
                {stat.babyName} 总量
              </p>
              <p className="text-zinc-900 dark:text-white tracking-light text-2xl font-bold leading-tight">
                {stat.totalAmount}ml
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-4 p-4">
          {stats.map((stat) => (
            <div
              key={`freq-${stat.babyId}`}
              className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50"
            >
              <p className="text-zinc-600 dark:text-zinc-400 text-base font-medium leading-normal">
                {stat.babyName} 频率
              </p>
              <p className="text-zinc-900 dark:text-white tracking-light text-2xl font-bold leading-tight">
                {stat.totalFeedings}次
              </p>
            </div>
          ))}
        </div>

        <div className="px-4 py-2">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-4">
              喂养量趋势 {viewMode === 'day' ? '(今日24小时)' : '(过去7天)'}
            </h3>
            <div className="flex h-48 w-full items-end justify-between gap-1 text-xs text-zinc-500 dark:text-zinc-400">
              {viewMode === 'day' ? (
                // 日视图：显示24小时的数据，每2小时一个柱状图
                Array.from({ length: 12 }).map((_, index) => {
                  const startHour = index * 2;
                  const endHour = startHour + 2;
                  
                  // 合并这2小时内的所有数据
                  const mergedData = { babies: [] as any[] };
                  const babyMap = new Map<string, any>();
                  
                  for (let h = startHour; h < endHour; h++) {
                    const hourData = trendData.find((d) => d.hour === h);
                    if (hourData && hourData.babies) {
                      hourData.babies.forEach(baby => {
                        const existing = babyMap.get(baby.babyId);
                        if (existing) {
                          existing.amount += baby.amount;
                        } else {
                          babyMap.set(baby.babyId, { ...baby });
                        }
                      });
                    }
                  }
                  
                  mergedData.babies = Array.from(babyMap.values());
                  const maxAmount = getMaxAmount();

                  return (
                    <div key={startHour} className="flex h-full flex-col items-center justify-end gap-1 flex-1">
                      <div className="flex w-full h-full items-end justify-center gap-0.5">
                        {mergedData.babies.length > 0 ? (
                          mergedData.babies.map((baby) => {
                            const widthClass = mergedData.babies.length === 1 ? 'w-full' : 'w-1/2';
                            const colorClass = baby.babyGender === 'male' ? 'bg-blue-500' : 'bg-pink-500';
                            const heightPercent = (baby.amount / maxAmount) * 100;
                            
                            return (
                              <div key={baby.babyId} className="relative flex flex-col items-center justify-end h-full" style={{ width: mergedData.babies.length === 1 ? '100%' : '50%' }}>
                                <div
                                  className={`${widthClass} ${colorClass} rounded-t relative`}
                                  style={{ height: `${heightPercent}%`, minHeight: baby.amount > 0 ? '6px' : '0' }}
                                >
                                  {baby.amount > 0 && (
                                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-[9px] font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                                      {baby.amount}ml
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="w-full rounded-t bg-zinc-200 dark:bg-zinc-700" style={{ height: '0%' }} />
                        )}
                      </div>
                      <span className="text-[9px]">{startHour.toString().padStart(2, '0')}</span>
                    </div>
                  );
                })
              ) : (
                // 周视图：显示过去7天的数据，按天统计
                trendData.map((data) => {
                  const maxAmount = Math.max(
                    ...trendData.flatMap((d) => d.babies.map((b) => b.amount || 0)),
                    100
                  );
                  
                  return (
                    <div key={data.date} className="flex h-full w-full flex-col items-center justify-end gap-2">
                      <div className="flex w-full h-full items-end justify-center gap-1">
                        {data.babies.length > 0 ? (
                          data.babies.map((baby) => {
                            const widthClass = data.babies.length === 1 ? 'w-full' : 'w-1/2';
                            const colorClass = baby.babyGender === 'male' ? 'bg-blue-500' : 'bg-pink-500';
                            const heightPercent = (baby.amount / maxAmount) * 100;
                            
                            return (
                              <div key={baby.babyId} className="relative flex flex-col items-center justify-end h-full" style={{ width: data.babies.length === 1 ? '100%' : '50%' }}>
                                <div
                                  className={`${widthClass} ${colorClass} rounded-t relative`}
                                  style={{ height: `${heightPercent}%`, minHeight: baby.amount > 0 ? '8px' : '0' }}
                                >
                                  {baby.amount > 0 && (
                                    <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-[10px] font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                                      {baby.amount}ml
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="w-full rounded-t bg-zinc-200 dark:bg-zinc-700" style={{ height: '0%' }} />
                        )}
                      </div>
                      <span className="text-[10px]">{data.date ? format(new Date(data.date), 'MM/dd') : ''}</span>
                    </div>
                  );
                })
              )}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-4">
              只统计奶粉和母乳，母乳按照近3天平均值计算。
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-10 border-t border-zinc-200 dark:border-zinc-800 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm pb-safe">
        <div className="grid h-16 grid-cols-3">
          <button
            onClick={() => navigate('/')}
            className="flex flex-col items-center justify-center gap-1 text-zinc-500 dark:text-zinc-400"
          >
            <span className="material-symbols-outlined">home</span>
            <span className="text-xs font-medium">主页</span>
          </button>
          <button
            onClick={() => navigate('/stats')}
            className="flex flex-col items-center justify-center gap-1 text-primary dark:text-primary"
          >
            <span className="material-symbols-outlined">bar_chart</span>
            <span className="text-xs font-medium">统计</span>
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="flex flex-col items-center justify-center gap-1 text-zinc-500 dark:text-zinc-400"
          >
            <span className="material-symbols-outlined">person</span>
            <span className="text-xs font-medium">我的</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
