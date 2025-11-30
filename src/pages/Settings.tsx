import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useFeedingStore } from '@/stores/feedingStore';

export default function Settings() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const { clearCache } = useFeedingStore();

  const handleLogout = async () => {
    if (confirm('确定要退出登录吗？')) {
      await logout();
      navigate('/login');
    }
  };

  const handleClearCache = () => {
    if (confirm('清除缓存后，下次加载页面会重新获取数据。确定要继续吗？')) {
      clearCache();
      alert('✅ 缓存已清除');
    }
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display group/design-root overflow-x-hidden">
      <div className="flex-1 pb-24">
        <div className="flex items-center p-4 pb-3 justify-between bg-background-light dark:bg-background-dark">
          <h1 className="text-slate-900 dark:text-slate-50 text-2xl font-bold leading-tight tracking-[-0.015em] flex-1">
            设置
          </h1>
        </div>

        <div className="flex flex-col gap-6 p-4 pt-2">
          {/* 账户与模式 */}
          <div className="flex flex-col">
            <h2 className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-tight px-4 pb-2 pt-2">
              账户与模式
            </h2>
            <div className="flex flex-col overflow-hidden rounded-xl bg-white dark:bg-slate-800/50 shadow-sm">
              <button
                onClick={() => navigate('/account-settings')}
                className="flex items-center gap-4 bg-white dark:bg-slate-800/50 px-4 min-h-[56px] justify-between border-b border-slate-100 dark:border-slate-700/50"
              >
                <div className="flex items-center gap-4">
                  <div className="text-slate-700 dark:text-slate-200 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 shrink-0 size-10">
                    <span className="material-symbols-outlined">person</span>
                  </div>
                  <p className="text-slate-900 dark:text-slate-50 text-base font-normal leading-normal flex-1 truncate">
                    账户设置
                  </p>
                </div>
                <div className="shrink-0">
                  <span className="material-symbols-outlined text-slate-400 dark:text-slate-500">
                    chevron_right
                  </span>
                </div>
              </button>

              <button
                onClick={() => navigate('/baby-profile')}
                className="flex items-center gap-4 bg-white dark:bg-slate-800/50 px-4 min-h-[56px] justify-between border-b border-slate-100 dark:border-slate-700/50"
              >
                <div className="flex items-center gap-4">
                  <div className="text-slate-700 dark:text-slate-200 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 shrink-0 size-10">
                    <span className="material-symbols-outlined">child_care</span>
                  </div>
                  <p className="text-slate-900 dark:text-slate-50 text-base font-normal leading-normal flex-1 truncate">
                    宝宝档案
                  </p>
                </div>
                <div className="shrink-0">
                  <span className="material-symbols-outlined text-slate-400 dark:text-slate-500">
                    chevron_right
                  </span>
                </div>
              </button>

              <button
                onClick={() => navigate('/family-settings')}
                className="flex items-center gap-4 bg-white dark:bg-slate-800/50 px-4 min-h-[56px] justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="text-slate-700 dark:text-slate-200 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 shrink-0 size-10">
                    <span className="material-symbols-outlined">group</span>
                  </div>
                  <p className="text-slate-900 dark:text-slate-50 text-base font-normal leading-normal flex-1 truncate">
                    家庭模式
                  </p>
                </div>
                <div className="shrink-0">
                  <span className="material-symbols-outlined text-slate-400 dark:text-slate-500">
                    chevron_right
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* 通用 */}
          <div className="flex flex-col">
            <h2 className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-tight px-4 pb-2 pt-2">
              通用
            </h2>
            <div className="flex flex-col overflow-hidden rounded-xl bg-white dark:bg-slate-800/50 shadow-sm">
              <button
                onClick={() => navigate('/reminder-settings')}
                className="flex items-center gap-4 bg-white dark:bg-slate-800/50 px-4 min-h-[56px] justify-between border-b border-slate-100 dark:border-slate-700/50"
              >
                <div className="flex items-center gap-4">
                  <div className="text-slate-700 dark:text-slate-200 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 shrink-0 size-10">
                    <span className="material-symbols-outlined">notifications</span>
                  </div>
                  <p className="text-slate-900 dark:text-slate-50 text-base font-normal leading-normal flex-1 truncate">
                    喂养提醒
                  </p>
                </div>
                <div className="shrink-0">
                  <span className="material-symbols-outlined text-slate-400 dark:text-slate-500">
                    chevron_right
                  </span>
                </div>
              </button>
              
              <button
                onClick={handleClearCache}
                className="flex items-center gap-4 bg-white dark:bg-slate-800/50 px-4 min-h-[56px] justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="text-slate-700 dark:text-slate-200 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 shrink-0 size-10">
                    <span className="material-symbols-outlined">cleaning_services</span>
                  </div>
                  <p className="text-slate-900 dark:text-slate-50 text-base font-normal leading-normal flex-1 truncate">
                    清除缓存
                  </p>
                </div>
                <div className="shrink-0">
                  <span className="material-symbols-outlined text-slate-400 dark:text-slate-500">
                    chevron_right
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* 退出登录 */}
          <div className="px-2 pt-4">
            <button
              onClick={handleLogout}
              className="w-full rounded-xl bg-red-500/10 dark:bg-red-500/20 h-12 text-base font-bold text-red-500 dark:text-red-400 hover:bg-red-500/20 dark:hover:bg-red-500/30 transition-colors"
            >
              退出登录
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-10 border-t border-zinc-200 dark:border-zinc-800 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm pb-safe">
        <div className="grid h-16 grid-cols-3">
          <button onClick={() => navigate('/')} className="flex flex-col items-center justify-center gap-1 text-zinc-500 dark:text-zinc-400">
            <span className="material-symbols-outlined">home</span>
            <span className="text-xs font-medium">主页</span>
          </button>
          <button onClick={() => navigate('/stats')} className="flex flex-col items-center justify-center gap-1 text-zinc-500 dark:text-zinc-400">
            <span className="material-symbols-outlined">bar_chart</span>
            <span className="text-xs font-medium">统计</span>
          </button>
          <button onClick={() => navigate('/settings')} className="flex flex-col items-center justify-center gap-1 text-primary dark:text-primary">
            <span className="material-symbols-outlined">person</span>
            <span className="text-xs font-medium">我的</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
