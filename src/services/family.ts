import api from './api';

export interface FamilyMember {
  id: string;
  userId: string;
  nickname: string;
  role: 'admin' | 'member';
  avatarUrl?: string;
  username: string;
}

export const familyService = {
  // 获取家庭成员列表
  getMembers: async (): Promise<FamilyMember[]> => {
    return await api.get<any, FamilyMember[]>('/family/members');
  },

  // 生成邀请码
  inviteMember: async (): Promise<{ inviteCode: string; familyId: string; expiresAt: string }> => {
    return await api.post<any, any>('/family/invite');
  },

  // 加入家庭
  joinFamily: async (data: { inviteCode: string; nickname: string }): Promise<FamilyMember> => {
    return await api.post<any, FamilyMember>('/family/join', data);
  },

  // 更新成员信息
  updateMember: async (
    id: string,
    data: { nickname?: string; role?: 'admin' | 'member' }
  ): Promise<FamilyMember> => {
    return await api.put<any, FamilyMember>(`/family/members/${id}`, data);
  },

  // 移除成员
  removeMember: async (id: string): Promise<void> => {
    return await api.delete(`/family/members/${id}`);
  },
};
