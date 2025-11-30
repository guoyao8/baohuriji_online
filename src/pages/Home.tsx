import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFeedingStore } from '@/stores/feedingStore';
import { useAuthStore } from '@/stores/authStore';
import { FeedingRecord } from '@/types';
import { format, formatDistanceToNow, addHours, addMinutes } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { babies, currentBabyId, records, setCurrentBaby, fetchBabies, fetchRecords } = useFeedingStore();
  const [todayStats, setTodayStats] = useState({
    formula: 0,
    breast: 0,
    solid: 0,
    totalCount: 0,
    lastFeedingTime: '',
    nextReminderTime: '',
  });
  // 缓存提醒设置，避免频繁请求导致闪烁
  const [reminderSettingsCache, setReminderSettingsCache] = useState<Record<string, { settings: any; timestamp: number }>>({});

  useEffect(() => {
    fetchBabies();
  }, [fetchBabies]);

  useEffect(() => {
    if (currentBabyId) {
      fetchRecords(currentBabyId);
    }
  }, [currentBabyId, fetchRecords]);

  useEffect(() => {
    calculateTodayStats();
    loadReminderSettings();
  }, [records]); // eslint-disable-line react-hooks/exhaustive-deps

  const calculateTodayStats = useCallback(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayRecords = records.filter(
      (r) => format(new Date(r.feedingTime), 'yyyy-MM-dd') === today
    );

    const formula = todayRecords
      .filter((r) => r.feedingType === 'formula')
      .reduce((sum, r) => sum + (r.amount || 0), 0);
    
    const breast = todayRecords.filter((r) => r.feedingType === 'breast').length;
    
    const solid = todayRecords
      .filter((r) => r.feedingType === 'solid')
      .reduce((sum, r) => sum + (r.amount || 0), 0);

    const lastRecord = todayRecords[0];
    const lastFeedingTime = lastRecord
      ? formatDistanceToNow(new Date(lastRecord.feedingTime), { locale: zhCN, addSuffix: true })
      : '';

    setTodayStats({
      formula,
      breast,
      solid,
      totalCount: todayRecords.length,
      lastFeedingTime,
      nextReminderTime: '',
    });
  }, [records]);

  const loadReminderSettings = useCallback(async () => {
    try {
      const cacheKey = currentBabyId || 'unified';
      const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存
      const now = Date.now();
      
      // 检查缓存是否有效
      const cached = reminderSettingsCache[cacheKey];
      const isCacheValid = cached && (now - cached.timestamp < CACHE_DURATION);
      
      // 先从缓存中获取设置，立即显示，避免闪烁
      if (cached) {
        calculateReminderTime(cached.settings);
      }
      
      // 如果缓存有效，不发起请求
      if (isCacheValid) {
        console.log('使用提醒设置缓存');
        return;
      }
      
      // 缓存失效或不存在，异步加载最新设置
      const { reminderService } = await import('@/services/reminder');
      const settings = await reminderService.getSettings(currentBabyId || undefined);
      
      // 更新缓存
      setReminderSettingsCache(prev => ({
        ...prev,
        [cacheKey]: { settings, timestamp: now },
      }));
      
      // 只在缓存失效时才重新计算（避免重复更新导致闪烁）
      if (!isCacheValid) {
        calculateReminderTime(settings);
      }
    } catch (error) {
      console.error('Failed to load reminder settings:', error);
    }
  }, [currentBabyId, reminderSettingsCache, records]); // eslint-disable-line react-hooks/exhaustive-deps

  const calculateReminderTime = useCallback((settings: any) => {
    if (settings.enabled && records.length > 0) {
      const lastRecord = records[0];
      let nextTime = new Date(lastRecord.feedingTime);
      nextTime = addHours(nextTime, settings.intervalHours);
      nextTime = addMinutes(nextTime, settings.intervalMinutes);
      
      const now = new Date();
      const isOverdue = nextTime < now;
      
      let nextReminderTime = '';
      if (isOverdue) {
        // 已经超时，计算超时了多久
        const overdueHours = Math.floor((now.getTime() - nextTime.getTime()) / (1000 * 60 * 60));
        const overdueMinutes = Math.floor(((now.getTime() - nextTime.getTime()) % (1000 * 60 * 60)) / (1000 * 60));
        
        if (overdueHours > 0) {
          nextReminderTime = `已经超时 ${overdueHours} 小时${overdueMinutes > 0 ? ` ${overdueMinutes} 分钟` : ''} 未喂养`;
        } else {
          nextReminderTime = `已经超时 ${overdueMinutes} 分钟未喂养`;
        }
      } else {
        // 未超时，显示下次提醒时间
        nextReminderTime = formatDistanceToNow(nextTime, { locale: zhCN, addSuffix: true });
      }
      
      setTodayStats(prev => ({
        ...prev,
        nextReminderTime,
      }));
    }
  }, [records]);

  // 使用 useMemo 缓存格式化函数
  const getFeedingIcon = useCallback((type: string) => {
    switch (type) {
      case 'breast':
        return 'breastfeeding';
      case 'formula':
        return 'water_bottle';
      case 'solid':
        return 'restaurant';
      default:
        return 'water_bottle';
    }
  }, []);

  const getFeedingColor = useCallback((type: string) => {
    switch (type) {
      case 'breast':
        return 'bg-pink-500/10 text-pink-500';
      case 'formula':
        return 'bg-primary/10 text-primary';
      case 'solid':
        return 'bg-green-500/10 text-green-500';
      default:
        return 'bg-primary/10 text-primary';
    }
  }, []);

  const getFeedingTypeName = useCallback((type: string) => {
    switch (type) {
      case 'breast':
        return '母乳';
      case 'formula':
        return '配方奶';
      case 'solid':
        return '辅食';
      default:
        return '';
    }
  }, []);

  const formatAmount = useCallback((record: FeedingRecord) => {
    if (record.duration) {
      // 不足1分钟显示秒数
      if (record.duration < 60) {
        return `${record.duration} 秒`;
      }
      return `${Math.floor(record.duration / 60)} min`;
    }
    if (record.amount) {
      return `${record.amount} ${record.unit || 'ml'}`;
    }
    return '';
  }, []);

  // 使用 useMemo 缓存今日记录列表
  const displayRecords = useMemo(() => records.slice(0, 10), [records]);

  return (
    <div className="relative flex min-h-screen w-full flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm pt-safe pb-3">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex size-10 shrink-0 items-center justify-center">
            <div
              className="aspect-square size-8 rounded-full bg-cover bg-center cursor-pointer"
              onClick={() => navigate('/settings')}
              style={{
                backgroundImage: user?.avatarUrl
                  ? `url(${user.avatarUrl})`
                  : `url(https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'user'})`,
              }}
            />
          </div>

          {/* Baby Selector */}
          <div className="flex-grow">
            <div className="flex justify-center">
              <div className="inline-flex rounded-full bg-zinc-200/80 dark:bg-zinc-800 p-1">
                {babies.map((baby) => (
                  <label key={baby.id} className="cursor-pointer">
                    <input
                      checked={currentBabyId === baby.id}
                      onChange={() => setCurrentBaby(baby.id)}
                      className="peer sr-only"
                      type="radio"
                      name="baby_selector"
                    />
                    <span className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-zinc-600 dark:text-zinc-300 transition-colors peer-checked:bg-white dark:peer-checked:bg-zinc-900/80 peer-checked:text-zinc-900 dark:peer-checked:text-white">
                      <div
                        className="size-5 rounded-full bg-cover bg-center"
                        style={{
                          backgroundImage: baby.avatarUrl
                            ? `url(${baby.avatarUrl})`
                            : `url(https://api.dicebear.com/7.x/avataaars/svg?seed=${baby.name})`,
                        }}
                      />
                      <span>{baby.name}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex size-10 items-center justify-center">
            <button
              onClick={() => navigate('/settings')}
              className="flex items-center justify-center text-zinc-800 dark:text-zinc-200"
            >
              <span className="material-symbols-outlined">settings</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow px-4 pb-32">
        <h3 className="pt-4 pb-2 text-lg font-bold leading-tight tracking-[-0.015em] text-zinc-900 dark:text-white">
          今日统计
        </h3>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">今日喂养</p>
              <p className="text-xl font-bold leading-tight tracking-tight text-zinc-900 dark:text-white">
                {todayStats.formula > 0 && `奶粉 ${todayStats.formula}ml`}
                {todayStats.breast > 0 && ` + 母乳 ${todayStats.breast}次`}
                {todayStats.solid > 0 && ` + 辅食 ${todayStats.solid}g`}
                {todayStats.totalCount === 0 && '暂无记录'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">喂养次数</p>
                <p className="text-2xl font-bold leading-tight tracking-tight text-zinc-900 dark:text-white">
                  {todayStats.totalCount} 次
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">上次喂养</p>
                <p className="text-lg font-bold leading-tight tracking-tight text-zinc-900 dark:text-white">
                  {todayStats.lastFeedingTime || '暂无'}
                </p>
              </div>
            </div>
            {todayStats.nextReminderTime && (
              <div className={`flex items-center gap-2 mt-2 px-3 py-2 rounded-lg border ${
                todayStats.nextReminderTime.includes('已经超时')
                  ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
                  : 'bg-primary/5 dark:bg-primary/10 border-primary/20'
              }`}>
                <span className={`material-symbols-outlined text-lg ${
                  todayStats.nextReminderTime.includes('已经超时')
                    ? 'text-red-500 dark:text-red-400'
                    : 'text-primary'
                }`}>
                  {todayStats.nextReminderTime.includes('已经超时') ? 'warning' : 'notifications_active'}
                </span>
                <div className="flex-1">
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    {todayStats.nextReminderTime.includes('已经超时') ? '喂养提醒' : '下次喂养提醒'}
                  </p>
                  <p className={`text-sm font-semibold ${
                    todayStats.nextReminderTime.includes('已经超时')
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-primary'
                  }`}>
                    {todayStats.nextReminderTime}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <h3 className="pt-6 pb-2 text-lg font-bold leading-tight tracking-[-0.015em] text-zinc-900 dark:text-white">
          最近记录
        </h3>
        <div className="space-y-3">
          {displayRecords.map((record) => (
            <div
              key={record.id}
              onClick={() => navigate(`/edit-record/${record.id}`)}
              className="flex items-center gap-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${getFeedingColor(
                  record.feedingType
                )}`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>
                  {getFeedingIcon(record.feedingType)}
                </span>
              </div>
              <div className="flex-grow">
                <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {getFeedingTypeName(record.feedingType)}
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {format(new Date(record.feedingTime), 'MM月dd日 HH:mm')} · {record.recordedByName || '我'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-zinc-900 dark:text-white">{formatAmount(record)}</p>
              </div>
            </div>
          ))}

          {records.length === 0 && (
            <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
              还没有喂养记录，点击下方按钮添加
            </div>
          )}
        </div>
      </main>

      {/* Add Button */}
      <div className="fixed bottom-20 right-0 left-0 z-20 flex justify-center">
        <button
          onClick={() => navigate('/add-record')}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>
            add
          </span>
        </button>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-10 border-t border-zinc-200 dark:border-zinc-800 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm pb-safe">
        <div className="grid h-16 grid-cols-3">
          <button
            onClick={() => navigate('/')}
            className="flex flex-col items-center justify-center gap-1 text-primary dark:text-primary"
          >
            <span className="material-symbols-outlined">home</span>
            <span className="text-xs font-medium">主页</span>
          </button>
          <button
            onClick={() => navigate('/stats')}
            className="flex flex-col items-center justify-center gap-1 text-zinc-500 dark:text-zinc-400"
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
