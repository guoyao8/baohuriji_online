import { useState, useRef } from 'react';

interface AvatarUploadProps {
  currentAvatar?: string;
  onAvatarChange: (avatarUrl: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function AvatarUpload({ currentAvatar, onAvatarChange, size = 'lg' }: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | undefined>(currentAvatar);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'size-16',
    md: 'size-20',
    lg: 'size-24',
  };

  const buttonSizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-7 w-7',
    lg: 'h-8 w-8',
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    // 检查文件大小（限制5MB）
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过5MB');
      return;
    }

    // 读取文件并预览
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setPreview(dataUrl);
      onAvatarChange(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative">
      <div
        className={`${sizeClasses[size]} rounded-full bg-cover bg-center cursor-pointer hover:opacity-90 transition-opacity`}
        style={{
          backgroundImage: preview
            ? `url(${preview})`
            : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIGZpbGw9IiNFNUU3RUIiLz48cGF0aCBkPSJNNDggNTZDNTguNDkzNCA1NiA2NyA0Ny40OTM0IDY3IDM3QzY3IDI2LjUwNjYgNTguNDkzNCAxOCA0OCAxOEMzNy41MDY2IDE4IDI5IDI2LjUwNjYgMjkgMzdDMjkgNDcuNDkzNCAzNy41MDY2IDU2IDQ4IDU2WiIgZmlsbD0iIzlDQTNBRiIvPjxwYXRoIGQ9Ik0yMCA3OEMyMCA2NS44NDk3IDI5Ljg0OTcgNTYgNDIgNTZINTRDNjYuMTUwMyA1NiA3NiA2NS44NDk3IDc2IDc4VjgySDIwVjc4WiIgZmlsbD0iIzlDQTNBRiIvPjwvc3ZnPg==',
        }}
        onClick={handleClick}
      />
      <button
        type="button"
        onClick={handleClick}
        className={`absolute bottom-0 right-0 flex ${buttonSizeClasses[size]} items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 transition-colors shadow-lg`}
      >
        <span className="material-symbols-outlined text-xl">photo_camera</span>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
