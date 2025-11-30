import prisma from '../config/database.js';

export const getBabies = async (req, res) => {
  try {
    const families = await prisma.familyMember.findMany({
      where: { userId: req.user.id },
      include: {
        family: {
          include: {
            babies: true,
          },
        },
      },
    });

    const babies = families.flatMap(f => f.family.babies);
    
    console.log(`用户 ${req.user.id} 的家庭数:`, families.length);
    console.log(`宝宝总数:`, babies.length);
    babies.forEach(baby => console.log(`- ${baby.name} (${baby.gender})`));

    res.json(babies);
  } catch (error) {
    console.error('Get babies error:', error);
    res.status(500).json({ error: '获取宝宝列表失败' });
  }
};

export const createBaby = async (req, res) => {
  try {
    const { name, gender, birthDate, avatarUrl } = req.body;

    if (!name || !gender || !birthDate) {
      return res.status(400).json({ error: '缺少必填字段' });
    }

    // 获取用户的家庭
    const familyMember = await prisma.familyMember.findFirst({
      where: { userId: req.user.id },
    });

    if (!familyMember) {
      return res.status(404).json({ error: '用户不属于任何家庭' });
    }

    const baby = await prisma.baby.create({
      data: {
        familyId: familyMember.familyId,
        name,
        gender,
        birthDate: new Date(birthDate),
        avatarUrl,
      },
    });

    res.status(201).json(baby);
  } catch (error) {
    console.error('Create baby error:', error);
    res.status(500).json({ error: '创建宝宝档案失败' });
  }
};

export const updateBaby = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, gender, birthDate, avatarUrl } = req.body;

    // 验证宝宝是否属于用户的家庭
    const baby = await prisma.baby.findFirst({
      where: {
        id,
        family: {
          members: {
            some: {
              userId: req.user.id,
            },
          },
        },
      },
    });

    if (!baby) {
      return res.status(403).json({ error: '无权修改该宝宝档案' });
    }

    const updatedBaby = await prisma.baby.update({
      where: { id },
      data: {
        name,
        gender,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        avatarUrl,
      },
    });

    res.json(updatedBaby);
  } catch (error) {
    console.error('Update baby error:', error);
    res.status(500).json({ error: '更新宝宝档案失败' });
  }
};

export const deleteBaby = async (req, res) => {
  try {
    const { id } = req.params;

    const baby = await prisma.baby.findFirst({
      where: {
        id,
        family: {
          members: {
            some: {
              userId: req.user.id,
              role: 'admin',
            },
          },
        },
      },
    });

    if (!baby) {
      return res.status(403).json({ error: '无权删除该宝宝档案' });
    }

    await prisma.baby.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete baby error:', error);
    res.status(500).json({ error: '删除宝宝档案失败' });
  }
};
