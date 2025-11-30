import prisma from '../config/database.js';
import supabase from '../config/supabase.js';

/**
 * 数据库帮助函数 - 统一 Supabase 和 Prisma 接口
 */

export const dbHelper = {
  /**
   * 检查是否使用 Supabase
   */
  useSupabase: () => !!supabase,

  /**
   * 获取用户的所有家庭成员关系
   */
  getUserFamilyMembers: async (userId) => {
    if (supabase) {
      const { data, error } = await supabase
        .from('FamilyMember')
        .select('*, Family(*)')
        .eq('userId', userId);
      
      if (error) throw error;
      return data || [];
    }
    
    if (!prisma) throw new Error('数据库未配置');
    
    return await prisma.familyMember.findMany({
      where: { userId },
      include: { family: true },
    });
  },

  /**
   * 获取用户的第一个家庭ID
   */
  getUserFirstFamilyId: async (userId) => {
    const members = await dbHelper.getUserFamilyMembers(userId);
    return members[0]?.familyId || members[0]?.Family?.id || null;
  },

  /**
   * 检查用户是否有权限访问某个家庭
   */
  userBelongsToFamily: async (userId, familyId) => {
    if (supabase) {
      const { data } = await supabase
        .from('FamilyMember')
        .select('id')
        .eq('userId', userId)
        .eq('familyId', familyId)
        .single();
      
      return !!data;
    }
    
    if (!prisma) return false;
    
    const member = await prisma.familyMember.findFirst({
      where: { userId, familyId },
    });
    
    return !!member;
  },
};
