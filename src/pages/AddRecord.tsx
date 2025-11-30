import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFeedingStore } from '@/stores/feedingStore';
import { useAuthStore } from '@/stores/authStore';
import { FeedingType } from '@/types';
import { format } from 'date-fns';

export default function AddRecord() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { babies, currentBabyId, records, setCurrentBaby, addRecord } = useFeedingStore();
  
  const [feedingType, setFeedingType] = useState<FeedingType>('formula');
  const [amount, setAmount] = useState<number | ''>(150);
  const [duration, setDuration] = useState<number>(0);
  const [feedingTime, setFeedingTime] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerInterval, setTimerInterval] = useState<number | null>(null);

  // 使用 useMemo 计算当前宝宝的最近一次喂养记录（性能优化）
  const lastRecord = useMemo(() => {
    if (!currentBabyId || !records.length) return null;
    // records 已经按时间倒序排列，直接取第一条当前宝宝的记录
    return records.find(r => r.babyId === currentBabyId) || null;
  }, [currentBabyId, records]);

  // 初始化默认喂养量：根据最近一次记录设置
  useEffect(() => {
    if (lastRecord) {
      // 设置喂养类型
      setFeedingType(lastRecord.feedingType);
      
      // 根据类型设置喂养量
      if (lastRecord.feedingType === 'breast') {
        setAmount(lastRecord.amount || '');
        setDuration(lastRecord.duration || 0);
      } else if (lastRecord.feedingType === 'formula') {
        setAmount(lastRecord.amount || 150);
      } else if (lastRecord.feedingType === 'solid') {
        setAmount(lastRecord.amount || 0);
      }
    } else {
      // 没有历史记录，使用默认值
      setFeedingType('formula');
      setAmount(150);
      setDuration(0);
    }
  }, [lastRecord, currentBabyId]); // 当切换宝宝或记录变化时重新设置

  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  const startTimer = () => {
    setIsTimerRunning(true);
    const interval = window.setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
    setTimerInterval(interval);
  };

  const stopTimer = () => {
    setIsTimerRunning(false);
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    if (!currentBabyId || !user) {
      alert('请先选择宝宝');
      return;
    }

    const record = {
      babyId: currentBabyId,
      feedingType,
      feedingTime: feedingTime + ':00',  // datetime-local 格式补全秒，保持本地时间值
      recordedBy: user.id,
      recordedByName: user.username,
    };

    if (feedingType === 'breast') {
      if (duration > 0) {
        Object.assign(record, { duration });
      }
      if (amount && amount > 0) {
        Object.assign(record, { amount, unit: 'ml' });
      }
    } else if (feedingType === 'formula') {
      Object.assign(record, { amount: amount || 0, unit: 'ml' });
    } else if (feedingType === 'solid') {
      Object.assign(record, { amount: amount || 0, unit: '斤' });
    }

    try {
      await addRecord(record);
      navigate('/');
    } catch (error) {
      alert('保存失败，请重试');
    }
  };

  const getUnitForType = () => {
    if (feedingType === 'solid') return '斤';
    return 'ml';
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm pt-safe">
        <div className="flex h-14 items-center justify-between px-2">
          <div className="flex size-10 items-center justify-center">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center text-zinc-800 dark:text-zinc-200"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <h1 className="text-lg font-bold">新增喂养记录</h1>
          <div className="flex size-10 items-center justify-center"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow px-4 pb-24">
        {/* Baby Selector */}
        <div className="pt-2 pb-4">
          <div className="flex h-10 flex-1 items-center justify-center rounded-lg bg-zinc-200 dark:bg-zinc-800 p-1">
            {babies.map((baby) => (
              <label key={baby.id} className="flex h-full flex-1 cursor-pointer items-center justify-center overflow-hidden rounded-md px-2 text-sm font-medium leading-normal text-zinc-500 dark:text-zinc-400 has-[:checked]:bg-white has-[:checked]:text-zinc-900 has-[:checked]:shadow-sm dark:has-[:checked]:bg-zinc-900/50 dark:has-[:checked]:text-white">
                <input
                  checked={currentBabyId === baby.id}
                  onChange={(e) => {
                    e.stopPropagation();
                    setCurrentBaby(baby.id);
                  }}
                  className="invisible w-0"
                  type="radio"
                  name="baby-selector"
                  value={baby.id}
                />
                <span className="truncate">{baby.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {/* Feeding Type */}
          <div>
            <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
              喂养类型
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setFeedingType('breast');
                  // 切换类型时，尝试使用该类型的最近一次喂养量
                  const lastBreastRecord = records.find(r => r.babyId === currentBabyId && r.feedingType === 'breast');
                  if (lastBreastRecord) {
                    setAmount(lastBreastRecord.amount || '');
                    setDuration(lastBreastRecord.duration || 0);
                  } else {
                    setAmount('');
                    setDuration(0);
                  }
                }}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl border py-3 ${
                  feedingType === 'breast'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>
                  breastfeeding
                </span>
                <span className="text-sm font-medium">母乳</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setFeedingType('formula');
                  // 切换类型时，尝试使用该类型的最近一次喂养量
                  const lastFormulaRecord = records.find(r => r.babyId === currentBabyId && r.feedingType === 'formula');
                  setAmount(lastFormulaRecord?.amount || 150);
                }}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl border py-3 ${
                  feedingType === 'formula'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>
                  water_bottle
                </span>
                <span className="text-sm font-medium">配方奶</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setFeedingType('solid');
                  // 切换类型时，尝试使用该类型的最近一次喂养量
                  const lastSolidRecord = records.find(r => r.babyId === currentBabyId && r.feedingType === 'solid');
                  setAmount(lastSolidRecord?.amount || 0);
                }}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl border py-3 ${
                  feedingType === 'solid'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>
                  restaurant
                </span>
                <span className="text-sm font-medium">辅食</span>
              </button>
            </div>
          </div>

          {/* Timer for Breast Feeding */}
          {feedingType === 'breast' && (
            <div>
              <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                喂养时长
              </label>
              <div className="flex items-center gap-3">
                <div className="relative flex-grow">
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-zinc-500 dark:text-zinc-400">
                    <span className="material-symbols-outlined">timer</span>
                  </span>
                  <input
                    className="w-full rounded-xl border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4 pl-12 text-center text-xl font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:border-primary focus:ring-primary"
                    placeholder="00:00:00"
                    value={formatDuration(duration)}
                    readOnly
                  />
                </div>
                <button
                  onClick={startTimer}
                  disabled={isTimerRunning}
                  className={`flex-shrink-0 h-14 w-14 flex items-center justify-center rounded-xl text-white shadow-sm ${
                    isTimerRunning ? 'bg-gray-400' : 'bg-green-500'
                  }`}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>
                    play_arrow
                  </span>
                </button>
                <button
                  onClick={stopTimer}
                  disabled={!isTimerRunning}
                  className={`flex-shrink-0 h-14 w-14 flex items-center justify-center rounded-xl text-white shadow-sm ${
                    !isTimerRunning ? 'bg-gray-400' : 'bg-red-500'
                  }`}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>
                    stop
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Amount */}
          {feedingType !== 'breast' && (
            <div>
              <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                喂养量
              </label>
              <div className="relative">
                <input
                  className="w-full rounded-xl border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4 text-center text-3xl font-bold text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:border-primary focus:ring-primary"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                />
                <span className="absolute inset-y-0 right-4 flex items-center text-zinc-500 dark:text-zinc-400">
                  {getUnitForType()}
                </span>
              </div>
              {feedingType === 'formula' && (
                <div className="mt-2 grid grid-cols-5 gap-2">
                  <button
                    onClick={() => setAmount((prev) => Math.max(0, (prev || 0) - 30))}
                    className="rounded-lg bg-zinc-200/80 dark:bg-zinc-800/80 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    -30
                  </button>
                  <button
                    onClick={() => setAmount((prev) => Math.max(0, (prev || 0) - 10))}
                    className="rounded-lg bg-zinc-200/80 dark:bg-zinc-800/80 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    -10
                  </button>
                  <button
                    onClick={() => setAmount((prev) => (prev || 0) + 10)}
                    className="rounded-lg bg-zinc-200/80 dark:bg-zinc-800/80 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    +10
                  </button>
                  <button
                    onClick={() => setAmount((prev) => (prev || 0) + 30)}
                    className="rounded-lg bg-zinc-200/80 dark:bg-zinc-800/80 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    +30
                  </button>
                  <button className="rounded-lg bg-zinc-200/80 dark:bg-zinc-800/80 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    <span className="material-symbols-outlined text-base">water_drop</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Optional Amount for Breast */}
          {feedingType === 'breast' && (
            <div>
              <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                喂养量 (可选)
              </label>
              <div className="relative">
                <input
                  className="w-full rounded-xl border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:border-primary focus:ring-primary"
                  placeholder="例如: 120"
                  type="number"
                  value={amount === '' ? '' : amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                />
                <span className="absolute inset-y-0 right-4 flex items-center text-zinc-500 dark:text-zinc-400">
                  ml
                </span>
              </div>
            </div>
          )}

          {/* Feeding Time */}
          <div>
            <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
              喂养时间
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-zinc-500 dark:text-zinc-400">
                <span className="material-symbols-outlined">schedule</span>
              </span>
              <input
                className="w-full rounded-xl border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4 pl-12 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:border-primary focus:ring-primary"
                type="datetime-local"
                value={feedingTime}
                onChange={(e) => setFeedingTime(e.target.value)}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-background-light dark:bg-background-dark p-4 pb-safe-or-4 border-t border-zinc-200 dark:border-zinc-800">
        <button
          onClick={handleSubmit}
          className="w-full h-12 rounded-xl bg-primary text-white font-bold text-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
        >
          保存
        </button>
      </div>
    </div>
  );
}
