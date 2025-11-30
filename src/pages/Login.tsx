import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  const { login, register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        await login(username, password);
      } else {
        await register(username, password, inviteCode || undefined);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || '操作失败，请重试');
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center overflow-x-hidden antialiased">
      <div className="flex w-full max-w-md flex-col px-4 pt-16 sm:px-6">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/20 text-primary">
            <span className="material-symbols-outlined !text-5xl">child_care</span>
          </div>
          <h1 className="text-slate-800 dark:text-white tracking-light text-[32px] font-bold leading-tight">
            宝贝日记
          </h1>
        </div>

        <div className="flex w-full px-0 py-8">
          <div className="flex h-12 flex-1 items-center justify-center rounded-xl bg-slate-200 dark:bg-slate-800 p-1">
            <label className="flex h-full grow cursor-pointer items-center justify-center overflow-hidden rounded-lg px-2 text-sm font-medium leading-normal text-slate-500 has-[:checked]:bg-white has-[:checked]:text-slate-900 has-[:checked]:shadow-sm dark:text-slate-400 dark:has-[:checked]:bg-slate-700 dark:has-[:checked]:text-white">
              <span className="truncate">登录</span>
              <input
                checked={isLogin}
                onChange={() => setIsLogin(true)}
                className="invisible w-0"
                type="radio"
                name="auth-toggle"
              />
            </label>
            <label className="flex h-full grow cursor-pointer items-center justify-center overflow-hidden rounded-lg px-2 text-sm font-medium leading-normal text-slate-500 has-[:checked]:bg-white has-[:checked]:text-slate-900 has-[:checked]:shadow-sm dark:text-slate-400 dark:has-[:checked]:bg-slate-700 dark:has-[:checked]:text-white">
              <span className="truncate">注册</span>
              <input
                checked={!isLogin}
                onChange={() => setIsLogin(false)}
                className="invisible w-0"
                type="radio"
                name="auth-toggle"
              />
            </label>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
          <label className="flex flex-col flex-1">
            <p className="text-slate-800 dark:text-white text-base font-medium leading-normal pb-2">
              账号
            </p>
            <input
              className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 focus:border-primary/50 h-14 placeholder:text-slate-400 dark:placeholder:text-slate-500 p-4 text-base font-normal leading-normal"
              placeholder="请输入您的账号"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>

          <label className="flex flex-col flex-1">
            <p className="text-slate-800 dark:text-white text-base font-medium leading-normal pb-2">
              密码
            </p>
            <div className="relative flex w-full flex-1 items-center">
              <input
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 focus:border-primary/50 h-14 placeholder:text-slate-400 dark:placeholder:text-slate-500 p-4 pr-12 text-base font-normal leading-normal"
                placeholder="请输入密码"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 flex h-14 w-14 items-center justify-center text-slate-400 dark:text-slate-500"
              >
                <span className="material-symbols-outlined">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </label>

          {!isLogin && (
            <label className="flex flex-col flex-1">
              <p className="text-slate-800 dark:text-white text-base font-medium leading-normal pb-2">
                家庭邀请码（非必填）
              </p>
              <input
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 focus:border-primary/50 h-14 placeholder:text-slate-400 dark:placeholder:text-slate-500 p-4 text-base font-normal leading-normal"
                placeholder="有邀请码则输入，无需留空"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
              />
            </label>
          )}

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          {isLogin && (
            <div className="flex w-full justify-end pt-3">
              <a className="text-primary text-sm font-medium leading-normal underline" href="#">
                忘记密码?
              </a>
            </div>
          )}

          <div className="flex w-full pt-8">
            <button
              type="submit"
              disabled={isLoading}
              className="flex h-14 w-full items-center justify-center rounded-xl bg-primary px-4 text-base font-bold text-white shadow-sm transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 dark:focus:ring-offset-background-dark disabled:opacity-50"
            >
              {isLoading ? '处理中...' : isLogin ? '登录' : '注册'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
