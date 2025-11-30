import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFeedingStore } from '@/stores/feedingStore';
import { format } from 'date-fns';
import AvatarUpload from '@/components/AvatarUpload';

export function BabyProfile() {
  const navigate = useNavigate();
  const { babies, fetchBabies, deleteBaby } = useFeedingStore();

  useEffect(() => {
    fetchBabies();
  }, [fetchBabies]);

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个宝宝档案吗？')) {
      try {
        await deleteBaby(id);
      } catch (error) {
        alert('删除失败，请重试');
      }
    }
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
      <div className="sticky top-0 z-10 flex items-center justify-between bg-background-light/80 dark:bg-background-dark/80 px-4 pt-4 pb-3 backdrop-blur-sm">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 dark:text-slate-300"
        >
          <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
        </button>
        <h1 className="text-slate-900 dark:text-slate-50 text-2xl font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
          宝宝档案
        </h1>
        <button
          onClick={() => navigate('/add-baby')}
          className="flex h-10 w-10 items-center justify-center rounded-full text-primary"
        >
          <span className="material-symbols-outlined text-3xl">add_circle</span>
        </button>
      </div>

      <div className="flex flex-col gap-4 p-4">
        {babies.map((baby) => (
          <div
            key={baby.id}
            className="relative flex flex-col overflow-hidden rounded-xl bg-white dark:bg-slate-800/50 shadow-sm"
          >
            <div className="flex items-center gap-4 px-4 py-4">
              <div
                className="size-16 rounded-full bg-cover bg-center"
                style={{
                  backgroundImage: baby.avatarUrl
                    ? `url(${baby.avatarUrl})`
                    : `url(https://api.dicebear.com/7.x/avataaars/svg?seed=${baby.name})`,
                }}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-xl font-bold text-slate-900 dark:text-slate-50">{baby.name}</p>
                  <span className="text-slate-500 dark:text-slate-400">
                    <span
                      className="material-symbols-outlined text-base"
                      style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}
                    >
                      {baby.gender === 'male' ? 'male' : 'female'}
                    </span>
                  </span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {format(new Date(baby.birthDate), 'yyyy年MM月dd日')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/edit-baby/${baby.id}`)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                >
                  <span className="material-symbols-outlined">edit</span>
                </button>
                <button
                  onClick={() => handleDelete(baby.id)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {babies.length === 0 && (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <span className="material-symbols-outlined text-6xl mb-4">child_care</span>
            <p>还没有宝宝档案，点击右上角添加</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function AddBaby() {
  const navigate = useNavigate();
  const { addBaby } = useFeedingStore();
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [birthDate, setBirthDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [avatarUrl, setAvatarUrl] = useState('');

  const handleSubmit = async () => {
    if (!name || !birthDate) {
      alert('请填写必填字段');
      return;
    }

    try {
      await addBaby({
        name,
        gender,
        birthDate,
        avatarUrl: avatarUrl || undefined,
      });
      navigate('/baby-profile');
    } catch (error: any) {
      alert(error.response?.data?.error || '创建失败，请重试');
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
          添加新宝宝
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
            <label className="w-20 text-slate-700 dark:text-slate-300" htmlFor="baby-name">
              姓名
            </label>
            <input
              className="flex-1 border-none bg-transparent p-0 text-slate-900 dark:text-slate-50 placeholder-slate-400 focus:ring-0"
              id="baby-name"
              placeholder="请输入宝宝姓名"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-700 px-4 py-3">
            <label className="w-20 text-slate-700 dark:text-slate-300" htmlFor="birth-date">
              出生日期
            </label>
            <input
              className="flex-1 border-none bg-transparent p-0 text-slate-900 dark:text-slate-50 focus:ring-0"
              id="birth-date"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4 px-4 py-3">
            <label className="w-20 text-slate-700 dark:text-slate-300">性别</label>
            <div className="flex-1">
              <div className="flex gap-2">
                <button
                  onClick={() => setGender('male')}
                  className={`flex-1 rounded-lg px-4 py-2 ${
                    gender === 'male'
                      ? 'bg-primary/10 text-primary dark:bg-primary/20'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-base align-bottom"
                    style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}
                  >
                    male
                  </span>
                  男孩
                </button>
                <button
                  onClick={() => setGender('female')}
                  className={`flex-1 rounded-lg px-4 py-2 ${
                    gender === 'female'
                      ? 'bg-primary/10 text-primary dark:bg-primary/20'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-base align-bottom"
                    style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}
                  >
                    female
                  </span>
                  女孩
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto px-4 pt-8 pb-8">
        <button
          onClick={handleSubmit}
          className="w-full rounded-full bg-primary py-3.5 text-lg font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors"
        >
          保存
        </button>
      </div>
    </div>
  );
}

export function EditBaby() {
  const navigate = useNavigate();
  const { babies, updateBaby } = useFeedingStore();
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [birthDate, setBirthDate] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [babyId, setBabyId] = useState('');

  useEffect(() => {
    // 从URL获取宝宝ID
    const pathParts = window.location.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    setBabyId(id);

    // 查找对应的宝宝数据
    const baby = babies.find((b) => b.id === id);
    if (baby) {
      setName(baby.name);
      setGender(baby.gender);
      setBirthDate(format(new Date(baby.birthDate), 'yyyy-MM-dd'));
      setAvatarUrl(baby.avatarUrl || '');
    }
  }, [babies]);

  const handleSubmit = async () => {
    if (!name || !birthDate) {
      alert('请填写必填字段');
      return;
    }

    try {
      await updateBaby(babyId, {
        name,
        gender,
        birthDate,
        avatarUrl: avatarUrl || undefined,
      });
      navigate('/baby-profile');
    } catch (error: any) {
      alert(error.response?.data?.error || '更新失败，请重试');
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
          编辑宝宝档案
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
            <label className="w-20 text-slate-700 dark:text-slate-300" htmlFor="baby-name">
              姓名
            </label>
            <input
              className="flex-1 border-none bg-transparent p-0 text-slate-900 dark:text-slate-50 placeholder-slate-400 focus:ring-0"
              id="baby-name"
              placeholder="请输入宝宝姓名"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-700 px-4 py-3">
            <label className="w-20 text-slate-700 dark:text-slate-300" htmlFor="birth-date">
              出生日期
            </label>
            <input
              className="flex-1 border-none bg-transparent p-0 text-slate-900 dark:text-slate-50 focus:ring-0"
              id="birth-date"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4 px-4 py-3">
            <label className="w-20 text-slate-700 dark:text-slate-300">性别</label>
            <div className="flex-1">
              <div className="flex gap-2">
                <button
                  onClick={() => setGender('male')}
                  className={`flex-1 rounded-lg px-4 py-2 ${
                    gender === 'male'
                      ? 'bg-primary/10 text-primary dark:bg-primary/20'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-base align-bottom"
                    style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}
                  >
                    male
                  </span>
                  男孩
                </button>
                <button
                  onClick={() => setGender('female')}
                  className={`flex-1 rounded-lg px-4 py-2 ${
                    gender === 'female'
                      ? 'bg-primary/10 text-primary dark:bg-primary/20'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-base align-bottom"
                    style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}
                  >
                    female
                  </span>
                  女孩
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto px-4 pt-8 pb-8">
        <button
          onClick={handleSubmit}
          className="w-full rounded-full bg-primary py-3.5 text-lg font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors"
        >
          保存
        </button>
      </div>
    </div>
  );
}

export function FamilySettings() {
  const navigate = useNavigate();
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const { familyService } = await import('@/services/family');
      const data = await familyService.getMembers();
      setMembers(data);
    } catch (error) {
      console.error('Failed to load family members:', error);
    }
  };

  const handleInvite = async () => {
    try {
      setIsLoading(true);
      const { familyService } = await import('@/services/family');
      const result = await familyService.inviteMember();
      alert(`邀请码：${result.inviteCode}\n\n请将此邀请码分享给家人，邀请码有效期7天。`);
    } catch (error: any) {
      alert(error.response?.data?.error || '生成邀请码失败');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleText = (role: string) => {
    return role === 'admin' ? '管理员' : '家庭成员';
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col font-display group/design-root overflow-x-hidden bg-background-light dark:bg-background-dark">
      <div className="flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="text-zinc-900 dark:text-white flex size-12 shrink-0 items-center justify-center"
        >
          <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
        </button>
        <h1 className="text-zinc-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
          家庭模式设置
        </h1>
        <div className="size-12 shrink-0"></div>
      </div>

      <div className="flex flex-col flex-grow px-4 pt-4 pb-6">
        <div className="flex flex-col bg-white dark:bg-zinc-800 rounded-xl overflow-hidden shadow-sm">
          {members.map((member, index) => (
            <div key={member.id}>
              {index > 0 && <div className="h-px bg-background-light dark:bg-background-dark mx-4"></div>}
              <div className="flex items-center gap-4 px-4 min-h-[72px] py-3 justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-14 w-14"
                    style={{
                      backgroundImage: member.avatarUrl
                        ? `url(${member.avatarUrl})`
                        : `url(https://api.dicebear.com/7.x/avataaars/svg?seed=${member.username})`,
                    }}
                  />
                  <div className="flex flex-col justify-center">
                    <p className="text-zinc-900 dark:text-white text-base font-medium leading-normal line-clamp-1">
                      {member.nickname}
                    </p>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm font-normal leading-normal line-clamp-2">
                      {getRoleText(member.role)}
                    </p>
                  </div>
                </div>
                <div className="shrink-0">
                  <span className="material-symbols-outlined text-zinc-400 dark:text-zinc-500 text-2xl">
                    chevron_right
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleInvite}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 w-full mt-6 bg-primary/20 dark:bg-primary/30 text-primary py-4 rounded-xl font-semibold hover:bg-primary/30 dark:hover:bg-primary/40 transition-colors disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-2xl">add</span>
          <span>{isLoading ? '生成中...' : '邀请新成员'}</span>
        </button>

        <div className="flex-grow"></div>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm font-normal leading-normal py-4 px-4 text-center">
          邀请家人共同记录宝宝的成长点滴
        </p>
      </div>
    </div>
  );
}

export function ReminderSettings() {
  const navigate = useNavigate();
  const { babies, fetchBabies } = useFeedingStore();
  const [enabled, setEnabled] = useState(true);
  const [selectedBaby, setSelectedBaby] = useState<string>('unified');
  const [intervalHours, setIntervalHours] = useState(3);
  const [intervalMinutes, setIntervalMinutes] = useState(0);
  const [reminderMethod, setReminderMethod] = useState<'vibrate' | 'sound' | 'both'>('both');
  const [ringtone, setRingtone] = useState('default');
  const [isLoading, setIsLoading] = useState(false);
  const [showIntervalPicker, setShowIntervalPicker] = useState(false);
  const [showMethodPicker, setShowMethodPicker] = useState(false);
  const [showRingtonePicker, setShowRingtonePicker] = useState(false);

  useEffect(() => {
    fetchBabies();
    loadSettings();
  }, [fetchBabies]);

  useEffect(() => {
    // 当切换宝宝时，重新加载设置
    loadSettings();
  }, [selectedBaby]);

  const loadSettings = async () => {
    try {
      const { reminderService } = await import('@/services/reminder');
      const babyId = selectedBaby === 'unified' ? undefined : selectedBaby;
      const settings = await reminderService.getSettings(babyId);
      
      setEnabled(settings.enabled);
      setIntervalHours(settings.intervalHours);
      setIntervalMinutes(settings.intervalMinutes);
      setReminderMethod(settings.reminderMethod);
      setRingtone(settings.ringtone);
    } catch (error) {
      console.error('Failed to load reminder settings:', error);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const { reminderService } = await import('@/services/reminder');
      
      const babyId = selectedBaby === 'unified' ? null : selectedBaby;
      await reminderService.saveSettings({
        babyId,
        enabled,
        intervalHours,
        intervalMinutes,
        reminderMethod,
        ringtone,
      });
      
      alert('保存成功！');
      navigate(-1);
    } catch (error: any) {
      alert(error.response?.data?.error || '保存失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const getReminderMethodText = () => {
    switch (reminderMethod) {
      case 'vibrate':
        return '震动';
      case 'sound':
        return '铃声';
      case 'both':
        return '震动和铃声';
      default:
        return '震动和铃声';
    }
  };

  const getRingtoneText = () => {
    switch (ringtone) {
      case 'default':
        return '默认';
      case 'gentle':
        return '温柔';
      case 'happy':
        return '欢快';
      case 'classic':
        return '经典';
      default:
        return '默认';
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col group/design-root overflow-x-hidden bg-background-light dark:bg-background-dark font-display">
      <div className="flex items-center justify-between bg-white dark:bg-background-dark p-4 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="flex size-10 items-center justify-center text-[#111418] dark:text-white"
        >
          <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
        </button>
        <h1 className="flex-1 text-center text-lg font-bold text-[#111418] dark:text-white tracking-[-0.015em]">
          喂养提醒设置
        </h1>
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="flex w-10 items-center justify-end text-base font-bold text-primary dark:text-primary disabled:opacity-50"
        >
          {isLoading ? '保存中...' : '保存'}
        </button>
      </div>

      <main className="flex-1 space-y-4 p-4">
        <div className="rounded-xl bg-white dark:bg-gray-800">
          <div className="flex min-h-14 items-center justify-between gap-4 px-4 py-2">
            <div className="flex items-center gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <span className="material-symbols-outlined">notifications</span>
              </div>
              <p className="flex-1 truncate text-base font-medium text-[#111418] dark:text-white">
                启用喂养提醒
              </p>
            </div>
            <div className="shrink-0">
              <label className="relative flex h-[31px] w-[51px] cursor-pointer items-center rounded-full bg-[#f0f2f4] dark:bg-gray-700 p-0.5 has-[:checked]:justify-end has-[:checked]:bg-primary">
                <div
                  className="h-full w-[27px] rounded-full bg-white transition-transform"
                  style={{ boxShadow: 'rgba(0, 0, 0, 0.15) 0px 3px 8px, rgba(0, 0, 0, 0.06) 0px 3px 1px' }}
                ></div>
                <input
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="invisible absolute"
                  type="checkbox"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="flex px-0 py-2">
          <div className="flex h-12 flex-1 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
            <label
              className="flex h-full grow cursor-pointer items-center justify-center overflow-hidden rounded-lg px-2 text-sm font-medium text-[#617589] dark:text-gray-400 has-[:checked]:bg-white has-[:checked]:text-[#111418] has-[:checked]:shadow-sm has-[:checked]:dark:bg-gray-700 has-[:checked]:dark:text-white"
            >
              <span className="truncate">统一设置</span>
              <input
                checked={selectedBaby === 'unified'}
                onChange={() => setSelectedBaby('unified')}
                className="invisible w-0"
                type="radio"
                name="baby-selector"
              />
            </label>
            {babies.map((baby) => (
              <label
                key={baby.id}
                className="flex h-full grow cursor-pointer items-center justify-center overflow-hidden rounded-lg px-2 text-sm font-medium text-[#617589] dark:text-gray-400 has-[:checked]:bg-white has-[:checked]:text-[#111418] has-[:checked]:shadow-sm has-[:checked]:dark:bg-gray-700 has-[:checked]:dark:text-white"
              >
                <span className="truncate">{baby.name}</span>
                <input
                  checked={selectedBaby === baby.id}
                  onChange={() => setSelectedBaby(baby.id)}
                  className="invisible w-0"
                  type="radio"
                  name="baby-selector"
                />
              </label>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl bg-white dark:bg-gray-800">
          <button
            onClick={() => setShowIntervalPicker(true)}
            className="flex min-h-14 w-full items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-700/50 px-4 py-2 text-left"
          >
            <div className="flex items-center gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <span className="material-symbols-outlined">schedule</span>
              </div>
              <p className="flex-1 truncate text-base font-medium text-[#111418] dark:text-white">
                提醒间隔
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <p className="text-base font-normal text-gray-600 dark:text-gray-300">
                {intervalHours}小时 {intervalMinutes}分钟
              </p>
              <span className="material-symbols-outlined text-gray-400">arrow_forward_ios</span>
            </div>
          </button>

          <button
            onClick={() => setShowMethodPicker(true)}
            className="flex min-h-14 w-full items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-700/50 px-4 py-2 text-left"
          >
            <div className="flex items-center gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <span className="material-symbols-outlined">vibration</span>
              </div>
              <p className="flex-1 truncate text-base font-medium text-[#111418] dark:text-white">
                提醒方式
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <p className="text-base font-normal text-gray-600 dark:text-gray-300">
                {getReminderMethodText()}
              </p>
              <span className="material-symbols-outlined text-gray-400">arrow_forward_ios</span>
            </div>
          </button>

          <button
            onClick={() => setShowRingtonePicker(true)}
            className="flex min-h-14 w-full items-center justify-between gap-4 px-4 py-2 text-left"
          >
            <div className="flex items-center gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <span className="material-symbols-outlined">music_note</span>
              </div>
              <p className="flex-1 truncate text-base font-medium text-[#111418] dark:text-white">
                铃声选择
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <p className="text-base font-normal text-gray-600 dark:text-gray-300">
                {getRingtoneText()}
              </p>
              <span className="material-symbols-outlined text-gray-400">arrow_forward_ios</span>
            </div>
          </button>
        </div>
      </main>

      {/* 提醒间隔选择器 */}
      {showIntervalPicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setShowIntervalPicker(false)}>
          <div className="w-full bg-white dark:bg-gray-800 rounded-t-2xl p-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-center mb-4">选择提醒间隔</h3>
            <div className="flex gap-4 items-center justify-center mb-4">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">小时</label>
                <input
                  type="number"
                  min="0"
                  max="12"
                  value={intervalHours}
                  onChange={(e) => setIntervalHours(Number(e.target.value))}
                  className="w-20 px-3 py-2 border rounded-lg text-center"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">分钟</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={intervalMinutes}
                  onChange={(e) => setIntervalMinutes(Number(e.target.value))}
                  className="w-20 px-3 py-2 border rounded-lg text-center"
                />
              </div>
            </div>
            <button
              onClick={() => setShowIntervalPicker(false)}
              className="w-full bg-primary text-white py-3 rounded-lg font-medium"
            >
              确定
            </button>
          </div>
        </div>
      )}

      {/* 提醒方式选择器 */}
      {showMethodPicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setShowMethodPicker(false)}>
          <div className="w-full bg-white dark:bg-gray-800 rounded-t-2xl p-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-center mb-4">选择提醒方式</h3>
            <div className="space-y-2 mb-4">
              <button
                onClick={() => {
                  setReminderMethod('vibrate');
                  setShowMethodPicker(false);
                }}
                className={`w-full py-3 rounded-lg ${
                  reminderMethod === 'vibrate'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                震动
              </button>
              <button
                onClick={() => {
                  setReminderMethod('sound');
                  setShowMethodPicker(false);
                }}
                className={`w-full py-3 rounded-lg ${
                  reminderMethod === 'sound'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                铃声
              </button>
              <button
                onClick={() => {
                  setReminderMethod('both');
                  setShowMethodPicker(false);
                }}
                className={`w-full py-3 rounded-lg ${
                  reminderMethod === 'both'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                震动和铃声
              </button>
            </div>
            <button
              onClick={() => setShowMethodPicker(false)}
              className="w-full bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white py-3 rounded-lg font-medium"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 铃声选择器 */}
      {showRingtonePicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setShowRingtonePicker(false)}>
          <div className="w-full bg-white dark:bg-gray-800 rounded-t-2xl p-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-center mb-4">选择铃声</h3>
            <div className="space-y-2 mb-4">
              {['default', 'gentle', 'happy', 'classic'].map((tone) => (
                <button
                  key={tone}
                  onClick={() => {
                    setRingtone(tone);
                    setShowRingtonePicker(false);
                  }}
                  className={`w-full py-3 rounded-lg ${
                    ringtone === tone
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  {tone === 'default' ? '默认' : tone === 'gentle' ? '温柔' : tone === 'happy' ? '欢快' : '经典'}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowRingtonePicker(false)}
              className="w-full bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white py-3 rounded-lg font-medium"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BabyProfile;
