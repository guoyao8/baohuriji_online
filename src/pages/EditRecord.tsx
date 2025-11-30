import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFeedingStore } from '@/stores/feedingStore';
import { useAuthStore } from '@/stores/authStore';
import { FeedingType } from '@/types';
import { format } from 'date-fns';

export default function EditRecord() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { babies, currentBabyId, records, setCurrentBaby, updateRecord, deleteRecord } = useFeedingStore();
  
  const [feedingType, setFeedingType] = useState<FeedingType>('formula');
  const [amount, setAmount] = useState<number>(150);
  const [duration, setDuration] = useState<number>(0);
  const [feedingTime, setFeedingTime] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [babyId, setBabyId] = useState<string>('');

  useEffect(() => {
    // 查找对应的记录
    const record = records.find(r => r.id === id);
    if (record) {
      setFeedingType(record.feedingType);
      setAmount(record.amount || 0);
      setDuration(record.duration || 0);
      setFeedingTime(format(new Date(record.feedingTime), "yyyy-MM-dd'T'HH:mm"));
      setBabyId(record.babyId);
      setCurrentBaby(record.babyId);
    }
  }, [id, records]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    if (!babyId || !user || !id) {
      alert('数据不完整');
      return;
    }

    const record: any = {
      babyId,
      feedingType,
      feedingTime: new Date(feedingTime).toISOString(),
      recordedBy: user.id,
      recordedByName: user.username,
    };

    if (feedingType === 'breast') {
      if (duration > 0) {
        record.duration = duration;
      }
      if (amount > 0) {
        record.amount = amount;
        record.unit = 'ml';
      }
    } else if (feedingType === 'formula') {
      record.amount = amount;
      record.unit = 'ml';
    } else if (feedingType === 'solid') {
      record.amount = amount;
      record.unit = '斤';
    }

    try {
      await updateRecord(id, record);
      navigate('/');
    } catch (error) {
      alert('更新失败，请重试');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    if (confirm('确定要删除这条记录吗？')) {
      try {
        await deleteRecord(id);
        navigate('/');
      } catch (error) {
        alert('删除失败，请重试');
      }
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
          <h1 className="text-lg font-bold">编辑喂养记录</h1>
          <div className="flex size-10 items-center justify-center">
            <button
              onClick={handleDelete}
              className="flex items-center justify-center text-red-500"
            >
              <span className="material-symbols-outlined">delete</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow px-4 pb-24">
        {/* Baby Selector */}
        <div className="pt-2 pb-4">
          <div className="flex h-10 flex-1 items-center justify-center rounded-lg bg-zinc-200 dark:bg-zinc-800 p-1">
            {babies.map((baby) => (
              <label key={baby.id} className="flex h-full flex-1 cursor-pointer items-center justify-center overflow-hidden rounded-md px-2 text-sm font-medium leading-normal text-zinc-500 dark:text-zinc-400 has-[:checked]:bg-white has-[:checked]:text-zinc-900 has-[:checked]:shadow-sm dark:has-[:checked]:bg-zinc-900/50 dark:has-[:checked]:text-white">
                <span className="truncate">{baby.name}</span>
                <input
                  checked={babyId === baby.id}
                  onChange={() => setBabyId(baby.id)}
                  className="invisible w-0"
                  type="radio"
                  name="baby-selector"
                />
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
                onClick={() => setFeedingType('breast')}
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
                onClick={() => setFeedingType('formula')}
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
                onClick={() => setFeedingType('solid')}
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

          {/* Duration for Breast Feeding */}
          {feedingType === 'breast' && (
            <div>
              <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                喂养时长
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-zinc-500 dark:text-zinc-400">
                  <span className="material-symbols-outlined">timer</span>
                </span>
                <input
                  type="text"
                  value={formatDuration(duration)}
                  readOnly
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-12 py-3 text-center text-lg font-mono text-zinc-900 dark:text-white"
                />
              </div>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">手动输入时长（秒）：</p>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 text-zinc-900 dark:text-white"
              />
            </div>
          )}

          {/* Amount */}
          {(feedingType === 'formula' || feedingType === 'solid' || (feedingType === 'breast' && amount > 0)) && (
            <div>
              <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                喂养量 ({getUnitForType()})
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 text-center text-2xl font-bold text-zinc-900 dark:text-white"
                />
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-zinc-500 dark:text-zinc-400">
                  {getUnitForType()}
                </div>
              </div>
            </div>
          )}

          {/* Time */}
          <div>
            <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
              喂养时间
            </label>
            <input
              type="datetime-local"
              value={feedingTime}
              onChange={(e) => setFeedingTime(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 text-zinc-900 dark:text-white"
            />
          </div>
        </div>
      </main>

      {/* Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 z-10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm pb-safe">
        <div className="p-4">
          <button
            onClick={handleSubmit}
            className="w-full rounded-xl bg-primary py-3.5 text-base font-bold text-white shadow-lg shadow-primary/20"
          >
            保存修改
          </button>
        </div>
      </div>
    </div>
  );
}
