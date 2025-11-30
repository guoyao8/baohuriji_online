import prisma from '../config/database.js';
import supabase from '../config/supabase.js';

// 获取家庭成员列表
export const getFamilyMembers = async (req, res) => {
  try {
    // 使用 Supabase
    if (supabase) {
      // 获取用户所在的家庭
      const { data: userFamilyData } = await supabase
        .from('FamilyMember')
        .select('familyId')
        .eq('userId', req.user.id)
        .limit(1)
        .single();

      if (!userFamilyData) {
        return res.status(404).json({ error: '用户不属于任何家庭' });
      }

      // 获取家庭所有成员
      const { data: members } = await supabase
        .from('FamilyMember')
        .select('id, userId, nickname, role')
        .eq('familyId', userFamilyData.familyId);

      // 获取成员的用户信息
      const userIds = members?.map(m => m.userId) || [];
      const { data: users } = await supabase
        .from('User')
        .select('id, username, avatarUrl')
        .in('id', userIds);

      const userMap = new Map(users?.map(u => [u.id, u]) || []);

      const result = members?.map(member => ({
        id: member.id,
        userId: member.userId,
        nickname: member.nickname,
        role: member.role,
        avatarUrl: userMap.get(member.userId)?.avatarUrl,
        username: userMap.get(member.userId)?.username,
      })) || [];

      return res.json(result);
    }

    // 使用 Prisma
    if (!prisma) {
      return res.status(500).json({ error: '数据库未配置' });
    }

    // 获取用户所在的家庭
    const userFamily = await prisma.familyMember.findFirst({
      where: { userId: req.user.id },
      include: {
        family: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!userFamily) {
      return res.status(404).json({ error: '用户不属于任何家庭' });
    }

    const members = userFamily.family.members.map(member => ({
      id: member.id,
      userId: member.user.id,
      nickname: member.nickname,
      role: member.role,
      avatarUrl: member.user.avatarUrl,
      username: member.user.username,
    }));

    res.json(members);
  } catch (error) {
    console.error('Get family members error:', error);
    res.status(500).json({ error: '获取家庭成员失败' });
  }
};

// 邀请家庭成员（生成邀请码）
export const inviteMember = async (req, res) => {
  try {
    // 使用 Supabase
    if (supabase) {
      const { data: userFamily } = await supabase
        .from('FamilyMember')
        .select('familyId')
        .eq('userId', req.user.id)
        .eq('role', 'admin')
        .limit(1)
        .single();

      if (!userFamily) {
        return res.status(403).json({ error: '只有管理员可以邀请成员' });
      }

      // 生成邀请码
      const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();

      // 更新家庭表
      const { data: family, error } = await supabase
        .from('Family')
        .update({ inviteCode })
        .eq('id', userFamily.familyId)
        .select('id, name, inviteCode')
        .single();

      if (error) throw error;

      return res.json({
        inviteCode: family.inviteCode,
        familyId: family.id,
        familyName: family.name,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    }

    // 使用 Prisma
    if (!prisma) {
      return res.status(500).json({ error: '数据库未配置' });
    }

    const userFamily = await prisma.familyMember.findFirst({
      where: {
        userId: req.user.id,
        role: 'admin',
      },
    });

    if (!userFamily) {
      return res.status(403).json({ error: '只有管理员可以邀请成员' });
    }

    // 生成邀请码
    const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    // 将邀请码保存到家庭表
    const family = await prisma.family.update({
      where: { id: userFamily.familyId },
      data: { inviteCode },
      select: {
        id: true,
        name: true,
        inviteCode: true,
      },
    });

    res.json({
      inviteCode: family.inviteCode,
      familyId: family.id,
      familyName: family.name,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后过期
    });
  } catch (error) {
    console.error('Invite member error:', error);
    res.status(500).json({ error: '生成邀请码失败' });
  }
};

// 加入家庭
export const joinFamily = async (req, res) => {
  try {
    const { inviteCode, nickname } = req.body;

    if (!inviteCode || !nickname) {
      return res.status(400).json({ error: '缺少邀请码或昵称' });
    }

    // 使用 Supabase
    if (supabase) {
      // 通过邀请码查找家庭
      const { data: family } = await supabase
        .from('Family')
        .select('id')
        .eq('inviteCode', inviteCode)
        .limit(1)
        .single();

      if (!family) {
        return res.status(404).json({ error: '邀请码无效' });
      }

      // 检查用户是否已经在其他家庭中
      const { data: existingMember } = await supabase
        .from('FamilyMember')
        .select('id')
        .eq('userId', req.user.id)
        .limit(1)
        .single();

      if (existingMember) {
        return res.status(400).json({ error: '您已经属于一个家庭,暂不支持加入多个家庭' });
      }

      // 添加成员
      const { data: member, error } = await supabase
        .from('FamilyMember')
        .insert({
          familyId: family.id,
          userId: req.user.id,
          nickname,
          role: 'member',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({
        ...member,
        user: {
          id: req.user.id,
          username: req.user.username,
          avatarUrl: req.user.avatarUrl,
        },
      });
    }

    // 使用 Prisma
    if (!prisma) {
      return res.status(500).json({ error: '数据库未配置' });
    }

    // TODO: 验证邀请码并获取familyId
    // 简化处理，这里假设inviteCode就是familyId
    const familyId = inviteCode;

    // 检查用户是否已经在其他家庭中
    const existingMember = await prisma.familyMember.findFirst({
      where: { userId: req.user.id },
    });

    if (existingMember) {
      return res.status(400).json({ error: '您已经属于一个家庭,暂不支持加入多个家庭' });
    }

    // 添加成员
    const member = await prisma.familyMember.create({
      data: {
        familyId,
        userId: req.user.id,
        nickname,
        role: 'member',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.status(201).json(member);
  } catch (error) {
    console.error('Join family error:', error);
    res.status(500).json({ error: '加入家庭失败' });
  }
};

// 更新成员信息
export const updateMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { nickname, role } = req.body;

    // 使用 Supabase
    if (supabase) {
      // 获取用户的家庭
      const { data: userFamily } = await supabase
        .from('FamilyMember')
        .select('familyId, role')
        .eq('userId', req.user.id)
        .limit(1)
        .single();

      if (!userFamily) {
        return res.status(404).json({ error: '用户不属于任何家庭' });
      }

      // 检查目标成员是否在同一家庭
      const { data: targetMember } = await supabase
        .from('FamilyMember')
        .select('id')
        .eq('id', id)
        .eq('familyId', userFamily.familyId)
        .single();

      if (!targetMember) {
        return res.status(404).json({ error: '成员不存在' });
      }

      // 如果要修改角色，必须是管理员
      if (role && userFamily.role !== 'admin') {
        return res.status(403).json({ error: '只有管理员可以修改成员角色' });
      }

      const updateData = { updatedAt: new Date().toISOString() };
      if (nickname) updateData.nickname = nickname;
      if (role) updateData.role = role;

      const { data: updatedMember, error } = await supabase
        .from('FamilyMember')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;

      // 获取用户信息
      const { data: user } = await supabase
        .from('User')
        .select('id, username, avatarUrl')
        .eq('id', updatedMember.userId)
        .single();

      return res.json({
        ...updatedMember,
        user,
      });
    }

    // 使用 Prisma
    if (!prisma) {
      return res.status(500).json({ error: '数据库未配置' });
    }

    // 获取用户的家庭
    const userFamily = await prisma.familyMember.findFirst({
      where: { userId: req.user.id },
    });

    if (!userFamily) {
      return res.status(404).json({ error: '用户不属于任何家庭' });
    }

    // 检查目标成员是否在同一家庭
    const targetMember = await prisma.familyMember.findFirst({
      where: {
        id,
        familyId: userFamily.familyId,
      },
    });

    if (!targetMember) {
      return res.status(404).json({ error: '成员不存在' });
    }

    // 如果要修改角色，必须是管理员
    if (role && userFamily.role !== 'admin') {
      return res.status(403).json({ error: '只有管理员可以修改成员角色' });
    }

    const updatedMember = await prisma.familyMember.update({
      where: { id },
      data: {
        nickname,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.json(updatedMember);
  } catch (error) {
    console.error('Update member error:', error);
    res.status(500).json({ error: '更新成员信息失败' });
  }
};

// 移除成员
export const removeMember = async (req, res) => {
  try {
    const { id } = req.params;

    // 使用 Supabase
    if (supabase) {
      const { data: userFamily } = await supabase
        .from('FamilyMember')
        .select('familyId, userId')
        .eq('userId', req.user.id)
        .eq('role', 'admin')
        .limit(1)
        .single();

      if (!userFamily) {
        return res.status(403).json({ error: '只有管理员可以移除成员' });
      }

      // 检查目标成员是否在同一家庭
      const { data: targetMember } = await supabase
        .from('FamilyMember')
        .select('userId')
        .eq('id', id)
        .eq('familyId', userFamily.familyId)
        .single();

      if (!targetMember) {
        return res.status(404).json({ error: '成员不存在' });
      }

      // 不能移除自己
      if (targetMember.userId === req.user.id) {
        return res.status(400).json({ error: '不能移除自己' });
      }

      const { error } = await supabase
        .from('FamilyMember')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.status(204).send();
    }

    // 使用 Prisma
    if (!prisma) {
      return res.status(500).json({ error: '数据库未配置' });
    }

    const userFamily = await prisma.familyMember.findFirst({
      where: {
        userId: req.user.id,
        role: 'admin',
      },
    });

    if (!userFamily) {
      return res.status(403).json({ error: '只有管理员可以移除成员' });
    }

    // 检查目标成员是否在同一家庭
    const targetMember = await prisma.familyMember.findFirst({
      where: {
        id,
        familyId: userFamily.familyId,
      },
    });

    if (!targetMember) {
      return res.status(404).json({ error: '成员不存在' });
    }

    // 不能移除自己
    if (targetMember.userId === req.user.id) {
      return res.status(400).json({ error: '不能移除自己' });
    }

    await prisma.familyMember.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: '移除成员失败' });
  }
};
