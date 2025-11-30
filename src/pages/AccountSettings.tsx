import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import AvatarUpload from '@/components/AvatarUpload';

export default function AccountSettings() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuthStore();
  const [username, setUsername] = useState(user?.username || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!username.trim()) {
      alert('请输入用户名');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProfile({ avatarUrl });
      alert('保存成功');
      navigate(-1);
    } catch (error: any) {
      alert(error.response?.data?.error || '保存失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display group/design-root overflow-x-hidden">
      <div className="sticky top-0 z-10 flex items-center justify-between bg-background-light/80 dark:bg-background-dark/80 px-4 pt-4 pb-3 backdrop-blur-sm">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 dark:text-slate-300"
        >
          <span className="material-symbols-outlined text-3xl">arrow_back_ios_new</span>
        </button>
        <h1 className="text-slate-900 dark:text-slate-50 text-2xl font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
          账户设置
        </h1>
        <div className="w-10"></div>
      </div>

      <div className="flex flex-col items-center gap-8 p-4">
        <AvatarUpload
          currentAvatar={avatarUrl}
          onAvatarChange={setAvatarUrl}
          size="lg"
        />
      </div>

      <div className="flex flex-col gap-4 px-4">
        <div className="flex flex-col rounded-xl bg-white dark:bg-slate-800/50 shadow-sm">
          <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-700 px-4 py-3">
            <label className="w-20 text-slate-700 dark:text-slate-300" htmlFor="username">
              用户名
            </label>
            <input
              className="flex-1 border-none bg-transparent p-0 text-slate-900 dark:text-slate-50 placeholder-slate-400 focus:ring-0"
              id="username"
              placeholder="请输入用户名"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4 px-4 py-3">
            <label className="w-20 text-slate-700 dark:text-slate-300">
              注册时间
            </label>
            <p className="flex-1 text-slate-500 dark:text-slate-400">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('zh-CN') : ''}
            </p>
          </div>
        </div>

        <div className="flex flex-col rounded-xl bg-white dark:bg-slate-800/50 shadow-sm">
          <button
            onClick={() => navigate('/change-password')}
            className="flex items-center gap-4 px-4 min-h-[56px] justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="text-slate-700 dark:text-slate-200 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 shrink-0 size-10">
                <span className="material-symbols-outlined">lock</span>
              </div>
              <p className="text-slate-900 dark:text-slate-50 text-base font-normal leading-normal flex-1 truncate">
                修改密码
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

      <div className="mt-auto px-4 pt-8 pb-8">
        <button
          onClick={handleSave}
          disabled={isSubmitting}
          className="w-full rounded-full bg-primary py-3.5 text-lg font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  );
}
