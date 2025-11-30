import prisma from '../config/database.js';
import supabase from '../config/supabase.js';
import { v4 as uuidv4 } from 'uuid';

export const createRecord = async (req, res) => {
  try {
    const { babyId, feedingType, amount, unit, duration, feedingTime, note } = req.body;

    if (!babyId || !feedingType || !feedingTime) {
      return res.status(400).json({ error: '缺少必填字段' });
    }

    // 使用 Supabase
    if (supabase) {
      // 验证宝宝是否存在且用户有权访问
      const { data: baby } = await supabase
        .from('Baby')
        .select('familyId')
        .eq('id', babyId)
        .single();

      if (!baby) {
        return res.status(404).json({ error: '宝宝不存在' });
      }

      const { data: member } = await supabase
        .from('FamilyMember')
        .select('id')
        .eq('familyId', baby.familyId)
        .eq('userId', req.user.id)
        .single();

      if (!member) {
        return res.status(403).json({ error: '无权访问该宝宝' });
      }

      const recordId = uuidv4();
      const { data: record, error } = await supabase
        .from('FeedingRecord')
        .insert({
          id: recordId,
          babyId,
          familyId: baby.familyId,
          recordedBy: req.user.id,
          feedingType,
          amount: amount ? parseFloat(amount) : null,
          unit,
          duration: duration ? parseInt(duration) : null,
          feedingTime: new Date(feedingTime).toISOString(),
          note,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({
        ...record,
        recordedByName: req.user.username,
      });
    }

    // 使用 Prisma
    if (!prisma) {
      return res.status(500).json({ error: '数据库未配置' });
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

    // 使用 Supabase
    if (supabase) {
      // 获取用户所属的家庭 ID
      const { data: familyMembers } = await supabase
        .from('FamilyMember')
        .select('familyId')
        .eq('userId', req.user.id);

      if (!familyMembers || familyMembers.length === 0) {
        return res.json([]);
      }

      const familyIds = familyMembers.map(m => m.familyId);

      // 构建查询
      let query = supabase
        .from('FeedingRecord')
        .select('*')
        .in('familyId', familyIds);

      if (babyId) {
        query = query.eq('babyId', babyId);
      }

      if (startDate) {
        query = query.gte('feedingTime', new Date(startDate).toISOString());
      }

      if (endDate) {
        query = query.lte('feedingTime', new Date(endDate).toISOString());
      }

      query = query.order('feedingTime', { ascending: false }).limit(parseInt(limit));

      const { data: records, error } = await query;

      if (error) throw error;

      // 获取所有记录人的用户名
      const userIds = [...new Set(records?.map(r => r.recordedBy) || [])];
      const { data: users } = await supabase
        .from('User')
        .select('id, username')
        .in('id', userIds);

      const userMap = new Map(users?.map(u => [u.id, u.username]) || []);

      const formattedRecords = records?.map(record => ({
        ...record,
        recordedByName: userMap.get(record.recordedBy) || 'Unknown',
      })) || [];

      return res.json(formattedRecords);
    }

    // 使用 Prisma
    if (!prisma) {
      return res.status(500).json({ error: '数据库未配置' });
    }

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

    // 使用 Supabase
    if (supabase) {
      // 获取记录信息验证权限
      const { data: record } = await supabase
        .from('FeedingRecord')
        .select('familyId, babyId')
        .eq('id', id)
        .single();

      if (!record) {
        return res.status(404).json({ error: '记录不存在' });
      }

      // 验证用户是否属于该家庭
      const { data: member } = await supabase
        .from('FamilyMember')
        .select('id')
        .eq('familyId', record.familyId)
        .eq('userId', req.user.id)
        .single();

      if (!member) {
        return res.status(403).json({ error: '无权修改该记录' });
      }

      const updateData = {
        updatedAt: new Date().toISOString(),
      };
      if (feedingType) updateData.feedingType = feedingType;
      if (amount !== undefined) updateData.amount = amount ? parseFloat(amount) : null;
      if (unit) updateData.unit = unit;
      if (duration !== undefined) updateData.duration = duration ? parseInt(duration) : null;
      if (feedingTime) updateData.feedingTime = new Date(feedingTime).toISOString();
      if (note !== undefined) updateData.note = note;

      const { data: updatedRecord, error } = await supabase
        .from('FeedingRecord')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return res.json({
        ...updatedRecord,
        recordedByName: req.user.username,
      });
    }

    // 使用 Prisma
    if (!prisma) {
      return res.status(500).json({ error: '数据库未配置' });
    }

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

    // 使用 Supabase
    if (supabase) {
      // 获取记录信息
      const { data: record } = await supabase
        .from('FeedingRecord')
        .select('familyId')
        .eq('id', id)
        .single();

      if (!record) {
        return res.status(404).json({ error: '记录不存在' });
      }

      // 验证用户是否属于该家庭
      const { data: member } = await supabase
        .from('FamilyMember')
        .select('id')
        .eq('familyId', record.familyId)
        .eq('userId', req.user.id)
        .single();

      if (!member) {
        return res.status(403).json({ error: '无权删除该记录' });
      }

      const { error } = await supabase
        .from('FeedingRecord')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.status(204).send();
    }

    // 使用 Prisma
    if (!prisma) {
      return res.status(500).json({ error: '数据库未配置' });
    }

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
