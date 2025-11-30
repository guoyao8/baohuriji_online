import prisma from '../config/database.js';

export const createRecord = async (req, res) => {
  try {
    const { babyId, feedingType, amount, unit, duration, feedingTime, note } = req.body;

    if (!babyId || !feedingType || !feedingTime) {
      return res.status(400).json({ error: '缺少必填字段' });
    }

    // 验证宝宝是否属于用户的家庭
    const baby = await prisma.baby.findFirst({
      where: {
        id: babyId,
        family: {
          members: {
            some: {
              userId: req.user.id,
            },
          },
        },
      },
      include: { family: true },
    });

    if (!baby) {
      return res.status(403).json({ error: '无权访问该宝宝' });
    }

    const record = await prisma.feedingRecord.create({
      data: {
        babyId,
        familyId: baby.familyId,
        recordedBy: req.user.id,
        feedingType,
        amount: amount ? parseFloat(amount) : null,
        unit,
        duration: duration ? parseInt(duration) : null,
        feedingTime: new Date(feedingTime),
        note,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    res.status(201).json({
      ...record,
      recordedByName: record.user.username,
    });
  } catch (error) {
    console.error('Create record error:', error);
    res.status(500).json({ error: '创建记录失败' });
  }
};

export const getRecords = async (req, res) => {
  try {
    const { babyId, startDate, endDate, limit = 50 } = req.query;

    const where = {
      baby: {
        family: {
          members: {
            some: {
              userId: req.user.id,
            },
          },
        },
      },
    };

    if (babyId) {
      where.babyId = babyId;
    }

    if (startDate || endDate) {
      where.feedingTime = {};
      if (startDate) {
        where.feedingTime.gte = new Date(startDate);
      }
      if (endDate) {
        where.feedingTime.lte = new Date(endDate);
      }
    }

    const records = await prisma.feedingRecord.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: {
        feedingTime: 'desc',
      },
      take: parseInt(limit),
    });

    const formattedRecords = records.map(record => ({
      ...record,
      recordedByName: record.user.username,
    }));

    res.json(formattedRecords);
  } catch (error) {
    console.error('Get records error:', error);
    res.status(500).json({ error: '获取记录失败' });
  }
};

export const updateRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { feedingType, amount, unit, duration, feedingTime, note } = req.body;

    // 验证记录是否属于用户
    const existingRecord = await prisma.feedingRecord.findFirst({
      where: {
        id,
        baby: {
          family: {
            members: {
              some: {
                userId: req.user.id,
              },
            },
          },
        },
      },
    });

    if (!existingRecord) {
      return res.status(403).json({ error: '无权修改该记录' });
    }

    const record = await prisma.feedingRecord.update({
      where: { id },
      data: {
        feedingType,
        amount: amount ? parseFloat(amount) : null,
        unit,
        duration: duration ? parseInt(duration) : null,
        feedingTime: feedingTime ? new Date(feedingTime) : undefined,
        note,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    res.json({
      ...record,
      recordedByName: record.user.username,
    });
  } catch (error) {
    console.error('Update record error:', error);
    res.status(500).json({ error: '更新记录失败' });
  }
};

export const deleteRecord = async (req, res) => {
  try {
    const { id } = req.params;

    const existingRecord = await prisma.feedingRecord.findFirst({
      where: {
        id,
        baby: {
          family: {
            members: {
              some: {
                userId: req.user.id,
              },
            },
          },
        },
      },
    });

    if (!existingRecord) {
      return res.status(403).json({ error: '无权删除该记录' });
    }

    await prisma.feedingRecord.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete record error:', error);
    res.status(500).json({ error: '删除记录失败' });
  }
};
