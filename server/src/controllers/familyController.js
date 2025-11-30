import prisma from '../config/database.js';

// 获取家庭成员列表
export const getFamilyMembers = async (req, res) => {
  try {
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

    // TODO: 验证邀请码并获取familyId
    // 简化处理，这里假设inviteCode就是familyId
    const familyId = inviteCode;

    // 检查用户是否已经在其他家庭中
    const existingMember = await prisma.familyMember.findFirst({
      where: { userId: req.user.id },
    });

    if (existingMember) {
      return res.status(400).json({ error: '您已经属于一个家庭，暂不支持加入多个家庭' });
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
